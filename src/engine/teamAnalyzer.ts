import type {
  Character,
  ElementType,
  LevelingCallout,
  ReactionSummary,
  ResonanceInfo,
  SlotRole,
  SynergyEdge,
  TeamAnalysis,
} from '../types/genshin';

export const BATTLE_READY_LEVEL = 70;

const RESONANCE_MAP: Record<ElementType, { name: string; effect: string }> = {
  Pyro: {
    name: 'Fervent Flames',
    effect: '+25% ATK to all party members; Cryo duration -40%',
  },
  Hydro: {
    name: 'Soothing Water',
    effect: '+25% Max HP to all party members; Pyro duration -40%',
  },
  Cryo: {
    name: 'Shattering Ice',
    effect: '+15% CRIT Rate against enemies affected by Cryo or Frozen',
  },
  Electro: {
    name: 'High Voltage',
    effect: 'Electro reactions generate bonus Electro particles every 5s',
  },
  Geo: {
    name: 'Enduring Rock',
    effect: '+15% Shield Strength; +15% DMG & -20% Geo RES while shielded',
  },
  Dendro: {
    name: 'Sprawling Greenery',
    effect: '+50 Elemental Mastery (+20–30 more on Dendro reactions)',
  },
  Anemo: {
    name: 'Impetuous Winds',
    effect: '+10% Movement SPD, -15% Stamina use, -5% Skill CD',
  },
};

export function inferSlotRoles(
  members: [Character, Character, Character, Character]
): [SlotRole, SlotRole, SlotRole, SlotRole] {
  const roles: SlotRole[] = ['Utility', 'Utility', 'Utility', 'Utility'];
  const assigned = new Set<number>();

  // 1. Pick Main DPS (prefer dedicated On-Field DPS / Driver over hybrid healers)
  let dpsIdx = -1;
  let bestDpsScore = -1;
  members.forEach((c, i) => {
    let s = 0;
    const roleLower = c.role.toLowerCase();
    if (roleLower.includes('on-field dps') && !c.isHealer) s += 60;
    else if (c.isOnField && !c.isHealer) s += 46;
    else if (roleLower.includes('on-field dps')) s += 26;
    else if (c.isOnField) s += 22;
    if (c.rarity === 5) s += 10;
    if (c.mechanicTags.includes('stellar-conduct') || c.mechanicTags.includes('lunar-charged') || c.mechanicTags.includes('lunar-crystallize')) {
      s += 12;
    }
    s += c.level * 0.2;
    if (s > bestDpsScore) {
      bestDpsScore = s;
      dpsIdx = i;
    }
  });
  if (dpsIdx !== -1) {
    roles[dpsIdx] = 'Main DPS';
    assigned.add(dpsIdx);
  }

  // 2. Pick Healer / Sustain
  let healerIdx = -1;
  members.forEach((c, i) => {
    if (assigned.has(i)) return;
    if (c.isHealer && healerIdx === -1) {
      healerIdx = i;
    }
  });
  if (healerIdx === -1) {
    members.forEach((c, i) => {
      if (assigned.has(i)) return;
      if (c.isShielder && healerIdx === -1) {
        healerIdx = i;
      }
    });
  }
  if (healerIdx !== -1) {
    roles[healerIdx] = 'Healer';
    assigned.add(healerIdx);
  }

  // 3. Pick Sub-DPS
  let subIdx = -1;
  members.forEach((c, i) => {
    if (assigned.has(i)) return;
    if (c.isOffField && subIdx === -1) {
      subIdx = i;
    }
  });
  if (subIdx !== -1) {
    roles[subIdx] = 'Sub-DPS';
    assigned.add(subIdx);
  }

  // 4. Remaining slot(s) stay Utility (or Sub-DPS if none assigned)
  members.forEach((_c, i) => {
    if (assigned.has(i)) return;
    roles[i] = !roles.includes('Sub-DPS') ? 'Sub-DPS' : 'Utility';
  });

  return roles as [SlotRole, SlotRole, SlotRole, SlotRole];
}

