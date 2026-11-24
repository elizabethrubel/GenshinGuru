import { useEffect, useMemo, useRef, useState } from 'react';
import {
  RotateCcw,
  Search,
  SlidersHorizontal,
  Wand2,
} from 'lucide-react';
import { ARCHETYPES } from '../data/archetypes';
import { ENCOUNTERS } from '../data/encounters';
import {
  buildCustomEncounterFromQuery,
  searchEncounters,
} from '../engine/encounterResolver';
import type {
  BuilderFilters,
  Character,
  EncounterDefinition,
  RegionalPreset,
} from '../types/genshin';
import { BATTLE_READY_LEVEL } from '../engine/teamAnalyzer';
import { CharacterPortrait } from './CharacterPortrait';
import { NationEmblem, PrimogemStar } from './NationEmblem';

interface FilterPanelProps {
  roster: Character[];
  presets: RegionalPreset[];
  selectedRegionId: string | null;
  onSelectRegion: (presetId: string | null) => void;
  filters: BuilderFilters;
  onChangeFilters: (next: BuilderFilters) => void;
  hasGeminiKey: boolean;
  isAskingGemini: boolean;
  geminiError: string | null;
  onAskGemini: (question: string) => void;
  onOpenSettings: () => void;
}

type OmniboxSuggestion =
  | {
      kind: 'boss';
      id: string;
      title: string;
      subtitle: string;
      region: string;
      encounterId: string;
    }
  | {
      kind: 'custom-opponent';
      id: string;
      title: string;
      subtitle: string;
      encounter: EncounterDefinition;
    }
  | {
      kind: 'region';
      id: string;
      title: string;
      subtitle: string;
      region: string;
      presetId: string;
    }
  | {
      kind: 'character';
      id: string;
      title: string;
      subtitle: string;
      character: Character;
    }
  | {
      kind: 'archetype';
      id: string;
      title: string;
      subtitle: string;
      archetypeId: string;
    };

const ENCOUNTER_GROUPS: Array<{
  label: string;
  filter: (e: EncounterDefinition) => boolean;
}> = [
  {
    label: 'Stygian Onslaught 7.2 & Snezhnaya',
    filter: (e) => Boolean(e.isStygian72) || (e.region === 'Snezhnaya' && e.category !== 'Elite & Shields'),
  },
  {
    label: 'Hypostases & Regisvines',
    filter: (e) => e.category === 'Hypostasis & Regisvine',
  },
  {
    label: 'Nod-Krai & Regional World Bosses',
    filter: (e) =>
      e.category === 'World Boss' &&
      !e.isStygian72 &&
      e.region !== 'Snezhnaya',
  },
  {
    label: 'Weekly Trounce Bosses',
    filter: (e) => e.category === 'Weekly Boss',
  },
  {
    label: 'Elites & Elemental Shields',
    filter: (e) => e.category === 'Elite & Shields',
  },
];

