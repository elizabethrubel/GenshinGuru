import { ARCHETYPES } from '../data/archetypes';
import { ENCOUNTERS } from '../data/encounters';
import type {
  ArchetypeDefinition,
  BuilderFilters,
  Character,
  EncounterDefinition,
  TeamRecommendation,
} from '../types/genshin';
import {
  analyzeTeam,
  BATTLE_READY_LEVEL,
  computeRawTeamPower,
  computeTeamReadinessMultiplier,
  inferSlotRoles,
} from './teamAnalyzer';

function scoreCandidateForFilters(
  char: Character,
  archetype: ArchetypeDefinition | null,
  encounter: EncounterDefinition | null,
  anchorId: string | null
): number {
  let score = char.level * 0.55;
  if (char.rarity === 5) score += 8;
  if (char.id === anchorId) score += 1000;

  if (archetype) {
    if (archetype.strictElementsOnly) {
      if (!archetype.strictElementsOnly.includes(char.element)) {
        return -500;
      }
      score += 35;
    }
    if (archetype.keyElements.includes(char.element)) score += 28;
    if (archetype.requiredTags?.some((t) => char.mechanicTags.includes(t))) {
      score += 75;
    }
    if (archetype.prefersMoonsign && char.moonsignLevel > 0) score += 45;
    if (
      archetype.prefersStellar &&
      (char.mechanicTags.includes('stellar-glimmer') ||
        char.mechanicTags.includes('stellar-conduct'))
    ) {
      score += 70;
    }

    // Archetype-specific meta pillars so they always enter the combination pool
    if (
      archetype.id === 'stellar-conduct' &&
      ['traveller', 'mitya', 'alyosha', 'fischl', 'kaeya', 'rosaria', 'charlotte', 'diona', 'sucrose', 'bennett', 'lan-yan'].includes(char.id)
    ) {
      score += 32;
    }
    if (
      archetype.id === 'lunar-charged' &&
      ['flins', 'aino', 'jahoda', 'fischl', 'sucrose', 'barbara', 'bennett', 'mona'].includes(char.id)
    ) {
      score += 32;
    }
    if (
      archetype.id === 'lunar-bloom' &&
      ['lauma', 'aino', 'fischl', 'baizhu', 'jahoda', 'barbara', 'flins', 'yaoyao'].includes(char.id)
    ) {
      score += 32;
    }
    if (
      archetype.id === 'lunar-crystallize' &&
      ['zibai', 'aino', 'noelle', 'kachina', 'fischl', 'jahoda', 'bennett', 'barbara'].includes(char.id)
    ) {
      score += 32;
    }
    if (
      archetype.id === 'melt-cryo-pyro' &&
      ['traveller', 'kaeya', 'rosaria', 'xiangling', 'bennett', 'sucrose', 'charlotte', 'diona'].includes(char.id)
    ) {
      score += 32;
    }
  }

  if (encounter) {
    if (encounter.avoidElements?.includes(char.element)) score -= 90;
    if (encounter.preferredElements.includes(char.element)) score += 24;
    if (encounter.requiredTags?.some((t) => char.mechanicTags.includes(t))) {
      score += 55;
    }
  }

  // Versatile roster pillars
  if (
    ['bennett', 'fischl', 'aino', 'jahoda', 'sucrose', 'xiangling'].includes(
      char.id
    )
  ) {
    score += 18;
  }
  if (char.isHealer) score += 14;
  if (char.isShielder) score += 8;
  if (char.isOffField) score += 10;

  return score;
}

function buildWhyItWorks(
  members: Character[],
  archetype: ArchetypeDefinition | null,
  encounter: EncounterDefinition | null,
  analysis: ReturnType<typeof analyzeTeam>
): string {
  const parts: string[] = [];
  if (encounter) {
    parts.push(encounter.tacticalTip);
  }
  if (archetype) {
    parts.push(archetype.highlightNote);
  }
  if (parts.length === 0) {
    const topReactions = analysis.reactions
      .slice(0, 3)
      .map((r) => r.name)
      .join(', ');
    const sustain = members
      .filter((m) => m.isHealer || m.isShielder)
      .map((m) => m.name)
      .join(' & ');
    parts.push(
      `Combines ${members.map((m) => m.name).join(', ')} around ${
        topReactions || 'elemental synergy'
      }${sustain ? ` with sustain from ${sustain}` : ''}.`
    );
  }
  return parts.join(' ');
}

