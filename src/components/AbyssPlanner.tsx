import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Bookmark,
  CheckCircle2,
  RefreshCw,
  RotateCcw,
  Shuffle,
  Trash2,
  Wand2,
} from 'lucide-react';
import {
  VERIFIED_ABYSS_ROTATION,
  type AbyssFloorNumber,
  type AbyssHalfSchedule,
  type AbyssRotationSchedule,
} from '../data/abyssRotation';
import { ARCHETYPES } from '../data/archetypes';
import { ENCOUNTERS } from '../data/encounters';
import { solveAllAbyssFloors } from '../engine/abyssSolver';
import { analyzeTeam } from '../engine/teamAnalyzer';
import { generateRecommendedTeams } from '../engine/teamBuilder';
import { checkCurrentSpiralAbyss } from '../services/abyssSync';
import type { Character } from '../types/genshin';
import { CharacterPortrait } from './CharacterPortrait';
import { SlotSwapDrawer } from './SlotSwapDrawer';
import { TeamCircle } from './TeamCircle';

export type AbyssSlotIds = [
  string | null,
  string | null,
  string | null,
  string | null,
];

interface FloorTeamState {
  half1Ids: AbyssSlotIds;
  half2Ids: AbyssSlotIds;
  half1Label: string;
  half2Label: string;
  isCustom?: boolean;
}

interface AbyssPlannerProps {
  roster: Character[];
  half1Ids: AbyssSlotIds;
  half2Ids: AbyssSlotIds;
  half1Label: string;
  half2Label: string;
  externalRevision: number;
  includeUnbuilt: boolean;
  requireSurvivability: boolean;
  onChangeHalf: (half: 1 | 2, ids: AbyssSlotIds, label?: string) => void;
  onSwapHalves: () => void;
  onSaveAbyssPair: (payload: {
    name: string;
    half1Ids: AbyssSlotIds;
    half2Ids: AbyssSlotIds;
    half1Label: string;
    half2Label: string;
  }) => void;
  onInspectCharacter: (char: Character) => void;
}

const FLOOR_DISPLAY_ORDER: AbyssFloorNumber[] = [12, 11, 10, 9];

function toTuple(ids: string[]): AbyssSlotIds {
  return [ids[0] ?? null, ids[1] ?? null, ids[2] ?? null, ids[3] ?? null];
}

