import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  Bookmark,
  ClipboardCopy,
  Shuffle,
  Swords,
} from 'lucide-react';
import type {
  ActiveTab,
  Character,
  SlotRole,
  TeamRecommendation,
} from '../types/genshin';
import { analyzeTeam, inferSlotRoles } from '../engine/teamAnalyzer';
import { getContextualBuildCallouts } from '../engine/buildPriorities';
import { CharacterPortrait } from './CharacterPortrait';
import { PrimogemStar } from './NationEmblem';
import { SlotSwapDrawer } from './SlotSwapDrawer';
import { getEdgeColor, TeamCircle } from './TeamCircle';

export interface OriginContext {
  fromTab: ActiveTab;
  label: string;
  detail?: string;
}

interface TeamVisualizerProps {
  recommendations: TeamRecommendation[];
  activeTeam: TeamRecommendation | null;
  manualSlots: [
    Character | null,
    Character | null,
    Character | null,
    Character | null,
  ];
  hasActiveSelection: boolean;
  activeRegionName?: string | null;
  originContext?: OriginContext | null;
  onReturnToOrigin?: () => void;
  burstSignal?: number;
  onSelectRecommendation: (rec: TeamRecommendation) => void;
  onShuffleTeam: () => void;
  onSwapSlot: (slotIndex: number, nextChar: Character) => void;
  onInspectCharacter: (char: Character) => void;
  onFatesPick: () => void;
  roster: Character[];
  includeUnbuilt: boolean;
  onSaveTeam: (team: TeamRecommendation) => void;
  onCopySheetRow: (team: TeamRecommendation) => void;
  onSendToAbyss: (team: TeamRecommendation, half: 1 | 2) => void;
  onNavigateTab: (tab: 'top-teams' | 'bosses' | 'regions' | 'roster') => void;
}

