import { useMemo, useState } from 'react';
import { ArrowUpRight, Search, Swords, Wand2 } from 'lucide-react';
import { ENCOUNTERS } from '../data/encounters';
import {
  buildCustomEncounterFromQuery,
  searchEncounters,
} from '../engine/encounterResolver';
import type {
  Character,
  EncounterDefinition,
  TeamRecommendation,
} from '../types/genshin';
import { generateRecommendedTeams } from '../engine/teamBuilder';
import { CharacterPortrait } from './CharacterPortrait';
import { NationEmblem } from './NationEmblem';

export type BossFilterKey =
  | 'All'
  | 'Hypostases & Regisvines'
  | 'Stygian 7.2'
  | 'World Bosses'
  | 'Weekly'
  | 'Elites & Shields'
  | 'Snezhnaya'
  | 'Nod-Krai'
  | 'Fontaine'
  | 'Natlan'
  | 'Sumeru'
  | 'Inazuma'
  | 'Liyue'
  | 'Mondstadt';

interface BossesViewProps {
  roster: Character[];
  includeUnbuilt: boolean;
  search: string;
  onChangeSearch: (q: string) => void;
  filterKey: BossFilterKey;
  onChangeFilterKey: (key: BossFilterKey) => void;
  onOpenBossInCircle: (
    boss: EncounterDefinition,
    rec: TeamRecommendation
  ) => void;
  onInspectCharacter: (char: Character) => void;
  onSendToAbyss: (
    members: Character[],
    label: string,
    half: 1 | 2
  ) => void;
}

const BOSS_FILTERS: BossFilterKey[] = [
  'All',
  'Hypostases & Regisvines',
  'Stygian 7.2',
  'World Bosses',
  'Weekly',
  'Elites & Shields',
  'Snezhnaya',
  'Nod-Krai',
  'Fontaine',
  'Natlan',
  'Sumeru',
  'Inazuma',
  'Liyue',
  'Mondstadt',
];

const NATION_FILTER_KEYS = new Set<string>([
  'Snezhnaya',
  'Nod-Krai',
  'Fontaine',
  'Natlan',
  'Sumeru',
  'Inazuma',
  'Liyue',
  'Mondstadt',
]);

const REGION_ACCENT: Record<string, string> = {
  Snezhnaya: 'var(--el-cryo)',
  'Nod-Krai': 'var(--lunar)',
  Fontaine: 'var(--el-hydro)',
  Natlan: 'var(--el-pyro)',
  Sumeru: 'var(--el-dendro)',
  Inazuma: 'var(--el-electro)',
  Liyue: 'var(--el-geo)',
  Mondstadt: 'var(--el-anemo)',
  'Custom Opponent': 'var(--gold-bright)',
};

const INITIAL_VISIBLE_COUNT = 24;

