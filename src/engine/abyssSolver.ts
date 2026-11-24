import type {
  AbyssFloorNumber,
  AbyssFloorSchedule,
  AbyssRotationSchedule,
} from '../data/abyssRotation';
import type { Character, TeamRecommendation } from '../types/genshin';
import { generateRecommendedTeams } from './teamBuilder';

export interface AbyssFloorPairOption {
  id: string;
  firstHalf: TeamRecommendation;
  secondHalf: TeamRecommendation;
  combinedScore: number;
}

export interface SolvedAbyssFloor {
  floor: AbyssFloorNumber;
  schedule: AbyssFloorSchedule;
  bestPair: AbyssFloorPairOption | null;
  alternatives: AbyssFloorPairOption[];
}

export interface SolveAbyssOptions {
  includeUnbuilt: boolean;
  requireSurvivability: boolean;
}

/**
 * Jointly optimizes First Half + Second Half for a Spiral Abyss floor so the
 * two 4-character teams have ZERO overlapping characters and the highest combined
 * counter fit across all 3 chambers on both sides.
 */
export function solveAbyssFloorPair(
  roster: Character[],
  floorSchedule: AbyssFloorSchedule,
  options: SolveAbyssOptions
): SolvedAbyssFloor {
  const half1Candidates = generateRecommendedTeams(
    roster,
    {
      archetypeId: null,
      encounterId: null,
      customEncounter: floorSchedule.firstHalf.encounterProfile,
      anchorCharacterId: null,
      includeUnbuilt: options.includeUnbuilt,
      requireSurvivability: options.requireSurvivability,
      excludedCharacterIds: [],
    },
    12,
    15
  );

  const half2Candidates = generateRecommendedTeams(
    roster,
    {
      archetypeId: null,
      encounterId: null,
      customEncounter: floorSchedule.secondHalf.encounterProfile,
      anchorCharacterId: null,
      includeUnbuilt: options.includeUnbuilt,
      requireSurvivability: options.requireSurvivability,
      excludedCharacterIds: [],
    },
    12,
    15
  );

  const validPairs: Array<AbyssFloorPairOption & { rankWeight: number }> = [];

  for (let i = 0; i < half1Candidates.length; i++) {
    const t1 = half1Candidates[i];
    const t1Ids = new Set(t1.members.map((m) => m.id));

    for (let j = 0; j < half2Candidates.length; j++) {
      const t2 = half2Candidates[j];
      const overlaps = t2.members.some((m) => t1Ids.has(m.id));
      if (overlaps) continue;

      const combinedScore = t1.analysis.score + t2.analysis.score;
      // Combine encounter-fit ranking order (i, j) with actual level-weighted team scores
      // so both halves stay faithful to the floor's boss mechanics AND strong overall.
      const rankWeight =
        combinedScore - i * 4.5 - j * 4.5 - Math.abs(i - j) * 1.2;

      validPairs.push({
        id: `f${floorSchedule.floor}-${t1.id}__${t2.id}`,
        firstHalf: t1,
        secondHalf: t2,
        combinedScore,
        rankWeight,
      });
    }
  }

  // Fallback: if 14x14 couldn't find a disjoint pair (very small Lv 70+ roster),
  // greedily lock Half 1's #1 team and solve Half 2 strictly excluding Half 1.
  if (validPairs.length === 0 && half1Candidates.length > 0) {
    const t1 = half1Candidates[0];
    const t1Ids = t1.members.map((m) => m.id);
    const t2Fallback = generateRecommendedTeams(
      roster,
      {
        archetypeId: null,
        encounterId: null,
        customEncounter: floorSchedule.secondHalf.encounterProfile,
        anchorCharacterId: null,
        includeUnbuilt: options.includeUnbuilt,
        requireSurvivability: options.requireSurvivability,
        excludedCharacterIds: t1Ids,
      },
      1
    )[0];

    if (t2Fallback) {
      validPairs.push({
        id: `f${floorSchedule.floor}-${t1.id}__${t2Fallback.id}`,
        firstHalf: t1,
        secondHalf: t2Fallback,
        combinedScore: t1.analysis.score + t2Fallback.analysis.score,
        rankWeight: t1.analysis.score + t2Fallback.analysis.score,
      });
    }
  }

  validPairs.sort((a, b) => b.rankWeight - a.rankWeight);

  // Deduplicate and pick up to 4 meaningfully distinct pair options for Shuffle
  const picked: AbyssFloorPairOption[] = [];
  const seen = new Set<string>();

  for (const item of validPairs) {
    if (picked.length >= 4) break;
    const sig1 = item.firstHalf.members.map((m) => m.id).sort().join('|');
    const sig2 = item.secondHalf.members.map((m) => m.id).sort().join('|');
    const pairSig = `${sig1}::${sig2}`;
    if (seen.has(pairSig)) continue;
    seen.add(pairSig);
    picked.push({
      id: item.id,
      firstHalf: item.firstHalf,
      secondHalf: item.secondHalf,
      combinedScore: item.combinedScore,
    });
  }

  return {
    floor: floorSchedule.floor,
    schedule: floorSchedule,
    bestPair: picked[0] ?? null,
    alternatives: picked,
  };
}

/**
 * Automatically builds optimal non-overlapping First Half + Second Half teams
 * for ALL floors (9, 10, 11, and 12) of the current Spiral Abyss rotation.
 */
export function solveAllAbyssFloors(
  roster: Character[],
  rotation: AbyssRotationSchedule,
  options: SolveAbyssOptions
): Record<AbyssFloorNumber, SolvedAbyssFloor> {
  const result = {} as Record<AbyssFloorNumber, SolvedAbyssFloor>;
  for (const floorSchedule of rotation.floors) {
    result[floorSchedule.floor] = solveAbyssFloorPair(
      roster,
      floorSchedule,
      options
    );
  }
  return result;
}
