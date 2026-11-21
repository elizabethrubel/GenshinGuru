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

  // 1. Pick Main DPS (prefer dedicated On-Field DPS / Stellar-Conduct or Lunar carries over hybrid healers)
  let dpsIdx = -1;
  let bestDpsScore = -1;
  members.forEach((c, i) => {
    let s = 0;
    const roleLower = c.role.toLowerCase();
    if (roleLower.includes('on-field dps') && !c.isHealer) s += 62;
    else if (c.isOnField && !c.isHealer) s += 48;
    else if (roleLower.includes('on-field dps')) s += 26;
    else if (c.isOnField) s += 22;
    if (c.rarity === 5) s += 10;
    if (
      c.id === 'mitya' ||
      c.id === 'flins' ||
      c.id === 'zibai' ||
      c.id === 'traveller'
    ) {
      s += 14;
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

  // 4. Remaining slot(s)
  members.forEach((_c, i) => {
    if (assigned.has(i)) return;
    roles[i] = !roles.includes('Sub-DPS') ? 'Sub-DPS' : 'Utility';
  });

  return roles as [SlotRole, SlotRole, SlotRole, SlotRole];
}

export function computeRawTeamPower(
  valid: Character[],
  meta: {
    lunarChargedActive: boolean;
    lunarBloomActive: boolean;
    lunarCrystallizeActive: boolean;
    moonsignTier: TeamAnalysis['moonsignTier'];
    stellarState: TeamAnalysis['stellarState'];
    chevreuseValid: boolean | null;
    survivability: TeamAnalysis['survivability'];
    healerCount: number;
    reactions: ReactionSummary[];
    resonances: ResonanceInfo[];
  }
): number {
  if (valid.length === 0) return 0;

  const ids = new Set(valid.map((c) => c.id));
  const hasEl = (el: ElementType) => valid.some((c) => c.element === el);
  const elCount = (el: ElementType) =>
    valid.filter((c) => c.element === el).length;

  let power = 100;

  // 1. Survivability & sustain efficiency
  if (meta.survivability === 'Glass Cannon') {
    power -= 16;
  } else {
    power += 12;
    if (meta.healerCount >= 2) {
      power -= 9;
    }
  }

  // 2. Single Strongest Core Archetype Bonus (NEVER double/triple-dip unrelated mechanics!)
  const coreScores: number[] = [0];

  if (meta.lunarChargedActive) {
    let s = 26;
    if (meta.moonsignTier === 'Ascendant Gleam') s += 20;
    if (elCount('Electro') >= 2) s += 10; // Fischl Oz battery + Electro Resonance
    if (hasEl('Anemo')) s += 12; // VV shred (Jahoda / Sucrose)
    coreScores.push(s);
  }
  if (meta.lunarBloomActive) {
    let s = 26;
    if (meta.moonsignTier === 'Ascendant Gleam') s += 20;
    if (meta.reactions.some((r) => r.name === 'Hyperbloom')) s += 14;
    if (ids.has('baizhu')) s += 12;
    coreScores.push(s);
  }
  if (meta.lunarCrystallizeActive) {
    let s = 26;
    if (meta.moonsignTier === 'Ascendant Gleam') s += 20;
    if (elCount('Geo') >= 2) s += 18; // Geo Resonance is huge for Zibai
    coreScores.push(s);
  }
  if (meta.stellarState === 'Stellar-Conduct Active') {
    let s = 28;
    if (ids.has('mitya') && ids.has('traveller')) s += 18; // Mitya + Cryo Traveller dual Stellar Jubilee
    if (ids.has('alyosha')) s += 16; // Dedicated Stellar-Conduct healer + 20% DMG + Furnace
    if (hasEl('Anemo')) s += 10; // VV shred
    if (elCount('Cryo') >= 2) s += 8; // Cryo Resonance +15% CRIT Rate
    if (elCount('Electro') >= 2) s += 8; // Electro Resonance battery
    coreScores.push(s);
  }
  if (meta.stellarState === 'Stellar Swirl Active') {
    let s = 22;
    if (ids.has('yumemizuki-mizuki') || ids.has('sucrose')) s += 14;
    coreScores.push(s);
  }
  if (meta.chevreuseValid === true) {
    let s = 44;
    if (ids.has('flins') || ids.has('fischl')) s += 10;
    if (ids.has('bennett') || ids.has('xiangling')) s += 10;
    coreScores.push(s);
  }
  if (
    meta.reactions.some((r) => r.name === 'Melt') &&
    ids.has('bennett') &&
    ids.has('xiangling')
  ) {
    let s = 38; // Classic Reverse Melt core
    if (ids.has('sucrose')) s += 12; // VV + EM share
    coreScores.push(s);
  }

  power += Math.max(...coreScores);

  if (meta.chevreuseValid === false) {
    power -= 42;
  }

  // 3. Anti-Soup Penalty: penalize cramming unrelated archetype carries together!
  const hasFlins = ids.has('flins');
  const hasZibai = ids.has('zibai');
  const hasLauma = ids.has('lauma');
  const hasTraveller = ids.has('traveller');
  const hasMitya = ids.has('mitya');

  if (hasFlins && hasZibai) power -= 34;
  if (hasFlins && hasTraveller) power -= 30; // Flins wants Hydro Lunar-Charged, not Cryo Traveller
  if (hasFlins && hasMitya) power -= 26;
  if (hasZibai && hasTraveller) power -= 30;
  if (hasZibai && hasLauma) power -= 32; // Dendro & Geo do not react
  if (hasZibai && hasMitya) power -= 32;
  if (hasLauma && hasTraveller) power -= 28; // Cryo + Dendro don't react
  if (hasLauma && hasMitya) power -= 28;
  // Flins + Lauma works ONLY in Multi-Lunar; otherwise Fischl + Aino + Jahoda is stronger for Flins
  if (hasFlins && hasLauma) power -= 10;

  // 4. Individual character kit value & anti-clash rules
  const hasAnyLunar =
    meta.lunarChargedActive ||
    meta.lunarBloomActive ||
    meta.lunarCrystallizeActive;
  const isStellarTeam = meta.stellarState === 'Stellar-Conduct Active';

  for (const c of valid) {
    switch (c.id) {
      case 'flins':
        if (meta.lunarChargedActive) power += 14;
        else if (meta.chevreuseValid) power += 14;
        else power -= 18;
        break;
      case 'zibai':
        if (meta.lunarCrystallizeActive) power += 14;
        else power -= 20;
        break;
      case 'lauma':
        if (meta.lunarBloomActive) power += 14;
        else power -= 16;
        break;
      case 'mitya':
        if (isStellarTeam) power += 18;
        else power -= 22;
        break;
      case 'traveller':
        if (
          isStellarTeam ||
          meta.stellarState === 'Stellar Swirl Active' ||
          meta.reactions.some((r) => r.name === 'Melt')
        ) {
          power += 14;
        } else {
          power -= 12;
        }
        break;
      case 'alyosha':
        if (isStellarTeam) power += 14;
        else power -= 18;
        break;
      case 'aino':
        if (hasAnyLunar) power += 16;
        else if (isStellarTeam) power -= 8; // Hydro disrupts pure Stellar-Conduct
        break;
      case 'jahoda':
        if (hasAnyLunar) power += 15;
        else if (hasEl('Cryo') || hasEl('Electro') || hasEl('Pyro')) power += 7;
        break;
      case 'fischl':
        if (
          meta.lunarChargedActive ||
          meta.lunarBloomActive ||
          isStellarTeam ||
          meta.chevreuseValid ||
          meta.lunarCrystallizeActive
        ) {
          power += 15;
        } else {
          power += 8;
        }
        break;
      case 'bennett':
        if (hasZibai && !ids.has('xiangling')) power += 3;
        else if (hasMitya && !ids.has('xiangling')) power += 2;
        else if (hasLauma) power -= 4; // Pyro Burning disrupts Bloom/Hyperbloom
        else power += 15;
        break;
      case 'xiangling':
        if (ids.has('bennett')) power += 14;
        else if (meta.chevreuseValid) power += 10;
        else power -= 8;
        break;
      case 'sucrose':
        if (
          meta.lunarChargedActive ||
          isStellarTeam ||
          meta.reactions.some((r) => r.name === 'Melt' || r.name === 'Vaporize')
        ) {
          power += 14;
        } else if (hasZibai) {
          power -= 10;
        } else {
          power += 6;
        }
        break;
      case 'noelle':
        if (hasZibai || elCount('Geo') >= 2) power += 14;
        else power -= 18;
        break;
      case 'kachina':
        if (hasZibai || elCount('Geo') >= 2) power += 14;
        else power -= 8;
        break;
      case 'baizhu':
        if (meta.lunarBloomActive || hasEl('Dendro')) power += 16;
        else power += 2;
        break;
      case 'rosaria':
        if (isStellarTeam || meta.reactions.some((r) => r.name === 'Melt')) {
          power += 13;
        } else {
          power += 3;
        }
        break;
      case 'charlotte':
        if (isStellarTeam || meta.reactions.some((r) => r.name === 'Freeze')) {
          power += 10;
        } else {
          power += 2;
        }
        break;
      case 'diona':
        if (isStellarTeam || elCount('Cryo') >= 2) power += 10;
        else power += 2;
        break;
      case 'yumemizuki-mizuki':
        if (meta.stellarState === 'Stellar Swirl Active') power += 14;
        else if (hasFlins || hasZibai || hasMitya) power -= 12;
        else power += 8;
        break;
      case 'dehya':
        power -= 6;
        break;
      case 'barbara':
        if (meta.lunarBloomActive || meta.lunarChargedActive) power += 7;
        else if (isStellarTeam || meta.reactions.some((r) => r.name === 'Melt')) {
          power -= 10;
        }
        break;
      case 'amber':
      case 'xinyan':
        power -= 14;
        break;
    }
  }

  // 5. Field-time clash check
  const selfishCarryIds = new Set([
    'flins',
    'zibai',
    'noelle',
    'gaming',
    'kaveh',
    'yumemizuki-mizuki',
  ]);
  const selfishCount = valid.filter((c) => selfishCarryIds.has(c.id)).length;
  if (selfishCount >= 2) {
    const isOnlyZibaiNoelle =
      selfishCount === 2 && hasZibai && ids.has('noelle');
    if (!isOnlyZibaiNoelle) {
      power -= 24;
    }
  }

  // 6. Resonance & level readiness
  power += Math.min(meta.resonances.length * 4, 8);
  const avgLevel = valid.reduce((s, c) => s + c.level, 0) / valid.length;
  power += (avgLevel / 90) * 14;

  return power;
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

  // Pairwise Synergy Edges
  const edges: SynergyEdge[] = [];
  for (let i = 0; i < valid.length; i++) {
    for (let j = i + 1; j < valid.length; j++) {
      const a = valid[i];
      const b = valid[j];
      const els = new Set<ElementType>([a.element, b.element]);

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
          description: `${a.name} + ${b.name} chain Swirl AoE & Viridescent RES shred.`,
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
    warnings.push('No Healer or Shielder slotted — running Glass Cannon mode.');
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
        'Lunar-Charged, Lunar-Bloom, and Lunar-Crystallize rely on Hydro application (unless fighting a Hydro-aura boss like Hydro Tulpa).'
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

  const levelingCallouts: LevelingCallout[] = valid
    .filter((c) => c.level < BATTLE_READY_LEVEL)
    .map((c) => ({
      characterId: c.id,
      characterName: c.name,
      currentLevel: c.level,
      reason: `Currently Lv ${c.level} — level to 70/80+ for Spiral Abyss & endgame comfort.`,
    }));

  // Calibrated meta power -> realistic 35..98 displayed score without artificial 98 ties
  const rawPower = computeRawTeamPower(valid, {
    lunarChargedActive,
    lunarBloomActive,
    lunarCrystallizeActive,
    moonsignTier,
    stellarState,
    chevreuseValid,
    survivability,
    healerCount,
    reactions,
    resonances,
  });

  // Map rawPower ~ [85..245] smoothly to [40..98]
  const calibrated = Math.round(40 + ((rawPower - 85) / 160) * 58);
  const clampedScore = Math.max(25, Math.min(98, calibrated));
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