function deriveTeamTitle(
  members: Character[],
  archetype: ArchetypeDefinition | null,
  encounter: EncounterDefinition | null,
  analysis: ReturnType<typeof analyzeTeam>
): string {
  if (archetype) {
    const anchor = members[0]?.name ?? 'Core';
    return `${archetype.name} — ${anchor} Core`;
  }
  if (encounter) {
    return `${encounter.name.split('/')[0].trim()} Counter`;
  }
  if (analysis.stellarState === 'Stellar-Conduct Active') {
    return members.some((m) => m.id === 'mitya')
      ? 'Mitya Stellar-Conduct Core'
      : 'Stellar-Conduct Frostbreaker';
  }
  if (analysis.reactions.some((r) => r.name === 'Lunar-Charged')) {
    return analysis.moonsignTier === 'Ascendant Gleam'
      ? 'Ascendant Lunar-Charged Storm'
      : 'Lunar-Charged Squad';
  }
  if (analysis.reactions.some((r) => r.name === 'Lunar-Bloom')) {
    return analysis.reactions.some((r) => r.name === 'Hyperbloom')
      ? 'Lunar-Bloom & Hyperbloom'
      : 'Ascendant Lunar-Bloom';
  }
  if (analysis.reactions.some((r) => r.name === 'Lunar-Crystallize')) {
    return 'Lunar-Crystallize Vanguard';
  }
  if (analysis.chevreuseValid) {
    return 'Chevreuse Overloaded Core';
  }
  const primary = analysis.reactions[0]?.name ?? 'Balanced Elemental';
  return `${primary} Party`;
}

