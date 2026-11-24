import { ENCOUNTERS } from '../data/encounters';
import type { ElementType, EncounterDefinition } from '../types/genshin';
import { slugifyName } from '../services/sheetsApi';

const TOKEN_ALIASES: Record<string, string[]> = {
  cube: ['hypostasis'],
  hypo: ['hypostasis'],
  flower: ['regisvine'],
  plant: ['regisvine'],
  vine: ['regisvine'],
  wolf: ['andrius', 'wolflord', 'rifthound'],
  dragon: ['dvalin', 'stormterror', 'apep'],
  whale: ['narwhal'],
  crab: ['emperor'],
  duck: ['knuckle', 'duckle'],
  worm: ['wenut'],
  chicken: ['jadeplume', 'terrorshroom'],
  triangle: ['asimon', 'matrix'],
  fire: ['pyro'],
  flame: ['pyro'],
  ice: ['cryo'],
  frost: ['cryo'],
  water: ['hydro'],
  lightning: ['electro'],
  thunder: ['electro'],
  wind: ['anemo'],
  rock: ['geo'],
  stone: ['geo'],
  earth: ['geo'],
  grass: ['dendro'],
  wood: ['wooden', 'dendro'],
  spectre: ['specter'],
};

const STOP_WORDS = new Set([
  'fight',
  'vs',
  'versus',
  'against',
  'counter',
  'for',
  'the',
  'a',
  'an',
  'team',
  'boss',
  'enemy',
  'opponent',
  'opponents',
]);

function normalizeTokens(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9-\s]/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && !STOP_WORDS.has(t));
}

function tokenMatchesHaystack(token: string, haystack: string): boolean {
  if (haystack.includes(token)) return true;
  const aliases = TOKEN_ALIASES[token];
  if (aliases) {
    return aliases.some((a) => haystack.includes(a));
  }
  return false;
}

/**
 * Multi-token, alias-aware search across all Genshin opponents.
 * Matches e.g. "anemo hypo", "fire cube", "wolf", "oceanid", "sucrose", "pyro shield".
 */
export function searchEncounters(
  rawQuery: string,
  encounters: EncounterDefinition[] = ENCOUNTERS
): EncounterDefinition[] {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return encounters;

  const tokens = normalizeTokens(rawQuery);
  if (tokens.length === 0) return encounters;

  const scored: Array<{ enc: EncounterDefinition; score: number }> = [];

  for (const enc of encounters) {
    const nameLower = enc.name.toLowerCase();
    const regionLower = enc.region.toLowerCase();
    const categoryLower = enc.category.toLowerCase();
    const keywordsJoined = enc.keywords.join(' ').toLowerCase();
    const dropsJoined = (enc.dropsFor ?? []).join(' ').toLowerCase();
    const fullHaystack = `${nameLower} ${regionLower} ${categoryLower} ${keywordsJoined} ${dropsJoined} ${enc.summary.toLowerCase()} ${enc.tacticalTip.toLowerCase()}`;

    if (!tokens.every((t) => tokenMatchesHaystack(t, fullHaystack))) {
      continue;
    }

    let score = 10;
    if (nameLower === q) score += 200;
    else if (nameLower.startsWith(q)) score += 120;
    else if (nameLower.includes(q)) score += 90;

    // Reward every token matching directly in name, keywords, or character drops
    for (const t of tokens) {
      if (tokenMatchesHaystack(t, nameLower)) score += 35;
      else if (tokenMatchesHaystack(t, keywordsJoined)) score += 22;
      else if (tokenMatchesHaystack(t, dropsJoined)) score += 20;
      else if (tokenMatchesHaystack(t, regionLower)) score += 12;
      else score += 5;
    }

    scored.push({ enc, score });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.enc);
}

const ELEMENT_MATCHERS: Array<{ element: ElementType; words: string[] }> = [
  { element: 'Anemo', words: ['anemo', 'wind', 'gale', 'whirlwind'] },
  { element: 'Pyro', words: ['pyro', 'fire', 'flame', 'blaze', 'blazing', 'molten'] },
  { element: 'Cryo', words: ['cryo', 'ice', 'frost', 'frozen', 'glacial', 'snow'] },
  { element: 'Hydro', words: ['hydro', 'water', 'ocean', 'mimic', 'tide', 'tainted'] },
  { element: 'Electro', words: ['electro', 'lightning', 'thunder', 'volt', 'storm', 'cicin'] },
  { element: 'Geo', words: ['geo', 'rock', 'stone', 'basalt', 'earth', 'crystal'] },
  { element: 'Dendro', words: ['dendro', 'grass', 'vine', 'fungus', 'fungi', 'flora', 'moss'] },
];

