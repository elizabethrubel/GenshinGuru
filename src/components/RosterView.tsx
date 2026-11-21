import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { Character, ElementType } from '../types/genshin';
import { BATTLE_READY_LEVEL } from '../engine/teamAnalyzer';
import { CharacterPortrait } from './CharacterPortrait';
import { ElementIcon } from './ElementIcon';

interface RosterViewProps {
  roster: Character[];
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
  onBuildAroundCharacter,
}: RosterViewProps) {
  const [search, setSearch] = useState('');
  const [elementFilter, setElementFilter] = useState<ElementType | 'All'>('All');
  const [readinessFilter, setReadinessFilter] = useState<
    'all' | 'ready' | 'unbuilt'
  >('all');

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
        return (
          c.name.toLowerCase().includes(q) ||
          c.role.toLowerCase().includes(q) ||
          c.specialMechanic.toLowerCase().includes(q)
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
      <div className="list-toolbar">
        <div>
          <h2 className="editorial-title" style={{ fontSize: 24 }}>
            Your Roster ({roster.length})
          </h2>
          <p className="editorial-prose" style={{ marginTop: 4 }}>
            {readyCount} Battle-Ready (Lv 70+) · {roster.length - readyCount}{' '}
            Unbuilt. Click any character portrait to build a Team Circle around
            them.
          </p>
        </div>

        <div className="command-search-wrap" style={{ maxWidth: 260 }}>
          <Search size={14} className="command-search-icon" />
          <input
            type="text"
            className="command-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search character or mechanic…"
          />
        </div>
      </div>

      {/* Quiet text filter strip — zero chip boxes */}
      <div className="roster-filter-bar">
        <button
          type="button"
          className={`text-tab ${elementFilter === 'All' ? 'active' : ''}`}
          onClick={() => setElementFilter('All')}
        >
          All
        </button>
        {ELEMENTS.map((el) => (
          <button
            key={el}
            type="button"
            className={`text-tab ${elementFilter === el ? 'active' : ''}`}
            onClick={() => setElementFilter(el)}
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
            onClick={() => setReadinessFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Open, borderless portrait gallery */}
      <div className="roster-gallery">
        {filtered.map((c) => {
          const isUnbuilt = c.level < BATTLE_READY_LEVEL;
          return (
            <button
              key={c.id}
              type="button"
              className={`roster-item el-${c.element}`}
              onClick={() => onBuildAroundCharacter(c)}
              title={`${c.name} — ${c.specialMechanic}`}
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
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
