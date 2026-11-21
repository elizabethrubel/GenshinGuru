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
  RegionalPreset,
  SavedAbyssPair,
  SavedTeam,
  TeamRecommendation,
} from './types/genshin';
import {
  analyzeTeam,
  BATTLE_READY_LEVEL,
  inferSlotRoles,
} from './engine/teamAnalyzer';
import {
  formatTeamAsSheetRow,
  generateRecommendedTeams,
} from './engine/teamBuilder';
import { fetchRosterFromSheets } from './services/sheetsApi';
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
import { AbyssPlanner } from './components/AbyssPlanner';
import { RegionalPresets } from './components/RegionalPresets';
import { RosterView } from './components/RosterView';
import { SavedTeamsDrawer } from './components/SavedTeamsView';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('visualizer');
  const [roster, setRoster] = useState<Character[]>(SNAPSHOT_CHARACTERS);
  const [presets, setPresets] = useState<RegionalPreset[]>(SNAPSHOT_PRESETS);
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showSavedDrawer, setShowSavedDrawer] = useState(false);

  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);

  const [filters, setFilters] = useState<BuilderFilters>({
    archetypeId: 'stellar-conduct',
    encounterId: null,
    anchorCharacterId: null,
    includeUnbuilt: false,
    requireSurvivability: true,
    excludedCharacterIds: [],
  });

  const [manualTeam, setManualTeam] = useState<TeamRecommendation | null>(null);
  const [selectedRecId, setSelectedRecId] = useState<string | null>(null);

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
    const t = window.setTimeout(() => setToast(null), 3000);
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
        notify(`Synced ${result.characters.length} characters from Google Sheets.`);
        setShowSettings(false);
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Failed to sync Google Sheet.';
      setSyncError(msg);
      if (!silent) {
        notify('Google Sheet sync failed — check Settings.');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const recommendations = useMemo(
    () => generateRecommendedTeams(roster, filters, 6),
    [roster, filters]
  );

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
      return;
    }
    const preset = presets.find((p) => p.id === presetId);
    if (preset) {
      loadPresetIntoCircle(preset);
    }
  };

  const handleSwapSlot = (slotIndex: number, nextChar: Character) => {
    if (!activeTeam) return;
    const nextMembers = [...activeTeam.members] as [
      Character,
      Character,
      Character,
      Character,
    ];
    nextMembers[slotIndex] = nextChar;
    const nextAnalysis = analyzeTeam(nextMembers);
    const nextRoles = inferSlotRoles(nextMembers);

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

  return (
    <div className="app-shell">
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
              activeRegionName={activeRegionPreset?.region ?? null}
              onSelectRecommendation={(rec) => {
                setSelectedRegionId(null);
                setManualTeam(null);
                setSelectedRecId(rec.id);
              }}
              onSwapSlot={handleSwapSlot}
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
            />
          </>
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
