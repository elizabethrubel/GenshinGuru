import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import {
  SNAPSHOT_CHARACTERS,
  SNAPSHOT_PRESETS,
} from './data/rosterSnapshot';
import type {
  ActiveTab,
  AppSettings,
  BuilderFilters,
  Character,
  ElementType,
  EncounterDefinition,
  RegionalPreset,
  SavedAbyssPair,
  SavedTeam,
  TeamRecommendation,
} from './types/genshin';
import { ARCHETYPES } from './data/archetypes';
import {
  analyzeTeam,
  BATTLE_READY_LEVEL,
  inferSlotRoles,
} from './engine/teamAnalyzer';
import {
  formatTeamAsSheetRow,
  generateRecommendedTeams,
  generateTeamsForRegion,
  type TeamRankingMode,
} from './engine/teamBuilder';
import {
  fetchRosterFromSheets,
  parseCharactersFromRows,
  parseDelimitedText,
} from './services/sheetsApi';
import {
  askGenshinGuruGemini,
  checkServerGeminiStatus,
} from './services/geminiApi';
import {
  askGuruSkill,
  type GuruChatMessage,
} from './services/guruChatEngine';
import {
  loadChatHistory,
  loadSavedAbyssPairs,
  loadSavedTeams,
  loadSettings,
  saveChatHistory,
  saveSavedAbyssPairs,
  saveSavedTeams,
  saveSettings,
  type StoredChatEntry,
} from './services/storage';
import { GENSHIN_GURU_SKILL_URL } from './data/genshinGuruSkill';
import { Header } from './components/Header';
import { FilterPanel } from './components/FilterPanel';
import {
  TeamVisualizer,
  type OriginContext,
} from './components/TeamVisualizer';
import {
  TopTeamsView,
  type TopTeamsCategory,
} from './components/TopTeamsView';
import { BossesView, type BossFilterKey } from './components/BossesView';
import { AbyssPlanner } from './components/AbyssPlanner';
import { RegionalPresets, type NationName } from './components/RegionalPresets';
import { RosterView } from './components/RosterView';
import { SavedTeamsDrawer } from './components/SavedTeamsView';
import { SettingsModal } from './components/SettingsModal';
import { CelestialBackdrop } from './components/CelestialBackdrop';
import { CharacterBuildDrawer } from './components/CharacterBuildDrawer';
import { GuruChatSidebar } from './components/GuruChatSidebar';

const EMPTY_SLOTS: [
  Character | null,
  Character | null,
  Character | null,
  Character | null,
] = [null, null, null, null];

const VALID_TABS: ActiveTab[] = [
  'visualizer',
  'top-teams',
  'bosses',
  'abyss',
  'regions',
  'roster',
];

function readTabFromHash(): ActiveTab {
  const raw = window.location.hash.replace(/^#/, '').split('?')[0].toLowerCase();
  if (raw === 'circle' || raw === 'visualizer') return 'visualizer';
  if (VALID_TABS.includes(raw as ActiveTab)) return raw as ActiveTab;
  return 'visualizer';
}

interface ToastState {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

function hydrateTeamFromIds(
  ids: [string, string, string, string],
  title: string,
  whyItWorks: string,
  charMap: Map<string, Character>
): TeamRecommendation | undefined {
  const members = ids
    .map((id) => charMap.get(id))
    .filter((c): c is Character => Boolean(c));
  if (members.length !== 4) return undefined;
  const tuple = members as [Character, Character, Character, Character];
  const analysis = analyzeTeam(tuple);
  return {
    id: `guru-hydrated-${ids.join('-')}`,
    title,
    subtitle:
      analysis.reactions
        .slice(0, 3)
        .map((r) => r.name)
        .join(' · ') || 'Balanced Squad',
    members: tuple,
    slotLabels: inferSlotRoles(tuple),
    analysis,
    whyItWorks,
    source: 'gemini',
  };
}

function hydrateChatEntries(
  entries: StoredChatEntry[],
  roster: Character[]
): GuruChatMessage[] {
  const charMap = new Map(roster.map((c) => [c.id, c]));
  return entries.map((e) => {
    const suggestedTeam = e.suggestedTeam
      ? hydrateTeamFromIds(
          e.suggestedTeam.memberIds,
          e.suggestedTeam.title,
          e.suggestedTeam.whyItWorks,
          charMap
        )
      : undefined;

    let suggestedAbyss: GuruChatMessage['suggestedAbyss'];
    if (e.suggestedAbyss) {
      const h1 = hydrateTeamFromIds(
        e.suggestedAbyss.half1Ids,
        e.suggestedAbyss.half1Title,
        'Abyss Half 1',
        charMap
      );
      const h2 = hydrateTeamFromIds(
        e.suggestedAbyss.half2Ids,
        e.suggestedAbyss.half2Title,
        'Abyss Half 2',
        charMap
      );
      if (h1 && h2) {
        suggestedAbyss = { half1: h1, half2: h2 };
      }
    }

    const mentionedCharacters = e.mentionedCharacterIds
      ?.map((id) => charMap.get(id))
      .filter((c): c is Character => Boolean(c));

    return {
      id: e.id,
      role: e.role,
      content: e.content,
      createdAt: e.createdAt,
      engine: e.engine,
      model: e.model,
      suggestedTeam,
      suggestedAbyss,
      mentionedCharacters:
        mentionedCharacters && mentionedCharacters.length > 0
          ? mentionedCharacters
          : undefined,
      followUps: e.followUps,
      fallbackNote: e.fallbackNote,
    };
  });
}

function serializeChatMessages(messages: GuruChatMessage[]): StoredChatEntry[] {
  return messages.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    createdAt: m.createdAt,
    engine: m.engine,
    model: m.model,
    suggestedTeam: m.suggestedTeam
      ? {
          title: m.suggestedTeam.title,
          whyItWorks: m.suggestedTeam.whyItWorks,
          memberIds: m.suggestedTeam.members.map((c) => c.id) as [
            string,
            string,
            string,
            string,
          ],
        }
      : undefined,
    suggestedAbyss: m.suggestedAbyss
      ? {
          half1Title: m.suggestedAbyss.half1.title,
          half1Ids: m.suggestedAbyss.half1.members.map((c) => c.id) as [
            string,
            string,
            string,
            string,
          ],
          half2Title: m.suggestedAbyss.half2.title,
          half2Ids: m.suggestedAbyss.half2.members.map((c) => c.id) as [
            string,
            string,
            string,
            string,
          ],
        }
      : undefined,
    mentionedCharacterIds: m.mentionedCharacters?.map((c) => c.id),
    followUps: m.followUps,
    fallbackNote: m.fallbackNote,
  }));
}

