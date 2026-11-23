import { useMemo } from 'react';
import { ArrowUpRight, Search, Swords, TrendingUp } from 'lucide-react';
import type {
  Character,
  RegionalPreset,
  TeamRecommendation,
} from '../types/genshin';
import { analyzeTeam } from '../engine/teamAnalyzer';
import { generateTeamsForRegion } from '../engine/teamBuilder';
import { CharacterPortrait } from './CharacterPortrait';
import { NationEmblem } from './NationEmblem';

export const NATIONS = [
  'Mondstadt',
  'Liyue',
  'Inazuma',
  'Sumeru',
  'Fontaine',
  'Natlan',
  'Nod-Krai',
  'Snezhnaya',
] as const;

export type NationName = (typeof NATIONS)[number];

interface RegionalPresetsProps {
  presets: RegionalPreset[];
  roster: Character[];
  includeUnbuilt: boolean;
  requireSurvivability: boolean;
  search: string;
  onChangeSearch: (q: string) => void;
  selectedNation: NationName | 'All';
  onChangeNation: (nation: NationName | 'All') => void;
  onLoadToVisualizer: (
    preset: RegionalPreset,
    members: Character[],
    initialAlt?: TeamRecommendation
  ) => void;
  onInspectCharacter: (char: Character) => void;
  onSendToAbyss: (
    members: Character[],
    label: string,
    half: 1 | 2
  ) => void;
}

const NATION_COLORS: Record<NationName, string> = {
  Mondstadt: 'var(--el-anemo)',
  Liyue: 'var(--el-geo)',
  Inazuma: 'var(--el-electro)',
  Sumeru: 'var(--el-dendro)',
  Fontaine: 'var(--el-hydro)',
  Natlan: 'var(--el-pyro)',
  'Nod-Krai': 'var(--lunar)',
  Snezhnaya: 'var(--el-cryo)',
};

function parseRegionDisplay(rawRegion: string): {
  primaryName: string;
  parentNation: NationName | null;
  subLabel: string | null;
} {
  const match = rawRegion.match(/^(.+?)\s*\((.+?)\)\s*$/);
  const primaryName = match ? match[1].trim() : rawRegion.trim();
  const paren = match ? match[2].trim() : null;

  const combined = rawRegion.toLowerCase();
  let parentNation: NationName | null = null;
  for (const nation of NATIONS) {
    if (combined.includes(nation.toLowerCase())) {
      parentNation = nation;
      break;
    }
  }
  if (!parentNation && combined.includes('hiisi')) {
    parentNation = 'Nod-Krai';
  }

  return {
    primaryName,
    parentNation,
    subLabel: paren,
  };
}