export function generateRecommendedTeams(
  roster: Character[],
  filters: BuilderFilters,
  maxResults = 6
): TeamRecommendation[] {
  const archetype =
    ARCHETYPES.find((a) => a.id === filters.archetypeId) ?? null;
  const encounter =
    ENCOUNTERS.find((e) => e.id === filters.encounterId) ?? null;
  const excluded = new Set(filters.excludedCharacterIds);

  const eligible = roster.filter((c) => {
    if (excluded.has(c.id)) return false;
    if (c.id === filters.anchorCharacterId) return true;
    if (!filters.includeUnbuilt && c.level < BATTLE_READY_LEVEL) return false;
    return true;
  });

  if (eligible.length < 4) return [];

  // Evaluate top 18 candidates (up to 3,060 4-combos — runs in ~8ms)
  const rankedPool = [...eligible]
    .sort(
      (a, b) =>
        scoreCandidateForFilters(
          b,
          archetype,
          encounter,
          filters.anchorCharacterId
        ) -
        scoreCandidateForFilters(
          a,
          archetype,
          encounter,
          filters.anchorCharacterId
        )
    )
    .slice(0, 18);

  if (filters.anchorCharacterId) {
    const anchor = eligible.find((c) => c.id === filters.anchorCharacterId);
    if (anchor && !rankedPool.some((c) => c.id === anchor.id)) {
      rankedPool[rankedPool.length - 1] = anchor;
    }
  }

  if (filters.requireSurvivability) {
    const sustainInPool = rankedPool.filter(
      (c) => c.isHealer || c.isShielder
    ).length;
    if (sustainInPool < 2) {
      const extraSustains = eligible
        .filter(
          (c) =>
            (c.isHealer || c.isShielder) &&
            !rankedPool.some((p) => p.id === c.id)
        )
        .sort((a, b) => b.level - a.level)
        .slice(0, 2 - sustainInPool);
      for (const s of extraSustains) {
        rankedPool.push(s);
      }
    }
  }

  const scoredCombos: Array<{
    members: [Character, Character, Character, Character];
    analysis: ReturnType<typeof analyzeTeam>;
    rankScore: number;
  }> = [];

  const n = rankedPool.length;
  for (let i = 0; i < n - 3; i++) {
    for (let j = i + 1; j < n - 2; j++) {
      for (let k = j + 1; k < n - 1; k++) {
        for (let l = k + 1; l < n; l++) {
          const combo: [Character, Character, Character, Character] = [
            rankedPool[i],
            rankedPool[j],
            rankedPool[k],
            rankedPool[l],
          ];

          if (
            filters.anchorCharacterId &&
            !combo.some((c) => c.id === filters.anchorCharacterId)
          ) {
            continue;
          }

          if (
            archetype?.strictElementsOnly &&
            !combo.every((c) =>
              archetype.strictElementsOnly!.includes(c.element)
            )
          ) {
            continue;
          }

          const hasSustain = combo.some((c) => c.isHealer || c.isShielder);
          if (filters.requireSurvivability && !hasSustain) {
            continue;
          }

          const analysis = analyzeTeam(combo);
          // Use full-resolution unclamped raw power so the strongest meta teams cleanly separate!
          const healerCount = combo.filter((c) => c.isHealer).length;
          let rankScore = computeRawTeamPower(combo, {
            lunarChargedActive: analysis.reactions.some(
              (r) => r.name === 'Lunar-Charged'
            ),
            lunarBloomActive: analysis.reactions.some(
              (r) => r.name === 'Lunar-Bloom'
            ),
            lunarCrystallizeActive: analysis.reactions.some(
              (r) => r.name === 'Lunar-Crystallize'
            ),
            moonsignTier: analysis.moonsignTier,
            stellarState: analysis.stellarState,
            chevreuseValid: analysis.chevreuseValid,
            survivability: analysis.survivability,
            healerCount,
            reactions: analysis.reactions,
            resonances: analysis.resonances,
          });

          const comboIds = new Set(combo.map((c) => c.id));

          // Archetype-specific high-precision ranking
          if (archetype) {
            if (archetype.id === 'stellar-conduct') {
              if (analysis.stellarState === 'Stellar-Conduct Active') {
                rankScore += 55;
              } else {
                rankScore -= 80;
              }
              if (comboIds.has('mitya')) rankScore += 22;
              if (comboIds.has('alyosha')) rankScore += 20;
              if (comboIds.has('traveller')) rankScore += 18;
              if (comboIds.has('fischl')) rankScore += 12;
              if (comboIds.has('flins') || comboIds.has('zibai') || comboIds.has('lauma')) {
                rankScore -= 30;
              }
            } else if (archetype.id === 'stellar-swirl') {
              if (analysis.stellarState === 'Stellar Swirl Active') {
                rankScore += 55;
              } else {
                rankScore -= 70;
              }
              if (comboIds.has('yumemizuki-mizuki')) rankScore += 18;
              if (comboIds.has('sucrose')) rankScore += 12;
            } else if (archetype.id === 'lunar-charged') {
              if (analysis.reactions.some((r) => r.name === 'Lunar-Charged')) {
                rankScore += 60;
              } else {
                rankScore -= 85;
              }
              if (analysis.moonsignTier === 'Ascendant Gleam') rankScore += 24;
              if (comboIds.has('fischl')) rankScore += 16;
              if (comboIds.has('jahoda') || comboIds.has('sucrose')) rankScore += 14;
              if (comboIds.has('zibai') || comboIds.has('traveller')) rankScore -= 25;
            } else if (archetype.id === 'lunar-bloom') {
              if (analysis.reactions.some((r) => r.name === 'Lunar-Bloom')) {
                rankScore += 60;
              } else {
                rankScore -= 85;
              }
              if (analysis.moonsignTier === 'Ascendant Gleam') rankScore += 24;
              if (analysis.reactions.some((r) => r.name === 'Hyperbloom')) {
                rankScore += 14;
              }
              if (comboIds.has('baizhu')) rankScore += 16;
              if (comboIds.has('zibai')) rankScore -= 30;
            } else if (archetype.id === 'lunar-crystallize') {
              if (
                analysis.reactions.some((r) => r.name === 'Lunar-Crystallize')
              ) {
                rankScore += 60;
              } else {
                rankScore -= 85;
              }
              if (analysis.moonsignTier === 'Ascendant Gleam') rankScore += 24;
              if (combo.filter((c) => c.element === 'Geo').length >= 2) {
                rankScore += 18;
              }
              if (comboIds.has('lauma')) rankScore -= 30;
            } else if (archetype.id === 'ascendant-gleam-multi') {
              rankScore += analysis.moonsignTotal * 18;
            } else if (archetype.id === 'overloaded-chevreuse') {
              if (analysis.chevreuseValid) rankScore += 75;
              else if (
                analysis.reactions.some((r) => r.name === 'Overloaded')
              ) {
                rankScore += 15;
              } else {
                rankScore -= 60;
              }
              if (comboIds.has('flins') && comboIds.has('fischl')) rankScore += 14;
              if (comboIds.has('bennett')) rankScore += 12;
            } else if (archetype.id === 'melt-cryo-pyro') {
              if (analysis.reactions.some((r) => r.name === 'Melt')) {
                rankScore += 50;
              } else {
                rankScore -= 70;
              }
              if (comboIds.has('bennett') && comboIds.has('xiangling')) {
                rankScore += 24;
              }
            } else if (archetype.id === 'swirl-taser') {
              const hasAnemoDriver = combo.some(
                (c) =>
                  c.element === 'Anemo' &&
                  c.role.toLowerCase().includes('driver')
              );
              if (hasAnemoDriver) rankScore += 32;
              if (analysis.reactions.some((r) => r.name === 'Swirl')) {
                rankScore += 18;
              }
            } else if (archetype.id === 'nightsoul-geo') {
              if (combo.some((c) => c.mechanicTags.includes('nightsoul'))) {
                rankScore += 55;
              } else {
                rankScore -= 65;
              }
            } else if (archetype.id === 'arkhe-ousia') {
              if (combo.some((c) => c.mechanicTags.includes('arkhe-ousia'))) {
                rankScore += 55;
              } else {
                rankScore -= 65;
              }
            }
          }

          // Encounter / Boss-specific scoring
          if (encounter) {
            // Strictly penalize immune/disadvantaged elements (e.g. Pyro vs Emperor, Hydro vs Tulpa, Electro vs Thunder Manifestation)
            if (encounter.avoidElements) {
              const badCount = combo.filter((c) =>
                encounter.avoidElements!.includes(c.element)
              ).length;
              if (badCount > 0) {
                rankScore -= badCount * 140;
              }
            }

            // Require an actual Healer when boss mechanics demand healing (e.g. Moongecko cocoon, The Knave Bond of Life)
            if (encounter.requiresHealer && !analysis.hasHealer) {
              rankScore -= 80;
            }

            // Reward matching the boss's single best counter archetype (never double-dip!)
            const prefArch = encounter.preferredArchetypes;
            const archBonuses: number[] = [0];
            if (
              prefArch.includes('stellar-conduct') &&
              analysis.stellarState === 'Stellar-Conduct Active'
            ) {
              archBonuses.push(prefArch[0] === 'stellar-conduct' ? 48 : 30);
            }
            if (
              prefArch.includes('stellar-swirl') &&
              analysis.stellarState === 'Stellar Swirl Active'
            ) {
              archBonuses.push(prefArch[0] === 'stellar-swirl' ? 48 : 30);
            }
            if (
              prefArch.includes('lunar-charged') &&
              analysis.reactions.some((r) => r.name === 'Lunar-Charged')
            ) {
              archBonuses.push(prefArch[0] === 'lunar-charged' ? 46 : 28);
            }
            if (
              prefArch.includes('lunar-bloom') &&
              analysis.reactions.some((r) => r.name === 'Lunar-Bloom')
            ) {
              archBonuses.push(prefArch[0] === 'lunar-bloom' ? 46 : 28);
            }
            if (
              prefArch.includes('lunar-crystallize') &&
              analysis.reactions.some((r) => r.name === 'Lunar-Crystallize')
            ) {
              archBonuses.push(prefArch[0] === 'lunar-crystallize' ? 50 : 28);
            }
            if (
              prefArch.includes('melt-cryo-pyro') &&
              analysis.reactions.some((r) => r.name === 'Melt')
            ) {
              archBonuses.push(prefArch[0] === 'melt-cryo-pyro' ? 40 : 24);
            }
            rankScore += Math.max(...archBonuses);

            const prefMatches = new Set(
              combo
                .map((c) => c.element)
                .filter((el) => encounter.preferredElements.includes(el))
            ).size;
            rankScore += prefMatches * 9;

            if (
              encounter.requiredTags?.some((tag) =>
                combo.some((c) => c.mechanicTags.includes(tag))
              )
            ) {
              rankScore += 28;
            }

            // Boss-specific mechanic checks
            if (encounter.id === 'wavebinder') {
              if (combo.some((c) => c.element === 'Electro')) rankScore += 18;
              if (analysis.stellarState === 'Stellar-Conduct Active') {
                rankScore += 24;
              }
            }
            if (
              encounter.id === 'emperor-of-fire-and-iron' &&
              combo.some((c) => c.element === 'Hydro')
            ) {
              rankScore += 28;
            }
            if (
              (encounter.id === 'radiant-moongecko' ||
                encounter.id === 'legatus-golem') &&
              combo.filter((c) => c.element === 'Geo').length >= 2
            ) {
              rankScore += 26;
            }
            if (
              encounter.id === 'overseer-device' &&
              combo.filter((c) => c.element === 'Cryo').length >= 2
            ) {
              rankScore += 24;
            }
            if (
              encounter.id === 'azhdaha-weekly' &&
              analysis.hasShielder
            ) {
              rankScore += 24;
            }
            if (
              encounter.id === 'raiden-weekly' &&
              combo.some((c) => c.element === 'Electro')
            ) {
              rankScore += 24;
            }
            if (
              (encounter.id === 'knuckle-duckle' ||
                encounter.id === 'radiant-moonfly' ||
                encounter.id === 'frostnight-herra') &&
              analysis.moonsignTier === 'Ascendant Gleam'
            ) {
              rankScore += 24;
            }
          }

          // Order slots nicely: Main DPS -> Sub-DPS -> Utility -> Healer
          const roleOrder = inferSlotRoles(combo);
          const rolePriority: Record<string, number> = {
            'Main DPS': 0,
            'Sub-DPS': 1,
            Utility: 2,
            Healer: 3,
          };
          const sortedCombo = combo
            .map((c, idx) => ({ c, role: roleOrder[idx] }))
            .sort((a, b) => rolePriority[a.role] - rolePriority[b.role])
            .map((x) => x.c) as [Character, Character, Character, Character];

          scoredCombos.push({
            members: sortedCombo,
            analysis: analyzeTeam(sortedCombo),
            rankScore,
          });
        }
      }
    }
  }

  scoredCombos.sort((a, b) => b.rankScore - a.rankScore);

  const picked: TeamRecommendation[] = [];
  const seenKeys = new Set<string>();

  for (const item of scoredCombos) {
    if (picked.length >= maxResults) break;
    const key = [...item.members]
      .map((m) => m.id)
      .sort()
      .join('|');
    if (seenKeys.has(key)) continue;

    // Keep #1 pure best, then encourage sensible variety across options 2-4
    const tooSimilar =
      picked.length >= 1 &&
      picked.some((existing) => {
        const existingIds = new Set(existing.members.map((m) => m.id));
        const overlap = item.members.filter((m) => existingIds.has(m.id)).length;
        return overlap >= 3 && picked.length < 3;
      });
    if (tooSimilar && scoredCombos.length > maxResults * 3) continue;

    seenKeys.add(key);
    const slotLabels = inferSlotRoles(item.members);
    picked.push({
      id: `rec-${key}`,
      title: deriveTeamTitle(
        item.members,
        archetype,
        encounter,
        item.analysis
      ),
      subtitle:
        item.analysis.reactions
          .slice(0, 3)
          .map((r) => r.name)
          .join(' · ') || 'Elemental Core',
      archetypeId: archetype?.id,
      encounterId: encounter?.id,
      members: item.members,
      slotLabels,
      analysis: item.analysis,
      whyItWorks: buildWhyItWorks(
        item.members,
        archetype,
        encounter,
        item.analysis
      ),
      source: 'engine',
    });
  }

  if (picked.length < maxResults) {
    for (const item of scoredCombos) {
      if (picked.length >= maxResults) break;
      const key = [...item.members]
        .map((m) => m.id)
        .sort()
        .join('|');
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);
      const slotLabels = inferSlotRoles(item.members);
      picked.push({
        id: `rec-${key}`,
        title: deriveTeamTitle(
          item.members,
          archetype,
          encounter,
          item.analysis
        ),
        subtitle:
          item.analysis.reactions
            .slice(0, 3)
            .map((r) => r.name)
            .join(' · ') || 'Elemental Core',
        archetypeId: archetype?.id,
        encounterId: encounter?.id,
        members: item.members,
        slotLabels,
        analysis: item.analysis,
        whyItWorks: buildWhyItWorks(
          item.members,
          archetype,
          encounter,
          item.analysis
        ),
        source: 'engine',
      });
    }
  }

  return picked;
}