export function TeamVisualizer({
  recommendations,
  activeTeam,
  manualSlots,
  hasActiveSelection,
  activeRegionName,
  originContext,
  onReturnToOrigin,
  burstSignal = 0,
  onSelectRecommendation,
  onShuffleTeam,
  onSwapSlot,
  onInspectCharacter,
  onFatesPick,
  roster,
  includeUnbuilt,
  onSaveTeam,
  onCopySheetRow,
  onSendToAbyss,
  onNavigateTab,
}: TeamVisualizerProps) {
  const [swappingSlot, setSwappingSlot] = useState<number | null>(null);
  const [activeEdgeIdx, setActiveEdgeIdx] = useState<number | null>(null);

  // Determine the 4 circle slots (either from activeTeam, or partial manualSlots)
  const circleSlots: (Character | null)[] = activeTeam
    ? activeTeam.members
    : manualSlots;
  const filledMembers = circleSlots.filter((c): c is Character => Boolean(c));
  const isFullTeam = filledMembers.length === 4;

  const liveAnalysis = useMemo(() => {
    if (activeTeam) return activeTeam.analysis;
    return analyzeTeam(filledMembers);
  }, [activeTeam, filledMembers]);

  const slotLabels: SlotRole[] | undefined = useMemo(() => {
    if (activeTeam) return activeTeam.slotLabels;
    if (isFullTeam) {
      return inferSlotRoles(
        filledMembers as [Character, Character, Character, Character]
      );
    }
    return undefined;
  }, [activeTeam, isFullTeam, filledMembers]);

  const buildCallouts = useMemo(() => {
    if (filledMembers.length === 0) return [];
    return getContextualBuildCallouts(filledMembers, roster, {
      archetypeId: activeTeam?.archetypeId,
      regionName: activeRegionName ?? activeTeam?.subtitle,
    });
  }, [filledMembers, roster, activeTeam, activeRegionName]);

  // Empty landing state — zero presets auto-selected!
  const isEmptyLanding = !hasActiveSelection && filledMembers.length === 0;
  const isNoFilterMatch = hasActiveSelection && !activeTeam && filledMembers.length === 0;

  const sustainNames = filledMembers
    .filter((m) => m.isHealer || m.isShielder)
    .map((m) => m.name)
    .join(' & ');

  const visibleEdges = liveAnalysis.edges.slice(0, 6);

  // Construct an exportable team object whenever all 4 slots are populated
  const effectiveTeam: TeamRecommendation | null = useMemo(() => {
    if (activeTeam) return activeTeam;
    if (!isFullTeam) return null;
    const tuple = filledMembers as [Character, Character, Character, Character];
    return {
      id: `manual-${tuple.map((m) => m.id).join('-')}`,
      title:
        liveAnalysis.reactions[0]?.name
          ? `${liveAnalysis.reactions[0].name} Custom Team`
          : 'Custom Party',
      subtitle:
        liveAnalysis.reactions
          .slice(0, 3)
          .map((r) => r.name)
          .join(' · ') || 'Custom Squad',
      members: tuple,
      slotLabels: inferSlotRoles(tuple),
      analysis: liveAnalysis,
      whyItWorks:
        'Custom party assembled directly on the Team Circle. Hover any chord to inspect how teammates react.',
      source: 'custom',
    };
  }, [activeTeam, isFullTeam, filledMembers, liveAnalysis]);

  return (
    <div className="visualizer-root">
      <div className="circle-stage-layout">
        {/* Left: Hero Circular Team Constellation */}
        <div className="circle-column">
          <TeamCircle
            members={circleSlots}
            slotLabels={slotLabels}
            analysis={liveAnalysis}
            activeEdgeIndex={activeEdgeIdx}
            onHoverEdge={setActiveEdgeIdx}
            onClickSlot={(idx) => setSwappingSlot(idx)}
            burstSignal={burstSignal}
          />

          {/* Compact Portrait-Cluster Switcher + Shuffle for Regions, Bosses & Filters */}
          {hasActiveSelection && recommendations.length > 1 && (
            <div
              className="alt-teams-bar"
              role="list"
              aria-label="Alternative team suggestions"
            >
              {recommendations.slice(0, 4).map((rec, i) => {
                const isActive = rec.id === activeTeam?.id;
                const isPreset = rec.source === 'preset';
                const label = isPreset
                  ? `Sheet · ${rec.analysis.score}`
                  : activeRegionName && i === 1
                    ? `Stronger · ${rec.analysis.score}`
                    : i === 0
                      ? `Top · ${rec.analysis.score}`
                      : `Alt ${activeRegionName ? i : i + 1} · ${rec.analysis.score}`;

                return (
                  <button
                    key={rec.id}
                    type="button"
                    className={`alt-team-btn ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      setActiveEdgeIdx(null);
                      onSelectRecommendation(rec);
                    }}
                    title={`${rec.title} (Score ${rec.analysis.score}) — ${rec.members.map((m) => m.name).join(' · ')}`}
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
                    <span>{label}</span>
                  </button>
                );
              })}

              <button
                id="btn-circle-shuffle"
                type="button"
                className="alt-team-btn shuffle-pill"
                onClick={() => {
                  setActiveEdgeIdx(null);
                  onShuffleTeam();
                }}
                title={
                  activeRegionName
                    ? `Shuffle to another strong team for ${activeRegionName}`
                    : 'Shuffle to another strong alternative team'
                }
              >
                <Shuffle size={13} />
                <span>Shuffle</span>
              </button>
            </div>
          )}
        </div>

        {/* Right: Calm, Borderless Scrollable Editorial Readout */}
        <section className="editorial-panel" aria-label="Team breakdown">
          {isEmptyLanding ? (
            <div className="editorial-empty-center">
              <div>
                <div className="section-kicker" style={{ color: 'var(--gold)' }}>
                  ✦ Constellation Astrolabe
                </div>
                <h2 className="editorial-title">Assemble Your Party</h2>
                <p className="editorial-prose" style={{ marginTop: 10 }}>
                  Choose a <strong>Region</strong>, <strong>Reaction Style</strong>,{' '}
                  <strong>Boss</strong>, or <strong>Anchor Character</strong>{' '}
                  above — or tap any of the four character slots on the astrolabe to
                  watch their elemental chords come alive.
                </p>
              </div>

              <div className="filigree-divider" aria-hidden="true">
                <span />
                <PrimogemStar size={10} color="var(--gold)" />
                <span />
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  id="btn-fates-pick-empty"
                  type="button"
                  className="btn-wish"
                  onClick={onFatesPick}
                  title="Summon a fresh high-synergy party from your roster"
                >
                  <PrimogemStar size={13} />
                  Fate&apos;s Pick
                </button>
                <button
                  type="button"
                  className="btn-subtle"
                  onClick={() => onNavigateTab('top-teams')}
                >
                  Strongest Teams by Score
                  <ArrowUpRight size={13} />
                </button>
                <button
                  type="button"
                  className="btn-subtle"
                  onClick={() => onNavigateTab('bosses')}
                >
                  Boss Matchups (Wavebinder, Stygian 7.2)
                  <ArrowUpRight size={13} />
                </button>
                <button
                  type="button"
                  className="btn-subtle"
                  onClick={() => onNavigateTab('regions')}
                >
                  Party by Region
                  <ArrowUpRight size={13} />
                </button>
                <button
                  type="button"
                  className="btn-subtle"
                  onClick={() => onNavigateTab('roster')}
                >
                  Roster &amp; Artifacts
                  <ArrowUpRight size={13} />
                </button>
              </div>
            </div>
          ) : isNoFilterMatch ? (
            <div>
              {originContext && onReturnToOrigin && (
                <button
                  type="button"
                  className="origin-breadcrumb"
                  onClick={onReturnToOrigin}
                >
                  <ArrowLeft size={13} />
                  <span>Back to {originContext.label}</span>
                  {originContext.detail && (
                    <span className="origin-breadcrumb-detail">
                      ✦ {originContext.detail}
                    </span>
                  )}
                </button>
              )}
              <h2 className="editorial-title" style={{ fontSize: 22 }}>
                No Battle-Ready team matches these filters
              </h2>
              <p className="editorial-prose" style={{ marginTop: 8 }}>
                Toggle <strong>Pool: Lv 70+</strong> in the top bar to{' '}
                <strong>Lv 1–90</strong> to unlock specialist characters like
                Alyosha, Mitya, Chevreuse, or Kachina.
              </p>
            </div>
          ) : (
            <>
              <div>
                {originContext && onReturnToOrigin && (
                  <button
                    type="button"
                    className="origin-breadcrumb"
                    onClick={onReturnToOrigin}
                  >
                    <ArrowLeft size={13} />
                    <span>Back to {originContext.label}</span>
                    {originContext.detail && (
                      <span className="origin-breadcrumb-detail">
                        ✦ {originContext.detail}
                      </span>
                    )}
                  </button>
                )}
                {activeRegionName && !originContext && (
                  <div
                    className="section-kicker"
                    style={{ color: 'var(--gold)', marginBottom: 4 }}
                  >
                    ✦ {activeRegionName}
                  </div>
                )}
                <h2 className="editorial-title">
                  {effectiveTeam?.title ??
                    `Building Party (${filledMembers.length}/4)`}
                </h2>
                <div className="meta-line">
                  <span style={{ color: 'var(--gold-bright)', fontWeight: 600 }}>
                    {liveAnalysis.potentialScore > liveAnalysis.score + 3
                      ? `Ready ${liveAnalysis.score} (Max ${liveAnalysis.potentialScore})`
                      : `Compatibility ${liveAnalysis.score}`}
                  </span>
                  {liveAnalysis.moonsignTotal > 0 && (
                    <>
                      <span className="meta-sep">✦</span>
                      <span
                        style={{
                          color:
                            liveAnalysis.moonsignTier === 'Ascendant Gleam'
                              ? 'var(--lunar)'
                              : 'var(--text-2)',
                        }}
                      >
                        {liveAnalysis.moonsignTier} ({liveAnalysis.moonsignTotal}
                        /2)
                      </span>
                    </>
                  )}
                  {liveAnalysis.stellarState.includes('Active') && (
                    <>
                      <span className="meta-sep">✦</span>
                      <span style={{ color: 'var(--stellar)' }}>
                        {liveAnalysis.stellarState.replace(' Active', '')}
                      </span>
                    </>
                  )}
                  <span className="meta-sep">✦</span>
                  <span>
                    {sustainNames ? `Sustain: ${sustainNames}` : 'Glass Cannon'}
                  </span>
                </div>
              </div>

              <div className="filigree-divider" aria-hidden="true">
                <span />
                <PrimogemStar size={10} color="var(--gold)" />
                <span />
              </div>

              {/* Interactive Reaction Connections */}
              <div>
                <h3 className="section-kicker">How They React</h3>
                <div className="connection-list">
                  {visibleEdges.map((edge, idx) => {
                    const a = filledMembers[edge.fromIndex];
                    const b = filledMembers[edge.toIndex];
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
                      {filledMembers.length < 2
                        ? 'Add another character on the circle to see elemental reaction chords.'
                        : 'Mono-element or raw damage pairing without direct reaction chords.'}
                    </p>
                  )}
                </div>
              </div>

              {effectiveTeam && (
                <>
                  <div className="filigree-divider" aria-hidden="true">
                    <span />
                    <PrimogemStar size={10} color="var(--gold)" />
                    <span />
                  </div>

                  <div>
                    <h3 className="section-kicker">Why It Works</h3>
                    <p className="editorial-prose">
                      {effectiveTeam.whyItWorks}
                    </p>
                    {liveAnalysis.resonances.length > 0 && (
                      <p
                        className="editorial-prose"
                        style={{
                          marginTop: 8,
                          color: 'var(--text-3)',
                          fontSize: 12.5,
                        }}
                      >
                        <strong style={{ color: 'var(--text-2)' }}>
                          Resonance:
                        </strong>{' '}
                        {liveAnalysis.resonances
                          .map((r) => `${r.name} (${r.effect})`)
                          .join(' ✦ ')}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Contextual "Beneficial to Build Up" callouts */}
              {(buildCallouts.length > 0 ||
                liveAnalysis.warnings.length > 0) && (
                <>
                  <div className="filigree-divider" aria-hidden="true">
                    <span />
                    <PrimogemStar size={10} color="var(--gold)" />
                    <span />
                  </div>
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
                        <button
                          type="button"
                          onClick={() => onInspectCharacter(call.character)}
                          title={`Inspect ${call.character.name}'s artifacts & boss`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            minWidth: 0,
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            textAlign: 'left',
                            color: 'inherit',
                          }}
                        >
                          <CharacterPortrait
                            character={call.character}
                            size={38}
                          />
                          <div>
                            <div>
                              <strong>{call.character.name}</strong>{' '}
                              <span style={{ fontSize: 12, opacity: 0.8 }}>
                                (Lv {call.character.level} ·{' '}
                                {call.character.element})
                              </span>
                            </div>
                            <div style={{ fontSize: 12.5, opacity: 0.88 }}>
                              {call.reason}
                            </div>
                          </div>
                        </button>

                        {!call.inTeamAlready && (
                          <button
                            type="button"
                            className="ghost-action accent"
                            style={{ flexShrink: 0, fontSize: 12 }}
                            onClick={() =>
                              onSwapSlot(
                                call.suggestedSlotIndex,
                                call.character
                              )
                            }
                            title={`Preview ${call.character.name} in this Team Circle`}
                          >
                            Try in Circle
                            <ArrowUpRight size={12} />
                          </button>
                        )}
                      </div>
                    ))}

                    {liveAnalysis.warnings.map((w, i) => (
                      <div key={i} className="note-line danger">
                        <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                        <span>{w}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Quiet Action Row when 4 members are placed */}
              {effectiveTeam && (
                <div className="editorial-actions">
                  <button
                    id="btn-save-team"
                    type="button"
                    className="btn-primary"
                    onClick={() => onSaveTeam(effectiveTeam)}
                  >
                    <Bookmark size={13} />
                    Save Team
                  </button>
                  <button
                    id="btn-fates-pick"
                    type="button"
                    className="btn-wish"
                    onClick={
                      recommendations.length > 1 ? onShuffleTeam : onFatesPick
                    }
                    title={
                      recommendations.length > 1
                        ? activeRegionName
                          ? `Cycle through other strong teams for ${activeRegionName}`
                          : 'Cycle through other strong alternative teams'
                        : 'Draw another high-synergy party from your roster'
                    }
                  >
                    {recommendations.length > 1 ? (
                      <>
                        <Shuffle size={12} />
                        {activeRegionName
                          ? `Shuffle ${activeRegionName.split('(')[0].trim()}`
                          : 'Shuffle Alternatives'}
                      </>
                    ) : (
                      <>
                        <PrimogemStar size={12} />
                        Fate&apos;s Pick
                      </>
                    )}
                  </button>
                  <button
                    id="btn-copy-sheet-row"
                    type="button"
                    className="btn-subtle"
                    onClick={() => onCopySheetRow(effectiveTeam)}
                  >
                    <ClipboardCopy size={13} />
                    Copy Sheet Row
                  </button>
                  <button
                    type="button"
                    className="ghost-action"
                    onClick={() => onSendToAbyss(effectiveTeam, 1)}
                  >
                    <Swords size={13} />
                    Abyss 1
                  </button>
                  <button
                    type="button"
                    className="ghost-action"
                    onClick={() => onSendToAbyss(effectiveTeam, 2)}
                  >
                    <Swords size={13} />
                    Abyss 2
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {swappingSlot !== null && (
        <SlotSwapDrawer
          title={
            circleSlots[swappingSlot]
              ? `Swap ${circleSlots[swappingSlot]!.name}`
              : `Add Character to Slot ${swappingSlot + 1}`
          }
          currentCharacter={circleSlots[swappingSlot] ?? null}
          currentMembers={filledMembers}
          slotIndex={(() => {
            const target = circleSlots[swappingSlot];
            if (!target) return filledMembers.length;
            return filledMembers.findIndex((c) => c.id === target.id);
          })()}
          roster={roster}
          includeUnbuilt={includeUnbuilt}
          onPickCharacter={(nextChar) => onSwapSlot(swappingSlot, nextChar)}
          onInspectCharacter={onInspectCharacter}
          onClose={() => setSwappingSlot(null)}
        />
      )}
    </div>
  );
}
