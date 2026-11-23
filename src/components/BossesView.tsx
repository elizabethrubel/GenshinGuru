import { useMemo } from 'react';
import { ArrowUpRight, Search, Swords } from 'lucide-react';
import { ENCOUNTERS } from '../data/encounters';
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
  | 'Stygian 7.2'
  | 'Snezhnaya'
  | 'Nod-Krai'
  | 'Fontaine'
  | 'Natlan'
  | 'Weekly'
  | 'Classic';

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
  'Stygian 7.2',
  'Snezhnaya',
  'Nod-Krai',
  'Fontaine',
  'Natlan',
  'Weekly',
  'Classic',
];

const REGION_ACCENT: Record<string, string> = {
  Snezhnaya: 'var(--el-cryo)',
  'Nod-Krai': 'var(--lunar)',
  Fontaine: 'var(--el-hydro)',
  Natlan: 'var(--el-pyro)',
  Sumeru: 'var(--el-dendro)',
  Inazuma: 'var(--el-electro)',
  Liyue: 'var(--el-geo)',
  Mondstadt: 'var(--el-anemo)',
};

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
  const filteredBosses = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ENCOUNTERS.filter((boss) => {
      if (filterKey === 'Stygian 7.2' && !boss.isStygian72) return false;
      if (filterKey === 'Weekly' && boss.category !== 'Weekly Boss') return false;
      if (
        filterKey === 'Classic' &&
        !['Sumeru', 'Inazuma', 'Liyue', 'Mondstadt'].includes(boss.region)
      ) {
        return false;
      }
      if (
        ['Snezhnaya', 'Nod-Krai', 'Fontaine', 'Natlan'].includes(filterKey) &&
        boss.region !== filterKey
      ) {
        return false;
      }

      if (!q) return true;
      return (
        boss.name.toLowerCase().includes(q) ||
        boss.region.toLowerCase().includes(q) ||
        boss.summary.toLowerCase().includes(q) ||
        boss.tacticalTip.toLowerCase().includes(q) ||
        boss.keywords.some((k) => k.includes(q)) ||
        (boss.dropsFor?.some((d) => d.toLowerCase().includes(q)) ?? false)
      );
    });
  }, [search, filterKey]);

  const bossMatchups = useMemo(() => {
    return filteredBosses.map((boss) => {
      const topRec =
        generateRecommendedTeams(
          roster,
          {
            archetypeId: null,
            encounterId: boss.id,
            anchorCharacterId: null,
            includeUnbuilt,
            requireSurvivability: true,
            excludedCharacterIds: [],
          },
          1
        )[0] ?? null;

      return { boss, topRec };
    });
  }, [filteredBosses, roster, includeUnbuilt]);

  return (
    <div>
      <div className="list-toolbar">
        <div>
          <h2 className="editorial-title" style={{ fontSize: 25 }}>
            Boss Matchups
          </h2>
          <p className="editorial-prose" style={{ marginTop: 4 }}>
            Your strongest counter team for each World Boss, Stygian Onslaught
            7.2 boss, and Weekly Trounce Domain — computed live from your{' '}
            <strong>{includeUnbuilt ? 'Lv 1–90' : 'Lv 70+'}</strong> pool.
          </p>
        </div>

        <div className="command-search-wrap" style={{ maxWidth: 280 }}>
          <Search size={14} className="command-search-icon" />
          <input
            type="text"
            className="command-input"
            value={search}
            onChange={(e) => onChangeSearch(e.target.value)}
            placeholder="Search boss or drop (e.g. Wavebinder, Mitya)…"
          />
        </div>
      </div>

      {/* Quiet Category / Region Jump Strip with Emblems */}
      <div className="roster-filter-bar" style={{ paddingBottom: 14 }}>
        {BOSS_FILTERS.map((key) => {
          const emblemColor =
            REGION_ACCENT[key] ??
            (key === 'Stygian 7.2' ? 'var(--gold-bright)' : 'var(--text-2)');
          return (
            <button
              key={key}
              type="button"
              className={`text-tab ${filterKey === key ? 'active' : ''}`}
              onClick={() => onChangeFilterKey(key)}
            >
              {key !== 'All' && key !== 'Weekly' && key !== 'Classic' && (
                <NationEmblem nation={key} size={13} color={emblemColor} />
              )}
              {key === 'All' ? `All Bosses (${ENCOUNTERS.length})` : key}
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
              {/* Left: Boss Focal Point + Clickable Character Drops + Mechanic Tip */}
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
                  <NationEmblem nation={boss.region} size={17} color={accent} />
                </span>
                <div style={{ minWidth: 0 }}>
                  <div className="region-focal-name">
                    <span>{boss.name}</span>
                    <span className="region-parent-tag">
                      {boss.region}
                      {boss.isStygian72
                        ? ' ✦ Stygian 7.2'
                        : ` ✦ ${boss.category}`}
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

        {bossMatchups.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 16px',
              color: 'var(--text-3)',
            }}
          >
            No bosses match your search.
          </div>
        )}
      </div>
    </div>
  );
}