const ELEMENT_COUNTER_META: Record<
  ElementType,
  {
    preferredElements: ElementType[];
    requiresElements?: ElementType[];
    preferredArchetypes: string[];
    counterSummary: string;
  }
> = {
  Anemo: {
    preferredElements: ['Electro', 'Cryo', 'Pyro', 'Hydro', 'Geo'],
    preferredArchetypes: ['stellar-conduct', 'melt-cryo-pyro', 'lunar-charged', 'lunar-crystallize'],
    counterSummary:
      'Avoid Anemo damage dealers and burst it down with Stellar-Conduct (Mitya/Traveller/Alyosha), Reverse Melt, or Lunar-Charged.',
  },
  Pyro: {
    preferredElements: ['Hydro', 'Electro', 'Cryo', 'Dendro', 'Geo'],
    requiresElements: ['Hydro'],
    preferredArchetypes: ['lunar-charged', 'lunar-bloom', 'lunar-crystallize'],
    counterSummary:
      'Bench Pyro carries and bring Hydro (Aino, Barbara, Candace) to strip Pyro shields/auras fast, backed by Electro, Dendro, or Geo.',
  },
  Cryo: {
    preferredElements: ['Pyro', 'Electro', 'Anemo', 'Geo'],
    requiresElements: ['Pyro'],
    preferredArchetypes: ['overloaded-chevreuse', 'lunar-charged', 'lunar-bloom'],
    counterSummary:
      'Bench Cryo carries and lead with Pyro (Bennett, Xiangling, Dehya) to melt Cryo shields and resistances cleanly.',
  },
  Hydro: {
    preferredElements: ['Cryo', 'Dendro', 'Electro', 'Pyro'],
    requiresElements: ['Cryo', 'Dendro'],
    preferredArchetypes: ['stellar-conduct', 'melt-cryo-pyro', 'overloaded-chevreuse'],
    counterSummary:
      'Drop Hydro units — use Cryo and Dendro (Cryo Traveller, Lauma, Kaeya) alongside Electro/Pyro for free Freeze, Hyperbloom, or Vaporize.',
  },
  Electro: {
    preferredElements: ['Pyro', 'Cryo', 'Dendro', 'Geo'],
    requiresElements: ['Pyro', 'Cryo', 'Dendro'],
    preferredArchetypes: ['melt-cryo-pyro', 'lunar-bloom', 'lunar-crystallize'],
    counterSummary:
      'Leave Electro units benched and break Electro shields/auras with Pyro, Cryo, or Dendro (Xiangling, Bennett, Cryo Traveller, Lauma).',
  },
  Geo: {
    preferredElements: ['Hydro', 'Electro', 'Pyro', 'Cryo'],
    preferredArchetypes: ['lunar-charged', 'overloaded-chevreuse', 'stellar-conduct'],
    counterSummary:
      'Avoid Geo DPS against Geo-immune foes; bring a non-Geo Claymore (Aino, Dehya) or Overloaded blasts to break rock shields.',
  },
  Dendro: {
    preferredElements: ['Pyro', 'Electro', 'Cryo', 'Anemo'],
    preferredArchetypes: ['stellar-conduct', 'melt-cryo-pyro', 'overloaded-chevreuse'],
    counterSummary:
      'Avoid Dendro carries and burn through Dendro foes with Pyro, Electro, or Cryo reactions (Stellar-Conduct, Melt, or Overloaded).',
  },
};

function toTitleCase(input: string): string {
  return input
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word) =>
      word.length > 0 ? word[0].toUpperCase() + word.slice(1) : word
    )
    .join(' ');
}

/**
 * Synthesizes a tailored EncounterDefinition for any freeform Genshin opponent
 * (e.g. "Cryo Whopperflower", "Pyro Specter", "Flying Electro Enemy", "Wooden Shield Mitachurl").
 * Runs 100% locally with zero API key needed.
 */