export interface SlotSubstitute {
  character: Character;
  scoreDelta: number;
  newScore: number;
  badges: string[];
  newAnalysis: ReturnType<typeof analyzeTeam>;
}

export function getSlotSubstitutes(
  currentMembers: Character[],
  slotIndex: number,
  roster: Character[],
  includeUnbuilt: boolean,
  excludedIds: string[] = []
): SlotSubstitute[] {
  const baseline = analyzeTeam(currentMembers);
  const currentIds = new Set(
    currentMembers.filter((_, idx) => idx !== slotIndex).map((c) => c.id)
  );
  const excludedSet = new Set(excludedIds);

  const candidates = roster.filter((c) => {
    if (currentIds.has(c.id)) return false;
    if (excludedSet.has(c.id)) return false;
    if (currentMembers[slotIndex]?.id === c.id) return false;
    if (!includeUnbuilt && c.level < BATTLE_READY_LEVEL) return false;
    return true;
  });

  const subs: SlotSubstitute[] = candidates.map((candidate) => {
    const nextTeam = [...currentMembers];
    nextTeam[slotIndex] = candidate;
    const nextAnalysis = analyzeTeam(nextTeam);
    const scoreDelta = nextAnalysis.score - baseline.score;

    const badges: string[] = [];
    if (
      nextAnalysis.moonsignTier === 'Ascendant Gleam' &&
      baseline.moonsignTier !== 'Ascendant Gleam'
    ) {
      badges.push('+Ascendant Gleam');
    }
    if (
      nextAnalysis.stellarState === 'Stellar-Conduct Active' &&
      baseline.stellarState !== 'Stellar-Conduct Active'
    ) {
      badges.push('+Stellar-Conduct');
    }
    if (nextAnalysis.hasHealer && !baseline.hasHealer) {
      badges.push('+Healer');
    }
    if (nextAnalysis.hasShielder && !baseline.hasShielder) {
      badges.push('+Shielder');
    }
    if (nextAnalysis.chevreuseValid && !baseline.chevreuseValid) {
      badges.push('+Chevreuse Shred');
    }
    if (candidate.level < BATTLE_READY_LEVEL) {
      badges.push(`Unbuilt Lv ${candidate.level}`);
    }

    return {
      character: candidate,
      scoreDelta,
      newScore: nextAnalysis.score,
      badges,
      newAnalysis: nextAnalysis,
    };
  });

  subs.sort((a, b) => {
    if (b.newScore !== a.newScore) return b.newScore - a.newScore;
    return b.character.level - a.character.level;
  });

  return subs;
}

