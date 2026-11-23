import type { EncounterDefinition } from '../types/genshin';

export const ENCOUNTERS: EncounterDefinition[] = [
  // === VERSION 7.2 STYGIAN ONSLAUGHT & SNEZHNAYA WORLD BOSSES ===
  {
    id: 'wavebinder',
    name: 'Wavebinder',
    region: 'Snezhnaya',
    category: 'World Boss',
    isStygian72: true,
    dropsFor: ['Mitya'],
    summary:
      'Snezhnaya World Boss (Port Belovodye) & Stygian Onslaught 7.2 — builds a Courage meter by drinking from his flask to enter a high-RES Valiant state.',
    tacticalTip:
      'Deal Electro and Stellar-Conduct DMG to drain Courage and interrupt his sips under Stellar Glimmer Radiance.',
    preferredArchetypes: ['stellar-conduct', 'lunar-charged'],
    preferredElements: ['Electro', 'Cryo', 'Anemo'],
    requiredTags: ['stellar-conduct'],
    keywords: [
      'wavebinder',
      'courage',
      'valiant',
      'mitya',
      'shattered stability anchor',
      'port belovodye',
      'snezhnaya',
      'stygian',
    ],
  },
  {
    id: 'emperor-of-fire-and-iron',
    name: 'Emperor of Fire and Iron',
    region: 'Fontaine',
    category: 'World Boss',
    isStygian72: true,
    dropsFor: ['Chevreuse'],
    summary:
      'Stygian Onslaught 7.2 & Fontaine World Boss — starts with extreme Pyro-shielded RES via twin molten horns.',
    tacticalTip:
      'Bring Hydro (Aino, Barbara, Candace) to shatter its Pyro horns rapidly and strip its RES; avoid Pyro carries.',
    preferredArchetypes: ['lunar-charged', 'lunar-bloom', 'lunar-crystallize'],
    preferredElements: ['Hydro', 'Electro', 'Dendro', 'Anemo'],
    avoidElements: ['Pyro'],
    keywords: [
      'emperor',
      'fire and iron',
      'crab',
      'pyro shield',
      'chevreuse',
      'stygian',
      'fontaine',
    ],
  },
  {
    id: 'radiant-moongecko',
    name: 'Radiant Moongecko',
    region: 'Nod-Krai',
    category: 'World Boss',
    isStygian72: true,
    summary:
      'Stygian Onslaught 7.2 & Nod-Krai World Boss — cocoons characters, carries high Geo RES until healed, and summons a Moonstone Anchor.',
    tacticalTip:
      'Heal cocooned teammates to full HP to strip its RES, and break the Moonstone Anchor quickly with Geo / Lunar-Crystallize (Zibai + Noelle).',
    preferredArchetypes: ['lunar-crystallize'],
    preferredElements: ['Geo', 'Hydro', 'Electro'],
    requiresHealer: true,
    keywords: [
      'moongecko',
      'radiant moongecko',
      'moonstone',
      'anchor',
      'stygian',
      'nod-krai',
      'geo',
    ],
  },
  {
    id: 'chimeric-winged-lion',
    name: 'Chimeric Winged Lion',
    region: 'Snezhnaya',
    category: 'World Boss',
    dropsFor: ['Alyosha'],
    summary:
      'Snezhnaya World Boss (Volkodlak Tundra) — alternates between Thundercall (Electro ward) and Galeforce (Anemo orbs).',
    tacticalTip:
      'Use Cryo/Pyro to break the Thundercall Electro ward and trigger Stellar Glimmer to pop its Galeforce Anemo orbs.',
    preferredArchetypes: ['stellar-conduct', 'melt-cryo-pyro'],
    preferredElements: ['Cryo', 'Electro', 'Pyro'],
    requiredTags: ['stellar-conduct'],
    keywords: [
      'chimeric',
      'winged lion',
      'alyosha',
      'volkodlak',
      'thundercall',
      'galeforce',
      'snezhnaya',
    ],
  },
  {
    id: 'immortal-construct',
    name: 'Immortal Construct',
    region: 'Snezhnaya',
    category: 'World Boss',
    summary:
      'Snezhnaya World Boss (Everfrozen Earth) — enters Lifeflare, stacks HP shields, and heals whenever it lands hits.',
    tacticalTip:
      'Trigger Stellar Glimmer (Stellar-Conduct or Stellar Swirl) to shut off its Lifeflare healing and burn through its shields.',
    preferredArchetypes: ['stellar-conduct', 'stellar-swirl'],
    preferredElements: ['Cryo', 'Electro', 'Anemo'],
    requiredTags: ['stellar-glimmer'],
    keywords: [
      'immortal construct',
      'lifeflare',
      'everfrozen',
      'snezhnaya',
      'stellar',
    ],
  },
  {
    id: 'domovoy-sculptor',
    name: 'Battle-Hardened Domovoy Sculptor',
    region: 'Snezhnaya',
    category: 'Stygian Onslaught',
    summary:
      'Snezhnaya Local Legend & Stygian Onslaught boss heavily favoring repeated Stellar Swirl and Stellar-Conduct triggers.',
    tacticalTip:
      'Pair Cryo Traveller with Yumemizuki Mizuki or Sucrose for Stellar Swirl, or Fischl/Mitya for nonstop Stellar-Conduct.',
    preferredArchetypes: ['stellar-swirl', 'stellar-conduct'],
    preferredElements: ['Cryo', 'Anemo', 'Electro'],
    requiredTags: ['stellar-glimmer'],
    keywords: ['domovoy', 'sculptor', 'churin', 'stellar swirl', 'snezhnaya'],
  },
  {
    id: 'guardian-blade-drifting-snow',
    name: 'Guardian Blade of Drifting Snow',
    region: 'Snezhnaya',
    category: 'Stygian Onslaught',
    summary:
      'Snezhnaya Boss rewarding Stellar Glimmer damage and strong Pyro application to melt its frost stances.',
    tacticalTip:
      'Cryo Traveller + Bennett + Xiangling + Fischl delivers both Stellar-Conduct and heavy Melt damage.',
    preferredArchetypes: ['melt-cryo-pyro', 'stellar-conduct'],
    preferredElements: ['Pyro', 'Cryo', 'Electro'],
    keywords: ['guardian blade', 'drifting snow', 'snezhnaya', 'melt', 'pyro'],
  },

  // === NOD-KRAI WORLD BOSSES ===
  {
    id: 'knuckle-duckle',
    name: 'The Knuckle Duckle',
    region: 'Nod-Krai',
    category: 'World Boss',
    dropsFor: ['Flins', 'Aino'],
    summary:
      'Nod-Krai World Boss — mechanical duck construct vulnerable to rapid Electro-Charged and Lunar-Charged hits.',
    tacticalTip:
      'Flins + Aino + Fischl + Jahoda shreds its mechanics cleanly with Ascendant Gleam Lunar-Charged.',
    preferredArchetypes: ['lunar-charged'],
    preferredElements: ['Electro', 'Hydro', 'Anemo'],
    requiredTags: ['moonsign'],
    keywords: ['knuckle duckle', 'duck', 'flins', 'aino', 'nod-krai', 'lunar-charged'],
  },
  {
    id: 'radiant-moonfly',
    name: 'Radiant Moonfly',
    region: 'Nod-Krai',
    category: 'World Boss',
    dropsFor: ['Lauma', 'Jahoda'],
    summary:
      'Nod-Krai World Boss — rewards Lunar Reactions (Ascendant Gleam) and steady healing to neutralize its status debuffs.',
    tacticalTip:
      'Bring 2+ Moonsign characters (Flins/Lauma + Aino/Jahoda) plus a reliable Healer for smooth clears.',
    preferredArchetypes: ['lunar-bloom', 'lunar-charged', 'ascendant-gleam-multi'],
    preferredElements: ['Dendro', 'Hydro', 'Electro', 'Anemo'],
    requiredTags: ['moonsign'],
    requiresHealer: true,
    keywords: ['moonfly', 'radiant moonfly', 'lauma', 'jahoda', 'nod-krai'],
  },
  {
    id: 'frostnight-herra',
    name: 'Frostnight Herra',
    region: 'Nod-Krai',
    category: 'World Boss',
    summary:
      'Hiisi Island World Boss — enters Gloomveiled state and absorbs the element you hit it with most.',
    tacticalTip:
      'Use Lunar Reactions (Lunar-Charged, Lunar-Bloom, or Lunar-Crystallize) to force it cleanly into an elementless vulnerable state.',
    preferredArchetypes: ['lunar-charged', 'lunar-bloom', 'lunar-crystallize'],
    preferredElements: ['Electro', 'Hydro', 'Dendro', 'Geo'],
    requiredTags: ['moonsign'],
    keywords: ['frostnight', 'herra', 'gloomveiled', 'hiisi', 'nod-krai'],
  },

  // === NATLAN & FONTAINE BOSSES ===
  {
    id: 'tenebrous-papilla',
    name: 'Tenebrous Papilla / Void Ward',
    region: 'Natlan',
    category: 'World Boss',
    summary:
      'Natlan Abyssal Boss — channels a Void Ward shield requiring rapid elemental hit frequency or Nightsoul hits.',
    tacticalTip:
      'Multi-hit Lunar-Charged (Flins + Fischl + Aino + Jahoda) or Kachina Nightsoul melts the Void Ward before it explodes.',
    preferredArchetypes: ['lunar-charged', 'nightsoul-geo'],
    preferredElements: ['Electro', 'Hydro', 'Pyro', 'Geo'],
    keywords: ['tenebrous', 'papilla', 'mimic', 'void ward', 'natlan', 'nightsoul'],
  },
  {
    id: 'overseer-device',
    name: 'Secret Source Automaton: Overseer Device',
    region: 'Natlan',
    category: 'World Boss',
    summary:
      'Natlan & Stygian Onslaught boss — ramps Sweeper Mode RES unless suppressed with rapid Cryo application.',
    tacticalTip:
      'Keep continuous Cryo hits on it with Cryo Traveller + Kaeya (or Rosaria/Charlotte) to lock down its Sweeper Mode.',
    preferredArchetypes: ['stellar-conduct', 'melt-cryo-pyro'],
    preferredElements: ['Cryo', 'Electro', 'Pyro'],
    keywords: ['overseer', 'secret source', 'automaton', 'ssaod', 'cryo', 'natlan'],
  },
  {
    id: 'hydro-tulpa',
    name: 'Hydro Tulpa',
    region: 'Fontaine',
    category: 'World Boss',
    summary:
      'Permanently Hydro-infused and 100% immune to Hydro DMG — grants free Vaporize, Hyperbloom, and Lunar-Bloom without bringing Hydro.',
    tacticalTip:
      'Drop all Hydro units! Run Pyro (Xiangling + Bennett), Dendro (Lauma), Electro (Flins/Fischl), or Cryo Melt.',
    preferredArchetypes: ['melt-cryo-pyro', 'overloaded-chevreuse', 'stellar-conduct'],
    preferredElements: ['Pyro', 'Dendro', 'Electro', 'Cryo'],
    avoidElements: ['Hydro'],
    keywords: ['tulpa', 'hydro tulpa', 'oceanid', 'hydro immune', 'fontaine'],
  },
  {
    id: 'legatus-golem',
    name: 'Statue of Marble and Brass (Legatus Golem)',
    region: 'Fontaine',
    category: 'World Boss',
    summary:
      'Sea of Bygone Eras World Boss — protected by heavy Geo armor that reduces all damage until shattered.',
    tacticalTip:
      'Zibai + Noelle (Geo + Claymore) + Aino shreds its Geo armor rapidly, or use Chevreuse Overloaded blasts.',
    preferredArchetypes: ['lunar-crystallize', 'overloaded-chevreuse'],
    preferredElements: ['Geo', 'Hydro', 'Electro', 'Pyro'],
    keywords: ['legatus', 'golem', 'marble', 'brass', 'geo shield', 'bygone eras', 'fontaine'],
  },
  {
    id: 'icewind-suite',
    name: 'Icewind Suite (Coppelia & Coppelius)',
    region: 'Fontaine',
    category: 'World Boss',
    dropsFor: ['Lynette', 'Charlotte'],
    summary:
      'Fontaine Clockwork Duo — Coppelia deals rapid Anemo/Cryo bursts; Coppelius raises Cryo shields broken by Arkhe: Ousia or Pyro.',
    tacticalTip:
      'Use Pyro (Bennett + Xiangling) or Ousia (Lynette) to shatter Coppelius’s Cryo shields immediately.',
    preferredArchetypes: ['melt-cryo-pyro', 'arkhe-ousia', 'overloaded-chevreuse'],
    preferredElements: ['Pyro', 'Electro', 'Anemo'],
    keywords: ['icewind', 'coppelia', 'coppelius', 'arkhe', 'ousia', 'lynette', 'charlotte', 'fontaine'],
  },

  // === CLASSIC WORLD & WEEKLY BOSSES ===
  {
    id: 'iniquitous-baptist',
    name: 'Iniquitous Baptist',
    region: 'Sumeru',
    category: 'World Boss',
    dropsFor: ['Baizhu'],
    summary:
      'Rotates three elemental shields (Pyro, Cryo, Hydro, or Electro) — punishes mono-element squads.',
    tacticalTip:
      'Bring 3+ distinct elements (e.g., Lauma + Aino + Fischl + Bennett/Barbara) to crack every shield phase cleanly.',
    preferredArchetypes: ['lunar-bloom', 'lunar-charged', 'ascendant-gleam-multi'],
    preferredElements: ['Dendro', 'Hydro', 'Electro', 'Pyro'],
    keywords: ['baptist', 'iniquitous', 'baizhu', 'sumeru', 'shields'],
  },
  {
    id: 'thunder-manifestation',
    name: 'Thunder Manifestation',
    region: 'Inazuma',
    category: 'World Boss',
    dropsFor: ['Kujou Sara'],
    summary:
      'Airborne, fast-moving Inazuma boss that is 100% immune to Electro DMG.',
    tacticalTip:
      'Leave Flins, Fischl, and Mitya benched — clear cleanly with Reverse Melt (Traveller/Xiangling/Bennett) or Zibai Lunar-Crystallize.',
    preferredArchetypes: ['melt-cryo-pyro', 'lunar-crystallize', 'lunar-bloom'],
    preferredElements: ['Pyro', 'Cryo', 'Geo', 'Dendro', 'Hydro'],
    avoidElements: ['Electro'],
    keywords: ['thunder', 'manifestation', 'electro immune', 'kujou sara', 'inazuma'],
  },
  {
    id: 'the-knave-weekly',
    name: 'The Knave (Arlecchino)',
    region: 'Fontaine',
    category: 'Weekly Boss',
    summary:
      'Weekly Trounce Boss — inflicts heavy Bond of Life that boosts her damage until healed off.',
    tacticalTip:
      'Always bring a strong, fast Healer (Bennett, Barbara, Jahoda, or Baizhu) to clear Bond of Life and trigger Charged Attack counter-stuns.',
    preferredArchetypes: ['lunar-charged', 'lunar-bloom', 'lunar-crystallize'],
    preferredElements: ['Hydro', 'Electro', 'Dendro', 'Geo'],
    avoidElements: ['Pyro'],
    requiresHealer: true,
    keywords: ['knave', 'arlecchino', 'weekly', 'trounce', 'bond of life', 'fontaine'],
  },
  {
    id: 'raiden-weekly',
    name: 'Magatsu Mitake Narukami no Mikoto (Raiden)',
    region: 'Inazuma',
    category: 'Weekly Boss',
    summary:
      'Weekly Trounce Boss — channels a lethal Final Calamity one-shot unless you charge the Flowers of Remembrance shield orb.',
    tacticalTip:
      'Bring at least one Electro character (Flins or Fischl) to instantly activate the protective dome, plus Cryo/Pyro/Dendro to break her Electro shield.',
    preferredArchetypes: ['stellar-conduct', 'lunar-bloom', 'lunar-charged'],
    preferredElements: ['Electro', 'Cryo', 'Dendro', 'Pyro'],
    keywords: ['raiden', 'shogun', 'magatsu', 'weekly', 'trounce', 'inazuma'],
  },
  {
    id: 'azhdaha-weekly',
    name: 'Azhdaha',
    region: 'Liyue',
    category: 'Weekly Boss',
    summary:
      'Weekly Trounce Boss — deals heavy AoE stomps and applies relentless elemental DoT marks to unshielded characters.',
    tacticalTip:
      'A Shielder (Noelle, Diona, Lan Yan, or Baizhu) prevents DoT marks completely; pair with ranged/mobile DPS and strong healing.',
    preferredArchetypes: ['lunar-crystallize', 'lunar-charged', 'lunar-bloom'],
    preferredElements: ['Geo', 'Hydro', 'Electro', 'Dendro'],
    requiresHealer: true,
    keywords: ['azhdaha', 'weekly', 'trounce', 'shield', 'liyue'],
  },
];