export function buildCustomEncounterFromQuery(
  rawQuery: string
): EncounterDefinition | null {
  const cleaned = rawQuery
    .trim()
    .replace(/^(fight|vs\.?|versus|against|counter\s+for|counter|team\s+for|beat)\s+/i, '')
    .trim();

  if (cleaned.length < 2) return null;

  const lower = cleaned.toLowerCase();
  const words = lower.replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter(Boolean);

  const detectedElements: ElementType[] = [];
  for (const matcher of ELEMENT_MATCHERS) {
    if (matcher.words.some((w) => words.includes(w) || lower.includes(w))) {
      detectedElements.push(matcher.element);
    }
  }

  const isFlying =
    /\b(flying|airborne|raptor|bird|eye|drake|specter|spectre|hover|float|wings?)\b/.test(
      lower
    );
  const isWoodenShield = /\b(wood|wooden)\b/.test(lower);
  const isGeoArmor =
    detectedElements.includes('Geo') ||
    /\b(lawachurl|mitachurl|rock|stone|pillar|golem|mineral)\b/.test(lower);
  const isCorrosion = /\b(corrosion|bleed|rifthound|wolf|wolflord|drain|bond of life)\b/.test(
    lower
  );
  const isAntiShield = /\b(husk|serpent knight|anti[- ]?shield|no shield)\b/.test(lower);
  const wantsShield = /\b(geovishap|vishap|reflect|azhdaha|stomp)\b/.test(lower);
  const isShielded = /\b(shield|armor|mage|lector|herald|fatui|slime|specter|spectre|whopperflower|eidolon|phantasm|hypostasis|cube|regisvine)\b/.test(
    lower
  );

  const avoidElements = [...detectedElements];
  let preferredElements: ElementType[] = ['Electro', 'Hydro', 'Cryo', 'Pyro', 'Dendro'];
  let preferredArchetypes: string[] = [
    'lunar-charged',
    'stellar-conduct',
    'lunar-bloom',
    'melt-cryo-pyro',
  ];
  let requiresElements: ElementType[] | undefined;

  const tips: string[] = [];

  if (detectedElements.length === 1) {
    const el = detectedElements[0];
    const meta = ELEMENT_COUNTER_META[el];
    preferredElements = meta.preferredElements;
    preferredArchetypes = meta.preferredArchetypes;
    if (isShielded || el === 'Pyro' || el === 'Cryo' || el === 'Hydro' || el === 'Electro') {
      requiresElements = meta.requiresElements;
    }
    tips.push(meta.counterSummary);
  } else if (detectedElements.length > 1) {
    const avoidSet = new Set(detectedElements);
    preferredElements = (
      ['Electro', 'Hydro', 'Cryo', 'Pyro', 'Dendro', 'Geo', 'Anemo'] as ElementType[]
    ).filter((e) => !avoidSet.has(e));
    if (preferredElements.length === 0) {
      preferredElements = ['Electro', 'Hydro', 'Pyro', 'Cryo'];
    }
    preferredArchetypes = [
      'lunar-charged',
      'stellar-conduct',
      'melt-cryo-pyro',
      'lunar-bloom',
      'lunar-crystallize',
    ];
    tips.push(
      `Avoid ${detectedElements.join(' & ')} carries and clear with ${preferredElements
        .slice(0, 3)
        .join(' / ')} reactions.`
    );
  } else if (isWoodenShield) {
    preferredElements = ['Pyro', 'Electro', 'Cryo', 'Anemo'];
    requiresElements = ['Pyro'];
    preferredArchetypes = ['melt-cryo-pyro', 'overloaded-chevreuse'];
    tips.push('Bring Pyro (Bennett, Xiangling, Dehya) to burn wooden shields immediately.');
  } else {
    tips.push(
      'Assembled your highest-synergy Battle-Ready reaction squad with balanced elemental coverage and sustain.'
    );
  }

  if (isFlying) {
    tips.push('Includes ranged/Bow reach to hit airborne phases cleanly.');
  }
  if (isGeoArmor) {
    tips.push('Favors Claymore / heavy impact or Overloaded to crack rock shields.');
  }
  if (isCorrosion) {
    tips.push('Prioritizes a dedicated Healer to counteract party-wide HP drain.');
  }
  if (isAntiShield) {
    tips.push('Avoids Shielders so enemies cannot trigger anti-shield buffs.');
  }
  if (wantsShield) {
    tips.push('Includes a Shielder for safe damage mitigation and rebound windows.');
  }

  const displayName = toTitleCase(cleaned);
  return {
    id: `custom-${slugifyName(cleaned) || 'opponent'}`,
    name: displayName,
    region: 'Custom Opponent',
    category: 'Elite & Shields',
    isCustom: true,
    summary: `Custom opponent counter generated for "${displayName}"${
      avoidElements.length > 0
        ? ` (avoids ${avoidElements.join(' & ')})`
        : ''
    }.`,
    tacticalTip: tips.join(' '),
    preferredArchetypes,
    preferredElements,
    avoidElements: avoidElements.length > 0 ? avoidElements : undefined,
    requiresElements,
    requiresBow: isFlying || undefined,
    requiresClaymoreOrGeo: isGeoArmor || undefined,
    requiresHealer: isCorrosion || isAntiShield || undefined,
    requiresShielder: wantsShield || undefined,
    avoidShielder: isAntiShield || undefined,
    keywords: words,
  };
}