export type TeamRankingMode = 'ready-now' | 'max-potential';

export interface RankedStrongestTeam {
  rank: number;
  team: TeamRecommendation;
  /** Ready-Now level-weighted score (0-100) */
  readyScore: number;
  /** Pure kit & reaction compatibility ceiling assuming Lv 90 (0-100) */
  potentialScore: number;
  /** Active score for the selected ranking mode */
  activeScore: number;
  rawPower: number;
  category: 'Lunar' | 'Stellar' | 'Melt / Vape' | 'Overloaded' | 'Hyperbloom' | 'Elemental';
}

function classifyTeamCategory(
  team: TeamRecommendation
): RankedStrongestTeam['category'] {
  const names = team.analysis.reactions.map((r) => r.name);
  if (
    names.includes('Lunar-Charged') ||
    names.includes('Lunar-Bloom') ||
    names.includes('Lunar-Crystallize') ||
    team.analysis.moonsignTier === 'Ascendant Gleam'
  ) {
    return 'Lunar';
  }
  if (team.analysis.stellarState.includes('Active')) {
    return 'Stellar';
  }
  if (team.analysis.chevreuseValid || names.includes('Overloaded')) {
    return 'Overloaded';
  }
  if (names.includes('Hyperbloom') || names.includes('Bloom')) {
    return 'Hyperbloom';
  }
  if (names.includes('Melt') || names.includes('Vaporize')) {
    return 'Melt / Vape';
  }
  return 'Elemental';
}

