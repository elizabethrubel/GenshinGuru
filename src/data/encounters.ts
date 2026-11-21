import type { EncounterDefinition } from '../types/genshin';

export const ENCOUNTERS: EncounterDefinition[] = [
  {
    id: 'snezhnaya-stellar-boss',
    name: 'Snezhnaya Stellar-Conduct Checks / Cryo-Weak Bosses',
    region: 'Snezhnaya',
    category: 'Boss',
    summary:
      'Encounters rewarding Stellar Glimmer damage and rapid Cryo + Electro Stellar-Conduct triggers.',
    tacticalTip:
      'Anchor around Cryo Traveller + Fischl (or Alyosha once leveled) to sustain Radiance: Stellar-Conduct.',
    preferredArchetypes: ['stellar-conduct', 'melt-cryo-pyro'],
    preferredElements: ['Cryo', 'Electro', 'Pyro'],
    requiredTags: ['stellar-conduct'],
    keywords: ['snezhnaya', 'stellar', 'conduct', 'frost', 'cryo', 'glimmer'],
    matchedPresetRegion: 'Snezhnaya',
  },
  {
    id: 'nod-krai-ascendant',
    name: 'Nod-Krai Ascendant Gleam / Lunar Check Bosses',
    region: 'Nod-Krai',
    category: 'Boss',
    summary:
      'High-HP Nod-Krai bosses & Abyss chambers with Lunar Reaction / Ascendant Gleam damage checks.',
    tacticalTip:
      'Bring at least 2 Moonsign characters (e.g., Flins/Lauma/Zibai + Aino or Jahoda) to guarantee Moonsign: Ascendant Gleam.',
    preferredArchetypes: [
      'ascendant-gleam-multi',
      'lunar-charged',
      'lunar-bloom',
      'lunar-crystallize',
    ],
    preferredElements: ['Electro', 'Hydro', 'Dendro', 'Anemo'],
    requiredTags: ['moonsign'],
    keywords: [
      'nod-krai',
      'lunar',
      'moonsign',
      'ascendant',
      'gleam',
      'frost moon',
      'hiisi',
    ],
    matchedPresetRegion: 'Nod-Krai',
  },
  {
    id: 'tenebrous-mimic',
    name: 'Tenebrous Mimic / Natlan Void Ward',
    region: 'Natlan',
    category: 'Shield & Mechanic',
    summary:
      'Void Ward shields require rapid elemental hit frequency (Electro-Charged / Lunar-Charged / Burning / Nightsoul hits).',
    tacticalTip:
      'Fast multi-hit teams like Flins + Fischl + Aino + Jahoda shred Void Wards quickly; Kachina adds Nightsoul bonus hits.',
    preferredArchetypes: ['lunar-charged', 'nightsoul-geo', 'swirl-taser'],
    preferredElements: ['Electro', 'Hydro', 'Pyro', 'Geo'],
    keywords: [
      'tenebrous',
      'mimic',
      'void ward',
      'natlan',
      'nightsoul',
      'papilla',
      'sacred mountain',
    ],
    matchedPresetRegion: 'Ancient Sacred Mountain (Natlan)',
  },
  {
    id: 'geo-golem-shields',
    name: 'Geo Shields / Golems / Golden Wolflord / Chasm',
    region: 'Liyue / Fontaine',
    category: 'Shield & Mechanic',
    summary:
      'Heavy Geo armor (Legatus Golem, Geo Lawachurls, Chasm rocks) requiring Geo, Claymore, or Overloaded blunt damage.',
    tacticalTip:
      'Zibai + Noelle (Claymore + Geo Resonance) + Aino breaks Geo armor cleanly while dealing Lunar-Crystallize burst.',
    preferredArchetypes: ['lunar-crystallize', 'overloaded-chevreuse'],
    preferredElements: ['Geo', 'Hydro', 'Electro', 'Pyro'],
    keywords: [
      'geo',
      'golem',
      'legatus',
      'chasm',
      'shieldbreaker',
      'wolflord',
      'bedrock',
      'bygone eras',
      'claymore',
    ],
    matchedPresetRegion: 'Sea of Bygone Eras (Fontaine)',
  },
  {
    id: 'abyss-lector-electro-pyro',
    name: 'Abyss Lectors & Vishaps (Elemental Shields)',
    region: 'Enkanomiya / Abyss',
    category: 'Shield & Mechanic',
    summary:
      'Multi-element Abyss shields & Energy-draining Bathysmal Vishaps demanding Pyro, Hydro, Cryo, or Dendro gauge.',
    tacticalTip:
      'Bring mixed elemental application (Hydro + Pyro + Electro/Dendro) and strong Energy batteries like Fischl or Bennett.',
    preferredArchetypes: ['lunar-charged', 'lunar-bloom', 'melt-cryo-pyro'],
    preferredElements: ['Hydro', 'Pyro', 'Electro', 'Dendro'],
    keywords: [
      'lector',
      'herald',
      'abyss',
      'vishap',
      'enkanomiya',
      'baptist',
      'shield',
    ],
    matchedPresetRegion: 'Enkanomiya (Inazuma)',
  },
  {
    id: 'cryo-shields-dragonspine',
    name: 'Cryo Shields / Fatui Skirmishers / Dragonspine',
    region: 'Mondstadt',
    category: 'Shield & Mechanic',
    summary:
      'Cryo Abyss Mages, Cryo Fatui, Frostarm Lawachurls, and Sheer Cold zones that demand strong Pyro application.',
    tacticalTip:
      'Bennett + Xiangling instantly melts Cryo shields and keeps Sheer Cold in check while buffing your main DPS.',
    preferredArchetypes: ['melt-cryo-pyro', 'overloaded-chevreuse'],
    preferredElements: ['Pyro', 'Electro', 'Cryo'],
    keywords: [
      'cryo shield',
      'dragonspine',
      'sheer cold',
      'fatui',
      'ice',
      'lawachurl',
      'cryo hypostasis',
    ],
    matchedPresetRegion: 'Dragonspine (Mondstadt)',
  },
  {
    id: 'pyro-shields-enemies',
    name: 'Pyro Shields / Pyro Hypostasis / Lava Avatars',
    region: 'General',
    category: 'Shield & Mechanic',
    summary:
      'Pyro-immune or Pyro-shielded bosses needing steady Hydro gauge application.',
    tacticalTip:
      'Aino + Barbara or Candace strips Pyro shields rapidly while enabling Flins (Lunar-Charged) or Lauma (Lunar-Bloom).',
    preferredArchetypes: ['lunar-charged', 'lunar-bloom', 'lunar-crystallize'],
    preferredElements: ['Hydro', 'Electro', 'Dendro', 'Geo'],
    avoidElements: ['Pyro'],
    keywords: ['pyro shield', 'pyro', 'lava', 'hypostasis', 'fire', 'lectors'],
  },
  {
    id: 'hydro-tulpa-mimics',
    name: 'Hydro Tulpa / Oceanid / Hydro-Immune Bosses',
    region: 'Fontaine / Liyue',
    category: 'Boss',
    summary:
      'Innate permanent Hydro aura — immune to Hydro DMG, enabling free Vaporize, Hyperbloom, Lunar-Bloom, or Lunar-Charged without a Hydro slot.',
    tacticalTip:
      'Drop Hydro DPS/supports and bring Dendro (Lauma), Pyro (Xiangling/Bennett), Electro (Flins/Fischl), or Cryo!',
    preferredArchetypes: ['melt-cryo-pyro', 'stellar-conduct', 'overloaded-chevreuse'],
    preferredElements: ['Dendro', 'Pyro', 'Electro', 'Cryo'],
    avoidElements: ['Hydro'],
    keywords: ['tulpa', 'oceanid', 'hydro', 'mimic', 'water', 'immune'],
  },
  {
    id: 'electro-immune-thunder',
    name: 'Thunder Manifestation / Electro-Immune Bosses',
    region: 'Inazuma',
    category: 'Boss',
    summary:
      'Airborne/mobile Electro-immune boss that punishes Electro carries and rewards Pyro, Cryo, Dendro, or Geo.',
    tacticalTip:
      'Avoid Flins/Fischl here; use Zibai Lunar-Crystallize, Lauma Lunar-Bloom (without Electro), or Cryo/Pyro Melt.',
    preferredArchetypes: ['melt-cryo-pyro', 'lunar-crystallize', 'lunar-bloom'],
    preferredElements: ['Pyro', 'Cryo', 'Dendro', 'Geo', 'Hydro'],
    avoidElements: ['Electro'],
    keywords: ['thunder', 'manifestation', 'electro', 'inazuma', 'immune'],
  },
  {
    id: 'fontaine-arkhe-meka',
    name: 'Fontaine Clockwork Meka / Coppelia & Coppelius',
    region: 'Fontaine',
    category: 'Boss',
    summary:
      'Pneuma-aligned bosses and Clockwork Meka vulnerable to Arkhe: Ousia interruptions and shield breaks.',
    tacticalTip:
      'Slot Lynette (Ousia) or rely on brute elemental shield break (Pyro/Electro/Geo) alongside your strongest Lunar core.',
    preferredArchetypes: ['arkhe-ousia', 'lunar-bloom', 'lunar-charged'],
    preferredElements: ['Anemo', 'Dendro', 'Hydro', 'Electro'],
    requiredTags: ['arkhe-ousia'],
    keywords: [
      'fontaine',
      'arkhe',
      'ousia',
      'pneuma',
      'coppelia',
      'coppelius',
      'meka',
      'icewind',
    ],
    matchedPresetRegion: 'Fontaine',
  },
  {
    id: 'abyss-aoe-crowd',
    name: 'Spiral Abyss: Multi-Wave AoE Crowds',
    region: 'Spiral Abyss',
    category: 'Abyss / Domain',
    summary:
      'Multi-enemy chambers rewarding Anemo grouping, Swirl chains, and wide AoE Lunar/Electro-Charged arcs.',
    tacticalTip:
      'Sucrose, Yumemizuki Mizuki, or Jahoda groups and swirls while Flins/Lauma/Xiangling clear waves simultaneously.',
    preferredArchetypes: ['swirl-taser', 'lunar-charged', 'ascendant-gleam-multi'],
    preferredElements: ['Anemo', 'Electro', 'Hydro', 'Pyro', 'Dendro'],
    keywords: ['aoe', 'crowd', 'waves', 'grouping', 'abyss', 'domain', 'swirl'],
    matchedPresetRegion: 'Temple of Space (Mondstadt)',
  },
  {
    id: 'abyss-single-target',
    name: 'Spiral Abyss: High-HP Single-Target Boss',
    region: 'Spiral Abyss',
    category: 'Abyss / Domain',
    summary:
      'DPS-check boss chamber requiring sustained reaction output, strong buffs, and tight survivability.',
    tacticalTip:
      'Bring your highest-level Lv 90 carries (Flins, Zibai, Lauma, Cryo Traveller) paired with Bennett or Ascendant Gleam supports.',
    preferredArchetypes: [
      'lunar-charged',
      'lunar-crystallize',
      'stellar-conduct',
      'lunar-bloom',
    ],
    preferredElements: ['Electro', 'Hydro', 'Geo', 'Cryo', 'Pyro', 'Dendro'],
    keywords: ['boss', 'single target', 'dps check', 'abyss', 'floor 12', 'weekly'],
  },
];
