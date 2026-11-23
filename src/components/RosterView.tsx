import { useMemo } from 'react';
import {
  ArrowUpRight,
  RefreshCw,
  Search,
  TrendingUp,
} from 'lucide-react';
import type { Character, ElementType } from '../types/genshin';
import { BATTLE_READY_LEVEL } from '../engine/teamAnalyzer';
import { getRosterBuildPriorities } from '../engine/buildPriorities';
import { getArtifactGuide } from '../data/artifactGuides';
import { CharacterPortrait } from './CharacterPortrait';
import { ElementIcon } from './ElementIcon';

interface RosterViewProps {
  roster: Character[];
  isSyncing: boolean;
  lastSyncedAt: string | null;
  search: string;
  onChangeSearch: (q: string) => void;
  elementFilter: ElementType | 'All';
  onChangeElementFilter: (el: ElementType | 'All') => void;
  readinessFilter: 'all' | 'ready' | 'unbuilt';
  onChangeReadinessFilter: (r: 'all' | 'ready' | 'unbuilt') => void;
  onRefreshRoster: () => void;
  onInspectCharacter: (char: Character) => void;
  onBuildAroundCharacter: (char: Character) => void;
}

const ELEMENTS: ElementType[] = [
  'Cryo',
  'Electro',
  'Pyro',
  'Geo',
  'Dendro',
  'Hydro',
  'Anemo',
];