/**
 * Computes the user's strongest distinct teams across their roster,
 * ordered either by Ready-Now (level-weighted) or Max Potential (kit compatibility).
 */
export function generateRankedStrongestTeams(
  roster: Character[],
  options: {
    includeUnbuilt: boolean;
    requireSurvivability: boolean;
    sortBy?: TeamRankingMode;
    maxResults?: number;
  }
): RankedStrongestTeam[] {
  const {
    includeUnbuilt,
    requireSurvivability,
    sortBy = 'ready-now',
    maxResults = 16,
  } = options;

  const baseFilters: BuilderFilters = {
    archetypeId: null,
    encounterId: null,
    anchorCharacterId: null,
    includeUnbuilt,
    requireSurvivability,
    excludedCharacterIds: [],
  };

  const uniqueMap = new Map<string, TeamRecommendation>();
  const register = (recs: TeamRecommendation[]) => {
    for (const rec of recs) {
      const sig = rec.members
        .map((m) => m.id)
        .slice()
        .sort()
        .join('|');
      if (!uniqueMap.has(sig)) {
        uniqueMap.set(sig, rec);
      }
    }
  };

  // 1. Broad top general combinations
  register(generateRecommendedTeams(roster, baseFilters, 8));

  // 2. When viewing Lv 1-90 in Ready Now mode, also seed top Battle-Ready Lv 70+ squads
  // so high-level squads aren't crowded out of the candidate pool by unbuilt ceiling picks
  if (includeUnbuilt) {
    register(
      generateRecommendedTeams(
        roster,
        { ...baseFilters, includeUnbuilt: false },
        6
      )
    );
  }

  // 3. Top 2 builds per reaction archetype so every viable playstyle is represented
  for (const arch of ARCHETYPES) {
    register(
      generateRecommendedTeams(
        roster,
        { ...baseFilters, archetypeId: arch.id },
        2
      )
    );
  }

  // Score every unique team for both Ready-Now and Max-Potential sorting
  const scored = Array.from(uniqueMap.values()).map((team) => {
    const a = team.analysis;
    const healerCount = team.members.filter((m) => m.isHealer).length;
    const rawKitPower = computeRawTeamPower(team.members, {
      lunarChargedActive: a.reactions.some((r) => r.name === 'Lunar-Charged'),
      lunarBloomActive: a.reactions.some((r) => r.name === 'Lunar-Bloom'),
      lunarCrystallizeActive: a.reactions.some(
        (r) => r.name === 'Lunar-Crystallize'
      ),
      moonsignTier: a.moonsignTier,
      stellarState: a.stellarState,
      chevreuseValid: a.chevreuseValid,
      survivability: a.survivability,
      healerCount,
      reactions: a.reactions,
      resonances: a.resonances,
    });
    const readyPower = rawKitPower * computeTeamReadinessMultiplier(team.members);

    return {
      team,
      readyScore: a.score,
      potentialScore: a.potentialScore,
      activeScore: sortBy === 'ready-now' ? a.score : a.potentialScore,
      rawPower: sortBy === 'ready-now' ? readyPower : rawKitPower,
      category: classifyTeamCategory(team),
    };
  });

  // Sort strictly descending by active score, then unclamped power
  scored.sort((a, b) => {
    if (b.activeScore !== a.activeScore) {
      return b.activeScore - a.activeScore;
    }
    return b.rawPower - a.rawPower;
  });

  // Keep distinct teams: avoid showing more than 2 variations sharing 3+ identical teammates
  const selected: RankedStrongestTeam[] = [];
  for (const item of scored) {
    if (selected.length >= maxResults) break;
    const ids = new Set(item.team.members.map((m) => m.id));
    const nearDupCount = selected.filter((existing) => {
      const overlap = existing.team.members.filter((m) => ids.has(m.id)).length;
      return overlap >= 3;
    }).length;
    if (nearDupCount >= 2) continue;

    selected.push({
      rank: selected.length + 1,
      team: item.team,
      readyScore: item.readyScore,
      potentialScore: item.potentialScore,
      activeScore: item.activeScore,
      rawPower: item.rawPower,
      category: item.category,
    });
  }

  return selected;
}

