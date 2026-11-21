import type { Character } from '../types/genshin';
import { BATTLE_READY_LEVEL } from './teamAnalyzer';

export interface BuildPriorityItem {
  character: Character;
  priority: 'Top Priority' | 'High Value' | 'Situational';
  headline: string;
  reason: string;
  pairsWith: string[];
  score: number;
}

export interface ContextualBuildSuggestion {
  character: Character;
  reason: string;
  suggestedSlotIndex: number;
  inTeamAlready: boolean;
}

export function getRosterBuildPriorities(
  roster: Character[],
  limit = 6
): BuildPriorityItem[] {
  const unbuilt = roster.filter((c) => c.level < BATTLE_READY_LEVEL);
  const ready = roster.filter((c) => c.level >= BATTLE_READY_LEVEL);
  const hasReady = (id: string) => ready.some((c) => c.id === id);

  const items: BuildPriorityItem[] = [];

  for (const c of unbuilt) {
    let priority: BuildPriorityItem['priority'] = 'Situational';
    let headline = c.specialMechanic;
    let reason = `Adds ${c.element} ${c.role.toLowerCase()} flexibility once leveled to 70+.`;
    let pairsWith: string[] = [];
    let score = 20 + (c.rarity === 5 ? 15 : 0) + (c.isHealer ? 10 : 0);

    if (c.id === 'alyosha') {
      priority = 'Top Priority';
      headline = 'Stellar-Conduct Healer & Enabler';
      reason =
        'Purpose-built Electro healer for Cryo Traveller — unlocks pure Stellar-Conduct teams without borrowing Bennett or Noelle.';
      pairsWith = ['Traveller', 'Fischl', 'Kaeya'].filter((n) =>
        ready.some((r) => r.name === n)
      );
      score = 100;
    } else if (c.id === 'chevreuse') {
      priority = 'Top Priority';
      headline = 'Overloaded RES Shred (-40%)';
      reason =
        'Unlocks high-damage Pyro + Electro Overloaded teams with healing and 40% RES shred for your Lv 90 Flins, Fischl, Bennett, and Xiangling.';
      pairsWith = ['Flins', 'Fischl', 'Bennett', 'Xiangling'].filter((n) =>
        ready.some((r) => r.name === n)
      );
      score = 96;
    } else if (c.id === 'baizhu') {
      priority = 'Top Priority';
      headline = '5★ Dendro Healer & Reaction Buffer';
      reason =
        'Provides team-wide healing, interruption shields, and Dendro reaction buffs for Lv 90 Lauma — freeing Barbara or Jahoda for your second Abyss half.';
      pairsWith = ['Lauma', 'Aino', 'Fischl'].filter((n) =>
        ready.some((r) => r.name === n)
      );
      score = 94;
    } else if (c.id === 'mona') {
      priority = 'High Value';
      headline = '5★ Hydro Omen Flex';
      reason =
        'Gives your Lunar teams (Flins, Lauma, Zibai) a strong second Hydro option when Lv 80 Aino is locked on the other Spiral Abyss side.';
      pairsWith = ['Flins', 'Lauma', 'Zibai'].filter((n) =>
        ready.some((r) => r.name === n)
      );
      score = 84;
    } else if (c.id === 'kachina') {
      priority = 'High Value';
      headline = 'Nightsoul & Geo Resonance';
      reason =
        'Activates Geo Resonance (+15% DMG while shielded) alongside Lv 90 Zibai and rapidly breaks Natlan Nightsoul / Void Ward mechanics.';
      pairsWith = ['Zibai', 'Aino', 'Noelle'].filter((n) =>
        ready.some((r) => r.name === n)
      );
      score = 80;
    } else if (c.id === 'diona') {
      priority = 'High Value';
      headline = 'Cryo Shield, Healer & Battery';
      reason =
        'Generates Cryo particles for Cryo Traveller while activating Cryo Resonance (+15% CRIT Rate) and protective shields.';
      pairsWith = ['Traveller', 'Fischl', 'Kaeya'].filter((n) =>
        ready.some((r) => r.name === n)
      );
      score = 74;
    } else if (c.id === 'lan-yan') {
      priority = 'High Value';
      headline = 'Anemo Elemental Absorption Shield';
      reason =
        'Combines Viridescent Venerer shred with a sturdy elemental shield for comfortable Flins or Cryo Traveller rotations.';
      pairsWith = ['Flins', 'Traveller', 'Fischl'].filter((n) =>
        ready.some((r) => r.name === n)
      );
      score = 70;
    } else if (c.id === 'lynette') {
      priority = 'Situational';
      headline = 'Fontaine Arkhe: Ousia Support';
      reason =
        'Provides on-demand Ousia alignment to stun Fontaine Clockwork Meka and Coppelia/Coppelius alongside Lauma or Flins.';
      pairsWith = ['Lauma', 'Aino', 'Flins'].filter((n) =>
        ready.some((r) => r.name === n)
      );
      score = 64;
    } else if (c.id === 'prune') {
      priority = 'Situational';
      headline = 'Hexerei Team DMG Buffer';
      reason =
        'Brings Team DMG Bonus and Anemo ATK buffing, with additional upside when paired with future Hexerei teammates.';
      pairsWith = ['Yumemizuki Mizuki', 'Sucrose'].filter((n) =>
        ready.some((r) => r.name === n)
      );
      score = 60;
    } else if (c.id === 'yaoyao' && hasReady('lauma')) {
      priority = 'Situational';
      headline = 'Off-Field Dendro Healer';
      reason =
        'Alternative Dendro Resonance + healing slot for Lauma teams if you prefer a 4★ build over Baizhu.';
      pairsWith = ['Lauma', 'Aino'];
      score = 58;
    } else {
      continue;
    }

    items.push({
      character: c,
      priority,
      headline,
      reason,
      pairsWith,
      score,
    });
  }

  return items.sort((a, b) => b.score - a.score).slice(0, limit);
}

