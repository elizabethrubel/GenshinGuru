import { Plus } from 'lucide-react';
import type {
  Character,
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
}

export function getEdgeColor(kind: SynergyEdge['kind']): string {
  switch (kind) {
    case 'stellar':
      return '#8ce2f7';
    case 'lunar':
      return '#e7cb8d';
    case 'resonance':
      return '#d9b878';
    case 'support':
      return '#6cc996';
    default:
      return '#7ca1cc';
  }
}

// Logical SVG coordinate space: 560 x 520, center (280, 260), radius 172
const CX = 280;
const CY = 260;
const R = 172;

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

export function TeamCircle({
  members,
  slotLabels,
  analysis,
  activeEdgeIndex,
  onHoverEdge,
  onClickSlot,
  compact = false,
}: TeamCircleProps) {
  const portraitSize = compact ? 68 : 86;

  // Map non-null character indices back to their actual slot position on the ring
  const presentIndices: number[] = [];
  members.forEach((m, idx) => {
    if (m) presentIndices.push(idx);
  });

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
      className={`team-circle-wrap ${compact ? 'compact' : ''}`}
      onMouseLeave={() => onHoverEdge(null)}
    >
      {/* Orbital Ring + Curved Reaction Chords */}
      <svg
        className="team-circle-svg"
        viewBox="0 0 560 520"
        aria-label="Circular team synergy diagram"
      >
        {/* Outer subtle orbital ring */}
        <circle
          cx={CX}
          cy={CY}
          r={R}
          fill="none"
          stroke="rgba(217, 184, 120, 0.16)"
          strokeWidth="1"
          strokeDasharray="4 6"
        />
        {/* Inner quiet astrolabe ring */}
        <circle
          cx={CX}
          cy={CY}
          r={96}
          fill="rgba(11, 16, 25, 0.35)"
          stroke="rgba(235, 228, 212, 0.06)"
          strokeWidth="1"
        />

        {/* Pairwise reaction connections between characters */}
        {mappedEdges.map((edge, idx) => {
          const { path, labelX, labelY } = computeChordGeometry(
            edge.ringFrom,
            edge.ringTo
          );
          const color = getEdgeColor(edge.kind);
          const isHighlighted = activeEdgeIndex === idx;
          const isDimmed = activeEdgeIndex !== null && !isHighlighted;
          const pillW = Math.max(72, edge.label.length * 6.5 + 16);

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
                strokeWidth="16"
              />
              <path
                d={path}
                className="chord-path"
                stroke={color}
                strokeDasharray={
                  edge.kind === 'resonance' ? '5 4' : undefined
                }
                opacity={isHighlighted ? 1 : 0.72}
              />
              <rect
                x={labelX - pillW / 2}
                y={labelY - 10}
                width={pillW}
                height={20}
                rx={10}
                fill="#0c121d"
                fillOpacity={0.94}
                stroke={color}
                strokeOpacity={isHighlighted ? 0.9 : 0.4}
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
            <span className="circle-center-state">Open Circle</span>
            <span className="circle-center-desc">
              Pick a filter above or tap any + slot
            </span>
          </>
        ) : (
          <>
            <span className="circle-center-score">{analysis.score}</span>
            <span className="circle-center-state">{centerBadgeLabel}</span>
            {!compact && (
              <span className="circle-center-desc">
                Click any portrait to swap
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
              <span className="circle-node-role">Add Slot {idx + 1}</span>
            </button>
          );
        }

        const isUnbuilt = char.level < BATTLE_READY_LEVEL;
        const dimmed = isSlotDimmed(idx);
        const highlighted = isSlotHighlighted(idx);

        return (
          <button
            key={`${char.id}-${idx}`}
            type="button"
            className={`circle-node el-${char.element} ${
              dimmed ? 'dimmed' : ''
            } ${highlighted ? 'highlighted' : ''}`}
            style={{ left: pos.leftPct, top: pos.topPct }}
            onClick={() => onClickSlot(idx)}
            title={`Click to swap ${char.name} (${char.specialMechanic})`}
          >
            <div className="circle-node-ring">
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