interface RegionExplorationProfile {
  label: string;
  preferredElements: Character['element'][];
  requiredElement?: Character['element'];
  preferAnemo?: boolean;
  preferGeo?: boolean;
  preferMoonsign?: boolean;
  preferStellar?: boolean;
  preferDendro?: boolean;
  tip: string;
}

function getRegionProfile(regionName: string): RegionExplorationProfile {
  const r = regionName.toLowerCase();
  if (r.includes('dragonspine')) {
    return {
      label: 'Dragonspine',
      preferredElements: ['Pyro', 'Cryo', 'Anemo', 'Electro'],
      requiredElement: 'Pyro',
      tip: 'Pyro lights braziers to clear Sheer Cold and melts Frostarm shields, backed by steady healing.',
    };
  }
  if (r.includes('temple of space')) {
    return {
      label: 'Temple of Space',
      preferredElements: ['Electro', 'Hydro', 'Anemo', 'Pyro'],
      preferAnemo: true,
      tip: 'Fast AoE elemental reactions and Anemo grouping clear spatial domain waves smoothly.',
    };
  }
  if (r.includes('mondstadt')) {
    return {
      label: 'Mondstadt',
      preferredElements: ['Anemo', 'Pyro', 'Electro', 'Cryo'],
      preferAnemo: true,
      tip: 'Anemo activates wind pinwheels & shreds RES while Pyro/Electro/Cryo handle torches, Cryo slimes, and Abyss Mages.',
    };
  }
  if (r.includes('chasm') || r.includes('bygone')) {
    return {
      label: r.includes('chasm') ? 'The Chasm' : 'Sea of Bygone Eras',
      preferredElements: ['Geo', 'Hydro', 'Electro'],
      preferGeo: true,
      tip: 'Geo shatters bedrock, Golem shields, and pressure plates while Lunar-Crystallize keeps DPS high.',
    };
  }
  if (r.includes('chenyu') || r.includes('sumeru')) {
    return {
      label: r.includes('chenyu') ? 'Chenyu Vale' : 'Sumeru',
      preferredElements: ['Dendro', 'Hydro', 'Electro', 'Anemo'],
      preferDendro: true,
      tip: 'Dendro + Electro/Hydro powers Tri-Lakshana puzzles and high-uptime Lunar-Bloom / Hyperbloom.',
    };
  }
  if (r.includes('liyue')) {
    return {
      label: 'Liyue',
      preferredElements: ['Geo', 'Electro', 'Hydro', 'Pyro'],
      preferGeo: true,
      tip: 'Geo resonance & shields break ore and Geo constructs cleanly while keeping overworld exploration effortless.',
    };
  }
  if (r.includes('enkanomiya') || r.includes('inazuma')) {
    return {
      label: r.includes('enkanomiya') ? 'Enkanomiya' : 'Inazuma',
      preferredElements: ['Electro', 'Hydro', 'Cryo', 'Anemo'],
      tip: 'Electro + Hydro/Cryo clears Bathysmal Vishaps, Abyss Lectors, and lightning relay puzzles rapidly.',
    };
  }
  if (r.includes('fontaine')) {
    return {
      label: 'Fontaine',
      preferredElements: ['Hydro', 'Electro', 'Dendro', 'Anemo'],
      tip: 'Hydro + Lunar reactions and Arkhe coverage breeze through Clockwork Meka and underwater-adjacent fights.',
    };
  }
  if (r.includes('sacred mountain') || r.includes('natlan')) {
    return {
      label: r.includes('sacred') ? 'Ancient Sacred Mountain' : 'Natlan',
      preferredElements: ['Pyro', 'Electro', 'Hydro', 'Geo'],
      tip: 'High-frequency elemental hits and Nightsoul/Pyro pressure burn through Tenebrous Void Wards quickly.',
    };
  }
  if (r.includes('nod-krai') || r.includes('frost moon') || r.includes('hiisi')) {
    return {
      label: 'Nod-Krai',
      preferredElements: ['Electro', 'Hydro', 'Dendro', 'Geo', 'Anemo'],
      preferMoonsign: true,
      tip: 'Moonsign Ascendant Gleam unlocks enhanced Lunar-Charged, Lunar-Bloom, and Lunar-Crystallize procs.',
    };
  }
  if (r.includes('snezhnaya')) {
    return {
      label: 'Snezhnaya',
      preferredElements: ['Cryo', 'Electro', 'Anemo', 'Pyro'],
      preferStellar: true,
      tip: 'Stellar Glimmer (Stellar-Conduct / Stellar Swirl) counters Snezhnayan Radiance & Valiant mechanics.',
    };
  }
  return {
    label: regionName,
    preferredElements: ['Anemo', 'Electro', 'Hydro', 'Pyro'],
    tip: 'High-compatibility all-purpose overworld & combat squad tailored to your strongest leveled characters.',
  };
}

/**
 * Generates stronger alternative teams tailored specifically to a Region's
 * exploration & combat profile, strictly ordered by Ready-Now score.
 */