export function RosterView({
  roster,
  isSyncing,
  lastSyncedAt,
  search,
  onChangeSearch,
  elementFilter,
  onChangeElementFilter,
  readinessFilter,
  onChangeReadinessFilter,
  onRefreshRoster,
  onInspectCharacter,
  onBuildAroundCharacter,
}: RosterViewProps) {
  const buildPriorities = useMemo(
    () => getRosterBuildPriorities(roster, 5),
    [roster]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...roster]
      .filter((c) => {
        if (elementFilter !== 'All' && c.element !== elementFilter) return false;
        if (readinessFilter === 'ready' && c.level < BATTLE_READY_LEVEL) {
          return false;
        }
        if (readinessFilter === 'unbuilt' && c.level >= BATTLE_READY_LEVEL) {
          return false;
        }
        if (!q) return true;
        const guide = getArtifactGuide(c);
        return (
          c.name.toLowerCase().includes(q) ||
          c.role.toLowerCase().includes(q) ||
          c.specialMechanic.toLowerCase().includes(q) ||
          guide.primarySet.toLowerCase().includes(q) ||
          guide.alternativeSet.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (b.level !== a.level) return b.level - a.level;
        return a.name.localeCompare(b.name);
      });
  }, [roster, search, elementFilter, readinessFilter]);

  const readyCount = roster.filter((c) => c.level >= BATTLE_READY_LEVEL).length;

  return (
    <div>
      {/* Focus on Building Up Section */}
      {buildPriorities.length > 0 && (
        <section
          aria-label="Focus on building up"
          style={{ marginBottom: 38 }}
        >
          <div className="list-toolbar" style={{ marginBottom: 4 }}>
            <div>
              <div
                className="section-kicker"
                style={{
                  color: 'var(--warn)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 4,
                }}
              >
                <TrendingUp size={13} />
                Focus on Building Up
              </div>
              <h2 className="editorial-title" style={{ fontSize: 22 }}>
                Highest-Impact Unbuilt Characters
              </h2>
              <p className="editorial-prose" style={{ marginTop: 4 }}>
                Under-leveled characters (below Lv 70) that unlock the strongest
                new synergies — and the ideal artifact set to farm for each.
              </p>
            </div>

            <button
              id="btn-roster-refresh"
              type="button"
              className="btn-subtle"
              disabled={isSyncing}
              onClick={onRefreshRoster}
            >
              <RefreshCw size={13} className={isSyncing ? 'spin' : ''} />
              {isSyncing ? 'Refreshing from Sheet…' : 'Refresh from Sheet'}
            </button>
          </div>

          <div className="focus-build-list">
            {buildPriorities.map((item) => {
              const c = item.character;
              const guide = getArtifactGuide(c);
              return (
                <div key={c.id} className="focus-build-row">
                  <button
                    type="button"
                    className="focus-build-identity"
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      textAlign: 'left',
                    }}
                    onClick={() => onInspectCharacter(c)}
                  >
                    <div className={`circle-node-ring el-${c.element}`}>
                      <CharacterPortrait character={c} size={52} />
                      <span className="circle-node-lv unbuilt">{c.level}</span>
                    </div>
                    <div>
                      <div className="focus-build-name">
                        <span>{c.name}</span>
                        <span
                          className={`focus-tier ${
                            item.priority === 'Top Priority' ? 'top' : ''
                          }`}
                        >
                          {item.priority}
                        </span>
                      </div>
                      <div className="focus-build-headline">
                        <span className={`el-text-${c.element}`}>
                          {c.element}
                        </span>
                        {' · '}
                        {item.headline}
                      </div>
                    </div>
                  </button>

                  <div className="focus-build-reason">
                    <div>{item.reason}</div>
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--text-3)',
                        marginTop: 4,
                        display: 'flex',
                        gap: 10,
                        flexWrap: 'wrap',
                      }}
                    >
                      <span>
                        Ideal Set:{' '}
                        <strong style={{ color: 'var(--gold-bright)' }}>
                          {guide.primarySet}
                        </strong>
                      </span>
                      {item.pairsWith.length > 0 && (
                        <span>
                          · Pairs with:{' '}
                          <span style={{ color: 'var(--text-2)' }}>
                            {item.pairsWith.join(', ')}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <button
                      type="button"
                      className="ghost-action"
                      onClick={() => onInspectCharacter(c)}
                    >
                      Artifacts &amp; Boss
                    </button>
                    <button
                      type="button"
                      className="btn-subtle"
                      onClick={() => onBuildAroundCharacter(c)}
                    >
                      Build Circle
                      <ArrowUpRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Full Roster Gallery with Ideal Artifact Sets */}
      <div className="list-toolbar">
        <div>
          <h2 className="editorial-title" style={{ fontSize: 22 }}>
            Full Roster &amp; Ideal Artifacts ({roster.length})
          </h2>
          <p className="editorial-prose" style={{ marginTop: 4 }}>
            {readyCount} Battle-Ready (Lv 70+) · {roster.length - readyCount}{' '}
            Unbuilt
            {lastSyncedAt
              ? ` · Refreshed ${new Date(lastSyncedAt).toLocaleTimeString()}`
              : ''}
            . Click any character to inspect ideal artifacts, farm their boss,
            or build a team.
          </p>
        </div>

        <div className="command-search-wrap" style={{ maxWidth: 290 }}>
          <Search size={14} className="command-search-icon" />
          <input
            type="text"
            className="command-input"
            value={search}
            onChange={(e) => onChangeSearch(e.target.value)}
            placeholder="Search character or artifact set…"
          />
        </div>
      </div>

      {/* Quiet text filter strip */}
      <div className="roster-filter-bar">
        <button
          type="button"
          className={`text-tab ${elementFilter === 'All' ? 'active' : ''}`}
          onClick={() => onChangeElementFilter('All')}
        >
          All
        </button>
        {ELEMENTS.map((el) => (
          <button
            key={el}
            type="button"
            className={`text-tab ${elementFilter === el ? 'active' : ''}`}
            onClick={() => onChangeElementFilter(el)}
          >
            <ElementIcon element={el} size={13} />
            {el}
          </button>
        ))}

        <span style={{ color: 'var(--hairline-strong)' }}>|</span>

        {(
          [
            ['all', 'All Levels'],
            ['ready', 'Lv 70+'],
            ['unbuilt', 'Unbuilt'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`text-tab ${readinessFilter === key ? 'active' : ''}`}
            onClick={() => onChangeReadinessFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="roster-gallery">
        {filtered.map((c) => {
          const isUnbuilt = c.level < BATTLE_READY_LEVEL;
          const guide = getArtifactGuide(c);
          return (
            <button
              key={c.id}
              type="button"
              className={`roster-item el-${c.element}`}
              onClick={() => onInspectCharacter(c)}
              title={`Inspect ${c.name}'s ideal artifacts & ascension boss`}
            >
              <div className="circle-node-ring">
                <CharacterPortrait character={c} size={84} />
                <span className="circle-node-el-dot" aria-hidden="true">
                  <ElementIcon element={c.element} size={13} />
                </span>
                <span
                  className={`circle-node-lv ${isUnbuilt ? 'unbuilt' : ''}`}
                >
                  {c.level}
                </span>
              </div>

              <div>
                <div className="roster-item-name">{c.name}</div>
                <div className="roster-item-meta">
                  <span className={`el-text-${c.element}`}>{c.element}</span>
                  {' · '}
                  {c.isHealer
                    ? 'Healer'
                    : c.isShielder
                      ? 'Shielder'
                      : c.role.split('/')[0].trim()}
                </div>
                <div className="roster-item-artifact">{guide.primarySet}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