export function FilterPanel({
  roster,
  presets,
  selectedRegionId,
  onSelectRegion,
  filters,
  onChangeFilters,
  hasGeminiKey,
  isAskingGemini,
  geminiError,
  onAskGemini,
  onOpenSettings,
}: FilterPanelProps) {
  const [queryText, setQueryText] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [showRules, setShowRules] = useState(false);

  const searchRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  // Cmd/Ctrl+K global shortcut focuses the omnibox cleanly
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setShowRules(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const readyCount = roster.filter((c) => c.level >= BATTLE_READY_LEVEL).length;

  // Build live instant suggestions across Bosses, Regions, Characters, and Reactions
  const suggestions = useMemo<OmniboxSuggestion[]>(() => {
    const q = queryText.trim().toLowerCase();

    if (!q) {
      // Curated quick-launch suggestions when clicking into Search
      const quick: OmniboxSuggestion[] = [];
      const wavebinder = ENCOUNTERS.find((e) => e.id === 'wavebinder');
      if (wavebinder) {
        quick.push({
          kind: 'boss',
          id: `boss-${wavebinder.id}`,
          title: wavebinder.name,
          subtitle: 'Snezhnaya ✦ Drops for Mitya',
          region: wavebinder.region,
          encounterId: wavebinder.id,
        });
      }
      const snezhnaya = presets.find((p) =>
        p.region.toLowerCase().includes('snezhnaya')
      );
      if (snezhnaya) {
        quick.push({
          kind: 'region',
          id: `region-${snezhnaya.id}`,
          title: snezhnaya.region,
          subtitle: snezhnaya.teamName,
          region: snezhnaya.region,
          presetId: snezhnaya.id,
        });
      }
      ARCHETYPES.slice(0, 3).forEach((arch) => {
        quick.push({
          kind: 'archetype',
          id: `arch-${arch.id}`,
          title: arch.name,
          subtitle: arch.summary,
          archetypeId: arch.id,
        });
      });
      const mitya = roster.find((c) => c.name.toLowerCase() === 'mitya');
      if (mitya) {
        quick.push({
          kind: 'character',
          id: `char-${mitya.id}`,
          title: `Build around ${mitya.name}`,
          subtitle: `Lv ${mitya.level} ${mitya.element} ✦ ${mitya.specialMechanic}`,
          character: mitya,
        });
      }
      return quick;
    }

    const out: OmniboxSuggestion[] = [];

    // 1. Opponents & Bosses (multi-token, alias-aware: e.g. "anemo hypostasis", "fire cube", "oceanid", "pyro shield")
    const matchedEncounters = searchEncounters(queryText, ENCOUNTERS);
    for (const enc of matchedEncounters.slice(0, 5)) {
      const dropNote =
        enc.dropsFor && enc.dropsFor.length > 0
          ? ` ✦ Drops for ${enc.dropsFor.join(', ')}`
          : '';
      out.push({
        kind: 'boss',
        id: `boss-${enc.id}`,
        title: enc.name,
        subtitle: `${enc.region} · ${enc.category}${dropNote}`,
        region: enc.region,
        encounterId: enc.id,
      });
    }

    // 2. Regions
    let regionHits = 0;
    for (const preset of presets) {
      if (
        preset.region.toLowerCase().includes(q) ||
        preset.teamName.toLowerCase().includes(q)
      ) {
        out.push({
          kind: 'region',
          id: `region-${preset.id}`,
          title: preset.region,
          subtitle: preset.teamName,
          region: preset.region,
          presetId: preset.id,
        });
        regionHits++;
        if (regionHits >= 2) break;
      }
    }

    // 3. Characters
    let charHits = 0;
    const sortedRoster = [...roster].sort((a, b) => b.level - a.level);
    for (const c of sortedRoster) {
      if (
        c.name.toLowerCase().includes(q) ||
        c.element.toLowerCase().includes(q) ||
        c.specialMechanic.toLowerCase().includes(q)
      ) {
        out.push({
          kind: 'character',
          id: `char-${c.id}`,
          title: c.name,
          subtitle: `Lv ${c.level} ${c.element} ✦ ${c.role.split('/')[0].trim()}`,
          character: c,
        });
        charHits++;
        if (charHits >= 3) break;
      }
    }

    // 4. Reaction Archetypes
    for (const arch of ARCHETYPES) {
      if (
        arch.name.toLowerCase().includes(q) ||
        arch.summary.toLowerCase().includes(q) ||
        arch.id.replace(/-/g, ' ').includes(q)
      ) {
        out.push({
          kind: 'archetype',
          id: `arch-${arch.id}`,
          title: arch.name,
          subtitle: arch.summary,
          archetypeId: arch.id,
        });
      }
    }

    // 5. Dynamic Custom Opponent Counter (works for ANY enemy name like "Cryo Whopperflower" or "Pyro Specter"!)
    const hasExactBossMatch = matchedEncounters.some(
      (e) => e.name.toLowerCase() === q
    );
    if (q.length >= 3 && !hasExactBossMatch) {
      const customEnc = buildCustomEncounterFromQuery(queryText);
      if (customEnc) {
        const customItem: OmniboxSuggestion = {
          kind: 'custom-opponent',
          id: `custom-${customEnc.id}`,
          title: `Counter "${customEnc.name}"`,
          subtitle: customEnc.tacticalTip,
          encounter: customEnc,
        };
        if (matchedEncounters.length === 0 && out.length === 0) {
          out.unshift(customItem);
        } else {
          out.push(customItem);
        }
      }
    }

    return out.slice(0, 8);
  }, [queryText, presets, roster]);

  useEffect(() => {
    setActiveIdx(0);
  }, [queryText]);

  const applySuggestion = (item: OmniboxSuggestion) => {
    setIsOpen(false);
    setQueryText('');
    if (item.kind === 'region') {
      onSelectRegion(item.presetId);
      return;
    }
    if (item.kind === 'boss') {
      onChangeFilters({
        ...filters,
        archetypeId: null,
        encounterId: item.encounterId,
        customEncounter: null,
        anchorCharacterId: null,
      });
      return;
    }
    if (item.kind === 'custom-opponent') {
      onChangeFilters({
        ...filters,
        archetypeId: null,
        encounterId: null,
        customEncounter: item.encounter,
        anchorCharacterId: null,
      });
      return;
    }
    if (item.kind === 'archetype') {
      onChangeFilters({
        ...filters,
        archetypeId: item.archetypeId,
        encounterId: null,
        customEncounter: null,
        anchorCharacterId: null,
        includeUnbuilt:
          item.archetypeId === 'overloaded-chevreuse' ||
          item.archetypeId === 'nightsoul-geo' ||
          item.archetypeId === 'arkhe-ousia'
            ? true
            : filters.includeUnbuilt,
      });
      return;
    }
    if (item.kind === 'character') {
      onChangeFilters({
        ...filters,
        archetypeId: null,
        encounterId: null,
        customEncounter: null,
        anchorCharacterId: item.character.id,
        includeUnbuilt:
          item.character.level < BATTLE_READY_LEVEL
            ? true
            : filters.includeUnbuilt,
      });
    }
  };

  const handleSmartQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (suggestions.length > 0 && queryText.trim()) {
      applySuggestion(suggestions[Math.min(activeIdx, suggestions.length - 1)]);
      return;
    }
    if (queryText.trim()) {
      const customEnc = buildCustomEncounterFromQuery(queryText);
      if (customEnc) {
        setIsOpen(false);
        setQueryText('');
        onChangeFilters({
          ...filters,
          archetypeId: null,
          encounterId: null,
          customEncounter: customEnc,
          anchorCharacterId: null,
        });
        return;
      }
      if (hasGeminiKey) {
        setIsOpen(false);
        onAskGemini(queryText.trim());
      }
    }
  };

  const hasActiveFilters =
    Boolean(selectedRegionId) ||
    Boolean(filters.archetypeId) ||
    Boolean(filters.encounterId) ||
    Boolean(filters.customEncounter) ||
    Boolean(filters.anchorCharacterId);

  const activeAnchorChar = filters.anchorCharacterId
    ? roster.find((c) => c.id === filters.anchorCharacterId) ?? null
    : null;
  const activeArch = filters.archetypeId
    ? ARCHETYPES.find((a) => a.id === filters.archetypeId) ?? null
    : null;

  return (
    <div>
      <form className="command-bar" onSubmit={handleSmartQuerySubmit}>
        {/* Instant ⌘K Omnibox across Bosses, Regions, Characters & Reactions */}
        <div className="command-search-wrap" ref={searchRef}>
          <Search size={15} className="command-search-icon" />
          <input
            ref={inputRef}
            id="guru-query-input"
            type="text"
            className="command-input"
            style={{ paddingRight: 44 }}
            value={queryText}
            onFocus={() => setIsOpen(true)}
            onChange={(e) => {
              setQueryText(e.target.value);
              setIsOpen(true);
            }}
            onKeyDown={(e) => {
              if (!isOpen) return;
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIdx((i) =>
                  suggestions.length > 0 ? (i + 1) % suggestions.length : 0
                );
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIdx((i) =>
                  suggestions.length > 0
                    ? (i - 1 + suggestions.length) % suggestions.length
                    : 0
                );
              } else if (e.key === 'Escape') {
                setIsOpen(false);
                inputRef.current?.blur();
              }
            }}
            placeholder="Search any opponent (e.g. Anemo Hypostasis), region, or character…"
            autoComplete="off"
          />
          <kbd className="kbd-hint" aria-hidden="true">
            ⌘K
          </kbd>

          {isOpen && suggestions.length > 0 && (
            <div className="omnibox-dropdown" role="listbox">
              <div className="omnibox-header">
                {queryText.trim() ? 'Instant Matches' : 'Quick Jump'}
              </div>
              {suggestions.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  role="option"
                  aria-selected={idx === activeIdx}
                  className={`omnibox-item ${idx === activeIdx ? 'active' : ''}`}
                  onMouseEnter={() => setActiveIdx(idx)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applySuggestion(item);
                  }}
                >
                  <span className="omnibox-icon">
                    {item.kind === 'character' ? (
                      <CharacterPortrait character={item.character} size={28} />
                    ) : item.kind === 'archetype' ? (
                      <PrimogemStar size={14} color="var(--gold-bright)" />
                    ) : item.kind === 'custom-opponent' ? (
                      <Wand2 size={15} color="var(--gold-bright)" />
                    ) : (
                      <NationEmblem
                        nation={item.region}
                        size={16}
                        color="var(--gold-bright)"
                      />
                    )}
                  </span>
                  <span className="omnibox-copy">
                    <span className="omnibox-title">{item.title}</span>
                    <span className="omnibox-sub">{item.subtitle}</span>
                  </span>
                  <span className="omnibox-kind">
                    {item.kind === 'boss'
                      ? 'Opponent'
                      : item.kind === 'custom-opponent'
                        ? 'Custom'
                        : item.kind === 'region'
                          ? 'Region'
                          : item.kind === 'character'
                            ? 'Anchor'
                            : 'Reaction'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Region Preset Dropdown (user-requested quick jump) */}
        <select
          id="region-select"
          aria-label="Select Region Team"
          className={`inline-select ${selectedRegionId ? 'active-filter' : ''}`}
          value={selectedRegionId ?? ''}
          onChange={(e) => onSelectRegion(e.target.value || null)}
        >
          <option value="">Region Preset…</option>
          {presets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.region}
            </option>
          ))}
        </select>

        {/* Opponent Counter Dropdown (grouped by category) */}
        <select
          id="encounter-select"
          aria-label="Boss or Opponent"
          className={`inline-select ${filters.encounterId ? 'active-filter' : ''}`}
          value={filters.encounterId ?? ''}
          onChange={(e) =>
            onChangeFilters({
              ...filters,
              archetypeId: null,
              anchorCharacterId: null,
              customEncounter: null,
              encounterId: e.target.value || null,
            })
          }
        >
          <option value="">Opponent Counter…</option>
          {ENCOUNTER_GROUPS.map((group) => {
            const items = ENCOUNTERS.filter(group.filter);
            if (items.length === 0) return null;
            return (
              <optgroup key={group.label} label={group.label}>
                {items.map((enc) => (
                  <option key={enc.id} value={enc.id}>
                    {enc.name}
                  </option>
                ))}
              </optgroup>
            );
          })}
        </select>

        {/* Quiet active badge when anchored by character, reaction, or custom opponent */}
        {(activeAnchorChar || activeArch || filters.customEncounter) && (
          <span className="active-scope-tag">
            {activeAnchorChar
              ? `Anchor: ${activeAnchorChar.name}`
              : filters.customEncounter
                ? `Counter: ${filters.customEncounter.name}`
                : activeArch?.name}
          </span>
        )}

        {/* Secondary Rules Popover (Sustain & Gemini AI) */}
        <div className="popover-anchor" ref={popoverRef}>
          <button
            id="btn-rules-popover"
            type="button"
            className={`btn-subtle ${!filters.requireSurvivability ? 'active-filter' : ''}`}
            onClick={() => setShowRules((v) => !v)}
            title="Survivability rule and optional Gemini advisor"
          >
            <SlidersHorizontal size={13} />
            <span>Rules</span>
          </button>

          {showRules && (
            <div className="options-popover">
              <div className="option-row">
                <div>
                  <div className="option-title">Include Unbuilt (Lv 1–69)</div>
                  <div className="option-sub">
                    {readyCount} of {roster.length} characters are Lv 70+
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={filters.includeUnbuilt}
                  className={`switch ${filters.includeUnbuilt ? 'on' : ''}`}
                  onClick={() =>
                    onChangeFilters({
                      ...filters,
                      includeUnbuilt: !filters.includeUnbuilt,
                    })
                  }
                />
              </div>

              <div className="option-row">
                <div>
                  <div className="option-title">Require Healer or Shielder</div>
                  <div className="option-sub">
                    Ensures comfortable Abyss survivability
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={filters.requireSurvivability}
                  className={`switch ${filters.requireSurvivability ? 'on' : ''}`}
                  onClick={() =>
                    onChangeFilters({
                      ...filters,
                      requireSurvivability: !filters.requireSurvivability,
                    })
                  }
                />
              </div>

              <hr className="hairline" />

              {hasGeminiKey ? (
                <button
                  type="button"
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  disabled={isAskingGemini || !queryText.trim()}
                  onClick={() => {
                    setShowRules(false);
                    onAskGemini(queryText.trim());
                  }}
                >
                  <Wand2 size={13} />
                  {isAskingGemini
                    ? 'Asking Gemini…'
                    : 'Ask Gemini about search query'}
                </button>
              ) : (
                <button
                  type="button"
                  className="ghost-action"
                  style={{ padding: 0, fontSize: 12 }}
                  onClick={() => {
                    setShowRules(false);
                    onOpenSettings();
                  }}
                >
                  <Wand2 size={13} />
                  Add optional Gemini API key in Settings
                </button>
              )}
            </div>
          )}
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            className="ghost-action"
            onClick={() => {
              setQueryText('');
              onSelectRegion(null);
              onChangeFilters({
                ...filters,
                archetypeId: null,
                encounterId: null,
                customEncounter: null,
                anchorCharacterId: null,
              });
            }}
            title="Clear current selection"
          >
            <RotateCcw size={13} />
            Reset
          </button>
        )}
      </form>

      {geminiError && (
        <div className="note-line danger" style={{ marginBottom: 16 }}>
          {geminiError}
        </div>
      )}
    </div>
  );
}
