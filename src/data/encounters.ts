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
    dropsFor: ['Chevreuse', 'Gaming'],
    summary:
      'Stygian Onslaught 7.2 & Fontaine World Boss — starts with extreme Pyro-shielded RES via twin molten horns.',
    tacticalTip:
      'Bring Hydro (Aino, Barbara, Candace) to shatter its Pyro horns rapidly and strip its RES; avoid Pyro carries.',
    preferredArchetypes: ['lunar-charged', 'lunar-bloom', 'lunar-crystallize'],
    preferredElements: ['Hydro', 'Electro', 'Dendro', 'Anemo'],
    requiresElements: ['Hydro'],
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
  {
    id: 'battle-hardened-prism-slime',
    name: 'Battle-Hardened Prism Slime',
    region: 'Nod-Krai',
    category: 'Stygian Onslaught',
    summary:
      'Floor 12-1 Boss — absorbs Energy and becomes immune to 1 element at a time until its gauge fills and it enlarges into a vulnerable state.',
    tacticalTip:
      'Bring multi-element or Lunar-Crystallize teams (Zibai + Aino + Fischl + Noelle) and rotate elements during Absorption Mode so your main carry is never locked out.',
    preferredArchetypes: ['lunar-crystallize', 'lunar-charged', 'lunar-bloom', 'stellar-conduct'],
    preferredElements: ['Geo', 'Hydro', 'Electro', 'Dendro', 'Pyro'],
    keywords: ['prism slime', 'battle-hardened', 'prism', 'absorption', 'floor 12', 'abyss', 'nod-krai'],
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
    requiresClaymoreOrGeo: true,
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

  // === ALL 7 HYPOSTASES & 3 REGISVINES ===
  {
    id: 'anemo-hypostasis',
    name: 'Anemo Hypostasis (Beth)',
    region: 'Mondstadt',
    category: 'Hypostasis & Regisvine',
    dropsFor: ['Sucrose'],
    summary:
      'Mondstadt Elemental Cube — 100% immune to Anemo DMG, hovers during tornado phases, and heals if its Anemo orbs are not collected during revival.',
    tacticalTip:
      'Bench Anemo units (Sucrose, Jahoda, Mizuki) — burst its exposed core with Stellar-Conduct (Mitya/Traveller/Alyosha), Reverse Melt, or Flins/Fischl, and glide through all 4 Anemo orbs in the revival phase.',
    preferredArchetypes: ['stellar-conduct', 'melt-cryo-pyro', 'lunar-charged', 'lunar-crystallize'],
    preferredElements: ['Electro', 'Cryo', 'Pyro', 'Hydro', 'Geo'],
    avoidElements: ['Anemo'],
    keywords: [
      'anemo hypostasis',
      'beth',
      'anemo cube',
      'wind cube',
      'anemo immune',
      'hurricane seed',
      'sucrose',
      'mondstadt',
      'hypostasis',
    ],
  },
  {
    id: 'electro-hypostasis',
    name: 'Electro Hypostasis (Aleph)',
    region: 'Mondstadt',
    category: 'Hypostasis & Regisvine',
    dropsFor: ['Fischl', 'Lisa'],
    summary:
      'Mondstadt Elemental Cube — 100% immune to Electro DMG and spawns 3 Electro revival prisms that only break cleanly to Pyro, Cryo, or Dendro.',
    tacticalTip:
      'Leave Electro units (Flins, Fischl, Mitya, Alyosha) benched — bring Pyro or Cryo (Xiangling, Bennett, Cryo Traveller, Kaeya) to melt its revival prisms in one cycle.',
    preferredArchetypes: ['melt-cryo-pyro', 'lunar-bloom', 'lunar-crystallize'],
    preferredElements: ['Pyro', 'Cryo', 'Dendro', 'Hydro'],
    requiresElements: ['Pyro', 'Cryo', 'Dendro'],
    avoidElements: ['Electro'],
    keywords: [
      'electro hypostasis',
      'aleph',
      'electro cube',
      'lightning cube',
      'electro immune',
      'lightning prism',
      'fischl',
      'lisa',
      'mondstadt',
      'hypostasis',
    ],
  },
  {
    id: 'cryo-hypostasis',
    name: 'Cryo Hypostasis (Daleth)',
    region: 'Mondstadt',
    category: 'Hypostasis & Regisvine',
    summary:
      'Dragonspine Elemental Cube — 100% immune to Cryo DMG; knocks frostfruits back with Charged Attacks to crack its final revival shield.',
    tacticalTip:
      'Bench Cryo units (Traveller, Kaeya) and bring Pyro (Bennett, Xiangling, Dehya) to shred its Cryo shield and stay warm against Sheer Cold.',
    preferredArchetypes: ['overloaded-chevreuse', 'lunar-charged', 'lunar-bloom'],
    preferredElements: ['Pyro', 'Electro', 'Hydro', 'Anemo'],
    requiresElements: ['Pyro'],
    avoidElements: ['Cryo'],
    keywords: [
      'cryo hypostasis',
      'daleth',
      'cryo cube',
      'ice cube',
      'cryo immune',
      'dragonspine',
      'crystalline bloom',
      'mondstadt',
      'hypostasis',
    ],
  },
  {
    id: 'geo-hypostasis',
    name: 'Geo Hypostasis (Gimel)',
    region: 'Liyue',
    category: 'Hypostasis & Regisvine',
    dropsFor: ['Noelle'],
    summary:
      'Liyue Elemental Cube — 100% immune to Geo DMG and perches on Basalt Pillars that require Claymore hits or Overloaded blasts to shatter.',
    tacticalTip:
      'Avoid Geo DPS (Zibai) since the core is Geo-immune; bring a non-Geo Claymore (Aino or Dehya) or Overloaded to smash the pillars and final revival totems fast.',
    preferredArchetypes: ['lunar-charged', 'overloaded-chevreuse', 'stellar-conduct'],
    preferredElements: ['Hydro', 'Electro', 'Pyro', 'Cryo'],
    avoidElements: ['Geo'],
    requiresClaymoreOrGeo: true,
    keywords: [
      'geo hypostasis',
      'gimel',
      'geo cube',
      'rock cube',
      'geo immune',
      'basalt pillar',
      'noelle',
      'liyue',
      'hypostasis',
    ],
  },
  {
    id: 'pyro-hypostasis',
    name: 'Pyro Hypostasis (Ayin)',
    region: 'Inazuma',
    category: 'Hypostasis & Regisvine',
    dropsFor: ['Thoma'],
    summary:
      'Inazuma Elemental Cube — 100% immune to Pyro DMG and starts encased in a thick Pyro shield that regenerates from Fire Seeds.',
    tacticalTip:
      'Bench Pyro units and lead with rapid Hydro (Barbara, Aino, Candace) to extinguish its Pyro shield and Fire Seeds, then burst with Electro/Cryo/Geo.',
    preferredArchetypes: ['lunar-charged', 'lunar-bloom', 'lunar-crystallize'],
    preferredElements: ['Hydro', 'Electro', 'Cryo', 'Dendro', 'Geo'],
    requiresElements: ['Hydro'],
    avoidElements: ['Pyro'],
    keywords: [
      'pyro hypostasis',
      'ayin',
      'pyro cube',
      'fire cube',
      'pyro immune',
      'smoldering pearl',
      'thoma',
      'inazuma',
      'hypostasis',
    ],
  },
  {
    id: 'hydro-hypostasis',
    name: 'Hydro Hypostasis (He)',
    region: 'Inazuma',
    category: 'Hypostasis & Regisvine',
    summary:
      'Inazuma Elemental Cube — 100% immune to Hydro DMG and spawns 3 healing Water Droplets during its revival phase.',
    tacticalTip:
      'Drop all Hydro units — use Cryo, Dendro, or Pyro (Cryo Traveller, Lauma, Xiangling, Bennett, Kaeya) to freeze/vaporize the 3 revival droplets instantly.',
    preferredArchetypes: ['stellar-conduct', 'melt-cryo-pyro', 'overloaded-chevreuse'],
    preferredElements: ['Cryo', 'Dendro', 'Pyro', 'Electro'],
    requiresElements: ['Cryo', 'Dendro', 'Pyro'],
    avoidElements: ['Hydro'],
    keywords: [
      'hydro hypostasis',
      'he',
      'hydro cube',
      'water cube',
      'hydro immune',
      'dew of repudiation',
      'inazuma',
      'hypostasis',
    ],
  },
  {
    id: 'dendro-hypostasis',
    name: 'Dendro Hypostasis (Zayin)',
    region: 'Sumeru',
    category: 'Hypostasis & Regisvine',
    dropsFor: ['Yaoyao', 'Kaveh'],
    summary:
      'Sumeru Elemental Cube — immune to Dendro DMG, but REQUIRES Dendro (plus optional Electro) in its final revival phase to cleanse the Restorative Piths.',
    tacticalTip:
      'Bring 1 Dendro cleanser (Lauma, Collei, Baizhu, or Yaoyao) specifically for the revival piths, plus Electro/Pyro/Hydro carries (Flins, Fischl, Mitya, Bennett) to burst its core.',
    preferredArchetypes: ['lunar-charged', 'stellar-conduct', 'overloaded-chevreuse'],
    preferredElements: ['Electro', 'Dendro', 'Pyro', 'Hydro'],
    requiresElements: ['Dendro'],
    keywords: [
      'dendro hypostasis',
      'zayin',
      'dendro cube',
      'quelled creeper',
      'yaoyao',
      'kaveh',
      'sumeru',
      'hypostasis',
    ],
  },
  {
    id: 'pyro-regisvine',
    name: 'Pyro Regisvine',
    region: 'Liyue',
    category: 'Hypostasis & Regisvine',
    dropsFor: ['Bennett', 'Xiangling', 'Amber', 'Xinyan'],
    summary:
      'Liyue Elemental Flora — high Pyro RES with a blazing Pyro corolla weakpoint at its roots and crown.',
    tacticalTip:
      'Extinguish its Pyro core in seconds with Hydro (Aino, Barbara, Candace) and finish cleanly with Lunar-Charged, Lunar-Bloom, or Cryo/Electro bursts.',
    preferredArchetypes: ['lunar-charged', 'lunar-bloom', 'lunar-crystallize'],
    preferredElements: ['Hydro', 'Electro', 'Cryo', 'Dendro'],
    requiresElements: ['Hydro'],
    avoidElements: ['Pyro'],
    keywords: [
      'pyro regisvine',
      'fire flower',
      'regisvine',
      'everflame seed',
      'bennett',
      'xiangling',
      'amber',
      'xinyan',
      'liyue',
    ],
  },
  {
    id: 'cryo-regisvine',
    name: 'Cryo Regisvine',
    region: 'Mondstadt',
    category: 'Hypostasis & Regisvine',
    dropsFor: ['Kaeya', 'Rosaria', 'Diona'],
    summary:
      'Mondstadt Elemental Flora — high Cryo RES with a frozen Cryo corolla weakpoint that collapses rapidly to Pyro.',
    tacticalTip:
      'Bring Pyro (Bennett, Xiangling, Dehya) to melt its corolla immediately, then unload Electro or Pyro burst damage while it is stunned.',
    preferredArchetypes: ['overloaded-chevreuse', 'lunar-charged', 'lunar-bloom'],
    preferredElements: ['Pyro', 'Electro', 'Hydro', 'Anemo'],
    requiresElements: ['Pyro'],
    avoidElements: ['Cryo'],
    keywords: [
      'cryo regisvine',
      'ice flower',
      'regisvine',
      'hoarfrost core',
      'kaeya',
      'rosaria',
      'diona',
      'mondstadt',
    ],
  },
  {
    id: 'electro-regisvine',
    name: 'Electro Regisvine',
    region: 'Sumeru',
    category: 'Hypostasis & Regisvine',
    summary:
      'Sumeru Elemental Flora — high Electro RES and switches between Waxing and Waning Electro stamens.',
    tacticalTip:
      'Avoid Electro carries; use Pyro, Cryo, or Dendro (Xiangling, Bennett, Cryo Traveller, Lauma) to break the stamen and burst it down.',
    preferredArchetypes: ['melt-cryo-pyro', 'lunar-bloom', 'lunar-crystallize'],
    preferredElements: ['Pyro', 'Cryo', 'Dendro', 'Hydro'],
    requiresElements: ['Pyro', 'Cryo', 'Dendro'],
    avoidElements: ['Electro'],
    keywords: [
      'electro regisvine',
      'thunder flower',
      'regisvine',
      'thunderclap fruitcore',
      'sumeru',
    ],
  },

  // === CLASSIC & REGIONAL WORLD BOSSES ===
  {
    id: 'oceanid',
    name: 'Rhodeia of Loch (Oceanid)',
    region: 'Liyue',
    category: 'World Boss',
    dropsFor: ['Barbara', 'Mona'],
    summary:
      'Liyue Hydro Boss — summons Hydro Mimics (including airborne Raptors) that are 100% immune to Hydro DMG.',
    tacticalTip:
      'Leave Hydro units home! Bring Cryo, Electro, or Dendro plus a ranged/Bow attacker (Fischl, Mitya, Cryo Traveller, Lauma, Kaeya) to freeze and snipe flying Raptors.',
    preferredArchetypes: ['stellar-conduct', 'melt-cryo-pyro', 'overloaded-chevreuse'],
    preferredElements: ['Electro', 'Cryo', 'Dendro', 'Pyro'],
    avoidElements: ['Hydro'],
    requiresBow: true,
    keywords: [
      'oceanid',
      'rhodeia',
      'hydro mimic',
      'raptors',
      'cleansing heart',
      'barbara',
      'mona',
      'hydro immune',
      'liyue',
    ],
  },
  {
    id: 'primo-geovishap',
    name: 'Primo Geovishap',
    region: 'Liyue',
    category: 'World Boss',
    summary:
      'Liyue Elemental Beast — channels Primordial Shower, which rebounds for massive self-damage if blocked by any shield.',
    tacticalTip:
      'Bring a Shielder (Noelle, Diona, Lan Yan, Thoma, or Baizhu) to reflect Primordial Shower and chunk its HP while resisting heavy slams.',
    preferredArchetypes: ['lunar-crystallize', 'stellar-conduct', 'lunar-charged'],
    preferredElements: ['Geo', 'Hydro', 'Electro', 'Cryo'],
    requiresShielder: true,
    keywords: ['primo geovishap', 'geovishap', 'juvenile jade', 'shield', 'reflect', 'liyue'],
  },
  {
    id: 'maguu-kenki',
    name: 'Maguu Kenki',
    region: 'Inazuma',
    category: 'World Boss',
    summary:
      'Inazuma Automaton Samurai — automatically parries distant projectiles and unleashes high-damage Cryo/Anemo phantom slashes.',
    tacticalTip:
      'Fight at close range so projectiles are not parried, and bring reliable sustain (Bennett, Alyosha, Jahoda, or Noelle) to absorb phantom bursts.',
    preferredArchetypes: ['lunar-charged', 'stellar-conduct', 'lunar-bloom', 'melt-cryo-pyro'],
    preferredElements: ['Electro', 'Hydro', 'Pyro', 'Cryo', 'Dendro'],
    requiresHealer: true,
    keywords: ['maguu kenki', 'kenki', 'marionette core', 'samurai', 'inazuma'],
  },
  {
    id: 'perpetual-mechanical-array',
    name: 'Perpetual Mechanical Array (PMA)',
    region: 'Inazuma',
    category: 'World Boss',
    summary:
      'Inazuma Ruin Boss — high Physical RES and splits into 4 Ruin Sentinels mid-fight; defeating the ringed sentinel weakens the core.',
    tacticalTip:
      'Focus purely on elemental reaction cores (Lunar-Charged, Stellar-Conduct, Lunar-Bloom, or Melt) and target the glowing ringed sentinel during split phase.',
    preferredArchetypes: ['lunar-charged', 'stellar-conduct', 'lunar-bloom', 'melt-cryo-pyro'],
    preferredElements: ['Electro', 'Hydro', 'Cryo', 'Dendro', 'Pyro'],
    keywords: ['perpetual mechanical array', 'pma', 'ruin', 'perpetual heart', 'inazuma'],
  },
  {
    id: 'golden-wolflord',
    name: 'Golden Wolflord',
    region: 'Inazuma',
    category: 'World Boss',
    summary:
      'Tsurumi Island Boss — inflicts party-wide Corrosion through shields and summons 3 Rifthound Skulls broken rapidly by Geo.',
    tacticalTip:
      'Bring Geo (Zibai, Noelle, or Kachina) to shatter the 3 Geo skulls quickly, plus a full-team Healer (Barbara, Noelle, Jahoda, or Baizhu) to counter Corrosion.',
    preferredArchetypes: ['lunar-crystallize', 'nightsoul-geo'],
    preferredElements: ['Geo', 'Hydro', 'Electro', 'Pyro'],
    requiresElements: ['Geo'],
    requiresHealer: true,
    keywords: ['golden wolflord', 'wolflord', 'corrosion', 'riftborn regalia', 'geo skulls', 'inazuma'],
  },
  {
    id: 'ruin-serpent',
    name: 'Ruin Serpent',
    region: 'Liyue',
    category: 'World Boss',
    summary:
      'Chasm Underground Boss — burrows frequently with short vulnerability windows and high Physical RES.',
    tacticalTip:
      'Use frontloaded elemental bursts and auto-targeting off-field sub-DPS (Fischl, Lauma, Mitya, Flins, Aino) so you deal damage even as it surfaces briefly.',
    preferredArchetypes: ['lunar-charged', 'lunar-bloom', 'stellar-conduct'],
    preferredElements: ['Electro', 'Hydro', 'Dendro', 'Cryo'],
    keywords: ['ruin serpent', 'serpent', 'chasm', 'runic fang', 'liyue'],
  },
  {
    id: 'jadeplume-terrorshroom',
    name: 'Jadeplume Terrorshroom',
    region: 'Sumeru',
    category: 'World Boss',
    dropsFor: ['Collei'],
    summary:
      'Sumeru Fungus Boss — 80% Dendro RES; Electro fills its Activation gauge until it collapses exhausted, while Pyro makes it spawn aggressive fungi.',
    tacticalTip:
      'Trigger Electro hits (Flins, Fischl, Mitya, Alyosha) to exhaust it quickly; avoid Dendro carries and avoid Pyro if you want cleaner stun windows.',
    preferredArchetypes: ['lunar-charged', 'stellar-conduct'],
    preferredElements: ['Electro', 'Hydro', 'Cryo', 'Anemo'],
    avoidElements: ['Dendro'],
    keywords: ['jadeplume', 'terrorshroom', 'chicken', 'mushroom', 'collei', 'majestic hooked beak', 'sumeru'],
  },
  {
    id: 'asimon',
    name: 'Algorithm of Semi-Intransient Matrix (ASIMON)',
    region: 'Sumeru',
    category: 'World Boss',
    dropsFor: ['Candace', 'Dehya'],
    summary:
      'Sumeru Desert Automaton — turns invisible with massive RES until hit by Quicken (Electro + Dendro) or until its broken parts are Electro-charged.',
    tacticalTip:
      'Pair Electro + Dendro (Lauma + Fischl/Flins/Mitya) to trigger Quicken and knock ASIMON out of invisibility immediately.',
    preferredArchetypes: ['lunar-bloom', 'ascendant-gleam-multi', 'lunar-charged'],
    preferredElements: ['Electro', 'Dendro', 'Hydro', 'Anemo'],
    requiresElements: ['Electro'],
    keywords: [
      'asimon',
      'algorithm',
      'semi-intransient',
      'matrix',
      'triangle',
      'invisible',
      'candace',
      'dehya',
      'sumeru',
    ],
  },
  {
    id: 'aeonblight-drake',
    name: 'Aeonblight Drake',
    region: 'Sumeru',
    category: 'World Boss',
    summary:
      'Sumeru Flying Ruin Drake — takes flight with 70% elemental absorption RES until its glowing wing cores are shot down.',
    tacticalTip:
      'Bring a Bow user (Fischl, Jahoda, Diona, or Collei) to snipe both wing cores, ground it immediately, and reset its absorbed elemental RES.',
    preferredArchetypes: ['lunar-charged', 'stellar-conduct', 'lunar-bloom'],
    preferredElements: ['Electro', 'Hydro', 'Cryo', 'Dendro', 'Anemo'],
    requiresBow: true,
    keywords: ['aeonblight', 'drake', 'flying', 'bow', 'wings', 'perpetual caliber', 'sumeru'],
  },
  {
    id: 'setekh-wenut',
    name: 'Setekh Wenut',
    region: 'Sumeru',
    category: 'World Boss',
    summary:
      'Sumeru Desert Worm — high Anemo RES, burrows constantly, and summons floating Windbite Bullets that must be swirled/hit by PECH elements.',
    tacticalTip:
      'Avoid Anemo main carries; bring Electro/Hydro/Pyro/Cryo AoE or Bow/Catalyst reach (Fischl, Mitya, Flins, Traveller) to pop 2 Windbite Bullets and drop its RES.',
    preferredArchetypes: ['stellar-conduct', 'lunar-charged', 'melt-cryo-pyro'],
    preferredElements: ['Electro', 'Cryo', 'Pyro', 'Hydro'],
    avoidElements: ['Anemo'],
    keywords: ['setekh', 'wenut', 'worm', 'windbite', 'pseudo-stamens', 'sumeru'],
  },
  {
    id: 'millennial-pearl-seahorse',
    name: 'Millennial Pearl Seahorse',
    region: 'Fontaine',
    category: 'World Boss',
    summary:
      'Fontaine Electro Beast — protected by an Electro Xenomare Pearl granting huge RES until shattered by Pyro, Cryo, or Dendro.',
    tacticalTip:
      'Bench Electro DPS; shred the Electro pearl rapidly with Cryo, Pyro, or Dendro (Cryo Traveller, Xiangling, Bennett, Lauma) to stun it.',
    preferredArchetypes: ['melt-cryo-pyro', 'lunar-bloom'],
    preferredElements: ['Cryo', 'Pyro', 'Dendro', 'Hydro'],
    requiresElements: ['Cryo', 'Pyro', 'Dendro'],
    avoidElements: ['Electro'],
    keywords: ['millennial', 'pearl', 'seahorse', 'xenomare', 'fontemer', 'fontaine'],
  },
  {
    id: 'solitary-suanni',
    name: 'Solitary Suanni',
    region: 'Liyue',
    category: 'World Boss',
    summary:
      'Chenyu Vale Beast — alternates between Hydro Aura (freeze & shatter to stun) and Anemo Aura (hit its Spiritwind Pearls with PECH elements).',
    tacticalTip:
      'Bring Cryo (Cryo Traveller or Kaeya) plus Pyro/Electro/Claymore to freeze and shatter its Hydro form, then pop its Anemo pearls cleanly.',
    preferredArchetypes: ['stellar-conduct', 'melt-cryo-pyro'],
    preferredElements: ['Cryo', 'Electro', 'Pyro'],
    requiresElements: ['Cryo'],
    keywords: ['solitary suanni', 'suanni', 'chenyu vale', 'cloudseam scale', 'liyue'],
  },
  {
    id: 'yumkasaur-mountain-king',
    name: 'Gluttonous Yumkasaur Mountain King',
    region: 'Natlan',
    category: 'World Boss',
    dropsFor: ['Kachina'],
    summary:
      'Natlan Saurian Boss — 70% Dendro RES and spits out Flamegranates that explode on it for massive Pyro self-damage when ignited.',
    tacticalTip:
      'Bring Pyro (Bennett, Xiangling, Dehya) to ignite its Flamegranates before it swallows them, and avoid Dendro carries.',
    preferredArchetypes: ['melt-cryo-pyro', 'overloaded-chevreuse'],
    preferredElements: ['Pyro', 'Cryo', 'Electro', 'Geo'],
    requiresElements: ['Pyro'],
    avoidElements: ['Dendro'],
    keywords: ['yumkasaur', 'mountain king', 'kongamato', 'flamegranate', 'kachina', 'natlan'],
  },
  {
    id: 'goldflame-qucusaur-tyrant',
    name: 'Goldflame Qucusaur Tyrant',
    region: 'Natlan',
    category: 'World Boss',
    summary:
      'Natlan Aerial Boss — flies high inside a Pyro shield and drops Flamewind Feathers that must be extinguished to force a landing.',
    tacticalTip:
      'Avoid Pyro carries and bring Hydro (Aino, Barbara, Candace) to extinguish its feathers and Pyro shield fast, then burst with Lunar-Charged or Electro.',
    preferredArchetypes: ['lunar-charged', 'lunar-bloom', 'lunar-crystallize'],
    preferredElements: ['Hydro', 'Electro', 'Cryo', 'Anemo'],
    requiresElements: ['Hydro'],
    avoidElements: ['Pyro'],
    keywords: ['goldflame', 'qucusaur', 'tyrant', 'pyro shield', 'flying', 'natlan'],
  },
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

  // === WEEKLY TROUNCE BOSSES ===
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
    requiresElements: ['Electro'],
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
    requiresShielder: true,
    keywords: ['azhdaha', 'weekly', 'trounce', 'shield', 'liyue'],
  },
  {
    id: 'stormterror-dvalin',
    name: 'Stormterror (Dvalin)',
    region: 'Mondstadt',
    category: 'Weekly Boss',
    summary:
      'Mondstadt Weekly Dragon — high Anemo RES; break his claw shield on the platform, climb his neck, and burst his glowing horn.',
    tacticalTip:
      'Avoid Anemo carries; bring high burst DPS and/or a Bow user (Fischl, Flins, Mitya, Xiangling + Bennett) to break his claw and melt the horn in 1–2 cycles.',
    preferredArchetypes: ['stellar-conduct', 'melt-cryo-pyro', 'lunar-charged'],
    preferredElements: ['Electro', 'Pyro', 'Cryo', 'Hydro'],
    avoidElements: ['Anemo'],
    keywords: ['stormterror', 'dvalin', 'dragon', 'weekly', 'trounce', 'mondstadt'],
  },
  {
    id: 'andrius-wolf',
    name: 'Andrius (Wolf of the North / Lupus Boreas)',
    region: 'Mondstadt',
    category: 'Weekly Boss',
    summary:
      'Mondstadt Weekly Boss — 100% IMMUNE to BOTH Cryo and Anemo DMG across the entire fight.',
    tacticalTip:
      'Bench all Cryo and Anemo characters (Traveller, Kaeya, Jahoda, Sucrose, Mizuki)! Clear effortlessly with Pyro, Electro, Hydro, Dendro, or Geo (Flins/Aino/Fischl/Barbara or Bennett/Xiangling).',
    preferredArchetypes: ['lunar-bloom', 'lunar-crystallize', 'overloaded-chevreuse'],
    preferredElements: ['Pyro', 'Electro', 'Hydro', 'Dendro', 'Geo'],
    avoidElements: ['Cryo', 'Anemo'],
    keywords: [
      'andrius',
      'wolf',
      'wolf of the north',
      'lupus boreas',
      'boreas',
      'cryo immune',
      'anemo immune',
      'weekly',
      'mondstadt',
    ],
  },
  {
    id: 'childe-weekly',
    name: 'Childe (Tartaglia — Golden House)',
    region: 'Liyue',
    category: 'Weekly Boss',
    summary:
      'Liyue Weekly Boss — high Hydro RES in Phase 1 and high Electro RES in Phase 2/3, plus Riptide burst marks.',
    tacticalTip:
      'Pyro, Cryo, Dendro, and Geo (Reverse Melt or Lunar-Crystallize) bypass both his Hydro and Electro resistances cleanly.',
    preferredArchetypes: ['melt-cryo-pyro', 'lunar-crystallize', 'lunar-bloom'],
    preferredElements: ['Pyro', 'Cryo', 'Geo', 'Dendro'],
    keywords: ['childe', 'tartaglia', 'golden house', 'foul legacy', 'weekly', 'trounce', 'liyue'],
  },
  {
    id: 'la-signora-weekly',
    name: 'La Signora (Crimson Witch of Embers)',
    region: 'Inazuma',
    category: 'Weekly Boss',
    summary:
      'Inazuma Weekly Boss — Phase 1 is Cryo (Sheer Cold) and Phase 2 is Pyro (Blazing Heat); deals constant environmental drain.',
    tacticalTip:
      'Bring a strong Healer plus mixed elements (Hydro + Electro/Pyro/Cryo — e.g. Flins/Aino/Fischl/Jahoda or Bennett/Xiangling) to handle both temperature phases.',
    preferredArchetypes: ['lunar-charged', 'lunar-bloom', 'lunar-crystallize'],
    preferredElements: ['Hydro', 'Electro', 'Dendro', 'Geo'],
    requiresHealer: true,
    keywords: ['signora', 'la signora', 'crimson witch', 'sheer cold', 'weekly', 'trounce', 'inazuma'],
  },
  {
    id: 'scaramouche-weekly',
    name: 'Everlasting Lord of Arcane Wisdom (Scaramouche)',
    region: 'Sumeru',
    category: 'Weekly Boss',
    summary:
      'Sumeru Weekly Mech Boss — high Electro RES and summons 4 Nirvana Engines (3 airborne) during his one-shot charge.',
    tacticalTip:
      'Avoid Electro carries; bring Pyro, Cryo, or Dendro with ranged/bow reach (Cryo Traveller, Bennett, Xiangling, Lauma, Collei/Diona) to pop Nirvana Engines quickly.',
    preferredArchetypes: ['melt-cryo-pyro', 'lunar-bloom'],
    preferredElements: ['Pyro', 'Cryo', 'Dendro', 'Hydro'],
    requiresElements: ['Pyro', 'Cryo', 'Dendro'],
    avoidElements: ['Electro'],
    keywords: ['scaramouche', 'shouki no kami', 'arcane wisdom', 'wanderer boss', 'weekly', 'trounce', 'sumeru'],
  },
  {
    id: 'apep-weekly',
    name: "Guardian of Apep's Oasis",
    region: 'Sumeru',
    category: 'Weekly Boss',
    summary:
      'Sumeru Weekly Dragon — 70% Dendro RES and features a multi-wave add defense phase plus massive AoE shockwaves.',
    tacticalTip:
      'Avoid Dendro carries; bring AoE elemental reactions (Stellar-Conduct, Lunar-Charged, or Melt) and a reliable Healer for the middle wave.',
    preferredArchetypes: ['lunar-charged', 'stellar-conduct', 'melt-cryo-pyro'],
    preferredElements: ['Electro', 'Hydro', 'Cryo', 'Pyro', 'Anemo'],
    avoidElements: ['Dendro'],
    requiresHealer: true,
    keywords: ['apep', 'oasis', 'dendro dragon', 'weekly', 'trounce', 'sumeru'],
  },
  {
    id: 'all-devouring-narwhal',
    name: 'All-Devouring Narwhal',
    region: 'Fontaine',
    category: 'Weekly Boss',
    summary:
      'Fontaine Weekly Whale — 70% Hydro RES; swallows you to fight a Dark Shadow phantom that stuns instantly to Arkhe attacks.',
    tacticalTip:
      'Avoid Hydro carries; Electro, Pyro, Cryo, or Dendro cores (plus optional Arkhe from Lynette/Charlotte) shred the phantom and whale quickly.',
    preferredArchetypes: ['stellar-conduct', 'melt-cryo-pyro', 'overloaded-chevreuse'],
    preferredElements: ['Electro', 'Cryo', 'Pyro', 'Dendro', 'Anemo'],
    avoidElements: ['Hydro'],
    keywords: ['narwhal', 'whale', 'all-devouring', 'dark shadow', 'arkhe', 'weekly', 'trounce', 'fontaine'],
  },

  // === ELITES, ELEMENTAL SHIELDS & OVERWORLD OPPONENTS ===
  {
    id: 'pyro-shield-enemies',
    name: 'Pyro Abyss Mage / Abyss Lector (Pyro Shield)',
    region: 'Mondstadt',
    category: 'Elite & Shields',
    summary:
      'Pyro-shielded enemies (Pyro Abyss Mages, Abyss Lector: Fathomless Flames, Pyro Fatui) — completely block Pyro damage until the shield breaks.',
    tacticalTip:
      'Bring Hydro (Aino, Barbara, Candace) to shatter Pyro shields twice as fast as any other element, and avoid Pyro main DPS.',
    preferredArchetypes: ['lunar-charged', 'lunar-bloom', 'lunar-crystallize'],
    preferredElements: ['Hydro', 'Electro', 'Cryo', 'Dendro'],
    requiresElements: ['Hydro'],
    avoidElements: ['Pyro'],
    keywords: [
      'pyro abyss mage',
      'abyss mage',
      'abyss lector',
      'fathomless flames',
      'pyro shield',
      'pyro slime',
      'pyro whopperflower',
      'shield',
    ],
  },
  {
    id: 'cryo-shield-enemies',
    name: 'Cryo Abyss Mage / Abyss Herald (Cryo Shield)',
    region: 'Mondstadt',
    category: 'Elite & Shields',
    summary:
      'Cryo-shielded enemies (Cryo Abyss Mages, Cryo Abyss Heralds, Cryo Fatui Gunners, Frostarm Lawachurls) — immune to Cryo while shielded.',
    tacticalTip:
      'Bring Pyro (Bennett, Xiangling, Dehya) to melt Cryo shields rapidly; Electro (Overloaded/Superconduct) also helps chip shields down.',
    preferredArchetypes: ['overloaded-chevreuse', 'lunar-charged'],
    preferredElements: ['Pyro', 'Electro', 'Anemo'],
    requiresElements: ['Pyro'],
    avoidElements: ['Cryo'],
    keywords: [
      'cryo abyss mage',
      'abyss mage',
      'abyss herald',
      'frost fall',
      'cryo shield',
      'cryo slime',
      'frostarm lawachurl',
      'shield',
    ],
  },
  {
    id: 'hydro-shield-enemies',
    name: 'Hydro Abyss Mage / Abyss Herald (Hydro Shield)',
    region: 'Mondstadt',
    category: 'Elite & Shields',
    summary:
      'Hydro-shielded enemies (Hydro Abyss Mages, Abyss Herald: Wicked Torrents, Hydro Fatui) — completely immune to Hydro while shielded.',
    tacticalTip:
      'Dendro (Lauma) and Cryo (Cryo Traveller, Kaeya) shred Hydro shields fastest while keeping enemies frozen or Bloom-locked; drop Hydro units.',
    preferredArchetypes: ['stellar-conduct', 'melt-cryo-pyro'],
    preferredElements: ['Dendro', 'Cryo', 'Electro', 'Pyro'],
    requiresElements: ['Dendro', 'Cryo'],
    avoidElements: ['Hydro'],
    keywords: [
      'hydro abyss mage',
      'abyss mage',
      'abyss herald',
      'wicked torrents',
      'hydro shield',
      'hydro slime',
      'shield',
    ],
  },
  {
    id: 'electro-shield-enemies',
    name: 'Electro Abyss Mage / Abyss Lector (Electro Shield)',
    region: 'Inazuma',
    category: 'Elite & Shields',
    summary:
      'Electro-shielded enemies (Electro Abyss Mages, Abyss Lector: Violet Lightning, Electro Fatui Hammer) — block Electro and drain Energy.',
    tacticalTip:
      'Leave Electro carries benched — Cryo, Pyro, and Dendro (Cryo Traveller, Xiangling, Bennett, Lauma) strip Electro shields fast.',
    preferredArchetypes: ['melt-cryo-pyro', 'lunar-bloom'],
    preferredElements: ['Pyro', 'Cryo', 'Dendro', 'Anemo'],
    requiresElements: ['Pyro', 'Cryo', 'Dendro'],
    avoidElements: ['Electro'],
    keywords: [
      'electro abyss mage',
      'abyss mage',
      'abyss lector',
      'violet lightning',
      'electro shield',
      'electro slime',
      'fatui electrohammer',
      'shield',
    ],
  },
  {
    id: 'ruin-machines',
    name: 'Ruin Guards, Ruin Graders & Ruin Hunters',
    region: 'Mondstadt',
    category: 'Elite & Shields',
    summary:
      'Heavy mechanical automatons with 70% Physical RES and glowing eye/leg weakpoints that stun them when struck by aimed shots.',
    tacticalTip:
      'Use elemental reaction teams (Lunar-Charged, Stellar-Conduct, Melt) and bring a Bow character (Fischl or Jahoda) to snipe weakpoints and ground Ruin Hunters.',
    preferredArchetypes: ['lunar-charged', 'stellar-conduct', 'lunar-bloom'],
    preferredElements: ['Electro', 'Hydro', 'Cryo', 'Pyro', 'Dendro'],
    requiresBow: true,
    keywords: ['ruin guard', 'ruin grader', 'ruin hunter', 'ruin machine', 'automaton', 'physical res', 'bow'],
  },
  {
    id: 'eye-of-the-storm',
    name: 'Eye of the Storm',
    region: 'Mondstadt',
    category: 'Elite & Shields',
    summary:
      'Airborne Mondstadt Elite — 100% immune to Anemo DMG and hovers out of melee reach during windstorms.',
    tacticalTip:
      'Avoid Anemo characters and bring a Bow/ranged attacker (Fischl, Mitya, Barbara, Lisa) to knock it out of the sky and burst it down.',
    preferredArchetypes: ['stellar-conduct', 'melt-cryo-pyro', 'lunar-charged'],
    preferredElements: ['Electro', 'Cryo', 'Pyro', 'Hydro'],
    avoidElements: ['Anemo'],
    requiresBow: true,
    keywords: ['eye of the storm', 'anemo immune', 'flying', 'airborne', 'mondstadt', 'elite'],
  },
  {
    id: 'fatui-skirmishers',
    name: 'Fatui Skirmishers (Elemental Armor)',
    region: 'Snezhnaya',
    category: 'Elite & Shields',
    summary:
      'Mixed squads of Pyro, Cryo, Hydro, and Electro Fatui that raise high-RES elemental armor if not burst down or countered.',
    tacticalTip:
      'Bring diverse elements (e.g., Hydro + Cryo + Electro + Pyro or Anemo Swirl) to break any armor combination cleanly before they buff up.',
    preferredArchetypes: ['stellar-conduct', 'lunar-charged', 'melt-cryo-pyro'],
    preferredElements: ['Hydro', 'Cryo', 'Electro', 'Pyro'],
    keywords: ['fatui', 'skirmisher', 'electrohammer', 'cryogunner', 'hydrogunner', 'pyroslinger', 'armor'],
  },
  {
    id: 'geo-mitachurl-lawachurl',
    name: 'Geo Shield Mitachurls & Stonehide Lawachurls',
    region: 'Liyue',
    category: 'Elite & Shields',
    summary:
      'Heavy-armored Hilichurl elites carrying Geo shields or rock armor that shrug off light sword/bow attacks.',
    tacticalTip:
      'Bring Claymore, Geo, or Overloaded (Zibai + Noelle, Aino, Dehya, or Bennett/Xiangling + Electro) to shatter Geo armor quickly.',
    preferredArchetypes: ['lunar-crystallize', 'overloaded-chevreuse', 'lunar-charged'],
    preferredElements: ['Geo', 'Hydro', 'Electro', 'Pyro'],
    requiresClaymoreOrGeo: true,
    keywords: ['mitachurl', 'lawachurl', 'stonehide', 'geo shield', 'hilichurl', 'wooden shield', 'rock shield'],
  },
  {
    id: 'rifthounds-corrosion',
    name: 'Rifthounds (Corrosion Pack)',
    region: 'Inazuma',
    category: 'Elite & Shields',
    summary:
      'Abyssal wolves whose attacks inflict stackable party-wide Corrosion HP drain that bypasses shields completely.',
    tacticalTip:
      'A dedicated Healer (Barbara, Jahoda, Bennett, Alyosha, or Baizhu) is mandatory; shields alone will not stop Corrosion.',
    preferredArchetypes: ['lunar-charged', 'stellar-conduct', 'lunar-bloom'],
    preferredElements: ['Electro', 'Hydro', 'Cryo', 'Dendro', 'Anemo'],
    requiresHealer: true,
    keywords: ['rifthound', 'corrosion', 'wolf', 'bleed', 'healer', 'inazuma'],
  },
  {
    id: 'shadowy-husks',
    name: 'Shadowy Husks & Black Serpent Knights',
    region: 'Liyue',
    category: 'Elite & Shields',
    summary:
      'Abyssal knights that gain shields, heals, or huge buffs whenever their attacks strike a player character protected by a shield.',
    tacticalTip:
      'Do NOT bring Shielders (Noelle, Diona, Lan Yan, Thoma, Baizhu)! Use pure Healing (Bennett, Barbara, Jahoda, Alyosha, Mizuki) instead.',
    preferredArchetypes: ['lunar-charged', 'stellar-conduct', 'melt-cryo-pyro'],
    preferredElements: ['Electro', 'Hydro', 'Cryo', 'Pyro', 'Anemo'],
    requiresHealer: true,
    avoidShielder: true,
    keywords: ['shadowy husk', 'black serpent', 'serpent knight', 'anti shield', 'no shield', 'chasm'],
  },
  {
    id: 'consecrated-beasts',
    name: 'Consecrated Beasts',
    region: 'Sumeru',
    category: 'Elite & Shields',
    summary:
      'Hyper-aggressive mutated predators with high elemental RES and heavy combo damage that drop Phagocytic Energy Blocks mid-fight.',
    tacticalTip:
      'Bring sturdy sustain (Healer + Shielder or high-uptime healing) and multi-element reactions so you can break their Energy Blocks and stun them.',
    preferredArchetypes: ['lunar-charged', 'lunar-bloom', 'stellar-conduct', 'lunar-crystallize'],
    preferredElements: ['Electro', 'Hydro', 'Dendro', 'Cryo', 'Geo'],
    requiresHealer: true,
    keywords: ['consecrated', 'beast', 'scorpion', 'vulture', 'serpent', 'fanged', 'horn', 'sumeru'],
  },
  {
    id: 'slimes-specters-pack',
    name: 'Elemental Slimes & Specters (Mixed Pack)',
    region: 'Inazuma',
    category: 'Elite & Shields',
    summary:
      'Elemental lifeforms that are 100% immune to their own element — Specters float over ledges and resist crowd-control pull.',
    tacticalTip:
      'Run 3–4 distinct elements with auto-targeting ranged/off-field damage (Fischl, Mitya, Aino, Lauma, Traveller) so no immunity can stall your clear.',
    preferredArchetypes: ['ascendant-gleam-multi', 'lunar-bloom', 'stellar-conduct'],
    preferredElements: ['Electro', 'Hydro', 'Dendro', 'Cryo', 'Pyro'],
    keywords: ['slime', 'specter', 'spectre', 'eidolon', 'phantasm', 'whopperflower', 'mixed', 'immune'],
  },
];
