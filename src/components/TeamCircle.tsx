import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import type {
  Character,
  ElementType,
  SlotRole,
  SynergyEdge,
  TeamAnalysis,
} from '../types/genshin';
import { BATTLE_READY_LEVEL } from '../engine/teamAnalyzer';
import { CharacterPortrait } from './CharacterPortrait';
import { ElementIcon } from './ElementIcon';

interface TeamCircleProps {
  members: (Character | null)[];
  slotLabels?: SlotRole[];
  analysis: TeamAnalysis;
  activeEdgeIndex: number | null;
  onHoverEdge: (idx: number | null) => void;
  onClickSlot: (slotIndex: number) => void;
  compact?: boolean;
  /** Optional counter incremented on Fate's Pick / shuffle to trigger a golden Wish burst */
  burstSignal?: number;
}

export function getEdgeColor(kind: SynergyEdge['kind']): string {
  switch (kind) {
    case 'stellar':
      return '#8ce2f7';
    case 'lunar':
      return '#f2d593';
    case 'resonance':
      return '#e5c687';
    case 'support':
      return '#75d39f';
    default:
      return '#8bb4e8';
  }
}

const ELEMENT_AURA_HEX: Record<ElementType, string> = {
  Cryo: '#7fd4fc',
  Electro: '#b09ef0',
  Pyro: '#f48b66',
  Geo: '#edc86e',
  Dendro: '#7ed176',
  Hydro: '#5ab4eb',
  Anemo: '#66e6d0',
};

// Logical SVG coordinate space: 560 x 520, center (280, 260), radius 172
const CX = 280;
const CY = 260;
const R = 172;
const OUTER_ASTRO_R = 204;
const INNER_ASTRO_R = 104;

// 24 fine astronomical degree ticks around the outer compass ring
const ASTRO_TICKS = Array.from({ length: 24 }, (_, i) => {
  const angle = (i * 15 * Math.PI) / 180;
  const isMajor = i % 6 === 0;
  const isMid = i % 3 === 0;
  const r1 = OUTER_ASTRO_R - (isMajor ? 6 : isMid ? 4 : 2.5);
  const r2 = OUTER_ASTRO_R + (isMajor ? 6 : isMid ? 3 : 2);
  return {
    x1: CX + Math.cos(angle) * r1,
    y1: CY + Math.sin(angle) * r1,
    x2: CX + Math.cos(angle) * r2,
    y2: CY + Math.sin(angle) * r2,
    isMajor,
  };
});

// 4 delicate Primogem stars along the diagonal intercardinals of the rotating ring
const ASTRO_STARS = [45, 135, 225, 315].map((deg) => {
  const rad = (deg * Math.PI) / 180;
  return {
    x: CX + Math.cos(rad) * OUTER_ASTRO_R,
    y: CY + Math.sin(rad) * OUTER_ASTRO_R,
  };
});

// 8 subtle star-dots around the counter-rotating inner ring
const INNER_DOTS = Array.from({ length: 8 }, (_, i) => {
  const rad = (i * 45 * Math.PI) / 180;
  return {
    x: CX + Math.cos(rad) * INNER_ASTRO_R,
    y: CY + Math.sin(rad) * INNER_ASTRO_R,
  };
});

// 4 compass points around the constellation ring (in %)
const NODE_POSITIONS = [
  { x: CX, y: CY - R, leftPct: '50%', topPct: '16.9%' }, // Top (Slot 1)
  { x: CX + R, y: CY, leftPct: '80.7%', topPct: '50%' }, // Right (Slot 2)
  { x: CX, y: CY + R, leftPct: '50%', topPct: '83.1%' }, // Bottom (Slot 3)
  { x: CX - R, y: CY, leftPct: '19.3%', topPct: '50%' }, // Left (Slot 4)
];

