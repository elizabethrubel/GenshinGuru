import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { Character } from '../types/genshin';
import { BATTLE_READY_LEVEL } from '../engine/teamAnalyzer';
import { getSlotSubstitutes } from '../engine/teamBuilder';
import { CharacterPortrait } from './CharacterPortrait';

interface SlotSwapDrawerProps {
  title: string;
  currentMembers: Character[];
  slotIndex: number;
  roster: Character[];
  includeUnbuilt: boolean;
  excludedIds?: string[];
  onPickCharacter: (char: Character) => void;
  onClose: () => void;
}

export function SlotSwapDrawer({
  title,
  currentMembers,
  slotIndex,
  roster,
  includeUnbuilt,
  excludedIds = [],
  onPickCharacter,
  onClose,
}: SlotSwapDrawerProps) {
  const [search, setSearch] = useState('');
  const [showUnbuiltLocal, setShowUnbuiltLocal] = useState(includeUnbuilt);

  const substitutes = useMemo(
    () =>
      getSlotSubstitutes(
        currentMembers,
        slotIndex,
        roster,
        showUnbuiltLocal,
        excludedIds
      ),
    [currentMembers, slotIndex, roster, showUnbuiltLocal, excludedIds]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return substitutes;
    return substitutes.filter(
      (s) =>
        s.character.name.toLowerCase().includes(q) ||
        s.character.element.toLowerCase().includes(q) ||
        s.character.specialMechanic.toLowerCase().includes(q)
    );
  }, [substitutes, search]);

  return (
    <div
      className="overlay-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="drawer-panel">
        <div className="drawer-header">
          <div>
            <h3 className="drawer-title">{title}</h3>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
              Ranked by live synergy impact
            </div>
          </div>
          <button
            type="button"
            className="ghost-action"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="drawer-body">
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div className="command-search-wrap" style={{ minWidth: 0 }}>
              <Search size={14} className="command-search-icon" />
              <input
                type="text"
                className="command-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search character or element…"
                autoFocus
              />
            </div>

            <button
              type="button"
              className={`ghost-action ${showUnbuiltLocal ? 'accent' : ''}`}
              onClick={() => setShowUnbuiltLocal((v) => !v)}
            >
              {showUnbuiltLocal ? 'Lv 1–90' : 'Lv 70+'}
            </button>
          </div>

          {excludedIds.length > 0 && (
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
              Characters used on the other Abyss half are hidden.
            </div>
          )}

          <div>
            {filtered.map((sub) => {
              const c = sub.character;
              const isUnbuilt = c.level < BATTLE_READY_LEVEL;
              return (
                <button
                  key={c.id}
                  type="button"
                  className="swap-row"
                  onClick={() => {
                    onPickCharacter(c);
                    onClose();
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      minWidth: 0,
                    }}
                  >
                    <CharacterPortrait character={c} size={44} />
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <strong style={{ fontSize: 14 }}>{c.name}</strong>
                        <span
                          style={{
                            fontSize: 11.5,
                            color: isUnbuilt ? 'var(--warn)' : 'var(--text-3)',
                            fontWeight: 600,
                          }}
                        >
                          Lv {c.level}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: 'var(--text-3)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: 230,
                        }}
                      >
                        <span className={`el-text-${c.element}`}>
                          {c.element}
                        </span>{' '}
                        · {c.specialMechanic}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color:
                          sub.scoreDelta > 0
                            ? 'var(--ok)'
                            : sub.scoreDelta < 0
                              ? 'var(--danger)'
                              : 'var(--text-2)',
                      }}
                    >
                      {sub.scoreDelta > 0
                        ? `+${sub.scoreDelta}`
                        : sub.scoreDelta === 0
                          ? '±0'
                          : sub.scoreDelta}
                    </div>
                    {sub.badges[0] && (
                      <div style={{ fontSize: 11, color: 'var(--gold)' }}>
                        {sub.badges[0]}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}

            {filtered.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: 32,
                  color: 'var(--text-3)',
                }}
              >
                No matching characters available.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
