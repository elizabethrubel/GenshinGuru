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

          // Encounter-specific scoring
          if (encounter) {
            if (encounter.avoidElements) {
              const badCount = combo.filter((c) =>
                encounter.avoidElements!.includes(c.element)
              ).length;
              rankScore -= badCount * 45;
            }
            const prefMatches = new Set(
              combo
                .map((c) => c.element)
                .filter((el) => encounter.preferredElements.includes(el))
            ).size;
            rankScore += prefMatches * 10;

            if (
              encounter.requiredTags?.some((tag) =>
                combo.some((c) => c.mechanicTags.includes(tag))
              )
            ) {
              rankScore += 26;
            }
            if (
              encounter.id === 'nod-krai-ascendant' &&
              analysis.moonsignTier === 'Ascendant Gleam'
            ) {
              rankScore += 28;
            }
            if (
              encounter.id === 'geo-golem-shields' &&
              combo.some((c) => c.element === 'Geo' || c.weapon === 'Claymore')
            ) {
              rankScore += 22;
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