export function RegionalPresets({
  presets,
  roster,
  includeUnbuilt,
  requireSurvivability,
  search,
  onChangeSearch,
  selectedNation,
  onChangeNation,
  onLoadToVisualizer,
  onInspectCharacter,
  onSendToAbyss,
}: RegionalPresetsProps) {
  const charMap = useMemo(
    () => new Map(roster.map((c) => [c.id, c])),
    [roster]
  );

  const enriched = useMemo(
    () =>
      presets.map((preset) => {
        const members = preset.resolvedCharacterIds
          .map((id) => (id ? charMap.get(id) ?? null : null))
          .filter((c): c is Character => Boolean(c));
        const presetScore =
          members.length === 4 ? analyzeTeam(members).score : 0;
        const excludePresetSig = members
          .map((m) => m.id)
          .slice()
          .sort()
          .join('|');
        const strongestAlt =
          generateTeamsForRegion(roster, preset.region, {
            includeUnbuilt,
            requireSurvivability,
            excludePresetSig,
            maxResults: 1,
          })[0] ?? null;

        return {
          preset,
          members,
          presetScore,
          strongestAlt,
          ...parseRegionDisplay(preset.region),
        };
      }),
    [presets, charMap, roster, includeUnbuilt, requireSurvivability]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enriched.filter(({ preset, primaryName, parentNation }) => {
      if (selectedNation !== 'All' && parentNation !== selectedNation) {
        return false;
      }
      if (!q) return true;
      return (
        preset.region.toLowerCase().includes(q) ||
        primaryName.toLowerCase().includes(q) ||
        preset.teamName.toLowerCase().includes(q) ||
        Object.values(preset.slots).some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [enriched, search, selectedNation]);

  return (
    <div>
      <div className="list-toolbar">
        <div>
          <h2 className="editorial-title" style={{ fontSize: 25 }}>
            Party by Region
          </h2>
          <p className="editorial-prose" style={{ marginTop: 4 }}>
            Pick where you&apos;re exploring in Teyvat to summon your saved
            sheet squad — or jump straight into a higher-scoring upgrade.
          </p>
        </div>

        <div className="command-search-wrap" style={{ maxWidth: 260 }}>
          <Search size={14} className="command-search-icon" />
          <input
            type="text"
            className="command-input"
            value={search}
            onChange={(e) => onChangeSearch(e.target.value)}
            placeholder="Search region or sub-area…"
          />
        </div>
      </div>

      {/* Quiet Nation Jump Strip with Bespoke Emblems */}
      <div className="roster-filter-bar" style={{ paddingBottom: 14 }}>
        <button
          type="button"
          className={`text-tab ${selectedNation === 'All' ? 'active' : ''}`}
          onClick={() => onChangeNation('All')}
        >
          All Regions ({presets.length})
        </button>
        {NATIONS.map((nation) => (
          <button
            key={nation}
            type="button"
            className={`text-tab ${selectedNation === nation ? 'active' : ''}`}
            onClick={() => onChangeNation(nation)}
          >
            <NationEmblem
              nation={nation}
              size={14}
              color={NATION_COLORS[nation]}
            />
            {nation}
          </button>
        ))}
      </div>

      <div className="region-list">
        {filtered.map(
          ({
            preset,
            members,
            presetScore,
            strongestAlt,
            primaryName,
            parentNation,
            subLabel,
          }) => {
            const accentColor = parentNation
              ? NATION_COLORS[parentNation]
              : 'var(--gold)';
            const hasStrongerUpgrade =
              strongestAlt && strongestAlt.analysis.score >= presetScore + 5;

            return (
              <div key={preset.id} className="region-row">
                {/* Focal Point: Region & Sub-Area */}
                <div className="region-focal">
                  <span
                    className="region-accent-bar"
                    style={{ backgroundColor: accentColor }}
                    aria-hidden="true"
                  />
                  <span
                    className="nation-crest-badge"
                    style={{ color: accentColor }}
                    aria-hidden="true"
                  >
                    <NationEmblem
                      nation={parentNation ?? primaryName}
                      size={18}
                      color={accentColor}
                    />
                  </span>
                  <div>
                    <div className="region-focal-name">
                      {primaryName}
                      {subLabel && (
                        <span className="region-parent-tag">{subLabel}</span>
                      )}
                    </div>
                    <div className="region-row-sub">
                      {preset.teamName}
                      {presetScore > 0 && (
                        <span style={{ color: 'var(--text-3)' }}>
                          {' '}
                          ✦ Score {presetScore}
                        </span>
                      )}
                    </div>
                    {hasStrongerUpgrade && strongestAlt && (
                      <button
                        type="button"
                        className="inline-entity-link"
                        style={{
                          marginTop: 4,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                        onClick={() =>
                          onLoadToVisualizer(preset, members, strongestAlt)
                        }
                        title={`Open upgraded ${primaryName} team (${strongestAlt.members.map((m) => m.name).join(' · ')})`}
                      >
                        <TrendingUp size={11} />
                        Stronger option available ({strongestAlt.analysis.score})
                      </button>
                    )}
                  </div>
                </div>

                {/* 4 Character Portraits (clickable to inspect build) */}
                <div className="region-portraits">
                  {members.map((m, idx) => (
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

                {/* Quiet Actions */}
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
                    disabled={members.length < 4}
                    onClick={() => onLoadToVisualizer(preset, members)}
                  >
                    Open Circle
                    <ArrowUpRight size={13} />
                  </button>
                  <button
                    type="button"
                    className="ghost-action"
                    disabled={members.length < 4}
                    onClick={() =>
                      onSendToAbyss(members, `${primaryName} Squad`, 1)
                    }
                    title="Queue for Spiral Abyss Half 1"
                  >
                    <Swords size={13} />1
                  </button>
                  <button
                    type="button"
                    className="ghost-action"
                    disabled={members.length < 4}
                    onClick={() =>
                      onSendToAbyss(members, `${primaryName} Squad`, 2)
                    }
                    title="Queue for Spiral Abyss Half 2"
                  >
                    <Swords size={13} />2
                  </button>
                </div>
              </div>
            );
          }
        )}

        {filtered.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 16px',
              color: 'var(--text-3)',
            }}
          >
            No regions match your filter.
          </div>
        )}
      </div>
    </div>
  );
}
