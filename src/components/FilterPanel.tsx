import { useEffect, useRef, useState } from 'react';
import {
  RotateCcw,
  Search,
  SlidersHorizontal,
  Wand2,
} from 'lucide-react';
import { ARCHETYPES } from '../data/archetypes';
import { ENCOUNTERS } from '../data/encounters';
import type { BuilderFilters, Character } from '../types/genshin';
import { BATTLE_READY_LEVEL } from '../engine/teamAnalyzer';

interface FilterPanelProps {
  roster: Character[];
  filters: BuilderFilters;
  onChangeFilters: (next: BuilderFilters) => void;
  hasGeminiKey: boolean;
  isAskingGemini: boolean;
  geminiError: string | null;
  onAskGemini: (question: string) => void;
  onOpenSettings: () => void;
}

export function FilterPanel({
  roster,
  filters,
  onChangeFilters,
  hasGeminiKey,
  isAskingGemini,
  geminiError,
  onAskGemini,
  onOpenSettings,
}: FilterPanelProps) {
  const [queryText, setQueryText] = useState('');
  const [showRules, setShowRules] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!showRules) return;
    const onDocClick = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setShowRules(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [showRules]);

  const readyCount = roster.filter((c) => c.level >= BATTLE_READY_LEVEL).length;

  const sortedRoster = [...roster].sort((a, b) => {
    if (b.level !== a.level) return b.level - a.level;
    return a.name.localeCompare(b.name);
  });

  const handleSmartQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = queryText.trim().toLowerCase();
    if (!q) return;

    const matchedArchetype = ARCHETYPES.find(
      (a) =>
        q.includes(a.name.toLowerCase()) ||
        q.includes(a.id.replace(/-/g, ' ')) ||
        (q.includes('stellar') && a.id === 'stellar-conduct') ||
        (q.includes('conduct') && a.id === 'stellar-conduct') ||
        (q.includes('overload') && a.id === 'overloaded-chevreuse') ||
        (q.includes('crystallize') && a.id === 'lunar-crystallize') ||
        (q.includes('lunar charged') && a.id === 'lunar-charged') ||
        (q.includes('lunar bloom') && a.id === 'lunar-bloom')
    );

    const matchedEncounter = ENCOUNTERS.find(
      (enc) =>
        enc.keywords.some((kw) => q.includes(kw)) ||
        q.includes(enc.region.toLowerCase())
    );

    const matchedChar = roster.find((c) => q.includes(c.name.toLowerCase()));

    if (matchedArchetype || matchedEncounter || matchedChar) {
      onChangeFilters({
        ...filters,
        archetypeId: matchedArchetype ? matchedArchetype.id : filters.archetypeId,
        encounterId: matchedEncounter ? matchedEncounter.id : filters.encounterId,
        anchorCharacterId: matchedChar ? matchedChar.id : filters.anchorCharacterId,
        includeUnbuilt:
          (matchedChar && matchedChar.level < BATTLE_READY_LEVEL) ||
          matchedArchetype?.id === 'overloaded-chevreuse' ||
          matchedArchetype?.id === 'nightsoul-geo' ||
          matchedArchetype?.id === 'arkhe-ousia'
            ? true
            : filters.includeUnbuilt,
      });
      return;
    }

    if (hasGeminiKey) {
      onAskGemini(queryText.trim());
    }
  };

  const hasActiveFilters =
    Boolean(filters.archetypeId) ||
    Boolean(filters.encounterId) ||
    Boolean(filters.anchorCharacterId);

  const nonDefaultRules =
    filters.includeUnbuilt || !filters.requireSurvivability;

  return (
    <div>
      <form className="command-bar" onSubmit={handleSmartQuerySubmit}>
        <div className="command-search-wrap">
          <Search size={15} className="command-search-icon" />
          <input
            id="guru-query-input"
            type="text"
            className="command-input"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="Ask or filter — e.g. Stellar-Conduct, Tenebrous Mimic, Flins…"
          />
        </div>

        <select
          id="archetype-select"
          aria-label="Reaction or Mechanic Style"
          className={`inline-select ${filters.archetypeId ? 'active-filter' : ''}`}
          value={filters.archetypeId ?? ''}
          onChange={(e) => {
            const nextId = e.target.value || null;
            const needsUnbuilt =
              nextId === 'overloaded-chevreuse' ||
              nextId === 'nightsoul-geo' ||
              nextId === 'arkhe-ousia';
            onChangeFilters({
              ...filters,
              archetypeId: nextId,
              includeUnbuilt: needsUnbuilt ? true : filters.includeUnbuilt,
            });
          }}
        >
          <option value="">Any Reaction Style</option>
          {ARCHETYPES.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>

        <select
          id="encounter-select"
          aria-label="Boss or Encounter Counter"
          className={`inline-select ${filters.encounterId ? 'active-filter' : ''}`}
          value={filters.encounterId ?? ''}
          onChange={(e) =>
            onChangeFilters({
              ...filters,
              encounterId: e.target.value || null,
            })
          }
        >
          <option value="">Any Encounter</option>
          {ENCOUNTERS.map((enc) => (
            <option key={enc.id} value={enc.id}>
              {enc.name.split('/')[0].trim()}
            </option>
          ))}
        </select>

        <select
          id="anchor-select"
          aria-label="Anchor Character"
          className={`inline-select ${filters.anchorCharacterId ? 'active-filter' : ''}`}
          value={filters.anchorCharacterId ?? ''}
          onChange={(e) => {
            const nextId = e.target.value || null;
            const chosen = roster.find((c) => c.id === nextId);
            onChangeFilters({
              ...filters,
              anchorCharacterId: nextId,
              includeUnbuilt:
                chosen && chosen.level < BATTLE_READY_LEVEL
                  ? true
                  : filters.includeUnbuilt,
            });
          }}
        >
          <option value="">Build Around…</option>
          {sortedRoster.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} (Lv {c.level})
            </option>
          ))}
        </select>

        {/* Secondary rules tucked in a calm popover */}
        <div className="popover-anchor" ref={popoverRef}>
          <button
            id="btn-rules-popover"
            type="button"
            className={`ghost-action ${nonDefaultRules ? 'accent' : ''}`}
            onClick={() => setShowRules((v) => !v)}
          >
            <SlidersHorizontal size={14} />
            <span>
              {filters.includeUnbuilt ? 'Lv 1–90' : 'Lv 70+'}
              {!filters.requireSurvivability ? ' · Glass' : ''}
            </span>
          </button>

          {showRules && (
            <div className="options-popover">
              <div className="option-row">
                <div>
                  <div className="option-title">Include Unbuilt (Lv 1–69)</div>
                  <div className="option-sub">
                    {filters.includeUnbuilt
                      ? `All ${roster.length} chars · flags Worth Leveling`
                      : `Battle-Ready only (${readyCount} chars)`}
                  </div>
                </div>
                <button
                  id="toggle-include-unbuilt"
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
                    {filters.requireSurvivability
                      ? 'Sustain guaranteed in every team'
                      : 'Glass Cannon / Max DPS allowed'}
                  </div>
                </div>
                <button
                  id="toggle-require-sustain"
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

              <button
                id="btn-ask-gemini"
                type="button"
                className="btn-subtle"
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={isAskingGemini}
                onClick={() => {
                  setShowRules(false);
                  if (!hasGeminiKey) {
                    onOpenSettings();
                  } else if (queryText.trim()) {
                    onAskGemini(queryText.trim());
                  }
                }}
              >
                <Wand2 size={13} />
                {isAskingGemini
                  ? 'Asking Gemini…'
                  : hasGeminiKey
                    ? 'Ask Gemini with search query'
                    : 'Connect Gemini API for freeform Q&A'}
              </button>
            </div>
          )}
        </div>

        {queryText.trim() && hasGeminiKey && (
          <button
            type="button"
            className="btn-primary"
            disabled={isAskingGemini}
            onClick={() => onAskGemini(queryText.trim())}
          >
            <Wand2 size={13} />
            {isAskingGemini ? 'Thinking…' : 'Ask Gemini'}
          </button>
        )}

        {hasActiveFilters && (
          <button
            type="button"
            className="ghost-action"
            onClick={() => {
              setQueryText('');
              onChangeFilters({
                ...filters,
                archetypeId: null,
                encounterId: null,
                anchorCharacterId: null,
              });
            }}
            title="Clear filters"
          >
            <RotateCcw size={13} />
          </button>
        )}
      </form>

      {geminiError && (
        <div
          className="note-line danger"
          style={{ marginTop: -14, marginBottom: 14 }}
        >
          {geminiError}
        </div>
      )}
    </div>
  );
}
