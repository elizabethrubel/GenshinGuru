import { useMemo, useState } from 'react';
import {
  ArrowLeftRight,
  Bookmark,
  Trash2,
  Wand2,
} from 'lucide-react';
import { ARCHETYPES } from '../data/archetypes';
import { ENCOUNTERS } from '../data/encounters';
import type { Character } from '../types/genshin';
import { analyzeTeam } from '../engine/teamAnalyzer';
import { generateRecommendedTeams } from '../engine/teamBuilder';
import { SlotSwapDrawer } from './SlotSwapDrawer';
import { TeamCircle } from './TeamCircle';

interface AbyssPlannerProps {
  roster: Character[];
  half1Ids: [string | null, string | null, string | null, string | null];
  half2Ids: [string | null, string | null, string | null, string | null];
  half1Label: string;
  half2Label: string;
  includeUnbuilt: boolean;
  requireSurvivability: boolean;
  onChangeHalf: (
    half: 1 | 2,
    ids: [string | null, string | null, string | null, string | null],
    label?: string
  ) => void;
  onSwapHalves: () => void;
  onSaveAbyssPair: (name: string) => void;
}

export function AbyssPlanner({
  roster,
  half1Ids,
  half2Ids,
  half1Label,
  half2Label,
  includeUnbuilt,
  requireSurvivability,
  onChangeHalf,
  onSwapHalves,
  onSaveAbyssPair,
}: AbyssPlannerProps) {
  const [half1Filter, setHalf1Filter] = useState<string>('arch:lunar-charged');
  const [half2Filter, setHalf2Filter] = useState<string>('arch:stellar-conduct');
  const [hoverEdge1, setHoverEdge1] = useState<number | null>(null);
  const [hoverEdge2, setHoverEdge2] = useState<number | null>(null);
  const [editingSlot, setEditingSlot] = useState<{
    half: 1 | 2;
    slotIdx: number;
  } | null>(null);

  const charMap = useMemo(
    () => new Map(roster.map((c) => [c.id, c])),
    [roster]
  );

  const resolveIds = (
    ids: [string | null, string | null, string | null, string | null]
  ) => ids.map((id) => (id ? charMap.get(id) ?? null : null));

  const half1Chars = resolveIds(half1Ids);
  const half2Chars = resolveIds(half2Ids);

  const half1Valid = half1Chars.filter((c): c is Character => Boolean(c));
  const half2Valid = half2Chars.filter((c): c is Character => Boolean(c));

  const analysis1 = useMemo(() => analyzeTeam(half1Valid), [half1Valid]);
  const analysis2 = useMemo(() => analyzeTeam(half2Valid), [half2Valid]);

  const handleAutoFillHalf = (half: 1 | 2) => {
    const filterKey = half === 1 ? half1Filter : half2Filter;
    const otherIds = (half === 1 ? half2Ids : half1Ids).filter(
      (id): id is string => Boolean(id)
    );
    const isEncounter = filterKey.startsWith('enc:');
    const rawId = filterKey.replace(/^(enc:|arch:)/, '');

    const recs = generateRecommendedTeams(
      roster,
      {
        archetypeId: !isEncounter && rawId !== 'best' ? rawId : null,
        encounterId: isEncounter ? rawId : null,
        anchorCharacterId: null,
        includeUnbuilt,
        requireSurvivability,
        excludedCharacterIds: otherIds,
      },
      1
    );

    if (recs.length > 0) {
      const top = recs[0];
      onChangeHalf(
        half,
        top.members.map((m) => m.id) as [string, string, string, string],
        top.title
      );
    }
  };

  const handleAutoFillBoth = () => {
    const isEnc1 = half1Filter.startsWith('enc:');
    const raw1 = half1Filter.replace(/^(enc:|arch:)/, '');
    const recs1 = generateRecommendedTeams(
      roster,
      {
        archetypeId: !isEnc1 && raw1 !== 'best' ? raw1 : null,
        encounterId: isEnc1 ? raw1 : null,
        anchorCharacterId: null,
        includeUnbuilt,
        requireSurvivability,
        excludedCharacterIds: [],
      },
      1
    );
    if (recs1.length === 0) return;

    const team1 = recs1[0];
    const team1Ids = team1.members.map((m) => m.id) as [
      string,
      string,
      string,
      string,
    ];
    onChangeHalf(1, team1Ids, team1.title);

    const isEnc2 = half2Filter.startsWith('enc:');
    const raw2 = half2Filter.replace(/^(enc:|arch:)/, '');
    const recs2 = generateRecommendedTeams(
      roster,
      {
        archetypeId: !isEnc2 && raw2 !== 'best' ? raw2 : null,
        encounterId: isEnc2 ? raw2 : null,
        anchorCharacterId: null,
        includeUnbuilt,
        requireSurvivability,
        excludedCharacterIds: team1Ids,
      },
      1
    );

    if (recs2.length > 0) {
      const team2 = recs2[0];
      onChangeHalf(
        2,
        team2.members.map((m) => m.id) as [string, string, string, string],
        team2.title
      );
    }
  };

  const renderHalfColumn = (
    half: 1 | 2,
    label: string,
    chars: (Character | null)[],
    analysis: ReturnType<typeof analyzeTeam>,
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
      <section className="abyss-half-col" aria-label={`Spiral Abyss Half ${half}`}>
        <div className="abyss-half-head">
          <div>
            <div className="section-kicker" style={{ marginBottom: 2 }}>
              Chamber Half {half}
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>
              {label || `Side ${half}`}
            </div>
          </div>

          <button
            type="button"
            className="ghost-action"
            onClick={() =>
              onChangeHalf(half, [null, null, null, null], `Side ${half}`)
            }
            disabled={valid.length === 0}
            title={`Clear Half ${half}`}
          >
            <Trash2 size={14} />
          </button>
        </div>

        {/* Minimal inline auto-fill selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select
            className="inline-select"
            style={{ flex: 1, maxWidth: 'none' }}
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            aria-label={`Half ${half} strategy`}
          >
            <option value="best">Best Non-Overlapping Team</option>
            <optgroup label="Reaction Styles">
              {ARCHETYPES.map((a) => (
                <option key={a.id} value={`arch:${a.id}`}>
                  {a.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Encounters">
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
            onClick={() => handleAutoFillHalf(half)}
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
      ? half1Valid
      : editingSlot?.half === 2
        ? half2Valid
        : [];
  const lockedOtherIds =
    editingSlot?.half === 1
      ? half2Ids.filter((id): id is string => Boolean(id))
      : editingSlot?.half === 2
        ? half1Ids.filter((id): id is string => Boolean(id))
        : [];

  return (
    <div>
      <div className="abyss-top">
        <div>
          <h2 className="editorial-title" style={{ fontSize: 24 }}>
            Spiral Abyss Dual Circles
          </h2>
          <p className="editorial-prose" style={{ marginTop: 4 }}>
            Two non-overlapping teams side-by-side. Characters in one ring are
            automatically locked out of the other.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            id="btn-autofill-both-abyss"
            type="button"
            className="btn-primary"
            onClick={handleAutoFillBoth}
          >
            <Wand2 size={13} />
            Auto-Build Both
          </button>
          <button
            type="button"
            className="btn-subtle"
            onClick={onSwapHalves}
          >
            <ArrowLeftRight size={13} />
            Swap Halves
          </button>
          <button
            id="btn-save-abyss"
            type="button"
            className="ghost-action"
            onClick={() =>
              onSaveAbyssPair(`${half1Label.split('—')[0].trim()} + ${half2Label.split('—')[0].trim()}`)
            }
          >
            <Bookmark size={14} />
            Save Pair
          </button>
        </div>
      </div>

      <div className="abyss-dual-stage">
        {renderHalfColumn(
          1,
          half1Label,
          half1Chars,
          analysis1,
          half1Filter,
          setHalf1Filter,
          hoverEdge1,
          setHoverEdge1
        )}
        {renderHalfColumn(
          2,
          half2Label,
          half2Chars,
          analysis2,
          half2Filter,
          setHalf2Filter,
          hoverEdge2,
          setHoverEdge2
        )}
      </div>

      {editingSlot && (
        <SlotSwapDrawer
          title={`Half ${editingSlot.half} — Slot ${editingSlot.slotIdx + 1}`}
          currentMembers={
            editingSlot.half === 1 ? half1Valid : half2Valid
          }
          slotIndex={(() => {
            const slots = editingSlot.half === 1 ? half1Chars : half2Chars;
            const target = slots[editingSlot.slotIdx];
            if (!target) return editingMembers.length;
            return editingMembers.findIndex((c) => c.id === target.id);
          })()}
          roster={roster}
          includeUnbuilt={includeUnbuilt}
          excludedIds={[
            ...lockedOtherIds,
            ...(editingSlot.half === 1 ? half1Ids : half2Ids).filter(
              (id, i): id is string =>
                Boolean(id) && i !== editingSlot.slotIdx
            ),
          ]}
          onPickCharacter={(picked) => {
            const current =
              editingSlot.half === 1 ? [...half1Ids] : [...half2Ids];
            current[editingSlot.slotIdx] = picked.id;
            onChangeHalf(
              editingSlot.half,
              current as [
                string | null,
                string | null,
                string | null,
                string | null,
              ]
            );
          }}
          onClose={() => setEditingSlot(null)}
        />
      )}
    </div>
  );
}
