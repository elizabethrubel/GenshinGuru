import { useMemo } from 'react';
import { ArrowUpRight, Search, Swords } from 'lucide-react';
import type { Character, TeamRecommendation } from '../types/genshin';
import {
  generateRankedStrongestTeams,
  type RankedStrongestTeam,
  type TeamRankingMode,
} from '../engine/teamBuilder';
import { BATTLE_READY_LEVEL } from '../engine/teamAnalyzer';
import { CharacterPortrait } from './CharacterPortrait';
import { PrimogemStar } from './NationEmblem';

export type TopTeamsCategory =
  | 'All'
  | 'Lunar'
  | 'Stellar'
  | 'Melt / Vape'
  | 'Overloaded'
  | 'Hyperbloom';

interface TopTeamsViewProps {
  roster: Character[];
  includeUnbuilt: boolean;
  requireSurvivability: boolean;
  sortBy: TeamRankingMode;
  onChangeSortBy: (mode: TeamRankingMode) => void;
  search: string;
  onChangeSearch: (q: string) => void;
  category: TopTeamsCategory;
  onChangeCategory: (cat: TopTeamsCategory) => void;
  onOpenTeamInCircle: (team: TeamRecommendation, rank: number) => void;
  onInspectCharacter: (char: Character) => void;
  onSendToAbyss: (
    members: Character[],
    label: string,
    half: 1 | 2
  ) => void;
}

const CATEGORIES: TopTeamsCategory[] = [
  'All',
  'Lunar',
  'Stellar',
  'Melt / Vape',
  'Overloaded',
  'Hyperbloom',
];

const CATEGORY_ACCENT: Record<RankedStrongestTeam['category'], string> = {
  Lunar: 'var(--lunar)',
  Stellar: 'var(--stellar)',
  'Melt / Vape': 'var(--el-pyro)',
  Overloaded: 'var(--el-electro)',
  Hyperbloom: 'var(--el-dendro)',
  Elemental: 'var(--gold)',
};

