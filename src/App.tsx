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
} from './engine/teamBuilder';
import {
  fetchRosterFromSheets,
  parseCharactersFromRows,
  parseDelimitedText,
} from './services/sheetsApi';
import { askGenshinGuruGemini } from './services/geminiApi';
import {
  loadSavedAbyssPairs,
  loadSavedTeams,
  loadSettings,
  saveSavedAbyssPairs,
  saveSavedTeams,
  saveSettings,
} from './services/storage';
import { Header } from './components/Header';
import { FilterPanel } from './components/FilterPanel';
import { TeamVisualizer } from './components/TeamVisualizer';
import { BossesView } from './components/BossesView';
import { AbyssPlanner } from './components/AbyssPlanner';
import { RegionalPresets } from './components/RegionalPresets';
import { RosterView } from './components/RosterView';
import { SavedTeamsDrawer } from './components/SavedTeamsView';
import { SettingsModal } from './components/SettingsModal';
import { CelestialBackdrop } from './components/CelestialBackdrop';

const EMPTY_SLOTS: [
  Character | null,
  Character | null,
  Character | null,
  Character | null,
] = [null, null, null, null];

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('visualizer');
  const [roster, setRoster] = useState<Character[]>(SNAPSHOT_CHARACTERS);
  const [presets, setPresets] = useState<RegionalPreset[]>(SNAPSHOT_PRESETS);
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showSavedDrawer, setShowSavedDrawer] = useState(false);

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

  const [toast, setToast] = useState<string | null>(null);
  const notify = (msg: string) => setToast(msg);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3200);
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

  const recommendations = useMemo(() => {
    if (
      !filters.archetypeId &&
      !filters.encounterId &&
      !filters.anchorCharacterId
    ) {
      return [];
    }
    return generateRecommendedTeams(roster, filters, 6);
  }, [roster, filters]);

  const activeTeam: TeamRecommendation | null = useMemo(() => {
    if (manualTeam) return manualTeam;
    if (selectedRecId) {
      const found = recommendations.find((r) => r.id === selectedRecId);
      if (found) return found;
    }
    return recommendations[0] ?? null;
  }, [manualTeam, selectedRecId, recommendations]);

  const activeRegionPreset = useMemo(
    () => presets.find((p) => p.id === selectedRegionId) ?? null,
    [presets, selectedRegionId]
  );

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
    resolvedMembers?: Character[]
  ) => {
    const charMap = new Map(roster.map((c) => [c.id, c]));
    const members =
      resolvedMembers ??
      preset.resolvedCharacterIds
        .map((id) => (id ? charMap.get(id) ?? null : null))
        .filter((c): c is Character => Boolean(c));

    if (members.length < 4) return;
    const tuple = members.slice(0, 4) as [
      Character,
      Character,
      Character,
      Character,
    ];
    const analysis = analyzeTeam(tuple);
    setSelectedRegionId(preset.id);
    setManualSlots(tuple);
    setManualTeam({
      id: `preset-${preset.id}`,
      title: preset.teamName,
      subtitle: preset.region,
      members: tuple,
      slotLabels: inferSlotRoles(tuple),
      analysis,
      whyItWorks: `Your go-to "${preset.region}" squad from Party by Region. Hover any connection inside the circle to inspect reactions, or click a portrait to test substitutes.`,
      source: 'preset',
    });
  };

  const handleSelectRegionDropdown = (presetId: string | null) => {
    if (!presetId) {
      setSelectedRegionId(null);
      setManualTeam(null);
      setManualSlots(EMPTY_SLOTS);
      return;
    }
    const preset = presets.find((p) => p.id === presetId);
    if (preset) {
      loadPresetIntoCircle(preset);
    }
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
        settings.geminiApiKey,
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

    setActiveTab('abyss');
    notify(`Loaded into Spiral Abyss Half ${half}.`);
  };

  const handleLoadPresetToVisualizer = (
    preset: RegionalPreset,
    members: Character[]
  ) => {
    loadPresetIntoCircle(preset, members);
    setActiveTab('visualizer');
  };

  const handleBuildAroundCharacter = (char: Character) => {
    handleChangeFilters({
      ...filters,
      archetypeId: null,
      encounterId: null,
      anchorCharacterId: char.id,
      includeUnbuilt:
        char.level < BATTLE_READY_LEVEL ? true : filters.includeUnbuilt,
    });
    setActiveTab('visualizer');
    notify(`Built Team Circle around ${char.name}.`);
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
    <div className="app-shell" data-ambient={ambientElement}>
      <CelestialBackdrop ambientElement={ambientElement} />
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        savedCount={savedTeams.length + savedAbyssPairs.length}
        settings={settings}
        isSyncing={isSyncing}
        onSyncNow={() => void performLiveSync(settings)}
        onOpenSettings={() => setShowSettings(true)}
        onOpenSavedDrawer={() => setShowSavedDrawer(true)}
      />

      <main className="canvas">
        {activeTab === 'visualizer' && (
          <>
            <FilterPanel
              roster={roster}
              presets={presets}
              selectedRegionId={selectedRegionId}
              onSelectRegion={handleSelectRegionDropdown}
              filters={filters}
              onChangeFilters={handleChangeFilters}
              hasGeminiKey={Boolean(settings.geminiApiKey)}
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
              burstSignal={fatesBurstKey}
              onSelectRecommendation={(rec) => {
                setSelectedRegionId(null);
                setManualTeam(null);
                setManualSlots(rec.members);
                setSelectedRecId(rec.id);
              }}
              onSwapSlot={handleSwapSlot}
              onFatesPick={handleFatesPick}
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
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          </>
        )}

        {activeTab === 'bosses' && (
          <BossesView
            roster={roster}
            includeUnbuilt={filters.includeUnbuilt}
            onToggleIncludeUnbuilt={() =>
              setFilters((prev) => ({
                ...prev,
                includeUnbuilt: !prev.includeUnbuilt,
              }))
            }
            onOpenBossInCircle={(
              boss: EncounterDefinition,
              rec: TeamRecommendation
            ) => {
              setSelectedRegionId(null);
              setFilters((prev) => ({
                ...prev,
                archetypeId: null,
                encounterId: boss.id,
                anchorCharacterId: null,
              }));
              setManualSlots(rec.members);
              setManualTeam(null);
              setSelectedRecId(rec.id);
              setActiveTab('visualizer');
            }}
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
            onLoadToVisualizer={handleLoadPresetToVisualizer}
            onSendToAbyss={handleSendToAbyss}
          />
        )}

        {activeTab === 'roster' && (
          <RosterView
            roster={roster}
            isSyncing={isSyncing}
            lastSyncedAt={settings.lastSyncedAt}
            onRefreshRoster={() => void performLiveSync(settings)}
            onBuildAroundCharacter={handleBuildAroundCharacter}
          />
        )}
      </main>

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
            setActiveTab('abyss');
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
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
