import { useMemo } from 'react';
import { ArrowUpRight, Search, Swords } from 'lucide-react';
import type { Character, TeamRecommendation } from '../types/genshin';
import {
  generateRankedStrongestTeams,
  type RankedStrongestTeam,
} from '../engine/teamBuilder';
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
        maxResults: 18,
      }),
    [roster, includeUnbuilt, requireSurvivability]
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
            Your highest-scoring squads computed live from your{' '}
            <strong>{includeUnbuilt ? 'Lv 1–90' : 'Lv 70+'}</strong> pool,
            ordered from highest compatibility score down.
          </p>
        </div>

        <div className="command-search-wrap" style={{ maxWidth: 290 }}>
          <Search size={14} className="command-search-icon" />
          <input
            type="text"
            className="command-input"
            value={search}
            onChange={(e) => onChangeSearch(e.target.value)}
            placeholder="Filter by character, element, or reaction…"
          />
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
          const { rank, team, compatibilityScore, category: teamCat } = entry;
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

          return (
            <div key={team.id} className="ranked-team-row">
              {/* Left: Rank + Compatibility Score Meter */}
              <div className="rank-score-col">
                <div className={`rank-badge ${isTopThree ? 'top' : ''}`}>
                  {isTopThree && (
                    <PrimogemStar size={10} color="var(--gold-bright)" />
                  )}
                  <span>#{rank}</span>
                </div>
                <div className="score-block">
                  <div className="score-numeral">
                    {compatibilityScore}
                    <span className="score-denom">/100</span>
                  </div>
                  <div className="score-bar-track" aria-hidden="true">
                    <div
                      className="score-bar-fill"
                      style={{
                        width: `${Math.max(12, Math.min(100, compatibilityScore))}%`,
                        backgroundColor: accent,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Center-Left: Team Title, Key Reactions & Sustain */}
              <div className="ranked-team-meta">
                <div className="region-focal-name">
                  <span>{team.title}</span>
                  <span
                    className="region-parent-tag"
                    style={{ color: accent }}
                  >
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

              {/* Center-Right: 4 Clickable Character Portraits */}
              <div className="region-portraits">
                {team.members.map((m, idx) => (
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