export default function App() {
  const [activeTab, setActiveTabState] = useState<ActiveTab>(() =>
    readTabFromHash()
  );
  const [roster, setRoster] = useState<Character[]>(SNAPSHOT_CHARACTERS);
  const [presets, setPresets] = useState<RegionalPreset[]>(SNAPSHOT_PRESETS);
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showSavedDrawer, setShowSavedDrawer] = useState(false);

  // Toggleable Genshin Guru Skill chat sidebar
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<GuruChatMessage[]>(() =>
    hydrateChatEntries(loadChatHistory(), SNAPSHOT_CHARACTERS)
  );
  const [isChatThinking, setIsChatThinking] = useState(false);
  const [serverGeminiConfigured, setServerGeminiConfigured] = useState(false);

  const envGeminiKey =
    ((import.meta.env.VITE_GEMINI_API_KEY as string | undefined) || '').trim();
  const effectiveGeminiKey = settings.geminiApiKey.trim() || envGeminiKey;
  const hasLiveGemini = Boolean(effectiveGeminiKey || serverGeminiConfigured);

  // Shared Character Build & Artifact drawer accessible from any tab
  const [inspectedCharacter, setInspectedCharacter] =
    useState<Character | null>(null);

  // Breadcrumb origin context when jumping into Team Circle from Bosses/Regions/Roster/Top Teams
  const [originContext, setOriginContext] = useState<OriginContext | null>(null);

  // Preserved per-tab filters so switching tabs never loses your place
  const [topTeamsSearch, setTopTeamsSearch] = useState('');
  const [topTeamsCategory, setTopTeamsCategory] =
    useState<TopTeamsCategory>('All');
  const [topTeamsSortBy, setTopTeamsSortBy] =
    useState<TeamRankingMode>('ready-now');
  const [bossSearch, setBossSearch] = useState('');
  const [bossFilterKey, setBossFilterKey] = useState<BossFilterKey>('All');
  const [regionSearch, setRegionSearch] = useState('');
  const [regionNation, setRegionNation] = useState<NationName | 'All'>('All');
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterElement, setRosterElement] = useState<ElementType | 'All'>('All');
  const [rosterReadiness, setRosterReadiness] = useState<
    'all' | 'ready' | 'unbuilt'
  >('all');

  // Start completely clean on landing — zero presets auto-selected!
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [filters, setFilters] = useState<BuilderFilters>({
    archetypeId: null,
    encounterId: null,
    anchorCharacterId: null,
    includeUnbuilt: false,
    requireSurvivability: true,
    excludedCharacterIds: [],
  });

  const [manualTeam, setManualTeam] = useState<TeamRecommendation | null>(null);
  const [manualSlots, setManualSlots] =
    useState<[Character | null, Character | null, Character | null, Character | null]>(
      EMPTY_SLOTS
    );
  const [selectedRecId, setSelectedRecId] = useState<string | null>(null);
  const [fatesBurstKey, setFatesBurstKey] = useState(0);

  const [isAskingGemini, setIsAskingGemini] = useState(false);
  const [geminiError, setGeminiError] = useState<string | null>(null);

  // Spiral Abyss dual-team state
  const [half1Ids, setHalf1Ids] = useState<
    [string | null, string | null, string | null, string | null]
  >(['flins', 'aino', 'fischl', 'jahoda']);
  const [half2Ids, setHalf2Ids] = useState<
    [string | null, string | null, string | null, string | null]
  >(['traveller', 'xiangling', 'bennett', 'yumemizuki-mizuki']);
  const [half1Label, setHalf1Label] = useState('Lunar-Charged Ascendant');
  const [half2Label, setHalf2Label] = useState('Cryo Melt & Swirl');

  const [savedTeams, setSavedTeams] = useState<SavedTeam[]>(() =>
    loadSavedTeams()
  );
  const [savedAbyssPairs, setSavedAbyssPairs] = useState<SavedAbyssPair[]>(() =>
    loadSavedAbyssPairs()
  );

  const [toast, setToast] = useState<ToastState | null>(null);
  const notify = (
    message: string,
    action?: { label: string; onAction: () => void }
  ) =>
    setToast({
      message,
      actionLabel: action?.label,
      onAction: action?.onAction,
    });

  // Sync tab navigation with URL hash so browser Back/Forward works naturally
  const setActiveTab = (tab: ActiveTab, clearOrigin = false) => {
    setActiveTabState(tab);
    if (clearOrigin) setOriginContext(null);
    const targetHash = tab === 'visualizer' ? '#circle' : `#${tab}`;
    if (window.location.hash !== targetHash) {
      window.history.pushState(null, '', targetHash);
    }
  };

  useEffect(() => {
    const onHashChange = () => {
      setActiveTabState(readTabFromHash());
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(
      () => setToast(null),
      toast.actionLabel ? 4600 : 3200
    );
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (settings.sheetsApiKey && settings.spreadsheetId) {
      void performLiveSync(settings, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const performLiveSync = async (
    targetSettings: AppSettings,
    silent = false
  ) => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const result = await fetchRosterFromSheets(
        targetSettings.spreadsheetId,
        targetSettings.sheetsApiKey
      );
      setRoster(result.characters);
      if (result.presets.length > 0) {
        setPresets(result.presets);
      }
      const updated: AppSettings = {
        ...targetSettings,
        lastSyncedAt: result.syncedAt,
        dataSource: 'live-sheets',
      };
      setSettings(updated);
      saveSettings(updated);
      if (!silent) {
        notify(
          `Refreshed ${result.characters.length} characters from your Google Sheet.`
        );
        setShowSettings(false);
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Failed to refresh Google Sheet.';
      setSyncError(msg);
      if (!silent) {
        setShowSettings(true);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleImportPastedRoster = (rawText: string) => {
    const rows = parseDelimitedText(rawText);
    const parsed = parseCharactersFromRows(rows);
    if (parsed.length === 0) {
      setSyncError(
        'Could not parse any characters — include the header row (Character, Level, Type, ...).'
      );
      return;
    }
    setRoster(parsed);
    const updated: AppSettings = {
      ...settings,
      lastSyncedAt: new Date().toISOString(),
      dataSource: 'live-sheets',
    };
    setSettings(updated);
    saveSettings(updated);
    setSyncError(null);
    setShowSettings(false);
    notify(`Updated ${parsed.length} characters from pasted spreadsheet rows.`);
  };

  const hasActiveFilterCriteria =
    Boolean(selectedRegionId) ||
    Boolean(filters.archetypeId) ||
    Boolean(filters.encounterId) ||
    Boolean(filters.anchorCharacterId) ||
    Boolean(manualTeam);

  const activeRegionPreset = useMemo(
    () => presets.find((p) => p.id === selectedRegionId) ?? null,
    [presets, selectedRegionId]
  );

  const recommendations = useMemo(() => {
    if (activeRegionPreset) {
      const charMap = new Map(roster.map((c) => [c.id, c]));
      const presetMembers = activeRegionPreset.resolvedCharacterIds
        .map((id) => (id ? charMap.get(id) ?? null : null))
        .filter((c): c is Character => Boolean(c));

      const out: TeamRecommendation[] = [];
      let excludePresetSig: string | undefined;

      if (presetMembers.length >= 4) {
        const tuple = presetMembers.slice(0, 4) as [
          Character,
          Character,
          Character,
          Character,
        ];
        excludePresetSig = tuple
          .map((m) => m.id)
          .slice()
          .sort()
          .join('|');
        const analysis = analyzeTeam(tuple);
        out.push({
          id: `preset-${activeRegionPreset.id}`,
          title: activeRegionPreset.teamName,
          subtitle: activeRegionPreset.region,
          members: tuple,
          slotLabels: inferSlotRoles(tuple),
          analysis,
          whyItWorks: `Your saved "${activeRegionPreset.region}" squad from Party by Region. Use the stronger options or Shuffle below the circle to test higher-scoring upgrades for this region.`,
          source: 'preset',
        });
      }

      const alts = generateTeamsForRegion(roster, activeRegionPreset.region, {
        includeUnbuilt: filters.includeUnbuilt,
        requireSurvivability: filters.requireSurvivability,
        excludePresetSig,
        maxResults: 7,
      });

      return [...out, ...alts];
    }

    if (
      !filters.archetypeId &&
      !filters.encounterId &&
      !filters.anchorCharacterId
    ) {
      return [];
    }
    return generateRecommendedTeams(roster, filters, 8);
  }, [activeRegionPreset, roster, filters]);

  const activeTeam: TeamRecommendation | null = useMemo(() => {
    if (manualTeam) return manualTeam;
    if (selectedRecId) {
      const found = recommendations.find((r) => r.id === selectedRecId);
      if (found) return found;
    }
    return recommendations[0] ?? null;
  }, [manualTeam, selectedRecId, recommendations]);

  const handleChangeFilters = (next: BuilderFilters) => {
    setSelectedRegionId(null);
    setFilters(next);
    setManualTeam(null);
    setManualSlots(EMPTY_SLOTS);
    setSelectedRecId(null);
    setGeminiError(null);
  };

  const loadPresetIntoCircle = (
    preset: RegionalPreset,
    _resolvedMembers?: Character[],
    initialAlt?: TeamRecommendation
  ) => {
    setSelectedRegionId(preset.id);
    setFilters((prev) => ({
      ...prev,
      archetypeId: null,
      encounterId: null,
      anchorCharacterId: null,
    }));
    setManualTeam(null);
    setManualSlots(EMPTY_SLOTS);
    setSelectedRecId(initialAlt ? initialAlt.id : `preset-${preset.id}`);
    setFatesBurstKey((k) => k + 1);
  };

  const handleSelectRegionDropdown = (presetId: string | null) => {
    if (!presetId) {
      setSelectedRegionId(null);
      setManualTeam(null);
      setManualSlots(EMPTY_SLOTS);
      setSelectedRecId(null);
      return;
    }
    const preset = presets.find((p) => p.id === presetId);
    if (preset) {
      loadPresetIntoCircle(preset);
    }
  };

  // Context-aware shuffle: cycles through strong alternatives within the current Region/Boss/Filter
  const handleShuffleTeam = () => {
    if (recommendations.length > 1) {
      const currentIdx = recommendations.findIndex(
        (r) => r.id === activeTeam?.id
      );
      const nextIdx =
        currentIdx === -1 ? 1 : (currentIdx + 1) % recommendations.length;
      const next = recommendations[nextIdx];
      setManualTeam(null);
      setManualSlots(next.members);
      setSelectedRecId(next.id);
      setFatesBurstKey((k) => k + 1);
      const label =
        next.source === 'preset'
          ? `Returned to Sheet Preset (Score ${next.analysis.score})`
          : `Shuffled to ${next.title} (Score ${next.analysis.score})`;
      notify(label);
      return;
    }
    handleFatesPick();
  };

  const handleSwapSlot = (slotIndex: number, nextChar: Character) => {
    if (activeTeam) {
      const nextMembers = [...activeTeam.members] as [
        Character,
        Character,
        Character,
        Character,
      ];
      nextMembers[slotIndex] = nextChar;
      const nextAnalysis = analyzeTeam(nextMembers);
      const nextRoles = inferSlotRoles(nextMembers);

      setManualSlots(nextMembers);
      setManualTeam({
        ...activeTeam,
        id: `custom-${nextMembers.map((m) => m.id).join('-')}`,
        members: nextMembers,
        slotLabels: nextRoles,
        analysis: nextAnalysis,
        subtitle:
          nextAnalysis.reactions
            .slice(0, 3)
            .map((r) => r.name)
            .join(' · ') || 'Custom Squad',
        source: 'custom',
      });
      return;
    }

    // Building manually on the blank landing circle
    const nextSlots = [...manualSlots] as [
      Character | null,
      Character | null,
      Character | null,
      Character | null,
    ];
    nextSlots[slotIndex] = nextChar;
    setManualSlots(nextSlots);

    if (nextSlots.every(Boolean)) {
      const tuple = nextSlots as [Character, Character, Character, Character];
      const nextAnalysis = analyzeTeam(tuple);
      setManualTeam({
        id: `custom-${tuple.map((m) => m.id).join('-')}`,
        title: nextAnalysis.reactions[0]?.name
          ? `${nextAnalysis.reactions[0].name} Custom Team`
          : 'Custom Party',
        subtitle:
          nextAnalysis.reactions
            .slice(0, 3)
            .map((r) => r.name)
            .join(' · ') || 'Custom Squad',
        members: tuple,
        slotLabels: inferSlotRoles(tuple),
        analysis: nextAnalysis,
        whyItWorks:
          'Custom party assembled directly on the Team Circle. Hover any chord to inspect how teammates react.',
        source: 'custom',
      });
    }
  };

  const handleAskGemini = async (question: string) => {
    setIsAskingGemini(true);
    setGeminiError(null);
    try {
      const rec = await askGenshinGuruGemini(
        question,
        roster,
        effectiveGeminiKey,
        filters.includeUnbuilt,
        filters.requireSurvivability
      );
      setSelectedRegionId(null);
      setManualSlots(rec.members);
      setManualTeam(rec);
      notify(`Genshin Guru assembled "${rec.title}".`);
    } catch (err) {
      setGeminiError(
        err instanceof Error ? err.message : 'Gemini request failed.'
      );
    } finally {
      setIsAskingGemini(false);
    }
  };

  const handleSaveTeam = (team: TeamRecommendation) => {
    const entry: SavedTeam = {
      id: `saved-${Date.now()}`,
      name: team.title,
      notes: team.whyItWorks,
      regionTag: activeRegionPreset?.region || team.archetypeId || 'Custom',
      memberIds: team.members.map((m) => m.id) as [
        string,
        string,
        string,
        string,
      ],
      createdAt: new Date().toISOString(),
    };
    const next = [entry, ...savedTeams];
    setSavedTeams(next);
    saveSavedTeams(next);
    notify(`Saved "${entry.name}".`);
  };

  const handleCopySheetRow = async (
    members: Character[],
    title: string,
    regionTag = 'Custom'
  ) => {
    const row = formatTeamAsSheetRow(members, title, regionTag);
    try {
      await navigator.clipboard.writeText(row);
      notify('Copied row — paste straight into Party by Region.');
    } catch {
      notify('Clipboard blocked; row logged in console.');
      console.info(row);
    }
  };

  const handleSendToAbyss = (
    members: Character[],
    label: string,
    half: 1 | 2
  ) => {
    const incomingIds = members.map((m) => m.id) as [
      string,
      string,
      string,
      string,
    ];
    const incomingSet = new Set(incomingIds);

    if (half === 1) {
      setHalf1Ids(incomingIds);
      setHalf1Label(label);
      setHalf2Ids(
        half2Ids.map((id) => (id && incomingSet.has(id) ? null : id)) as [
          string | null,
          string | null,
          string | null,
          string | null,
        ]
      );
    } else {
      setHalf2Ids(incomingIds);
      setHalf2Label(label);
      setHalf1Ids(
        half1Ids.map((id) => (id && incomingSet.has(id) ? null : id)) as [
          string | null,
          string | null,
          string | null,
          string | null,
        ]
      );
    }

    notify(`Queued "${label}" in Abyss Half ${half}`, {
      label: 'Open Abyss →',
      onAction: () => {
        setToast(null);
        setActiveTab('abyss', true);
      },
    });
  };

  const handleLoadPresetToVisualizer = (
    preset: RegionalPreset,
    members: Character[],
    initialAlt?: TeamRecommendation
  ) => {
    loadPresetIntoCircle(preset, members, initialAlt);
    setOriginContext({
      fromTab: 'regions',
      label: 'Regions',
      detail: preset.region,
    });
    setActiveTab('visualizer');
  };

  const handleBuildAroundCharacter = (char: Character) => {
    const sourceTab = activeTab;
    handleChangeFilters({
      ...filters,
      archetypeId: null,
      encounterId: null,
      anchorCharacterId: char.id,
      includeUnbuilt:
        char.level < BATTLE_READY_LEVEL ? true : filters.includeUnbuilt,
    });
    if (sourceTab !== 'visualizer') {
      setOriginContext({
        fromTab: sourceTab,
        label:
          sourceTab === 'roster'
            ? 'Roster'
            : sourceTab === 'bosses'
              ? 'Bosses'
              : sourceTab === 'regions'
                ? 'Regions'
                : 'Spiral Abyss',
        detail: char.name,
      });
    } else {
      setOriginContext(null);
    }
    setActiveTab('visualizer');
    notify(`Built Team Circle around ${char.name}.`);
  };

  const handleOpenBossCounter = (
    boss: EncounterDefinition,
    precomputedRec?: TeamRecommendation
  ) => {
    const sourceTab = activeTab;
    setSelectedRegionId(null);
    setFilters((prev) => ({
      ...prev,
      archetypeId: null,
      encounterId: boss.id,
      anchorCharacterId: null,
    }));
    if (precomputedRec) {
      setManualSlots(precomputedRec.members);
      setSelectedRecId(precomputedRec.id);
    } else {
      setManualSlots(EMPTY_SLOTS);
      setSelectedRecId(null);
    }
    setManualTeam(null);
    if (sourceTab !== 'visualizer') {
      setOriginContext({
        fromTab: sourceTab,
        label:
          sourceTab === 'bosses'
            ? 'Bosses'
            : sourceTab === 'roster'
              ? 'Roster'
              : sourceTab === 'regions'
                ? 'Regions'
                : 'Spiral Abyss',
        detail: boss.name,
      });
    } else {
      setOriginContext(null);
    }
    setActiveTab('visualizer');
  };

  // Playful Wish-inspired "Fate's Pick" that summons a fresh, strong, distinct constellation
  const handleFatesPick = () => {
    const baseFilters: BuilderFilters = {
      archetypeId: null,
      encounterId: null,
      anchorCharacterId: null,
      includeUnbuilt: filters.includeUnbuilt,
      requireSurvivability: filters.requireSurvivability,
      excludedCharacterIds: filters.excludedCharacterIds,
    };

    const poolMap = new Map<string, TeamRecommendation>();
    // General top picks + 1 top pick from each major archetype for rich variety
    const general = generateRecommendedTeams(roster, baseFilters, 4);
    for (const rec of general) {
      const sig = rec.members
        .map((m) => m.id)
        .slice()
        .sort()
        .join('|');
      if (!poolMap.has(sig)) poolMap.set(sig, rec);
    }

    for (const arch of ARCHETYPES) {
      const top = generateRecommendedTeams(
        roster,
        { ...baseFilters, archetypeId: arch.id },
        1
      )[0];
      if (top) {
        const sig = top.members
          .map((m) => m.id)
          .slice()
          .sort()
          .join('|');
        if (!poolMap.has(sig)) poolMap.set(sig, top);
      }
    }

    const candidates = Array.from(poolMap.values());
    if (candidates.length === 0) {
      notify('Enable Lv 1–90 in the rules menu to widen Fate’s Pick.');
      return;
    }

    const currentSig = activeTeam
      ? activeTeam.members
          .map((m) => m.id)
          .slice()
          .sort()
          .join('|')
      : '';
    const freshPool =
      candidates.length > 1
        ? candidates.filter(
            (c) =>
              c.members
                .map((m) => m.id)
                .slice()
                .sort()
                .join('|') !== currentSig
          )
        : candidates;

    const chosen = freshPool[Math.floor(Math.random() * freshPool.length)];
    setSelectedRegionId(null);
    setFilters(baseFilters);
    setSelectedRecId(null);
    setManualSlots(chosen.members);
    setManualTeam({
      ...chosen,
      id: `fates-${Date.now()}`,
      subtitle: `Fate's Pick · ${chosen.subtitle}`,
    });
    setFatesBurstKey((k) => k + 1);
    notify(`✦ Fate's Pick summoned ${chosen.title}`);
  };

  // Cmd/Ctrl + / toggles the Genshin Guru skill chat sidebar from anywhere
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setIsChatOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    let active = true;
    void checkServerGeminiStatus().then((ok) => {
      if (active) setServerGeminiConfigured(ok);
    });
    return () => {
      active = false;
    };
  }, []);

  const handleSendGuruChat = async (question: string) => {
    const userMsg: GuruChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: question,
      createdAt: new Date().toISOString(),
    };
    const nextWithUser = [...chatMessages, userMsg];
    setChatMessages(nextWithUser);
    saveChatHistory(serializeChatMessages(nextWithUser));
    setIsChatThinking(true);

    try {
      const reply = await askGuruSkill(question, {
        roster,
        presets,
        activeTeam,
        includeUnbuilt: filters.includeUnbuilt,
        requireSurvivability: filters.requireSurvivability,
        geminiApiKey: effectiveGeminiKey,
        serverGeminiAvailable: serverGeminiConfigured,
        history: chatMessages,
      });
      const nextAll = [...nextWithUser, reply];
      setChatMessages(nextAll);
      saveChatHistory(serializeChatMessages(nextAll));
    } finally {
      setIsChatThinking(false);
    }
  };

  const handleClearGuruChat = () => {
    setChatMessages([]);
    saveChatHistory([]);
    notify('Cleared Genshin Guru chat.');
  };

  const handleLoadTeamFromChat = (team: TeamRecommendation) => {
    setOriginContext(null);
    setSelectedRegionId(null);
    setSelectedRecId(null);
    setManualSlots(team.members);
    setManualTeam(team);
    setFatesBurstKey((k) => k + 1);
    setActiveTab('visualizer');
    notify(`Loaded "${team.title}" into Team Circle.`);
  };

  const handleLoadAbyssPairFromChat = (
    half1: TeamRecommendation,
    half2: TeamRecommendation
  ) => {
    setHalf1Ids(
      half1.members.map((m) => m.id) as [string, string, string, string]
    );
    setHalf2Ids(
      half2.members.map((m) => m.id) as [string, string, string, string]
    );
    setHalf1Label(half1.title);
    setHalf2Label(half2.title);
    setActiveTab('abyss', true);
    notify('Loaded both Genshin Guru squads into Spiral Abyss.');
  };

  const handleCopyAndOpenSkill = async (promptText: string) => {
    try {
      await navigator.clipboard.writeText(promptText);
      notify('Copied your question — opening Genshin Guru Skill in Gemini.');
    } catch {
      notify('Opening Genshin Guru Skill in Gemini.');
    }
    window.open(GENSHIN_GURU_SKILL_URL, '_blank', 'noopener,noreferrer');
  };

  // Dynamic ambient elemental sky mood matching the active party's dominant Vision
  const ambientElement: ElementType | 'Default' = useMemo(() => {
    if (activeTab !== 'visualizer') return 'Default';
    const slots = activeTeam ? activeTeam.members : manualSlots;
    const present = slots.filter((c): c is Character => Boolean(c));
    if (present.length === 0) return 'Default';

    const counts = new Map<ElementType, number>();
    present.forEach((m, idx) => {
      counts.set(m.element, (counts.get(m.element) ?? 0) + (idx === 0 ? 1.2 : 1));
    });

    let best: ElementType = present[0].element;
    let max = -1;
    counts.forEach((val, el) => {
      if (val > max) {
        max = val;
        best = el;
      }
    });
    return best;
  }, [activeTab, activeTeam, manualSlots]);

  return (
    <div
      className="app-shell"
      data-ambient={ambientElement}
      data-tab={activeTab}
      data-chat-open={isChatOpen ? 'true' : 'false'}
    >
      <CelestialBackdrop ambientElement={ambientElement} />
      <Header
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab, true)}
        savedCount={savedTeams.length + savedAbyssPairs.length}
        includeUnbuilt={filters.includeUnbuilt}
        onToggleIncludeUnbuilt={() => {
          const next = !filters.includeUnbuilt;
          setFilters((prev) => ({ ...prev, includeUnbuilt: next }));
          notify(
            next
              ? 'Character pool widened to Lv 1–90 across all tabs.'
              : 'Character pool set to Battle-Ready (Lv 70+) across all tabs.'
          );
        }}
        isChatOpen={isChatOpen}
        onToggleChat={() => setIsChatOpen((v) => !v)}
        onOpenSettings={() => setShowSettings(true)}
        onOpenSavedDrawer={() => setShowSavedDrawer(true)}
      />

      <div className="workspace-body">
        <main className="canvas">
        {activeTab === 'visualizer' && (
          <>
            <FilterPanel
              roster={roster}
              presets={presets}
              selectedRegionId={selectedRegionId}
              onSelectRegion={(presetId) => {
                setOriginContext(null);
                handleSelectRegionDropdown(presetId);
              }}
              filters={filters}
              onChangeFilters={(next) => {
                setOriginContext(null);
                handleChangeFilters(next);
              }}
              hasGeminiKey={hasLiveGemini}
              isAskingGemini={isAskingGemini}
              geminiError={geminiError}
              onAskGemini={(q) => void handleAskGemini(q)}
              onOpenSettings={() => setShowSettings(true)}
            />

            <TeamVisualizer
              recommendations={recommendations}
              activeTeam={activeTeam}
              manualSlots={manualSlots}
              hasActiveSelection={hasActiveFilterCriteria}
              activeRegionName={activeRegionPreset?.region ?? null}
              originContext={originContext}
              onReturnToOrigin={() => {
                if (originContext) {
                  const dest = originContext.fromTab;
                  setOriginContext(null);
                  setActiveTab(dest);
                }
              }}
              burstSignal={fatesBurstKey}
              onSelectRecommendation={(rec) => {
                setManualTeam(null);
                setManualSlots(rec.members);
                setSelectedRecId(rec.id);
              }}
              onShuffleTeam={handleShuffleTeam}
              onSwapSlot={handleSwapSlot}
              onInspectCharacter={(char) => setInspectedCharacter(char)}
              onFatesPick={() => {
                setOriginContext(null);
                handleFatesPick();
              }}
              roster={roster}
              includeUnbuilt={filters.includeUnbuilt}
              onSaveTeam={handleSaveTeam}
              onCopySheetRow={(t) =>
                void handleCopySheetRow(
                  t.members,
                  t.title,
                  activeRegionPreset?.region || t.archetypeId || 'Custom'
                )
              }
              onSendToAbyss={(t, half) =>
                handleSendToAbyss(t.members, t.title, half)
              }
              onNavigateTab={(tab) => setActiveTab(tab, true)}
            />
          </>
        )}

        {activeTab === 'top-teams' && (
          <TopTeamsView
            roster={roster}
            includeUnbuilt={filters.includeUnbuilt}
            requireSurvivability={filters.requireSurvivability}
            sortBy={topTeamsSortBy}
            onChangeSortBy={setTopTeamsSortBy}
            search={topTeamsSearch}
            onChangeSearch={setTopTeamsSearch}
            category={topTeamsCategory}
            onChangeCategory={setTopTeamsCategory}
            onOpenTeamInCircle={(team, rank) => {
              setSelectedRegionId(null);
              setFilters((prev) => ({
                ...prev,
                archetypeId: null,
                encounterId: null,
                anchorCharacterId: null,
              }));
              setSelectedRecId(null);
              setManualSlots(team.members);
              setManualTeam(team);
              setOriginContext({
                fromTab: 'top-teams',
                label: 'Top Teams',
                detail: `#${rank} · Score ${team.analysis.score}`,
              });
              setFatesBurstKey((k) => k + 1);
              setActiveTab('visualizer');
            }}
            onInspectCharacter={(char) => setInspectedCharacter(char)}
            onSendToAbyss={handleSendToAbyss}
          />
        )}

        {activeTab === 'bosses' && (
          <BossesView
            roster={roster}
            includeUnbuilt={filters.includeUnbuilt}
            search={bossSearch}
            onChangeSearch={setBossSearch}
            filterKey={bossFilterKey}
            onChangeFilterKey={setBossFilterKey}
            onOpenBossInCircle={(boss, rec) =>
              handleOpenBossCounter(boss, rec)
            }
            onInspectCharacter={(char) => setInspectedCharacter(char)}
            onSendToAbyss={handleSendToAbyss}
          />
        )}

        {activeTab === 'abyss' && (
          <AbyssPlanner
            roster={roster}
            half1Ids={half1Ids}
            half2Ids={half2Ids}
            half1Label={half1Label}
            half2Label={half2Label}
            includeUnbuilt={filters.includeUnbuilt}
            requireSurvivability={filters.requireSurvivability}
            onChangeHalf={(half, ids, label) => {
              if (half === 1) {
                setHalf1Ids(ids);
                if (label) setHalf1Label(label);
              } else {
                setHalf2Ids(ids);
                if (label) setHalf2Label(label);
              }
            }}
            onSwapHalves={() => {
              setHalf1Ids(half2Ids);
              setHalf2Ids(half1Ids);
              setHalf1Label(half2Label);
              setHalf2Label(half1Label);
              notify('Swapped Half 1 and Half 2.');
            }}
            onSaveAbyssPair={(name) => {
              const pair: SavedAbyssPair = {
                id: `abyss-${Date.now()}`,
                name,
                half1Ids,
                half2Ids,
                half1Label,
                half2Label,
                createdAt: new Date().toISOString(),
              };
              const next = [pair, ...savedAbyssPairs];
              setSavedAbyssPairs(next);
              saveSavedAbyssPairs(next);
              notify(`Saved "${name}".`);
            }}
          />
        )}

        {activeTab === 'regions' && (
          <RegionalPresets
            presets={presets}
            roster={roster}
            includeUnbuilt={filters.includeUnbuilt}
            requireSurvivability={filters.requireSurvivability}
            search={regionSearch}
            onChangeSearch={setRegionSearch}
            selectedNation={regionNation}
            onChangeNation={setRegionNation}
            onLoadToVisualizer={handleLoadPresetToVisualizer}
            onInspectCharacter={(char) => setInspectedCharacter(char)}
            onSendToAbyss={handleSendToAbyss}
          />
        )}

        {activeTab === 'roster' && (
          <RosterView
            roster={roster}
            isSyncing={isSyncing}
            lastSyncedAt={settings.lastSyncedAt}
            search={rosterSearch}
            onChangeSearch={setRosterSearch}
            elementFilter={rosterElement}
            onChangeElementFilter={setRosterElement}
            readinessFilter={rosterReadiness}
            onChangeReadinessFilter={setRosterReadiness}
            onRefreshRoster={() => void performLiveSync(settings)}
            onInspectCharacter={(char) => setInspectedCharacter(char)}
            onBuildAroundCharacter={handleBuildAroundCharacter}
          />
        )}
        </main>

        <GuruChatSidebar
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          messages={chatMessages}
          isThinking={isChatThinking}
          hasGeminiKey={hasLiveGemini}
          roster={roster}
          activeTeam={activeTeam}
          includeUnbuilt={filters.includeUnbuilt}
          onSendMessage={(q) => void handleSendGuruChat(q)}
          onClearChat={handleClearGuruChat}
          onLoadTeamInCircle={handleLoadTeamFromChat}
          onSendToAbyss={handleSendToAbyss}
          onLoadAbyssPair={handleLoadAbyssPairFromChat}
          onInspectCharacter={(char) => setInspectedCharacter(char)}
          onOpenSettings={() => setShowSettings(true)}
          onCopyAndOpenSkill={(q) => void handleCopyAndOpenSkill(q)}
        />
      </div>

      {inspectedCharacter && (
        <CharacterBuildDrawer
          character={inspectedCharacter}
          onClose={() => setInspectedCharacter(null)}
          onBuildAroundCharacter={handleBuildAroundCharacter}
          onOpenBossCounter={(boss) => handleOpenBossCounter(boss)}
        />
      )}

      {showSavedDrawer && (
        <SavedTeamsDrawer
          roster={roster}
          savedTeams={savedTeams}
          savedAbyssPairs={savedAbyssPairs}
          onLoadTeam={(saved, members) => {
            if (members.length < 4) return;
            const tuple = members.slice(0, 4) as [
              Character,
              Character,
              Character,
              Character,
            ];
            const analysis = analyzeTeam(tuple);
            setOriginContext(null);
            setSelectedRegionId(null);
            setManualSlots(tuple);
            setManualTeam({
              id: saved.id,
              title: saved.name,
              subtitle: analysis.reactions
                .slice(0, 3)
                .map((r) => r.name)
                .join(' · '),
              members: tuple,
              slotLabels: inferSlotRoles(tuple),
              analysis,
              whyItWorks: saved.notes,
              source: 'custom',
            });
            setActiveTab('visualizer');
          }}
          onCopyTeamRow={(saved, members) =>
            void handleCopySheetRow(members, saved.name, saved.regionTag)
          }
          onDeleteTeam={(id) => {
            const next = savedTeams.filter((t) => t.id !== id);
            setSavedTeams(next);
            saveSavedTeams(next);
            notify('Removed saved team.');
          }}
          onLoadAbyssPair={(pair) => {
            setHalf1Ids(pair.half1Ids);
            setHalf2Ids(pair.half2Ids);
            setHalf1Label(pair.half1Label);
            setHalf2Label(pair.half2Label);
            setActiveTab('abyss', true);
            notify(`Loaded "${pair.name}" into Spiral Abyss.`);
          }}
          onDeleteAbyssPair={(id) => {
            const next = savedAbyssPairs.filter((p) => p.id !== id);
            setSavedAbyssPairs(next);
            saveSavedAbyssPairs(next);
            notify('Removed saved Abyss pair.');
          }}
          onClose={() => setShowSavedDrawer(false)}
        />
      )}

      {showSettings && (
        <SettingsModal
          settings={settings}
          isSyncing={isSyncing}
          syncError={syncError}
          onSaveAndSync={(next) => performLiveSync(next)}
          onSaveOnly={(next) => {
            setSettings(next);
            saveSettings(next);
            notify('Settings saved.');
          }}
          onImportPastedRoster={handleImportPastedRoster}
          onResetSnapshot={() => {
            setRoster(SNAPSHOT_CHARACTERS);
            setPresets(SNAPSHOT_PRESETS);
            const reset: AppSettings = {
              ...settings,
              dataSource: 'snapshot',
              lastSyncedAt: null,
            };
            setSettings(reset);
            saveSettings(reset);
            setSyncError(null);
            notify('Restored bundled snapshot.');
          }}
          onClose={() => setShowSettings(false)}
        />
      )}

      {toast && (
        <div className="toast" role="status" aria-live="polite">
          <CheckCircle2 size={14} color="var(--gold-bright)" />
          <span>{toast.message}</span>
          {toast.actionLabel && toast.onAction && (
            <button
              type="button"
              className="toast-action-btn"
              onClick={toast.onAction}
            >
              {toast.actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