export function generateTeamsForRegion(
  roster: Character[],
  regionName: string,
  options: {
    includeUnbuilt: boolean;
    requireSurvivability: boolean;
    excludePresetSig?: string;
    maxResults?: number;
  }
): TeamRecommendation[] {
  const {
    includeUnbuilt,
    requireSurvivability,
    excludePresetSig,
    maxResults = 7,
  } = options;
  const profile = getRegionProfile(regionName);

  // Pull a rich candidate pool from strongest ranked teams (both Ready Now & archetype variety)
  const rankedPool = generateRankedStrongestTeams(roster, {
    includeUnbuilt,
    requireSurvivability,
    sortBy: 'ready-now',
    maxResults: 24,
  });

  // Also ensure region-preferred archetype builds are represented
  const extraMap = new Map<string, TeamRecommendation>();
  const addRec = (rec: TeamRecommendation) => {
    const sig = rec.members
      .map((m) => m.id)
      .slice()
      .sort()
      .join('|');
    if (sig === excludePresetSig) return;
    if (!extraMap.has(sig)) extraMap.set(sig, rec);
  };

  rankedPool.forEach((r) => addRec(r.team));

  const baseFilters: BuilderFilters = {
    archetypeId: null,
    encounterId: null,
    anchorCharacterId: null,
    includeUnbuilt,
    requireSurvivability,
    excludedCharacterIds: [],
  };

  if (profile.preferAnemo) {
    generateRecommendedTeams(roster, { ...baseFilters, archetypeId: 'stellar-swirl' }, 3).forEach(addRec);
    generateRecommendedTeams(roster, { ...baseFilters, archetypeId: 'lunar-charged' }, 3).forEach(addRec);
  }
  if (profile.preferGeo) {
    generateRecommendedTeams(roster, { ...baseFilters, archetypeId: 'lunar-crystallize' }, 3).forEach(addRec);
    generateRecommendedTeams(roster, { ...baseFilters, archetypeId: 'nightsoul-geo' }, 2).forEach(addRec);
  }
  if (profile.preferDendro) {
    generateRecommendedTeams(roster, { ...baseFilters, archetypeId: 'lunar-bloom' }, 3).forEach(addRec);
  }
  if (profile.preferStellar) {
    generateRecommendedTeams(roster, { ...baseFilters, archetypeId: 'stellar-conduct' }, 3).forEach(addRec);
  }
  if (profile.requiredElement === 'Pyro') {
    generateRecommendedTeams(roster, { ...baseFilters, archetypeId: 'melt-vape' }, 3).forEach(addRec);
    generateRecommendedTeams(roster, { ...baseFilters, archetypeId: 'overloaded-chevreuse' }, 2).forEach(addRec);
  }

  const scored = Array.from(extraMap.values())
    .filter((team) => {
      if (
        profile.requiredElement &&
        !team.members.some((m) => m.element === profile.requiredElement)
      ) {
        return false;
      }
      return true;
    })
    .map((team) => {
      const a = team.analysis;
      let fitBonus = 0;

      const els = new Set(team.members.map((m) => m.element));
      for (const pref of profile.preferredElements) {
        if (els.has(pref)) fitBonus += 2.2;
      }
      if (profile.preferAnemo && els.has('Anemo')) fitBonus += 4;
      if (profile.preferGeo && els.has('Geo')) fitBonus += 5;
      if (profile.preferDendro && els.has('Dendro')) fitBonus += 5;
      if (profile.preferMoonsign && a.moonsignTier === 'Ascendant Gleam') {
        fitBonus += 5;
      }
      if (profile.preferStellar && a.stellarState.includes('Active')) {
        fitBonus += 5;
      }

      // Order primarily by real Ready-Now strength + modest region exploration fit
      const sortMetric = a.score + fitBonus;
      return { team, sortMetric };
    });

  scored.sort((a, b) => {
    if (b.sortMetric !== a.sortMetric) return b.sortMetric - a.sortMetric;
    return b.team.analysis.score - a.team.analysis.score;
  });

  return scored.slice(0, maxResults).map(({ team }) => ({
    ...team,
    id: `region-alt-${profile.label.toLowerCase().replace(/\s+/g, '-')}-${team.members
      .map((m) => m.id)
      .sort()
      .join('-')}`,
    whyItWorks: `${profile.tip} ${team.whyItWorks}`,
  }));
}

export function formatTeamAsSheetRow(
  members: Character[],
  teamName: string,
  regionTag = 'Custom'
): string {
  const formatMember = (c?: Character) => {
    if (!c) return '';
    if (c.name.toLowerCase().includes('travel')) {
      return `${c.name} - ${c.element} (${c.level})`;
    }
    return `${c.name} (${c.level})`;
  };

  return [
    regionTag,
    teamName,
    formatMember(members[0]),
    formatMember(members[1]),
    formatMember(members[2]),
    formatMember(members[3]),
  ].join('\t');
}