function computeChordGeometry(
  fromIdx: number,
  toIdx: number
): { path: string; labelX: number; labelY: number } {
  const p1 = NODE_POSITIONS[fromIdx];
  const p2 = NODE_POSITIONS[toIdx];
  const isDiagonal = Math.abs(fromIdx - toIdx) === 2;

  if (isDiagonal) {
    // Gently bow diagonals away from the center badge so lines & labels stay crystal clear
    if (fromIdx === 0 || toIdx === 0) {
      // Vertical 0 <-> 2: bow slightly left
      const ctrlX = CX - 66;
      const ctrlY = CY;
      return {
        path: `M ${p1.x} ${p1.y} Q ${ctrlX} ${ctrlY} ${p2.x} ${p2.y}`,
        labelX: CX - 42,
        labelY: CY - 52,
      };
    } else {
      // Horizontal 1 <-> 3: bow slightly down
      const ctrlX = CX;
      const ctrlY = CY + 68;
      return {
        path: `M ${p1.x} ${p1.y} Q ${ctrlX} ${ctrlY} ${p2.x} ${p2.y}`,
        labelX: CX + 48,
        labelY: CY + 42,
      };
    }
  }

  // Perimeter chords curve gracefully inward toward the center
  const midX = (p1.x + p2.x) / 2;
  const midY = (p1.y + p2.y) / 2;
  const ctrlX = midX * 0.62 + CX * 0.38;
  const ctrlY = midY * 0.62 + CY * 0.38;

  // Point at t = 0.5 on quadratic Bezier
  const labelX = 0.25 * p1.x + 0.5 * ctrlX + 0.25 * p2.x;
  const labelY = 0.25 * p1.y + 0.5 * ctrlY + 0.25 * p2.y;

  return {
    path: `M ${p1.x} ${p1.y} Q ${ctrlX} ${ctrlY} ${p2.x} ${p2.y}`,
    labelX,
    labelY,
  };
}

function getDominantElementColor(members: (Character | null)[]): string {
  const present = members.filter((m): m is Character => Boolean(m));
  if (present.length === 0) return '#e5c687';

  const counts = new Map<ElementType, number>();
  present.forEach((m, idx) => {
    // Slot 0 (main carry) gets slight tie-breaker weight
    counts.set(m.element, (counts.get(m.element) ?? 0) + (idx === 0 ? 1.2 : 1));
  });

  let best: ElementType = present[0].element;
  let max = -1;
  counts.forEach((val, el) => {
    if (val > max) {
      max = val;
      best = el;
    }
  });
  return ELEMENT_AURA_HEX[best] ?? '#e5c687';
}