export function AbyssPlanner({
  roster,
  half1Ids,
  half2Ids,
  half1Label,
  half2Label,
  externalRevision,
  includeUnbuilt,
  requireSurvivability,
  onChangeHalf,
  onSwapHalves,
  onSaveAbyssPair,
  onInspectCharacter,
}: AbyssPlannerProps) {
  const [rotation, setRotation] = useState<AbyssRotationSchedule>(
    VERIFIED_ABYSS_ROTATION
  );
  const [isCheckingLive, setIsCheckingLive] = useState(false);

  // 'all' shows all 4 floors auto-built side-by-side; 9|10|11|12 opens that floor's Dual Circles
  const [selectedView, setSelectedView] = useState<'all' | AbyssFloorNumber>(
    externalRevision > 0 ? 12 : 'all'
  );

  // Per-floor pair index (for shuffling between distinct non-overlapping auto-built pairs)
  const [pairIndexes, setPairIndexes] = useState<
    Record<AbyssFloorNumber, number>
  >({ 9: 0, 10: 0, 11: 0, 12: 0 });

  // Optional per-floor manual overrides when user edits slots, swaps halves, or sends a team from another tab
  const [manualOverrides, setManualOverrides] = useState<
    Partial<Record<AbyssFloorNumber, FloorTeamState>>
  >({});

  // Manual strategy dropdowns inside single-floor dual-circle view
  const [half1Filter, setHalf1Filter] = useState<string>('floor-auto');
  const [half2Filter, setHalf2Filter] = useState<string>('floor-auto');
  const [hoverEdge1, setHoverEdge1] = useState<number | null>(null);
  const [hoverEdge2, setHoverEdge2] = useState<number | null>(null);
  const [editingSlot, setEditingSlot] = useState<{
    half: 1 | 2;
    slotIdx: number;
  } | null>(null);

  // Automatically check live current Spiral Abyss bosses once on mount
  const runLiveAbyssCheck = async () => {
    setIsCheckingLive(true);
    try {
      const latest = await checkCurrentSpiralAbyss();
      setRotation(latest);
    } finally {
      setIsCheckingLive(false);
    }
  };

  useEffect(() => {
    void runLiveAbyssCheck();
  }, []);

  // If the user explicitly sent a team from another tab or loaded a saved Abyss pair,
  // apply it to Floor 12 (or currently inspected floor) and jump straight to its Dual Circles.
  useEffect(() => {
    if (externalRevision === 0) return;
    const targetFloor: AbyssFloorNumber =
      selectedView === 'all' ? 12 : selectedView;
    setManualOverrides((prev) => ({
      ...prev,
      [targetFloor]: {
        half1Ids,
        half2Ids,
        half1Label,
        half2Label,
        isCustom: true,
      },
    }));
    setSelectedView(targetFloor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalRevision]);

  const charMap = useMemo(
    () => new Map(roster.map((c) => [c.id, c])),
    [roster]
  );

  // Automatically solve ALL 4 floors (Floors 9, 10, 11, 12) whenever roster, rotation, or pool changes
  const solvedFloors = useMemo(
    () =>
      solveAllAbyssFloors(roster, rotation, {
        includeUnbuilt,
        requireSurvivability,
      }),
    [roster, rotation, includeUnbuilt, requireSurvivability]
  );

  const getFloorTeams = (floor: AbyssFloorNumber): FloorTeamState => {
    const manual = manualOverrides[floor];
    if (manual) return manual;

    const solved = solvedFloors[floor];
    const alts = solved?.alternatives ?? [];
    const chosen =
      alts.length > 0
        ? alts[pairIndexes[floor] % alts.length]
        : solved?.bestPair ?? null;

    if (!chosen) {
      return {
        half1Ids: [null, null, null, null],
        half2Ids: [null, null, null, null],
        half1Label: `Floor ${floor} · First Half`,
        half2Label: `Floor ${floor} · Second Half`,
      };
    }

    return {
      half1Ids: toTuple(chosen.firstHalf.members.map((m) => m.id)),
      half2Ids: toTuple(chosen.secondHalf.members.map((m) => m.id)),
      half1Label: chosen.firstHalf.title.replace(/ Counter$/, ''),
      half2Label: chosen.secondHalf.title.replace(/ Counter$/, ''),
    };
  };

  const resolveIds = (ids: AbyssSlotIds) =>
    ids.map((id) => (id ? charMap.get(id) ?? null : null));

  const updateFloorTeam = (
    floor: AbyssFloorNumber,
    next: FloorTeamState
  ) => {
    setManualOverrides((prev) => ({ ...prev, [floor]: next }));
    onChangeHalf(1, next.half1Ids, next.half1Label);
    onChangeHalf(2, next.half2Ids, next.half2Label);
  };

  const handleCycleFloorPair = (floor: AbyssFloorNumber) => {
    const alts = solvedFloors[floor]?.alternatives ?? [];
    if (alts.length <= 1) return;
    setManualOverrides((prev) => {
      const copy = { ...prev };
      delete copy[floor];
      return copy;
    });
    setPairIndexes((prev) => ({
      ...prev,
      [floor]: (prev[floor] + 1) % alts.length,
    }));
  };

  const handleResetFloorToAuto = (floor: AbyssFloorNumber) => {
    setManualOverrides((prev) => {
      const copy = { ...prev };
      delete copy[floor];
      return copy;
    });
    setPairIndexes((prev) => ({ ...prev, [floor]: 0 }));
    setHalf1Filter('floor-auto');
    setHalf2Filter('floor-auto');
  };

  const handleResetAllFloors = () => {
    setManualOverrides({});
    setPairIndexes({ 9: 0, 10: 0, 11: 0, 12: 0 });
  };

  const handleAutoFillHalf = (floor: AbyssFloorNumber, half: 1 | 2) => {
    const floorState = getFloorTeams(floor);
    const solved = solvedFloors[floor];
    const filterKey = half === 1 ? half1Filter : half2Filter;
    const otherIds = (
      half === 1 ? floorState.half2Ids : floorState.half1Ids
    ).filter((id): id is string => Boolean(id));

    let recs;
    if (filterKey === 'floor-auto' && solved) {
      const profile =
        half === 1
          ? solved.schedule.firstHalf.encounterProfile
          : solved.schedule.secondHalf.encounterProfile;
      recs = generateRecommendedTeams(
        roster,
        {
          archetypeId: null,
          encounterId: null,
          customEncounter: profile,
          anchorCharacterId: null,
          includeUnbuilt,
          requireSurvivability,
          excludedCharacterIds: otherIds,
        },
        1
      );
    } else {
      const isEncounter = filterKey.startsWith('enc:');
      const rawId = filterKey.replace(/^(enc:|arch:)/, '');
      recs = generateRecommendedTeams(
        roster,
        {
          archetypeId: !isEncounter && rawId !== 'best' ? rawId : null,
          encounterId: isEncounter ? rawId : null,
          customEncounter: null,
          anchorCharacterId: null,
          includeUnbuilt,
          requireSurvivability,
          excludedCharacterIds: otherIds,
        },
        1
      );
    }

    if (recs.length > 0) {
      const top = recs[0];
      const nextIds = toTuple(top.members.map((m) => m.id));
      updateFloorTeam(floor, {
        ...floorState,
        half1Ids: half === 1 ? nextIds : floorState.half1Ids,
        half2Ids: half === 2 ? nextIds : floorState.half2Ids,
        half1Label: half === 1 ? top.title : floorState.half1Label,
        half2Label: half === 2 ? top.title : floorState.half2Label,
        isCustom: true,
      });
    }
  };

  const renderChamberList = (
    floor: AbyssFloorNumber,
    halfSchedule: AbyssHalfSchedule
  ) => (
    <div className="abyss-chamber-list">
      {halfSchedule.chambers.map((ch) => (
        <div key={ch.chamber} className="abyss-chamber-row">
          <span className="abyss-chamber-num">
            {floor}-{ch.chamber}
          </span>
          <span className="abyss-chamber-enemies">
            {ch.enemies.join(' · ')}
            {ch.note && (
              <span className="abyss-chamber-note"> — {ch.note}</span>
            )}
          </span>
        </div>
      ))}
    </div>
  );

  // Active single-floor state (when viewing Floor 9, 10, 11, or 12 dual circles)
  const activeFloorNum: AbyssFloorNumber =
    selectedView === 'all' ? 12 : selectedView;
  const activeFloorSolved = solvedFloors[activeFloorNum];
  const activeFloorState = getFloorTeams(activeFloorNum);
  const activeHalf1Chars = resolveIds(activeFloorState.half1Ids);
  const activeHalf2Chars = resolveIds(activeFloorState.half2Ids);
  const activeHalf1Valid = activeHalf1Chars.filter(
    (c): c is Character => Boolean(c)
  );
  const activeHalf2Valid = activeHalf2Chars.filter(
    (c): c is Character => Boolean(c)
  );
  const analysis1 = useMemo(
    () => analyzeTeam(activeHalf1Valid),
    [activeHalf1Valid]
  );
  const analysis2 = useMemo(
    () => analyzeTeam(activeHalf2Valid),
    [activeHalf2Valid]
  );

  const renderHalfColumn = (
    half: 1 | 2,
    label: string,
    chars: (Character | null)[],
    analysis: ReturnType<typeof analyzeTeam>,
    halfSchedule: AbyssHalfSchedule | undefined,
    filterValue: string,
    setFilterValue: (v: string) => void,
    hoverEdge: number | null,
    setHoverEdge: (i: number | null) => void
  ) => {
    const valid = chars.filter((c): c is Character => Boolean(c));
    const sustain = valid
      .filter((c) => c.isHealer || c.isShielder)
      .map((c) => c.name)
      .join(' & ');

    return (
      <section
        className="abyss-half-col"
        aria-label={`Floor ${activeFloorNum} Half ${half}`}
      >
        <div className="abyss-half-head">
          <div>
            <div className="section-kicker" style={{ marginBottom: 2 }}>
              Floor {activeFloorNum} · {half === 1 ? 'First Half' : 'Second Half'}
              {halfSchedule?.buff ? ` · ${halfSchedule.buff}` : ''}
            </div>
            <div
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: 'var(--text)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span>{label || `Side ${half}`}</span>
              {valid.length === 4 && (
                <span className="abyss-score-tag">
                  Score {analysis.score}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            className="ghost-action"
            onClick={() =>
              updateFloorTeam(activeFloorNum, {
                ...activeFloorState,
                half1Ids:
                  half === 1
                    ? [null, null, null, null]
                    : activeFloorState.half1Ids,
                half2Ids:
                  half === 2
                    ? [null, null, null, null]
                    : activeFloorState.half2Ids,
                half1Label:
                  half === 1 ? 'First Half' : activeFloorState.half1Label,
                half2Label:
                  half === 2 ? 'Second Half' : activeFloorState.half2Label,
                isCustom: true,
              })
            }
            disabled={valid.length === 0}
            title={`Clear Half ${half}`}
          >
            <Trash2 size={14} />
          </button>
        </div>

        {/* Detected current bosses for this half */}
        {halfSchedule && (
          <div className="abyss-half-boss-box">
            {renderChamberList(activeFloorNum, halfSchedule)}
            <div className="abyss-strategy-line">{halfSchedule.strategy}</div>
          </div>
        )}

        {/* Optional override selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select
            className="inline-select"
            style={{ flex: 1, maxWidth: 'none' }}
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            aria-label={`Half ${half} strategy`}
          >
            <option value="floor-auto">
              Auto-Counter Floor {activeFloorNum} {half === 1 ? '1st' : '2nd'} Half
            </option>
            <option value="best">Best General Non-Overlapping Team</option>
            <optgroup label="Reaction Styles">
              {ARCHETYPES.map((a) => (
                <option key={a.id} value={`arch:${a.id}`}>
                  {a.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Specific Opponent">
              {ENCOUNTERS.map((enc) => (
                <option key={enc.id} value={`enc:${enc.id}`}>
                  {enc.name.split('/')[0].trim()}
                </option>
              ))}
            </optgroup>
          </select>

          <button
            id={`btn-autofill-half-${half}`}
            type="button"
            className="btn-subtle"
            onClick={() => handleAutoFillHalf(activeFloorNum, half)}
          >
            <Wand2 size={13} />
            Auto-Fill
          </button>
        </div>

        {/* Hero Circle for this Half */}
        <TeamCircle
          members={chars}
          analysis={analysis}
          activeEdgeIndex={hoverEdge}
          onHoverEdge={setHoverEdge}
          onClickSlot={(slotIdx) => setEditingSlot({ half, slotIdx })}
          compact
        />

        {/* Quiet 1-line summary beneath circle */}
        <div
          className="meta-line"
          style={{ justifyContent: 'center', marginTop: -4 }}
        >
          {analysis.moonsignTotal > 0 && (
            <>
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
              <span className="meta-sep">·</span>
            </>
          )}
          <span>{sustain ? `Sustain: ${sustain}` : 'No healer/shielder'}</span>
          {analysis.reactions.length > 0 && (
            <>
              <span className="meta-sep">·</span>
              <span>
                {analysis.reactions
                  .slice(0, 3)
                  .map((r) => r.name)
                  .join(', ')}
              </span>
            </>
          )}
        </div>
      </section>
    );
  };

  const editingMembers =
    editingSlot?.half === 1
      ? activeHalf1Valid
      : editingSlot?.half === 2
        ? activeHalf2Valid
        : [];
  const lockedOtherIds =
    editingSlot?.half === 1
      ? activeFloorState.half2Ids.filter((id): id is string => Boolean(id))
      : editingSlot?.half === 2
        ? activeFloorState.half1Ids.filter((id): id is string => Boolean(id))
        : [];

  const hasAnyManualEdits = Object.keys(manualOverrides).length > 0;

  return (
    <div>
      {/* Top Header + Current Cycle Verification */}
      <div className="abyss-top">
        <div>
          <div className="abyss-cycle-pill-row">
            <span className="abyss-cycle-badge">
              <CheckCircle2 size={12} />
              <span>
                {isCheckingLive
                  ? 'Checking current Spiral Abyss bosses…'
                  : `${rotation.version} · ${rotation.cycleLabel}`}
              </span>
            </span>
            <span className="abyss-cycle-meta">
              {rotation.source === 'live-wiki'
                ? 'Live-verified'
                : rotation.sourceNote}{' '}
              · Next reset: {rotation.nextResetLabel}
            </span>
          </div>
          <h2 className="editorial-title" style={{ fontSize: 25, marginTop: 6 }}>
            Spiral Abyss Auto-Planner
          </h2>
          <p className="editorial-prose" style={{ marginTop: 4 }}>
            Current bosses detected across <strong>Floors 9–12</strong> with
            non-overlapping First Half &amp; Second Half teams built
            automatically from your{' '}
            <strong>{includeUnbuilt ? 'Lv 1–90' : 'Lv 70+'}</strong> roster.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            className="btn-subtle"
            onClick={() => void runLiveAbyssCheck()}
            disabled={isCheckingLive}
            title="Check Genshin Impact Wiki for the latest Spiral Abyss boss rotation"
          >
            <RefreshCw
              size={13}
              className={isCheckingLive ? 'spin' : undefined}
            />
            <span>{isCheckingLive ? 'Checking…' : 'Check Live Bosses'}</span>
          </button>

          {hasAnyManualEdits && (
            <button
              type="button"
              className="ghost-action"
              onClick={handleResetAllFloors}
              title="Reset all floors back to auto-generated counter teams"
            >
              <RotateCcw size={13} />
              <span>Reset All</span>
            </button>
          )}
        </div>
      </div>

      {/* Blessing of the Abyssal Moon quiet banner */}
      <div className="abyss-blessing-strip">
        <span className="section-kicker" style={{ margin: 0, color: 'var(--gold-bright)' }}>
          Blessing · {rotation.blessing.name}
        </span>
        <span className="abyss-blessing-desc">
          {rotation.blessing.description}
        </span>
      </div>

      {/* Floor Switcher Bar */}
      <div className="roster-filter-bar" style={{ paddingBottom: 18 }}>
        <button
          type="button"
          className={`text-tab ${selectedView === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedView('all')}
        >
          All Floors (9–12)
        </button>
        {FLOOR_DISPLAY_ORDER.map((floorNum) => {
          const teams = getFloorTeams(floorNum);
          const isEdited = Boolean(manualOverrides[floorNum]);
          return (
            <button
              key={floorNum}
              type="button"
              className={`text-tab ${selectedView === floorNum ? 'active' : ''}`}
              onClick={() => setSelectedView(floorNum)}
            >
              <span>Floor {floorNum}</span>
              {isEdited && (
                <span
                  className="abyss-dot-edited"
                  title="Custom edited"
                  aria-hidden="true"
                />
              )}
              {teams.half1Ids.filter(Boolean).length === 4 &&
                teams.half2Ids.filter(Boolean).length === 4 && (
                  <span className="abyss-tab-sub">2/2</span>
                )}
            </button>
          );
        })}
      </div>

      {/* VIEW 1: ALL 4 FLOORS AUTO-BUILT OVERVIEW (DEFAULT — ZERO EXTRA WORK!) */}
      {selectedView === 'all' ? (
        <div className="abyss-all-floors">
          {FLOOR_DISPLAY_ORDER.map((floorNum) => {
            const solved = solvedFloors[floorNum];
            if (!solved) return null;
            const { schedule } = solved;
            const floorTeams = getFloorTeams(floorNum);
            const h1Members = resolveIds(floorTeams.half1Ids).filter(
              (c): c is Character => Boolean(c)
            );
            const h2Members = resolveIds(floorTeams.half2Ids).filter(
              (c): c is Character => Boolean(c)
            );
            const h1Analysis = analyzeTeam(h1Members);
            const h2Analysis = analyzeTeam(h2Members);
            const altCount = solved.alternatives.length;
            const isEdited = Boolean(manualOverrides[floorNum]);

            return (
              <section
                key={floorNum}
                className="abyss-floor-section"
                aria-label={`Spiral Abyss Floor ${floorNum}`}
              >
                <div className="abyss-floor-header">
                  <div>
                    <div className="abyss-floor-title-row">
                      <h3 className="editorial-title" style={{ fontSize: 21 }}>
                        Floor {floorNum}
                      </h3>
                      <span className="region-parent-tag">
                        {schedule.enemyLevels}
                      </span>
                      {isEdited && (
                        <span className="abyss-edited-pill">Edited</span>
                      )}
                    </div>
                    <div className="abyss-leyline-text">
                      <strong>Ley Line Disorder:</strong>{' '}
                      {schedule.leyLineDisorder}
                    </div>
                  </div>

                  <div className="abyss-floor-actions">
                    {altCount > 1 && (
                      <button
                        type="button"
                        className="btn-subtle"
                        onClick={() => handleCycleFloorPair(floorNum)}
                        title="Cycle to another non-overlapping pair for this floor"
                      >
                        <Shuffle size={13} />
                        <span>
                          Next Pair ({(pairIndexes[floorNum] % altCount) + 1}/
                          {altCount})
                        </span>
                      </button>
                    )}
                    {isEdited && (
                      <button
                        type="button"
                        className="ghost-action"
                        onClick={() => handleResetFloorToAuto(floorNum)}
                      >
                        <RotateCcw size={13} />
                        <span>Auto</span>
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => setSelectedView(floorNum)}
                    >
                      <span>Edit Circles</span>
                      <ArrowUpRight size={13} />
                    </button>
                    <button
                      type="button"
                      className="ghost-action"
                      onClick={() =>
                        onSaveAbyssPair({
                          name: `Floor ${floorNum}: ${floorTeams.half1Label} + ${floorTeams.half2Label}`,
                          half1Ids: floorTeams.half1Ids,
                          half2Ids: floorTeams.half2Ids,
                          half1Label: floorTeams.half1Label,
                          half2Label: floorTeams.half2Label,
                        })
                      }
                      title={`Save Floor ${floorNum} team pair`}
                    >
                      <Bookmark size={14} />
                    </button>
                  </div>
                </div>

                {/* Two Halves Side-by-Side */}
                <div className="abyss-floor-halves">
                  {[
                    {
                      half: 1 as const,
                      scheduleHalf: schedule.firstHalf,
                      members: h1Members,
                      label: floorTeams.half1Label,
                      analysis: h1Analysis,
                    },
                    {
                      half: 2 as const,
                      scheduleHalf: schedule.secondHalf,
                      members: h2Members,
                      label: floorTeams.half2Label,
                      analysis: h2Analysis,
                    },
                  ].map(({ half, scheduleHalf, members, label, analysis }) => (
                    <div key={half} className="abyss-overview-half">
                      <div className="abyss-overview-half-top">
                        <span className="section-kicker" style={{ margin: 0 }}>
                          {half === 1 ? 'First Half' : 'Second Half'}
                          {scheduleHalf.buff ? ` · ${scheduleHalf.buff}` : ''}
                        </span>
                        {members.length === 4 && (
                          <span className="abyss-score-tag">
                            Score {analysis.score}
                          </span>
                        )}
                      </div>

                      {/* Detected Chamber Bosses */}
                      {renderChamberList(floorNum, scheduleHalf)}

                      {/* Auto-Built 4-Character Squad */}
                      {members.length === 4 ? (
                        <div className="abyss-overview-team">
                          <div className="region-portraits">
                            {members.map((m, idx) => (
                              <button
                                key={`${m.id}-${idx}`}
                                type="button"
                                className="region-portrait-item clickable-portrait"
                                onClick={() => onInspectCharacter(m)}
                                title={`Inspect ${m.name}'s artifacts & build`}
                              >
                                <CharacterPortrait character={m} size={48} />
                                <span className="region-portrait-name">
                                  {m.name}
                                </span>
                              </button>
                            ))}
                          </div>
                          <div className="abyss-overview-team-meta">
                            <div className="abyss-overview-team-name">
                              {label}
                            </div>
                            <div className="abyss-overview-team-why">
                              {scheduleHalf.strategy}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          style={{
                            fontSize: 12.5,
                            color: 'var(--text-3)',
                            padding: '8px 0',
                          }}
                        >
                          Switch top bar to <strong>Pool: Lv 1–90</strong> to
                          auto-fill 8 non-overlapping characters.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        /* VIEW 2: SINGLE-FLOOR DUAL TEAM CIRCLES EDITOR */
        <div>
          <div className="abyss-single-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="ghost-action"
                onClick={() => setSelectedView('all')}
              >
                <ArrowLeft size={13} />
                <span>All Floors (9–12)</span>
              </button>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                  Floor {activeFloorNum}{' '}
                  <span className="region-parent-tag">
                    {activeFloorSolved?.schedule.enemyLevels}
                  </span>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 2 }}>
                  {activeFloorSolved?.schedule.leyLineDisorder}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <button
                id="btn-autofill-both-abyss"
                type="button"
                className="btn-primary"
                onClick={() => handleResetFloorToAuto(activeFloorNum)}
              >
                <Wand2 size={13} />
                <span>Auto-Build Floor {activeFloorNum}</span>
              </button>
              {(activeFloorSolved?.alternatives.length ?? 0) > 1 && (
                <button
                  type="button"
                  className="btn-subtle"
                  onClick={() => handleCycleFloorPair(activeFloorNum)}
                >
                  <Shuffle size={13} />
                  <span>Next Pair</span>
                </button>
              )}
              <button
                type="button"
                className="btn-subtle"
                onClick={() => {
                  updateFloorTeam(activeFloorNum, {
                    half1Ids: activeFloorState.half2Ids,
                    half2Ids: activeFloorState.half1Ids,
                    half1Label: activeFloorState.half2Label,
                    half2Label: activeFloorState.half1Label,
                    isCustom: true,
                  });
                  onSwapHalves();
                }}
              >
                <ArrowLeftRight size={13} />
                <span>Swap Halves</span>
              </button>
              <button
                id="btn-save-abyss"
                type="button"
                className="ghost-action"
                onClick={() =>
                  onSaveAbyssPair({
                    name: `Floor ${activeFloorNum}: ${activeFloorState.half1Label} + ${activeFloorState.half2Label}`,
                    half1Ids: activeFloorState.half1Ids,
                    half2Ids: activeFloorState.half2Ids,
                    half1Label: activeFloorState.half1Label,
                    half2Label: activeFloorState.half2Label,
                  })
                }
              >
                <Bookmark size={14} />
                <span>Save Pair</span>
              </button>
            </div>
          </div>

          <div className="abyss-dual-stage">
            {renderHalfColumn(
              1,
              activeFloorState.half1Label,
              activeHalf1Chars,
              analysis1,
              activeFloorSolved?.schedule.firstHalf,
              half1Filter,
              setHalf1Filter,
              hoverEdge1,
              setHoverEdge1
            )}
            {renderHalfColumn(
              2,
              activeFloorState.half2Label,
              activeHalf2Chars,
              analysis2,
              activeFloorSolved?.schedule.secondHalf,
              half2Filter,
              setHalf2Filter,
              hoverEdge2,
              setHoverEdge2
            )}
          </div>
        </div>
      )}

      {editingSlot && (
        <SlotSwapDrawer
          title={`Floor ${activeFloorNum} · Half ${editingSlot.half} — Slot ${editingSlot.slotIdx + 1}`}
          currentMembers={
            editingSlot.half === 1 ? activeHalf1Valid : activeHalf2Valid
          }
          slotIndex={(() => {
            const slots =
              editingSlot.half === 1 ? activeHalf1Chars : activeHalf2Chars;
            const target = slots[editingSlot.slotIdx];
            if (!target) return editingMembers.length;
            return editingMembers.findIndex((c) => c.id === target.id);
          })()}
          roster={roster}
          includeUnbuilt={includeUnbuilt}
          excludedIds={[
            ...lockedOtherIds,
            ...(editingSlot.half === 1
              ? activeFloorState.half1Ids
              : activeFloorState.half2Ids
            ).filter(
              (id, i): id is string =>
                Boolean(id) && i !== editingSlot.slotIdx
            ),
          ]}
          onPickCharacter={(picked) => {
            const current =
              editingSlot.half === 1
                ? [...activeFloorState.half1Ids]
                : [...activeFloorState.half2Ids];
            current[editingSlot.slotIdx] = picked.id;
            const nextTuple = current as AbyssSlotIds;
            updateFloorTeam(activeFloorNum, {
              ...activeFloorState,
              half1Ids:
                editingSlot.half === 1 ? nextTuple : activeFloorState.half1Ids,
              half2Ids:
                editingSlot.half === 2 ? nextTuple : activeFloorState.half2Ids,
              isCustom: true,
            });
          }}
          onClose={() => setEditingSlot(null)}
        />
      )}
    </div>
  );
}