function pickBestSlotToReplace(
  members: Character[],
  candidate: Character
): number {
  // Prefer replacing an existing healer/shielder if candidate is a healer/shielder
  if (candidate.isHealer || candidate.isShielder) {
    const sustainIdx = members.findIndex((m) => m.isHealer || m.isShielder);
    if (sustainIdx !== -1) return sustainIdx;
  }
  // Prefer replacing a same-element support/utility unit
  const sameElSupport = members.findIndex(
    (m, i) => i > 0 && m.element === candidate.element
  );
  if (sameElSupport !== -1) return sameElSupport;

  // Otherwise replace slot 3 (index 2, Utility) or slot 4 (index 3)
  return members.length >= 4 ? 2 : members.length - 1;
}

export function getContextualBuildCallouts(
  members: Character[],
  roster: Character[],
  context?: {
    archetypeId?: string | null;
    regionName?: string | null;
  }
): ContextualBuildSuggestion[] {
  const memberIds = new Set(members.map((m) => m.id));
  const unbuiltMap = new Map(
    roster
      .filter((c) => c.level < BATTLE_READY_LEVEL)
      .map((c) => [c.id, c])
  );

  const suggestions: ContextualBuildSuggestion[] = [];
  const added = new Set<string>();

  const addIfUnbuilt = (id: string, reason: string) => {
    if (added.has(id)) return;
    const c = unbuiltMap.get(id);
    if (!c) return;
    added.add(id);
    suggestions.push({
      character: c,
      reason,
      suggestedSlotIndex: memberIds.has(id)
        ? members.findIndex((m) => m.id === id)
        : pickBestSlotToReplace(members, c),
      inTeamAlready: memberIds.has(id),
    });
  };

  // First include any unbuilt characters already in the circle
  for (const m of members) {
    if (m.level < BATTLE_READY_LEVEL) {
      const priorityMatch = getRosterBuildPriorities(roster, 12).find(
        (p) => p.character.id === m.id
      );
      addIfUnbuilt(
        m.id,
        priorityMatch?.reason ??
          `Currently Lv ${m.level} — level to 70/80+ for endgame survivability.`
      );
    }
  }

  const hasTraveller = memberIds.has('traveller');
  const hasLauma = memberIds.has('lauma');
  const hasZibai = memberIds.has('zibai');
  const hasFlins = memberIds.has('flins');
  const hasElectro = members.some((m) => m.element === 'Electro');
  const hasPyro = members.some((m) => m.element === 'Pyro');
  const hasHydro = members.some((m) => m.element === 'Hydro');
  const hasCryo = members.some((m) => m.element === 'Cryo');
  const regionLower = (context?.regionName ?? '').toLowerCase();

  // Contextual beneficial unbuilt characters NOT yet in this circle
  if (
    hasTraveller ||
    context?.archetypeId === 'stellar-conduct' ||
    regionLower.includes('snezhnaya')
  ) {
    addIfUnbuilt(
      'alyosha',
      'Dedicated Stellar-Conduct healer & Electro support — huge upgrade for Cryo Traveller.'
    );
  }

  if (
    hasLauma ||
    context?.archetypeId === 'lunar-bloom' ||
    regionLower.includes('sumeru')
  ) {
    addIfUnbuilt(
      'baizhu',
      '5★ Dendro healer, shielder & reaction buffer — big comfort & damage boost for Lauma teams.'
    );
  }

  if (
    hasZibai ||
    context?.archetypeId === 'lunar-crystallize' ||
    context?.archetypeId === 'nightsoul-geo' ||
    regionLower.includes('natlan')
  ) {
    addIfUnbuilt(
      'kachina',
      'Activates Geo Resonance with Zibai and breaks Natlan Nightsoul / Void Ward shields.'
    );
  }

  if (
    (hasFlins || hasElectro) &&
    (hasPyro || context?.archetypeId === 'overloaded-chevreuse')
  ) {
    addIfUnbuilt(
      'chevreuse',
      'Unlocks -40% Pyro/Electro RES shred & healing in Pyro + Electro Overloaded lineups.'
    );
  }

  if (
    regionLower.includes('fontaine') ||
    context?.archetypeId === 'arkhe-ousia'
  ) {
    addIfUnbuilt(
      'lynette',
      'Brings Arkhe: Ousia alignment to stun Fontaine Clockwork Meka and bosses.'
    );
  }

  if ((hasFlins || hasLauma || hasZibai) && hasHydro) {
    addIfUnbuilt(
      'mona',
      '5★ Hydro Omen buffer — great Hydro substitute whenever Aino is needed on your other Abyss team.'
    );
  }

  if (hasCryo && !memberIds.has('diona')) {
    addIfUnbuilt(
      'diona',
      'Cryo shielder, healer & battery — grants Cryo Resonance (+15% CRIT Rate).'
    );
  }

  return suggestions.slice(0, 2);
}