export function TeamCircle({
  members,
  slotLabels,
  analysis,
  activeEdgeIndex,
  onHoverEdge,
  onClickSlot,
  compact = false,
  burstSignal = 0,
}: TeamCircleProps) {
  const uid = useId().replace(/:/g, '');
  const portraitSize = compact ? 68 : 102;

  // Track slot changes & 4/4 completion to play a crisp Genshin Wish/Ascension golden ripple
  const prevIdsRef = useRef<(string | null)[]>([null, null, null, null]);
  const [burstSlots, setBurstSlots] = useState<boolean[]>([
    false,
    false,
    false,
    false,
  ]);
  const [constellationBurst, setConstellationBurst] = useState(false);

  const memberKey = members.map((m) => m?.id ?? '').join('|');

  useEffect(() => {
    const nextIds = [0, 1, 2, 3].map((i) => members[i]?.id ?? null);
    const prevIds = prevIdsRef.current;

    const changed = nextIds.map(
      (id, idx) => Boolean(id) && id !== prevIds[idx]
    );
    const anyChanged = changed.some(Boolean);
    const nowFull = nextIds.every(Boolean);
    const wasFull = prevIds.every(Boolean);

    prevIdsRef.current = nextIds;

    if (anyChanged || burstSignal > 0) {
      setBurstSlots(changed.some(Boolean) ? changed : [true, true, true, true]);
      if ((nowFull && !wasFull) || burstSignal > 0 || changed.filter(Boolean).length >= 3) {
        setConstellationBurst(true);
      }
      const t = window.setTimeout(() => {
        setBurstSlots([false, false, false, false]);
        setConstellationBurst(false);
      }, 720);
      return () => window.clearTimeout(t);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberKey, burstSignal]);

  // Map non-null character indices back to their actual slot position on the ring
  const presentIndices: number[] = [];
  members.forEach((m, idx) => {
    if (m) presentIndices.push(idx);
  });

  const auraColor = useMemo(() => getDominantElementColor(members), [members]);

  const mappedEdges = analysis.edges.slice(0, 6).map((edge) => ({
    ...edge,
    ringFrom: presentIndices[edge.fromIndex] ?? edge.fromIndex,
    ringTo: presentIndices[edge.toIndex] ?? edge.toIndex,
  }));

  const focusedEdge =
    activeEdgeIndex !== null ? mappedEdges[activeEdgeIndex] ?? null : null;

  const isSlotDimmed = (slotIdx: number) => {
    if (!focusedEdge) return false;
    return focusedEdge.ringFrom !== slotIdx && focusedEdge.ringTo !== slotIdx;
  };

  const isSlotHighlighted = (slotIdx: number) => {
    if (!focusedEdge) return false;
    return focusedEdge.ringFrom === slotIdx || focusedEdge.ringTo === slotIdx;
  };

  const centerBadgeLabel =
    analysis.stellarState === 'Stellar-Conduct Active'
      ? 'Stellar-Conduct'
      : analysis.stellarState === 'Stellar Swirl Active'
        ? 'Stellar Swirl'
        : analysis.moonsignTier === 'Ascendant Gleam'
          ? 'Ascendant Gleam'
          : analysis.chevreuseValid
            ? 'Overloaded Shred'
            : analysis.reactions[0]?.name ?? 'Team Core';

  return (
    <div
      className={`team-circle-wrap ${compact ? 'compact' : ''} ${
        constellationBurst ? 'constellation-burst' : ''
      }`}
      onMouseLeave={() => onHoverEdge(null)}
    >
      {/* Living Teyvat Constellation Astrolabe SVG */}
      <svg
        className="team-circle-svg"
        viewBox="0 0 560 520"
        aria-label="Circular team synergy constellation"
      >
        <defs>
          <radialGradient id={`${uid}-aura`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={auraColor} stopOpacity="0.16" />
            <stop offset="52%" stopColor={auraColor} stopOpacity="0.05" />
            <stop offset="100%" stopColor={auraColor} stopOpacity="0" />
          </radialGradient>
          <filter id={`${uid}-glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Soft Dynamic Elemental Halo */}
        <circle cx={CX} cy={CY} r={225} fill={`url(#${uid}-aura)`} />

        {/* Slow-Rotating Outer Celestial Astrolabe Ring */}
        <g
          className="astrolabe-outer"
          style={{ transformOrigin: `${CX}px ${CY}px` }}
        >
          <circle
            cx={CX}
            cy={CY}
            r={OUTER_ASTRO_R}
            fill="none"
            stroke="rgba(229, 198, 135, 0.14)"
            strokeWidth="0.85"
          />
          {ASTRO_TICKS.map((tick, idx) => (
            <line
              key={idx}
              x1={tick.x1}
              y1={tick.y1}
              x2={tick.x2}
              y2={tick.y2}
              stroke="rgba(229, 198, 135, 0.28)"
              strokeWidth={tick.isMajor ? 1.2 : 0.8}
              strokeLinecap="round"
            />
          ))}
          {ASTRO_STARS.map((star, idx) => (
            <path
              key={idx}
              d={`M ${star.x} ${star.y - 5.5} L ${star.x + 1.5} ${star.y - 1.5} L ${star.x + 5.5} ${star.y} L ${star.x + 1.5} ${star.y + 1.5} L ${star.x} ${star.y + 5.5} L ${star.x - 1.5} ${star.y + 1.5} L ${star.x - 5.5} ${star.y} L ${star.x - 1.5} ${star.y - 1.5} Z`}
              fill="rgba(246, 224, 174, 0.52)"
            />
          ))}
        </g>

        {/* Primary Character Orbit Track */}
        <circle
          cx={CX}
          cy={CY}
          r={R}
          fill="none"
          stroke="rgba(229, 198, 135, 0.22)"
          strokeWidth="1"
          strokeDasharray="4 7"
        />

        {/* Counter-Rotating Inner Constellation Compass */}
        <g
          className="astrolabe-inner"
          style={{ transformOrigin: `${CX}px ${CY}px` }}
        >
          <circle
            cx={CX}
            cy={CY}
            r={INNER_ASTRO_R}
            fill="rgba(16, 21, 38, 0.42)"
            stroke="rgba(229, 198, 135, 0.12)"
            strokeWidth="0.9"
          />
          {INNER_DOTS.map((pt, idx) => (
            <circle
              key={idx}
              cx={pt.x}
              cy={pt.y}
              r={idx % 2 === 0 ? 1.7 : 1}
              fill="rgba(246, 224, 174, 0.36)"
            />
          ))}
        </g>

        {/* Golden Constellation Complete Ripple Ring */}
        {constellationBurst && (
          <circle
            cx={CX}
            cy={CY}
            r={R}
            fill="none"
            stroke="#f6e0ae"
            strokeWidth="2"
            className="wish-constellation-ring"
          />
        )}

        {/* Pairwise Reaction Connections + Flowing Elemental Sparks */}
        {mappedEdges.map((edge, idx) => {
          const { path, labelX, labelY } = computeChordGeometry(
            edge.ringFrom,
            edge.ringTo
          );
          const color = getEdgeColor(edge.kind);
          const isHighlighted = activeEdgeIndex === idx;
          const isDimmed = activeEdgeIndex !== null && !isHighlighted;
          const showSpark =
            isHighlighted || (activeEdgeIndex === null && idx === 0);
          const pillW = Math.max(74, edge.label.length * 6.6 + 18);
          const pathId = `${uid}-chord-${idx}`;

          return (
            <g
              key={`${edge.ringFrom}-${edge.ringTo}-${edge.label}`}
              className={`chord-group ${isHighlighted ? 'highlighted' : ''} ${
                isDimmed ? 'dimmed' : ''
              }`}
              onMouseEnter={() => onHoverEdge(idx)}
              onClick={() =>
                onHoverEdge(activeEdgeIndex === idx ? null : idx)
              }
            >
              {/* Wide invisible hit target for easy hover */}
              <path
                d={path}
                fill="none"
                stroke="transparent"
                strokeWidth="18"
              />
              <path
                id={pathId}
                d={path}
                className="chord-path"
                stroke={color}
                strokeDasharray={
                  edge.kind === 'resonance' ? '5 4' : undefined
                }
                opacity={isHighlighted ? 1 : 0.72}
                filter={isHighlighted ? `url(#${uid}-glow)` : undefined}
              />

              {/* Flowing luminous elemental mote along the Bezier reaction chord */}
              {showSpark && (
                <circle
                  r={isHighlighted ? 3.8 : 2.6}
                  fill="#fffdf7"
                  stroke={color}
                  strokeWidth={isHighlighted ? 2 : 1.5}
                  filter={`url(#${uid}-glow)`}
                  className="chord-spark"
                >
                  <animateMotion
                    dur={isHighlighted ? '1.85s' : '3.4s'}
                    repeatCount="indefinite"
                    path={path}
                  />
                </circle>
              )}

              <rect
                x={labelX - pillW / 2}
                y={labelY - 10}
                width={pillW}
                height={20}
                rx={10}
                fill="#11172a"
                fillOpacity={0.94}
                stroke={color}
                strokeOpacity={isHighlighted ? 0.95 : 0.44}
                strokeWidth={1}
              />
              <text
                x={labelX}
                y={labelY + 3.5}
                textAnchor="middle"
                fill={color}
                className="chord-label"
              >
                {edge.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Center Readout */}
      <div className="circle-center-info">
        {focusedEdge ? (
          <>
            <span
              className="circle-center-state"
              style={{ color: getEdgeColor(focusedEdge.kind) }}
            >
              {focusedEdge.label}
            </span>
            <span className="circle-center-desc">{focusedEdge.description}</span>
          </>
        ) : presentIndices.length === 0 ? (
          <>
            <span className="circle-center-state">Four Visions</span>
            <span className="circle-center-desc">
              Awaiting a constellation — tap any + slot
            </span>
          </>
        ) : (
          <>
            <span className="circle-center-score">{analysis.score}</span>
            <span className="circle-center-state">{centerBadgeLabel}</span>
            {!compact && (
              <span className="circle-center-desc">
                Tap any portrait to swap
              </span>
            )}
          </>
        )}
      </div>

      {/* 4 Character Portrait Medallions Positioned Around the Circle */}
      {NODE_POSITIONS.map((pos, idx) => {
        const char = members[idx] ?? null;
        if (!char) {
          return (
            <button
              key={`empty-${idx}`}
              type="button"
              className="circle-node"
              style={{ left: pos.leftPct, top: pos.topPct }}
              onClick={() => onClickSlot(idx)}
              aria-label={`Select character for slot ${idx + 1}`}
            >
              <div className="circle-empty-ring">
                <Plus size={20} />
              </div>
              <span className="circle-node-role">Vision {idx + 1}</span>
            </button>
          );
        }

        const isUnbuilt = char.level < BATTLE_READY_LEVEL;
        const dimmed = isSlotDimmed(idx);
        const highlighted = isSlotHighlighted(idx);
        const isBursting = burstSlots[idx];

        return (
          <button
            key={`${char.id}-${idx}`}
            type="button"
            className={`circle-node el-${char.element} ${
              dimmed ? 'dimmed' : ''
            } ${highlighted ? 'highlighted' : ''} ${
              isBursting ? 'wish-burst' : ''
            }`}
            style={{ left: pos.leftPct, top: pos.topPct }}
            onClick={() => onClickSlot(idx)}
            title={`Click to swap ${char.name} (${char.specialMechanic})`}
          >
            <div className="circle-node-ring">
              {isBursting && (
                <span className="wish-ripple-halo" aria-hidden="true" />
              )}
              <CharacterPortrait character={char} size={portraitSize} />
              <span className="circle-node-el-dot" aria-hidden="true">
                <ElementIcon element={char.element} size={13} />
              </span>
              <span
                className={`circle-node-lv ${isUnbuilt ? 'unbuilt' : ''}`}
              >
                {char.level}
              </span>
            </div>

            <div className="circle-node-caption">
              <span className="circle-node-name">{char.name}</span>
              <span className="circle-node-role">
                {slotLabels?.[idx] ?? char.role.split('/')[0].trim()}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
