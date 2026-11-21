import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Bookmark,
  ClipboardCopy,
  Sparkles,
  Swords,
} from 'lucide-react';
import type { Character, TeamRecommendation } from '../types/genshin';
import { getContextualBuildCallouts } from '../engine/buildPriorities';
import { CharacterPortrait } from './CharacterPortrait';
import { SlotSwapDrawer } from './SlotSwapDrawer';
import { getEdgeColor, TeamCircle } from './TeamCircle';

interface TeamVisualizerProps {
  recommendations: TeamRecommendation[];
  activeTeam: TeamRecommendation | null;
  activeRegionName?: string | null;
  onSelectRecommendation: (rec: TeamRecommendation) => void;
  onSwapSlot: (slotIndex: number, nextChar: Character) => void;
  roster: Character[];
  includeUnbuilt: boolean;
  onSaveTeam: (team: TeamRecommendation) => void;
  onCopySheetRow: (team: TeamRecommendation) => void;
  onSendToAbyss: (team: TeamRecommendation, half: 1 | 2) => void;
}

export function TeamVisualizer({
  recommendations,
  activeTeam,
  activeRegionName,
  onSelectRecommendation,
  onSwapSlot,
  roster,
  includeUnbuilt,
  onSaveTeam,
  onCopySheetRow,
  onSendToAbyss,
}: TeamVisualizerProps) {
  const [swappingSlot, setSwappingSlot] = useState<number | null>(null);
  const [activeEdgeIdx, setActiveEdgeIdx] = useState<number | null>(null);

  const buildCallouts = useMemo(() => {
    if (!activeTeam) return [];
    return getContextualBuildCallouts(activeTeam.members, roster, {
      archetypeId: activeTeam.archetypeId,
      regionName: activeRegionName ?? activeTeam.subtitle,
    });
  }, [activeTeam, roster, activeRegionName]);

  if (!activeTeam) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '72px 20px',
          color: 'var(--text-2)',
        }}
      >
        <Sparkles size={26} color="var(--gold)" />
        <h2 style={{ margin: '12px 0 6px', fontSize: 18 }}>
          No Battle-Ready team matches these filters
        </h2>
        <p style={{ margin: 0, color: 'var(--text-3)', fontSize: 13.5 }}>
          Open the level menu in the top bar and enable{' '}
          <strong>Include Unbuilt (Lv 1–69)</strong> to unlock specialist units
          like Alyosha, Chevreuse, or Kachina.
        </p>
      </div>
    );
  }

  const { analysis, members, slotLabels } = activeTeam;
  const sustainNames = members
    .filter((m) => m.isHealer || m.isShielder)
    .map((m) => m.name)
    .join(' & ');

  const visibleEdges = analysis.edges.slice(0, 6);

  return (
    <div>
      <div className="circle-stage-layout">
        {/* Left: Hero Circular Team Constellation */}
        <div className="circle-column">
          <TeamCircle
            members={members}
            slotLabels={slotLabels}
            analysis={analysis}
            activeEdgeIndex={activeEdgeIdx}
            onHoverEdge={setActiveEdgeIdx}
            onClickSlot={(idx) => setSwappingSlot(idx)}
          />

          {/* Compact Portrait-Cluster Switcher for Alternative Teams */}
          {recommendations.length > 1 && !activeRegionName && (
            <div
              className="alt-teams-bar"
              role="list"
              aria-label="Alternative team suggestions"
            >
              {recommendations.slice(0, 4).map((rec, i) => {
                const isActive = rec.id === activeTeam.id;
                return (
                  <button
                    key={rec.id}
                    type="button"
                    className={`alt-team-btn ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      setActiveEdgeIdx(null);
                      onSelectRecommendation(rec);
                    }}
                    title={rec.members.map((m) => m.name).join(' · ')}
                  >
                    <span className="avatar-stack">
                      {rec.members.map((m) => (
                        <CharacterPortrait
                          key={m.id}
                          character={m}
                          size={24}
                        />
                      ))}
                    </span>
                    <span>
                      {i === 0 ? 'Top Pick' : `Option ${i + 1}`}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Calm, Borderless Editorial Readout */}
        <section className="editorial-panel" aria-label="Team breakdown">
          <div>
            {activeRegionName && (
              <div className="section-kicker" style={{ color: 'var(--gold)', marginBottom: 4 }}>
                {activeRegionName}
              </div>
            )}
            <h2 className="editorial-title">{activeTeam.title}</h2>
            <div className="meta-line">
              <span style={{ color: 'var(--gold-bright)', fontWeight: 600 }}>
                Synergy {analysis.score}
              </span>
              {analysis.moonsignTotal > 0 && (
                <>
                  <span className="meta-sep">·</span>
                  <span
                    style={{
                      color:
                        analysis.moonsignTier === 'Ascendant Gleam'
                          ? 'var(--lunar)'
                          : 'var(--text-2)',
                    }}
                  >
                    {analysis.moonsignTier} ({analysis.moonsignTotal}/2)
                  </span>
                </>
              )}
              {analysis.stellarState.includes('Active') && (
                <>
                  <span className="meta-sep">·</span>
                  <span style={{ color: 'var(--stellar)' }}>
                    {analysis.stellarState.replace(' Active', '')}
                  </span>
                </>
              )}
              <span className="meta-sep">·</span>
              <span>
                {sustainNames ? `Sustain: ${sustainNames}` : 'Glass Cannon'}
              </span>
            </div>
          </div>

          <hr className="hairline" />

          {/* Interactive Reaction Connections */}
          <div>
            <h3 className="section-kicker">How They React</h3>
            <div className="connection-list">
              {visibleEdges.map((edge, idx) => {
                const a = members[edge.fromIndex];
                const b = members[edge.toIndex];
                const color = getEdgeColor(edge.kind);
                return (
                  <button
                    key={`${edge.fromIndex}-${edge.toIndex}-${edge.label}`}
                    type="button"
                    className={`connection-row ${
                      activeEdgeIdx === idx ? 'active' : ''
                    }`}
                    onMouseEnter={() => setActiveEdgeIdx(idx)}
                    onMouseLeave={() => setActiveEdgeIdx(null)}
                    onClick={() =>
                      setActiveEdgeIdx(activeEdgeIdx === idx ? null : idx)
                    }
                  >
                    <span className="connection-left">
                      <span
                        className="connection-dot"
                        style={{ backgroundColor: color }}
                      />
                      <span className="connection-name">{edge.label}</span>
                    </span>
                    <span className="connection-pair">
                      {a?.name} ↔ {b?.name}
                    </span>
                  </button>
                );
              })}

              {visibleEdges.length === 0 && (
                <p className="editorial-prose">
                  Mono-element or raw damage pairing without direct reaction
                  chords.
                </p>
              )}
            </div>
          </div>

          <hr className="hairline" />

          {/* Strategy & Resonance */}
          <div>
            <h3 className="section-kicker">Why It Works</h3>
            <p className="editorial-prose">{activeTeam.whyItWorks}</p>
            {analysis.resonances.length > 0 && (
              <p
                className="editorial-prose"
                style={{ marginTop: 8, color: 'var(--text-3)', fontSize: 12.5 }}
              >
                <strong style={{ color: 'var(--text-2)' }}>Resonance:</strong>{' '}
                {analysis.resonances
                  .map((r) => `${r.name} (${r.effect})`)
                  .join(' · ')}
              </p>
            )}
          </div>

          {/* Contextual "Worth Building Up" callouts — shown even in Lv 70+ mode! */}
          {(buildCallouts.length > 0 || analysis.warnings.length > 0) && (
            <>
              <hr className="hairline" />
              <div>
                {buildCallouts.length > 0 && (
                  <h3
                    className="section-kicker"
                    style={{ color: 'var(--warn)', marginBottom: 6 }}
                  >
                    Beneficial to Build Up
                  </h3>
                )}

                {buildCallouts.map((call) => (
                  <div
                    key={call.character.id}
                    className="note-line warn"
                    style={{ justifyContent: 'space-between' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                      <CharacterPortrait character={call.character} size={38} />
                      <div>
                        <div>
                          <strong>{call.character.name}</strong>{' '}
                          <span style={{ fontSize: 12, opacity: 0.8 }}>
                            (Lv {call.character.level} · {call.character.element})
                          </span>
                        </div>
                        <div style={{ fontSize: 12.5, opacity: 0.88 }}>
                          {call.reason}
                        </div>
                      </div>
                    </div>

                    {!call.inTeamAlready && (
                      <button
                        type="button"
                        className="ghost-action accent"
                        style={{ flexShrink: 0, fontSize: 12 }}
                        onClick={() =>
                          onSwapSlot(call.suggestedSlotIndex, call.character)
                        }
                        title={`Preview ${call.character.name} in this Team Circle`}
                      >
                        Try in Circle
                        <ArrowUpRight size={12} />
                      </button>
                    )}
                  </div>
                ))}

                {analysis.warnings.map((w, i) => (
                  <div key={i} className="note-line danger">
                    <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Quiet Action Row */}
          <div className="editorial-actions">
            <button
              id="btn-save-team"
              type="button"
              className="btn-primary"
              onClick={() => onSaveTeam(activeTeam)}
            >
              <Bookmark size={13} />
              Save Team
            </button>
            <button
              id="btn-copy-sheet-row"
              type="button"
              className="btn-subtle"
              onClick={() => onCopySheetRow(activeTeam)}
            >
              <ClipboardCopy size={13} />
              Copy Sheet Row
            </button>
            <button
              type="button"
              className="ghost-action"
              onClick={() => onSendToAbyss(activeTeam, 1)}
            >
              <Swords size={13} />
              Abyss 1
            </button>
            <button
              type="button"
              className="ghost-action"
              onClick={() => onSendToAbyss(activeTeam, 2)}
            >
              <Swords size={13} />
              Abyss 2
            </button>
          </div>
        </section>
      </div>

      {swappingSlot !== null && (
        <SlotSwapDrawer
          title={`Swap ${members[swappingSlot]?.name ?? `Slot ${swappingSlot + 1}`}`}
          currentMembers={members}
          slotIndex={swappingSlot}
          roster={roster}
          includeUnbuilt={includeUnbuilt}
          onPickCharacter={(nextChar) => onSwapSlot(swappingSlot, nextChar)}
          onClose={() => setSwappingSlot(null)}
        />
      )}
    </div>
  );
}