export function analyzeTeam(members: Character[]): TeamAnalysis {
  const valid = members.filter(Boolean);
  const elementCounts = new Map<ElementType, number>();
  for (const c of valid) {
    elementCounts.set(c.element, (elementCounts.get(c.element) ?? 0) + 1);
  }

  const hasEl = (el: ElementType) => (elementCounts.get(el) ?? 0) > 0;
  const hasTag = (tag: Character['mechanicTags'][number]) =>
    valid.some((c) => c.mechanicTags.includes(tag));

  // Moonsign calculation
  const moonsignTotal = valid.reduce((sum, c) => sum + c.moonsignLevel, 0);
  const moonsignTier: TeamAnalysis['moonsignTier'] =
    moonsignTotal >= 2
      ? 'Ascendant Gleam'
      : moonsignTotal === 1
        ? 'Nascent Gleam'
        : 'None';

  // Stellar Glimmer calculation
  const hasStellarConductEnabler = hasTag('stellar-conduct');
  const hasStellarGlimmer = hasTag('stellar-glimmer');
  let stellarState: TeamAnalysis['stellarState'] = 'None';
  if (hasStellarConductEnabler && hasEl('Cryo') && hasEl('Electro')) {
    stellarState = 'Stellar-Conduct Active';
  } else if (hasStellarGlimmer && hasEl('Cryo') && hasEl('Anemo')) {
    stellarState = 'Stellar Swirl Active';
  } else if (hasStellarGlimmer) {
    stellarState = 'Stellar Ready (Needs Electro/Anemo)';
  }

  // Chevreuse check
  const hasChevreuse = valid.some((c) =>
    c.mechanicTags.includes('overloaded-specialist')
  );
  const chevreuseValid = hasChevreuse
    ? valid.every((c) => c.element === 'Pyro' || c.element === 'Electro') &&
      hasEl('Pyro') &&
      hasEl('Electro')
    : null;

  // Resonances
  const resonances: ResonanceInfo[] = [];
  for (const [el, count] of elementCounts.entries()) {
    if (count >= 2) {
      resonances.push({
        name: RESONANCE_MAP[el].name,
        element: el,
        effect: RESONANCE_MAP[el].effect,
      });
    }
  }
  if (valid.length === 4 && elementCounts.size === 4) {
    resonances.push({
      name: 'Protective Canopy',
      element: 'Protective',
      effect: '+15% All Elemental & Physical RES',
    });
  }

  // Reactions
  const reactions: ReactionSummary[] = [];

  if (stellarState === 'Stellar-Conduct Active') {
    reactions.push({
      name: 'Stellar-Conduct',
      tier: 'stellar',
      elements: ['Cryo', 'Electro'],
      description:
        'Stellar Glimmer Cryo + Electro reaction unlocking Radiance: Stellar-Conduct bursts.',
    });
  }
  if (hasStellarGlimmer && hasEl('Cryo') && hasEl('Anemo')) {
    reactions.push({
      name: 'Stellar Swirl',
      tier: 'stellar',
      elements: ['Cryo', 'Anemo'],
      description:
        'Cryo + Anemo Stellar Glimmer state granting active-character ATK & Stellar ticks.',
    });
  }

  const lunarChargedActive =
    hasTag('lunar-charged') && hasEl('Electro') && hasEl('Hydro');
  const lunarBloomActive =
    hasTag('lunar-bloom') && hasEl('Dendro') && hasEl('Hydro');
  const lunarCrystallizeActive =
    hasTag('lunar-crystallize') && hasEl('Geo') && hasEl('Hydro');

  if (lunarChargedActive) {
    reactions.push({
      name: 'Lunar-Charged',
      tier: 'lunar',
      elements: ['Electro', 'Hydro'],
      description:
        moonsignTier === 'Ascendant Gleam'
          ? 'Crittable Lunar-Charged thunderclouds enhanced by Ascendant Gleam!'
          : 'Crittable Lunar-Charged conversion (add a 2nd Moonsign unit for Ascendant Gleam).',
    });
  }
  if (lunarBloomActive) {
    reactions.push({
      name: 'Lunar-Bloom',
      tier: 'lunar',
      elements: ['Dendro', 'Hydro'],
      description:
        moonsignTier === 'Ascendant Gleam'
          ? 'EM-scaling crittable Lunar-Bloom amplified by Ascendant Gleam!'
          : 'Converts Bloom into Lunar-Bloom (add a 2nd Moonsign unit for Ascendant Gleam).',
    });
  }
  if (lunarCrystallizeActive) {
    reactions.push({
      name: 'Lunar-Crystallize',
      tier: 'lunar',
      elements: ['Geo', 'Hydro'],
      description:
        moonsignTier === 'Ascendant Gleam'
          ? 'Generates Moondrifts with Ascendant Gleam damage amplification!'
          : 'Converts Hydro-Crystallize into Moondrifts (add a 2nd Moonsign unit for Ascendant Gleam).',
    });
  }

  // Standard Reactions
  if (hasEl('Dendro') && hasEl('Hydro') && hasEl('Electro')) {
    reactions.push({
      name: 'Hyperbloom',
      tier: 'standard',
      elements: ['Dendro', 'Hydro', 'Electro'],
      description: 'Electro detonates Dendro Cores into homing missiles.',
    });
  }
  if (hasEl('Dendro') && hasEl('Hydro') && hasEl('Pyro')) {
    reactions.push({
      name: 'Burgeon',
      tier: 'standard',
      elements: ['Dendro', 'Hydro', 'Pyro'],
      description: 'Pyro detonates Dendro Cores for AoE Dendro bursts.',
    });
  }
  if (hasEl('Cryo') && hasEl('Pyro')) {
    reactions.push({
      name: 'Melt',
      tier: 'standard',
      elements: ['Cryo', 'Pyro'],
      description: '1.5× / 2× amplifying reaction and rapid Cryo shield melt.',
    });
  }
  if (hasEl('Hydro') && hasEl('Pyro')) {
    reactions.push({
      name: 'Vaporize',
      tier: 'standard',
      elements: ['Hydro', 'Pyro'],
      description: '1.5× / 2× amplifying Hydro + Pyro reaction.',
    });
  }
  if (hasEl('Pyro') && hasEl('Electro')) {
    reactions.push({
      name: 'Overloaded',
      tier: 'standard',
      elements: ['Pyro', 'Electro'],
      description: chevreuseValid
        ? 'Triggers Chevreuse’s -40% Pyro/Electro RES shred & heavy poise break.'
        : 'Explosive AoE Pyro damage with strong Geo/blunt shield break.',
    });
  }
  if (!lunarChargedActive && hasEl('Electro') && hasEl('Hydro')) {
    reactions.push({
      name: 'Electro-Charged',
      tier: 'standard',
      elements: ['Electro', 'Hydro'],
      description: 'Sustained Electro DoT ticks across wet targets.',
    });
  }
  if (hasEl('Dendro') && hasEl('Electro')) {
    reactions.push({
      name: 'Quicken / Aggravate',
      tier: 'standard',
      elements: ['Dendro', 'Electro'],
      description: 'Boosts Electro & Dendro hit damage via Quicken aura.',
    });
  }
  if (
    hasEl('Anemo') &&
    (hasEl('Pyro') || hasEl('Hydro') || hasEl('Electro') || hasEl('Cryo'))
  ) {
    reactions.push({
      name: 'Swirl',
      tier: 'standard',
      elements: ['Anemo'],
      description: 'Spreads elements across crowds and enables VV RES shred.',
    });
  }
  if (hasEl('Cryo') && hasEl('Hydro')) {
    reactions.push({
      name: 'Freeze',
      tier: 'standard',
      elements: ['Cryo', 'Hydro'],
      description: 'Immobilizes freezable targets for safe DPS windows.',
    });
  }
  if (
    !lunarCrystallizeActive &&
    hasEl('Geo') &&
    (hasEl('Pyro') || hasEl('Hydro') || hasEl('Electro') || hasEl('Cryo'))
  ) {
    reactions.push({
      name: 'Crystallize',
      tier: 'standard',
      elements: ['Geo'],
      description: 'Creates elemental shields for Geo Resonance uptime.',
    });
  }

  // Pairwise Synergy Edges (for visual SVG link graph between slots)
  const edges: SynergyEdge[] = [];
  for (let i = 0; i < valid.length; i++) {
    for (let j = i + 1; j < valid.length; j++) {
      const a = valid[i];
      const b = valid[j];
      const els = new Set<ElementType>([a.element, b.element]);

      // Stellar-Conduct pair
      if (
        els.has('Cryo') &&
        els.has('Electro') &&
        (a.mechanicTags.includes('stellar-conduct') ||
          b.mechanicTags.includes('stellar-conduct'))
      ) {
        edges.push({
          fromIndex: i,
          toIndex: j,
          label: 'Stellar-Conduct',
          kind: 'stellar',
          description: `${a.name} + ${b.name} trigger Radiance: Stellar-Conduct.`,
        });
        continue;
      }

      // Stellar Swirl pair
      if (
        els.has('Cryo') &&
        els.has('Anemo') &&
        (a.mechanicTags.includes('stellar-glimmer') ||
          b.mechanicTags.includes('stellar-glimmer'))
      ) {
        edges.push({
          fromIndex: i,
          toIndex: j,
          label: 'Stellar Swirl',
          kind: 'stellar',
          description: `${a.name} + ${b.name} sustain Radiance: Stellar Swirl.`,
        });
        continue;
      }

      // Lunar pairs
      if (
        els.has('Electro') &&
        els.has('Hydro') &&
        (a.mechanicTags.includes('lunar-charged') ||
          b.mechanicTags.includes('lunar-charged'))
      ) {
        edges.push({
          fromIndex: i,
          toIndex: j,
          label: 'Lunar-Charged',
          kind: 'lunar',
          description: `${a.name} + ${b.name} drive crittable Lunar-Charged strikes.`,
        });
        continue;
      }
      if (
        els.has('Dendro') &&
        els.has('Hydro') &&
        (a.mechanicTags.includes('lunar-bloom') ||
          b.mechanicTags.includes('lunar-bloom'))
      ) {
        edges.push({
          fromIndex: i,
          toIndex: j,
          label: 'Lunar-Bloom',
          kind: 'lunar',
          description: `${a.name} + ${b.name} convert Bloom into EM-scaling Lunar-Bloom.`,
        });
        continue;
      }
      if (
        els.has('Geo') &&
        els.has('Hydro') &&
        (a.mechanicTags.includes('lunar-crystallize') ||
          b.mechanicTags.includes('lunar-crystallize'))
      ) {
        edges.push({
          fromIndex: i,
          toIndex: j,
          label: 'Lunar-Crystallize',
          kind: 'lunar',
          description: `${a.name} + ${b.name} generate Moondrift bursts.`,
        });
        continue;
      }

      // Moonsign pair (Ascendant Gleam)
      if (a.moonsignLevel > 0 && b.moonsignLevel > 0) {
        edges.push({
          fromIndex: i,
          toIndex: j,
          label: 'Ascendant Gleam',
          kind: 'lunar',
          description: `${a.name} + ${b.name} combine for Moonsign: Ascendant Gleam.`,
        });
        continue;
      }

      // Same-element resonance / battery
      if (a.element === b.element) {
        edges.push({
          fromIndex: i,
          toIndex: j,
          label: `${a.element} Resonance`,
          kind: 'resonance',
          description: `${a.name} + ${b.name} unlock ${RESONANCE_MAP[a.element].name} & share Energy particles.`,
        });
        continue;
      }

      // Key reactions
      if (els.has('Cryo') && els.has('Pyro')) {
        edges.push({
          fromIndex: i,
          toIndex: j,
          label: 'Melt',
          kind: 'reaction',
          description: `${a.name} + ${b.name} trigger amplifying Melt reactions.`,
        });
      } else if (els.has('Pyro') && els.has('Electro')) {
        edges.push({
          fromIndex: i,
          toIndex: j,
          label: chevreuseValid ? 'Chevreuse Overload' : 'Overloaded',
          kind: chevreuseValid ? 'support' : 'reaction',
          description: chevreuseValid
            ? `${a.name} + ${b.name} activate Chevreuse’s 40% Pyro/Electro RES shred.`
            : `${a.name} + ${b.name} trigger Overloaded blasts.`,
        });
      } else if (els.has('Dendro') && els.has('Electro')) {
        edges.push({
          fromIndex: i,
          toIndex: j,
          label: hasEl('Hydro') ? 'Hyperbloom' : 'Quicken',
          kind: 'reaction',
          description: hasEl('Hydro')
            ? `${a.name} + ${b.name} detonate Dendro Cores into Hyperbloom.`
            : `${a.name} + ${b.name} trigger Quicken / Aggravate.`,
        });
      } else if (els.has('Hydro') && els.has('Pyro')) {
        edges.push({
          fromIndex: i,
          toIndex: j,
          label: 'Vaporize',
          kind: 'reaction',
          description: `${a.name} + ${b.name} trigger amplifying Vaporize.`,
        });
      } else if (
        els.has('Anemo') &&
        (els.has('Electro') ||
          els.has('Hydro') ||
          els.has('Pyro') ||
          els.has('Cryo'))
      ) {
        edges.push({
          fromIndex: i,
          toIndex: j,
          label: 'Swirl',
          kind: 'support',
          description: `${a.name} + ${b.name} chain Swirl AoE & elemental buffs.`,
        });
      }
    }
  }

  // Survivability
  const healerCount = valid.filter((c) => c.isHealer).length;
  const shielderCount = valid.filter((c) => c.isShielder).length;
  const hasHealer = healerCount > 0;
  const hasShielder = shielderCount > 0;
  const survivability: TeamAnalysis['survivability'] =
    healerCount + shielderCount >= 2 || (hasHealer && hasShielder)
      ? 'Strong'
      : hasHealer || hasShielder
        ? 'Covered'
        : 'Glass Cannon';

  // Warnings & Strengths
  const warnings: string[] = [];
  const strengths: string[] = [];

  if (survivability === 'Glass Cannon') {
    warnings.push(
      'No Healer or Shielder slotted — running Glass Cannon mode.'
    );
  } else {
    const sustainNames = valid
      .filter((c) => c.isHealer || c.isShielder)
      .map((c) => c.name)
      .join(' & ');
    strengths.push(`Sustain covered by ${sustainNames}.`);
  }

  const hasLunarEnabler =
    hasTag('lunar-charged') ||
    hasTag('lunar-bloom') ||
    hasTag('lunar-crystallize');

  if (hasLunarEnabler) {
    if (moonsignTier === 'Ascendant Gleam') {
      strengths.push(
        `Moonsign: Ascendant Gleam active (${moonsignTotal} Moonsign units) — maximizes Lunar reaction damage.`
      );
    } else {
      warnings.push(
        'Lunar Enabler present, but Moonsign is only Nascent Gleam (1). Add Aino, Jahoda, or a 2nd Lunar unit for Ascendant Gleam.'
      );
    }
    if (!hasEl('Hydro')) {
      warnings.push(
        'Lunar-Charged, Lunar-Bloom, and Lunar-Crystallize all rely on Hydro application (unless fighting a Hydro-aura boss like Hydro Tulpa).'
      );
    }
  }

  if (stellarState === 'Stellar-Conduct Active') {
    strengths.push(
      'Radiance: Stellar-Conduct active (Cryo + Electro Stellar Glimmer core).'
    );
  } else if (stellarState === 'Stellar Swirl Active') {
    strengths.push(
      'Radiance: Stellar Swirl active (Cryo + Anemo Stellar Glimmer state).'
    );
  } else if (stellarState === 'Stellar Ready (Needs Electro/Anemo)') {
    warnings.push(
      'Stellar Glimmer character needs Electro (Stellar-Conduct) or Anemo (Stellar Swirl) to trigger Radiance.'
    );
  }

  if (hasChevreuse) {
    if (chevreuseValid) {
      strengths.push(
        'Chevreuse Overloaded lock satisfied (Pyro + Electro only) — 40% Pyro/Electro RES shred active!'
      );
    } else {
      warnings.push(
        'Chevreuse’s 40% RES shred is disabled because a non-Pyro/Electro teammate is in the party.'
      );
    }
  }

  if (valid.some((c) => c.mechanicTags.includes('hexerei'))) {
    strengths.push(
      'Prune provides Team DMG Bonus & Anemo ATK buff (Hexerei passive scales further with a 2nd Hexerei unit).'
    );
  }

  // Worth Leveling callouts for unbuilt characters
  const levelingCallouts: LevelingCallout[] = valid
    .filter((c) => c.level < BATTLE_READY_LEVEL)
    .map((c) => {
      let reason = `Currently Lv ${c.level} — level to 70/80+ for comfortable Spiral Abyss & endgame survivability.`;
      if (c.id === 'alyosha') {
        reason =
          'Lv 1 Stellar-Conduct Specialist & Healer — top investment priority if you play Cryo Traveller Stellar-Conduct teams!';
      } else if (c.id === 'chevreuse') {
        reason =
          'Lv 1 Overloaded Specialist — unlocks -40% Pyro/Electro RES shred & healing for Flins / Fischl / Xiangling cores.';
      } else if (c.id === 'baizhu') {
        reason =
          'Lv 1 5★ Dendro Healer & Reaction Buffer — huge comfort upgrade for Lauma Lunar-Bloom / Hyperbloom teams.';
      } else if (c.id === 'kachina') {
        reason =
          'Lv 40 Nightsoul Geo Sub-DPS — pairs cleanly with Zibai for Geo Resonance and Natlan Void Ward checks.';
      } else if (c.id === 'lynette') {
        reason =
          'Lv 25 Arkhe: Ousia Anemo Support — helpful for Fontaine Clockwork Meka & Pneuma boss stuns.';
      } else if (c.id === 'mona') {
        reason =
          'Lv 1 5★ Hydro Omen Buffer — alternative Hydro option when Aino is locked on the other Spiral Abyss side.';
      } else if (c.id === 'prune') {
        reason =
          'Lv 1 Hexerei Support — brings Team DMG% and Anemo ATK buffing.';
      } else if (c.id === 'diona') {
        reason =
          'Lv 1 Cryo Shielder & Battery — grants Cryo Resonance (+15% CRIT Rate) and energy for Cryo Traveller.';
      }
      return {
        characterId: c.id,
        characterName: c.name,
        currentLevel: c.level,
        reason,
      };
    });

  // Overall Synergy Score (0–98) with realistic spread
  let score = 46;
  if (survivability === 'Strong') score += 11;
  else if (survivability === 'Covered') score += 10;
  else score -= 10;

  if (lunarChargedActive || lunarBloomActive || lunarCrystallizeActive) {
    score += 12;
    if (moonsignTier === 'Ascendant Gleam') score += 11;
  }
  if (stellarState === 'Stellar-Conduct Active') score += 16;
  else if (stellarState === 'Stellar Swirl Active') score += 11;

  if (chevreuseValid === true) score += 15;
  if (chevreuseValid === false) score -= 22;

  score += Math.min(reactions.length * 3, 12);
  score += Math.min(resonances.length * 4, 8);

  const selfishOnFieldCount = valid.filter((c) => {
    const r = c.role.toLowerCase();
    return (
      (r.includes('on-field dps') || r.includes('on-field plunge dps')) &&
      !c.isHealer
    );
  }).length;
  if (selfishOnFieldCount === 1) score += 6;
  else if (selfishOnFieldCount >= 2) score -= 14;

  const offFieldSupportCount = valid.filter(
    (c) => c.isOffField || c.isSupport
  ).length;
  if (offFieldSupportCount >= 3) score += 4;

  // Gentle level readiness bonus
  const avgLevel =
    valid.length > 0
      ? valid.reduce((s, c) => s + c.level, 0) / valid.length
      : 0;
  score += Math.round((avgLevel / 90) * 6);

  const clampedScore = Math.max(20, Math.min(98, Math.round(score)));
  const minLevel =
    valid.length > 0 ? Math.min(...valid.map((c) => c.level)) : 0;

  return {
    score: clampedScore,
    reactions,
    resonances,
    moonsignTotal,
    moonsignTier,
    stellarState,
    hasHealer,
    hasShielder,
    survivability,
    chevreuseValid,
    edges,
    warnings,
    strengths,
    levelingCallouts,
    allBattleReady: minLevel >= BATTLE_READY_LEVEL,
    minLevel,
  };
}
