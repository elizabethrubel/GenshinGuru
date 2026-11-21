import { useMemo } from 'react';
import {
  Bookmark,
  ClipboardCopy,
  Swords,
  Trash2,
  X,
} from 'lucide-react';
import type {
  Character,
  SavedAbyssPair,
  SavedTeam,
} from '../types/genshin';
import { CharacterPortrait } from './CharacterPortrait';

interface SavedTeamsDrawerProps {
  roster: Character[];
  savedTeams: SavedTeam[];
  savedAbyssPairs: SavedAbyssPair[];
  onLoadTeam: (saved: SavedTeam, members: Character[]) => void;
  onCopyTeamRow: (saved: SavedTeam, members: Character[]) => void;
  onDeleteTeam: (id: string) => void;
  onLoadAbyssPair: (pair: SavedAbyssPair) => void;
  onDeleteAbyssPair: (id: string) => void;
  onClose: () => void;
}

export function SavedTeamsDrawer({
  roster,
  savedTeams,
  savedAbyssPairs,
  onLoadTeam,
  onCopyTeamRow,
  onDeleteTeam,
  onLoadAbyssPair,
  onDeleteAbyssPair,
  onClose,
}: SavedTeamsDrawerProps) {
  const charMap = useMemo(
    () => new Map(roster.map((c) => [c.id, c])),
    [roster]
  );

  const isEmpty = savedTeams.length === 0 && savedAbyssPairs.length === 0;

  return (
    <div
      className="overlay-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Saved teams"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="drawer-panel">
        <div className="drawer-header">
          <h3 className="drawer-title">Saved Teams</h3>
          <button
            type="button"
            className="ghost-action"
            onClick={onClose}
            aria-label="Close saved drawer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="drawer-body">
          {isEmpty && (
            <div
              style={{
                textAlign: 'center',
                padding: '48px 16px',
                color: 'var(--text-3)',
              }}
            >
              <Bookmark size={22} style={{ marginBottom: 10, opacity: 0.6 }} />
              <div style={{ fontSize: 13.5, color: 'var(--text-2)' }}>
                No saved teams yet
              </div>
              <p style={{ fontSize: 12.5, marginTop: 6 }}>
                Save a team from the Circle or a dual pair from Spiral Abyss to
                revisit or copy into your Google Sheet.
              </p>
            </div>
          )}

          {savedTeams.length > 0 && (
            <div>
              <div className="section-kicker">Custom Teams</div>
              {savedTeams.map((team) => {
                const members = team.memberIds
                  .map((id) => charMap.get(id))
                  .filter((c): c is Character => Boolean(c));
                return (
                  <div
                    key={team.id}
                    style={{
                      padding: '12px 0',
                      borderBottom: '1px solid var(--hairline)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                      }}
                    >
                      <button
                        type="button"
                        className="ghost-action"
                        style={{ padding: 0, textAlign: 'left' }}
                        onClick={() => {
                          onLoadTeam(team, members);
                          onClose();
                        }}
                      >
                        <span className="avatar-stack">
                          {members.map((m) => (
                            <CharacterPortrait
                              key={m.id}
                              character={m}
                              size={32}
                            />
                          ))}
                        </span>
                        <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                          {team.name}
                        </span>
                      </button>

                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          type="button"
                          className="ghost-action"
                          onClick={() => onCopyTeamRow(team, members)}
                          title="Copy row for Google Sheet"
                        >
                          <ClipboardCopy size={13} />
                        </button>
                        <button
                          type="button"
                          className="ghost-action"
                          onClick={() => onDeleteTeam(team.id)}
                          title="Delete saved team"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {savedAbyssPairs.length > 0 && (
            <div>
              <div className="section-kicker">Spiral Abyss Pairs</div>
              {savedAbyssPairs.map((pair) => {
                const h1 = pair.half1Ids
                  .map((id) => (id ? charMap.get(id) : null))
                  .filter((c): c is Character => Boolean(c));
                const h2 = pair.half2Ids
                  .map((id) => (id ? charMap.get(id) : null))
                  .filter((c): c is Character => Boolean(c));
                return (
                  <div
                    key={pair.id}
                    style={{
                      padding: '12px 0',
                      borderBottom: '1px solid var(--hairline)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <strong style={{ fontSize: 13.5 }}>{pair.name}</strong>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          type="button"
                          className="ghost-action accent"
                          onClick={() => {
                            onLoadAbyssPair(pair);
                            onClose();
                          }}
                        >
                          <Swords size={13} />
                          Load
                        </button>
                        <button
                          type="button"
                          className="ghost-action"
                          onClick={() => onDeleteAbyssPair(pair.id)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                      Half 1: {h1.map((c) => c.name).join(', ') || 'Empty'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                      Half 2: {h2.map((c) => c.name).join(', ') || 'Empty'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