export function BossesView({
  roster,
  includeUnbuilt,
  search,
  onChangeSearch,
  filterKey,
  onChangeFilterKey,
  onOpenBossInCircle,
  onInspectCharacter,
  onSendToAbyss,
}: BossesViewProps) {
  const [showAllUnfiltered, setShowAllUnfiltered] = useState(false);

  // Per-(roster, includeUnbuilt) memoized cache so typing in search never recomputes recommendations
  const recCache = useMemo(
    () => new Map<string, TeamRecommendation | null>(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [roster, includeUnbuilt]
  );

  const getTopRec = (boss: EncounterDefinition): TeamRecommendation | null => {
    const cached = recCache.get(boss.id);
    if (cached !== undefined) return cached;

    const topRec =
      generateRecommendedTeams(
        roster,
        {
          archetypeId: null,
          encounterId: boss.isCustom ? null : boss.id,
          customEncounter: boss.isCustom ? boss : null,
          anchorCharacterId: null,
          includeUnbuilt,
          requireSurvivability: true,
          excludedCharacterIds: [],
        },
        1
      )[0] ?? null;

    recCache.set(boss.id, topRec);
    return topRec;
  };

  const filteredBosses = useMemo(() => {
    const categoryFiltered = ENCOUNTERS.filter((boss) => {
      if (filterKey === 'Stygian 7.2') return Boolean(boss.isStygian72);
      if (filterKey === 'Hypostases & Regisvines') {
        return boss.category === 'Hypostasis & Regisvine';
      }
      if (filterKey === 'World Bosses') {
        return (
          boss.category === 'World Boss' ||
          boss.category === 'Stygian Onslaught'
        );
      }
      if (filterKey === 'Weekly') return boss.category === 'Weekly Boss';
      if (filterKey === 'Elites & Shields') {
        return boss.category === 'Elite & Shields';
      }
      if (NATION_FILTER_KEYS.has(filterKey)) {
        return boss.region === filterKey;
      }
      return true;
    });

    const trimmed = search.trim();
    if (!trimmed) return categoryFiltered;

    // When searching, search within the active filter first; if 0 hits and a category filter is active, search all opponents so users always find what they typed!
    const inCategory = searchEncounters(trimmed, categoryFiltered);
    if (inCategory.length > 0 || filterKey === 'All') {
      return inCategory;
    }
    return searchEncounters(trimmed, ENCOUNTERS);
  }, [search, filterKey]);

  const customFallbackBoss = useMemo<EncounterDefinition | null>(() => {
    const trimmed = search.trim();
    if (trimmed.length < 3) return null;
    const exactHit = filteredBosses.some(
      (b) => b.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (exactHit) return null;
    return buildCustomEncounterFromQuery(trimmed);
  }, [search, filteredBosses]);

  const isUnfilteredAll = filterKey === 'All' && !search.trim();
  const visibleBosses =
    isUnfilteredAll && !showAllUnfiltered
      ? filteredBosses.slice(0, INITIAL_VISIBLE_COUNT)
      : filteredBosses;

  const bossMatchups = useMemo(() => {
    const list: Array<{
      boss: EncounterDefinition;
      topRec: TeamRecommendation | null;
    }> = visibleBosses.map((boss) => ({
      boss,
      topRec: getTopRec(boss),
    }));

    if (customFallbackBoss && filteredBosses.length === 0) {
      list.unshift({
        boss: customFallbackBoss,
        topRec: getTopRec(customFallbackBoss),
      });
    } else if (customFallbackBoss && search.trim().length >= 3) {
      list.push({
        boss: customFallbackBoss,
        topRec: getTopRec(customFallbackBoss),
      });
    }

    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleBosses, customFallbackBoss, filteredBosses.length, search, recCache]);

  const remainingCount = filteredBosses.length - visibleBosses.length;

  return (
    <div>
      <div className="list-toolbar">
        <div>
          <h2 className="editorial-title" style={{ fontSize: 25 }}>
            Opponents &amp; Boss Matchups
          </h2>
          <p className="editorial-prose" style={{ marginTop: 4 }}>
            Search any Hypostasis, Regisvine, World Boss, Weekly Trounce Domain,
            Elemental Shield, or custom enemy — counter teams are computed live
            from your <strong>{includeUnbuilt ? 'Lv 1–90' : 'Lv 70+'}</strong>{' '}
            pool.
          </p>
        </div>

        <div className="command-search-wrap" style={{ maxWidth: 320 }}>
          <Search size={14} className="command-search-icon" />
          <input
            type="text"
            className="command-input"
            value={search}
            onChange={(e) => onChangeSearch(e.target.value)}
            placeholder="Search opponent (e.g. Anemo Hypostasis, Oceanid, Pyro Slime)…"
          />
        </div>
      </div>

      {/* Category & Nation Jump Strip */}
      <div className="roster-filter-bar" style={{ paddingBottom: 14 }}>
        {BOSS_FILTERS.map((key) => {
          const emblemColor =
            REGION_ACCENT[key] ??
            (key === 'Stygian 7.2' ? 'var(--gold-bright)' : 'var(--text-2)');
          const showEmblem = NATION_FILTER_KEYS.has(key) || key === 'Stygian 7.2';
          return (
            <button
              key={key}
              type="button"
              className={`text-tab ${filterKey === key ? 'active' : ''}`}
              onClick={() => onChangeFilterKey(key)}
            >
              {showEmblem && (
                <NationEmblem nation={key} size={13} color={emblemColor} />
              )}
              {key === 'All' ? `All (${ENCOUNTERS.length})` : key}
            </button>
          );
        })}
      </div>

      <div className="region-list">
        {bossMatchups.map(({ boss, topRec }) => {
          const accent = REGION_ACCENT[boss.region] ?? 'var(--gold)';
          const ownedDropChars = (boss.dropsFor ?? [])
            .map((name) =>
              roster.find((c) => c.name.toLowerCase() === name.toLowerCase())
            )
            .filter((c): c is Character => Boolean(c));

          return (
            <div key={boss.id} className="boss-row">
              {/* Left: Opponent Focal Point + Clickable Character Drops + Mechanic Tip */}
              <div className="region-focal">
                <span
                  className="region-accent-bar"
                  style={{ backgroundColor: accent, height: 48 }}
                  aria-hidden="true"
                />
                <span
                  className="nation-crest-badge"
                  style={{ color: accent }}
                  aria-hidden="true"
                >
                  {boss.isCustom ? (
                    <Wand2 size={16} color={accent} />
                  ) : (
                    <NationEmblem
                      nation={boss.region}
                      size={17}
                      color={accent}
                    />
                  )}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div className="region-focal-name">
                    <span>
                      {boss.isCustom ? `Custom Counter: ${boss.name}` : boss.name}
                    </span>
                    <span className="region-parent-tag">
                      {boss.isCustom
                        ? 'Instant Counter'
                        : `${boss.region}${
                            boss.isStygian72
                              ? ' ✦ Stygian 7.2'
                              : ` ✦ ${boss.category}`
                          }`}
                    </span>
                  </div>

                  {ownedDropChars.length > 0 && (
                    <div className="inline-drop-links">
                      <span>Drops mats for:</span>
                      {ownedDropChars.map((char, i) => (
                        <span key={char.id}>
                          <button
                            type="button"
                            className="inline-entity-link"
                            onClick={() => onInspectCharacter(char)}
                            title={`Inspect ${char.name}'s artifacts & build`}
                          >
                            {char.name} (Lv {char.level})
                          </button>
                          {i < ownedDropChars.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="region-row-sub" style={{ marginTop: 3 }}>
                    {boss.tacticalTip}
                  </div>
                </div>
              </div>

              {/* Center: Recommended 4-Portrait Team (clickable to inspect build) */}
              {topRec ? (
                <div className="region-portraits">
                  {topRec.members.map((m, idx) => (
                    <button
                      key={`${m.id}-${idx}`}
                      type="button"
                      className="region-portrait-item clickable-portrait"
                      onClick={() => onInspectCharacter(m)}
                      title={`Inspect ${m.name}'s ideal artifacts & build`}
                    >
                      <CharacterPortrait character={m} size={48} />
                      <span className="region-portrait-name">{m.name}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>
                  Switch top bar to Pool: Lv 1–90 to see counter
                </div>
              )}

              {/* Right: Actions */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  type="button"
                  className="btn-primary"
                  disabled={!topRec}
                  onClick={() => topRec && onOpenBossInCircle(boss, topRec)}
                >
                  Open Circle
                  <ArrowUpRight size={13} />
                </button>
                <button
                  type="button"
                  className="ghost-action"
                  disabled={!topRec}
                  onClick={() =>
                    topRec && onSendToAbyss(topRec.members, boss.name, 1)
                  }
                  title={`Queue ${boss.name} team for Spiral Abyss Half 1`}
                >
                  <Swords size={13} />1
                </button>
                <button
                  type="button"
                  className="ghost-action"
                  disabled={!topRec}
                  onClick={() =>
                    topRec && onSendToAbyss(topRec.members, boss.name, 2)
                  }
                  title={`Queue ${boss.name} team for Spiral Abyss Half 2`}
                >
                  <Swords size={13} />2
                </button>
              </div>
            </div>
          );
        })}

        {remainingCount > 0 && (
          <div style={{ textAlign: 'center', padding: '18px 0 8px' }}>
            <button
              type="button"
              className="btn-subtle"
              onClick={() => setShowAllUnfiltered(true)}
            >
              Show all {filteredBosses.length} opponents ({remainingCount} more)
            </button>
          </div>
        )}

        {bossMatchups.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 16px',
              color: 'var(--text-3)',
            }}
          >
            No opponents match your search. Try typing an enemy name or element
            (e.g. &ldquo;Anemo Hypostasis&rdquo; or &ldquo;Pyro Slime&rdquo;).
          </div>
        )}
      </div>
    </div>
  );
}
