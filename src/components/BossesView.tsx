import { useMemo, useState } from 'react';
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

interface BossesViewProps {
  roster: Character[];
  includeUnbuilt: boolean;
  onToggleIncludeUnbuilt: () => void;
  onOpenBossInCircle: (
    boss: EncounterDefinition,
    rec: TeamRecommendation
  ) => void;
  onSendToAbyss: (
    members: Character[],
    label: string,
    half: 1 | 2
  ) => void;
}

type BossFilterKey =
  | 'All'
  | 'Stygian 7.2'
  | 'Snezhnaya'
  | 'Nod-Krai'
  | 'Fontaine'
  | 'Natlan'
  | 'Weekly'
  | 'Classic';

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
  onToggleIncludeUnbuilt,
  onOpenBossInCircle,
  onSendToAbyss,
}: BossesViewProps) {
  const [search, setSearch] = useState('');
  const [filterKey, setFilterKey] = useState<BossFilterKey>('All');

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

  // Compute the #1 strongest team from the user's live roster for each visible boss
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
          <h2 className="editorial-title" style={{ fontSize: 24 }}>
            Boss Matchups
          </h2>
          <p className="editorial-prose" style={{ marginTop: 4 }}>
            Your strongest counter team for each World Boss, Stygian Onslaught
            7.2 boss, and Weekly Trounce Domain — computed live from your
            roster.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`btn-subtle ${includeUnbuilt ? 'active-filter' : ''}`}
            onClick={onToggleIncludeUnbuilt}
            title="Switch between Battle-Ready Lv 70+ teams and full roster including unbuilt characters"
          >
            {includeUnbuilt ? 'Showing Lv 1–90' : 'Battle-Ready (Lv 70+)'}
          </button>

          <div className="command-search-wrap" style={{ maxWidth: 270 }}>
            <Search size={14} className="command-search-icon" />
            <input
              type="text"
              className="command-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search boss or drop (e.g. Wavebinder, Mitya)…"
            />
          </div>
        </div>
      </div>

      {/* Quiet Category / Region Jump Strip with Emblems */}
      <div className="roster-filter-bar" style={{ paddingBottom: 14 }}>
        {BOSS_FILTERS.map((key) => {
          const emblemColor =
            REGION_ACCENT[key] ?? (key === 'Stygian 7.2' ? 'var(--gold-bright)' : 'var(--text-2)');
          return (
            <button
              key={key}
              type="button"
              className={`text-tab ${filterKey === key ? 'active' : ''}`}
              onClick={() => setFilterKey(key)}
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
          const ownedDrops = (boss.dropsFor ?? []).filter((name) =>
            roster.some((c) => c.name.toLowerCase() === name.toLowerCase())
          );

          return (
            <div key={boss.id} className="boss-row">
              {/* Left: Boss Focal Point + Mechanic Tip */}
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
                  <NationEmblem
                    nation={boss.region}
                    size={17}
                    color={accent}
                  />
                </span>
                <div style={{ minWidth: 0 }}>
                  <div className="region-focal-name">
                    <span>{boss.name}</span>
                    <span className="region-parent-tag">
                      {boss.region}
                      {boss.isStygian72 ? ' ✦ Stygian 7.2' : ` ✦ ${boss.category}`}
                    </span>
                  </div>

                  {ownedDrops.length > 0 && (
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--gold)',
                        fontWeight: 600,
                        marginTop: 2,
                      }}
                    >
                      Drops ascension mats for: {ownedDrops.join(', ')}
                    </div>
                  )}

                  <div className="region-row-sub" style={{ marginTop: 3 }}>
                    {boss.tacticalTip}
                  </div>
                </div>
              </div>

              {/* Center: Recommended 4-Portrait Team */}
              {topRec ? (
                <div className="region-portraits">
                  {topRec.members.map((m, idx) => (
                    <div
                      key={`${m.id}-${idx}`}
                      className="region-portrait-item"
                    >
                      <CharacterPortrait character={m} size={48} />
                      <span className="region-portrait-name">{m.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>
                  Enable Lv 1–90 to see counter
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
                  title={`Send ${boss.name} team to Spiral Abyss Half 1`}
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
                  title={`Send ${boss.name} team to Spiral Abyss Half 2`}
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
