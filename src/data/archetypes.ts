import type { ArchetypeDefinition } from '../types/genshin';

export const ARCHETYPES: ArchetypeDefinition[] = [
  {
    id: 'stellar-conduct',
    name: 'Stellar-Conduct',
    category: 'Stellar',
    summary:
      'Cryo + Electro Stellar Glimmer reaction powered by Cryo Traveller (and Alyosha as dedicated support/healer).',
    keyElements: ['Cryo', 'Electro'],
    requiredTags: ['stellar-conduct'],
    prefersStellar: true,
    highlightNote:
      'Trigger Cryo + Electro with Cryo Traveller on-field to enter Radiance: Stellar-Conduct. Fischl provides steady Electro battery; leveling Alyosha unlocks a dedicated Stellar-Conduct healer.',
  },
  {
    id: 'stellar-swirl',
    name: 'Stellar Swirl',
    category: 'Stellar',
    summary:
      'Cryo + Anemo Stellar Glimmer state pairing Cryo Traveller with Anemo Swirl drivers or buffers.',
    keyElements: ['Cryo', 'Anemo'],
    requiredTags: ['stellar-glimmer'],
    prefersStellar: true,
    highlightNote:
      'Pairs Cryo Traveller with Yumemizuki Mizuki, Sucrose, or Jahoda to maintain Radiance: Stellar Swirl and buff active-character damage.',
  },
  {
    id: 'lunar-charged',
    name: 'Lunar-Charged',
    category: 'Lunar',
    summary:
      'Flins converts Electro-Charged (Electro + Hydro) into crittable Lunar-Charged strikes; thrives at Moonsign 2+ (Ascendant Gleam).',
    keyElements: ['Electro', 'Hydro'],
    requiredTags: ['lunar-charged'],
    prefersMoonsign: true,
    highlightNote:
      'Pair Flins with Hydro (Aino, Barbara, Candace) and at least one other Moonsign character (Aino or Jahoda) to unlock Ascendant Gleam thundercloud bonuses.',
  },
  {
    id: 'lunar-bloom',
    name: 'Lunar-Bloom / Hyperbloom',
    category: 'Lunar',
    summary:
      'Lauma converts Bloom (Dendro + Hydro) into EM-scaling Lunar-Bloom damage, with optional Electro for Hyperbloom detonation.',
    keyElements: ['Dendro', 'Hydro', 'Electro'],
    requiredTags: ['lunar-bloom'],
    prefersMoonsign: true,
    highlightNote:
      'Lauma + Aino hits Ascendant Gleam immediately. Add Fischl for Hyperbloom or Barbara/Jahoda/Baizhu for comfort healing.',
  },
  {
    id: 'lunar-crystallize',
    name: 'Lunar-Crystallize',
    category: 'Lunar',
    summary:
      'Zibai converts Hydro-Crystallize (Geo + Hydro) into Moondrift bursts with Geo Resonance durability.',
    keyElements: ['Geo', 'Hydro'],
    requiredTags: ['lunar-crystallize'],
    prefersMoonsign: true,
    highlightNote:
      'Zibai + Aino activates Ascendant Gleam and reliable Hydro aura. Add Noelle (Geo Resonance + Shield/Heal) or Kachina (Nightsoul) for massive uptime.',
  },
  {
    id: 'ascendant-gleam-multi',
    name: 'Multi-Lunar Ascendant',
    category: 'Lunar',
    summary:
      'Stacks 3–4 Moonsign units (Flins + Lauma + Aino + Jahoda) for layered Lunar-Charged, Lunar-Bloom, and Hyperbloom.',
    keyElements: ['Electro', 'Dendro', 'Hydro', 'Anemo'],
    requiredTags: ['moonsign'],
    prefersMoonsign: true,
    highlightNote:
      'Maximizes Nod-Krai Ascendant Gleam uptime with simultaneous Electro, Dendro, and Hydro Lunar triggers.',
  },
  {
    id: 'overloaded-chevreuse',
    name: 'Overloaded (Chevreuse)',
    category: 'Specialist',
    summary:
      'Strict Pyro + Electro party unlocking Chevreuse’s 40% Pyro/Electro RES shred and ATK buff.',
    keyElements: ['Pyro', 'Electro'],
    requiredTags: ['overloaded-specialist'],
    strictElementsOnly: ['Pyro', 'Electro'],
    highlightNote:
      'Requires ONLY Pyro and Electro members! Toggle "Include Unbuilt" to test Lv 1 Chevreuse with Flins, Fischl, Bennett, or Xiangling.',
  },
  {
    id: 'melt-cryo-pyro',
    name: 'Melt / Reverse Melt',
    category: 'Elemental',
    summary:
      'Amplifying Cryo + Pyro reaction core anchored by Cryo Traveller or Kaeya alongside Xiangling & Bennett.',
    keyElements: ['Cryo', 'Pyro'],
    highlightNote:
      'Bennett + Xiangling grants Pyro Resonance (+25% ATK) and relentless off-field Pyro for Melt reactions and Cryo shield melting.',
  },
  {
    id: 'swirl-taser',
    name: 'Anemo Swirl Driver',
    category: 'Elemental',
    summary:
      'On-field Anemo driver (Yumemizuki Mizuki or Sucrose) swirling Electro + Hydro/Pyro off-field sub-DPS.',
    keyElements: ['Anemo', 'Electro', 'Hydro'],
    highlightNote:
      'Yumemizuki Mizuki covers both Swirl Driver and Healer in one slot, freeing three slots for off-field damage like Fischl, Aino, Xiangling, or Lauma.',
  },
  {
    id: 'nightsoul-geo',
    name: 'Nightsoul & Geo Core',
    category: 'Specialist',
    summary:
      'Geo Resonance durability paired with Kachina’s Nightsoul Blessing for Natlan mechanics and Void Wards.',
    keyElements: ['Geo', 'Hydro', 'Pyro'],
    requiredTags: ['nightsoul'],
    highlightNote:
      'Pairs Zibai + Kachina for Geo Resonance (+15% DMG while shielded) and Natlan Nightsoul triggers.',
  },
  {
    id: 'arkhe-ousia',
    name: 'Fontaine Arkhe (Ousia)',
    category: 'Specialist',
    summary:
      'Includes Lynette’s Ousia alignment to stun Pneuma-charged Fontaine Clockwork Meka and bosses.',
    keyElements: ['Anemo', 'Dendro', 'Hydro'],
    requiredTags: ['arkhe-ousia'],
    highlightNote:
      'Slotting Lynette provides instant Ousia neutralization alongside a strong Lunar-Bloom or Lunar-Charged core.',
  },
];