export function TopTeamsView({
  roster,
  includeUnbuilt,
  requireSurvivability,
  sortBy,
  onChangeSortBy,
  search,
  onChangeSearch,
  category,
  onChangeCategory,
  onOpenTeamInCircle,
  onInspectCharacter,
  onSendToAbyss,
}: TopTeamsViewProps) {
  const rankedTeams = useMemo(
    () =>
      generateRankedStrongestTeams(roster, {
        includeUnbuilt,
        requireSurvivability,
        sortBy,
        maxResults: 18,
      }),
    [roster, includeUnbuilt, requireSurvivability, sortBy]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rankedTeams.filter((entry) => {
      if (category !== 'All' && entry.category !== category) return false;
      if (!q) return true;
      return (
        entry.team.title.toLowerCase().includes(q) ||
        entry.team.subtitle.toLowerCase().includes(q) ||
        entry.category.toLowerCase().includes(q) ||
        entry.team.members.some(
          (m) =>
            m.name.toLowerCase().includes(q) ||
            m.element.toLowerCase().includes(q)
        )
      );
    });
  }, [rankedTeams, search, category]);

  return (
    <div>
      <div className="list-toolbar">
        <div>
          <h2 className="editorial-title" style={{ fontSize: 25 }}>
            Strongest Teams by Compatibility
          </h2>
          <p className="editorial-prose" style={{ marginTop: 4 }}>
            {sortBy === 'ready-now'
              ? 'Ranked by current combat strength — weighting both kit synergy and your characters’ actual levels.'
              : 'Ranked by max kit compatibility — showing each squad’s ceiling once every character is leveled.'}
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          {/* Ready Now vs Max Potential Segmented Switch */}
          <div
            className="mode-segmented"
            role="tablist"
            aria-label="Team score sorting mode"
          >
            <button
              type="button"
              role="tab"
              aria-selected={sortBy === 'ready-now'}
              className={`mode-seg-btn ${sortBy === 'ready-now' ? 'active' : ''}`}
              onClick={() => onChangeSortBy('ready-now')}
              title="Weights current character levels heavily so your Lv 80-90 squads rank highest"
            >
              Ready Now
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={sortBy === 'max-potential'}
              className={`mode-seg-btn ${sortBy === 'max-potential' ? 'active' : ''}`}
              onClick={() => onChangeSortBy('max-potential')}
              title="Pure kit and reaction compatibility ceiling assuming all teammates are leveled"
            >
              Max Potential
            </button>
          </div>

          <div className="command-search-wrap" style={{ maxWidth: 260 }}>
            <Search size={14} className="command-search-icon" />
            <input
              type="text"
              className="command-input"
              value={search}
              onChange={(e) => onChangeSearch(e.target.value)}
              placeholder="Filter by character or reaction…"
            />
          </div>
        </div>
      </div>

      {/* Quiet Category Jump Strip */}
      <div className="roster-filter-bar" style={{ paddingBottom: 14 }}>
        {CATEGORIES.map((cat) => {
          const count =
            cat === 'All'
              ? rankedTeams.length
              : rankedTeams.filter((r) => r.category === cat).length;
          return (
            <button
              key={cat}
              type="button"
              className={`text-tab ${category === cat ? 'active' : ''}`}
              onClick={() => onChangeCategory(cat)}
            >
              {cat === 'All' ? `All Strongest (${count})` : `${cat} (${count})`}
            </button>
          );
        })}
      </div>

      <div className="region-list">
        {filtered.map((entry) => {
          const {
            rank,
            team,
            readyScore,
            potentialScore,
            activeScore,
            category: teamCat,
          } = entry;
          const accent = CATEGORY_ACCENT[teamCat] ?? 'var(--gold)';
          const isTopThree = rank <= 3;
          const sustainNames = team.members
            .filter((m) => m.isHealer || m.isShielder)
            .map((m) => m.name)
            .join(' & ');

          const highlightMode = team.analysis.stellarState.includes('Active')
            ? team.analysis.stellarState.replace(' Active', '')
            : team.analysis.moonsignTier === 'Ascendant Gleam'
              ? 'Ascendant Gleam'
              : team.analysis.chevreuseValid
                ? 'Chevreuse Shred'
                : teamCat;

          const needsLeveling = readyScore < potentialScore - 8;

          return (
            <div key={team.id} className="ranked-team-row">
              {/* Left: Rank + Active Score Meter + Secondary Potential/Ready Cue */}
              <div className="rank-score-col">
                <div className={`rank-badge ${isTopThree ? 'top' : ''}`}>
                  {isTopThree && (
                    <PrimogemStar size={10} color="var(--gold-bright)" />
                  )}
                  <span>#{rank}</span>
                </div>
                <div className="score-block">
                  <div className="score-numeral">
                    {activeScore}
                    <span className="score-denom">/100</span>
                  </div>
                  <div className="score-bar-track" aria-hidden="true">
                    <div
                      className="score-bar-fill"
                      style={{
                        width: `${Math.max(12, Math.min(100, activeScore))}%`,
                        backgroundColor: accent,
                      }}
                    />
                  </div>
                  <div className="score-sub-meta">
                    {sortBy === 'ready-now' ? (
                      potentialScore > readyScore + 1 ? (
                        <span>
                          Max {potentialScore} · Avg Lv {team.analysis.avgLevel}
                        </span>
                      ) : (
                        <span>Avg Lv {team.analysis.avgLevel}</span>
                      )
                    ) : (
                      <span
                        style={{
                          color: needsLeveling ? 'var(--warn)' : undefined,
                        }}
                      >
                        Ready {readyScore} · Avg Lv {team.analysis.avgLevel}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Center-Left: Team Title, Key Reactions & Sustain */}
              <div className="ranked-team-meta">
                <div className="region-focal-name">
                  <span>{team.title}</span>
                  <span className="region-parent-tag" style={{ color: accent }}>
                    {highlightMode}
                  </span>
                </div>
                <div className="ranked-team-sub">
                  <span>{team.subtitle}</span>
                  {sustainNames && (
                    <>
                      <span className="meta-sep">✦</span>
                      <span>Sustain: {sustainNames}</span>
                    </>
                  )}
                </div>
                <div className="region-row-sub" style={{ marginTop: 3 }}>
                  {team.whyItWorks}
                </div>
              </div>

              {/* Center-Right: 4 Clickable Character Portraits with Level Readout */}
              <div className="region-portraits">
                {team.members.map((m, idx) => {
                  const isUnbuilt = m.level < BATTLE_READY_LEVEL;
                  return (
                    <button
                      key={`${m.id}-${idx}`}
                      type="button"
                      className="region-portrait-item clickable-portrait"
                      onClick={() => onInspectCharacter(m)}
                      title={`Inspect ${m.name} (Lv ${m.level}) ideal artifacts & build`}
                    >
                      <CharacterPortrait character={m} size={48} />
                      <span className="region-portrait-name">{m.name}</span>
                      <span
                        className={`portrait-lv-sub ${isUnbuilt ? 'unbuilt' : ''}`}
                      >
                        Lv {m.level}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Right: Open Circle + Abyss Queue Actions */}
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
                  onClick={() => onOpenTeamInCircle(team, rank)}
                >
                  Open Circle
                  <ArrowUpRight size={13} />
                </button>
                <button
                  type="button"
                  className="ghost-action"
                  onClick={() => onSendToAbyss(team.members, team.title, 1)}
                  title={`Queue #${rank} team for Spiral Abyss Half 1`}
                >
                  <Swords size={13} />1
                </button>
                <button
                  type="button"
                  className="ghost-action"
                  onClick={() => onSendToAbyss(team.members, team.title, 2)}
                  title={`Queue #${rank} team for Spiral Abyss Half 2`}
                >
                  <Swords size={13} />2
                </button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 16px',
              color: 'var(--text-3)',
            }}
          >
            No teams match this filter. Try switching to{' '}
            <strong>Pool: Lv 1–90</strong> in the top bar or clearing your
            search.
          </div>
        )}
      </div>
    </div>
  );
}
