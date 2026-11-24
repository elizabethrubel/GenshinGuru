import type { EncounterDefinition } from '../types/genshin';

export type AbyssFloorNumber = 9 | 10 | 11 | 12;

export interface AbyssChamberLineup {
  chamber: 1 | 2 | 3;
  enemies: string[];
  note?: string;
}

export interface AbyssHalfSchedule {
  buff?: string;
  chambers: [AbyssChamberLineup, AbyssChamberLineup, AbyssChamberLineup];
  strategy: string;
  keyTags: string[];
  encounterProfile: EncounterDefinition;
}

export interface AbyssFloorSchedule {
  floor: AbyssFloorNumber;
  enemyLevels: string;
  leyLineDisorder: string;
  firstHalf: AbyssHalfSchedule;
  secondHalf: AbyssHalfSchedule;
}

export interface AbyssRotationSchedule {
  id: string;
  version: string;
  cycleLabel: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  nextResetLabel: string;
  blessing: {
    name: string;
    description: string;
  };
  source: 'live-wiki' | 'verified-cycle';
  sourceNote: string;
  checkedAt: string;
  floors: AbyssFloorSchedule[];
}

/**
 * Verified Genshin Impact Version 7.2 ("Hour of Ruin") Phase 1 Spiral Abyss rotation
 * Active window: November 16, 2026 – December 16, 2026 (Resounding Moon)
 */
export const VERIFIED_ABYSS_ROTATION: AbyssRotationSchedule = {
  id: 'v7.2-2026-11-16',
  version: 'Version 7.2 (Hour of Ruin)',
  cycleLabel: 'Nov 16 – Dec 16, 2026',
  startDate: '2026-11-16',
  endDate: '2026-12-16',
  nextResetLabel: 'Dec 16, 2026',
  blessing: {
    name: 'Resounding Moon',
    description:
      'Triggering Superconduct or Stellar-Conduct grants 1 stack; at 3 stacks, unleashes a True DMG shockwave (once every 4s).',
  },
  source: 'verified-cycle',
  sourceNote: 'Version 7.2 Phase 1 verified rotation',
  checkedAt: new Date().toISOString(),
  floors: [
    {
      floor: 9,
      enemyLevels: 'Lv. 72 · 74 · 76',
      leyLineDisorder: 'Stellar Swirl DMG dealt by all characters increased by 50%.',
      firstHalf: {
        chambers: [
          {
            chamber: 1,
            enemies: ['Winged Halberd-Knight', 'Winged Soarer Knight'],
          },
          {
            chamber: 2,
            enemies: ['Winged Halberd-Knight', 'Volkodlak Basher'],
          },
          {
            chamber: 3,
            enemies: ['Rugged Elder Leshy', 'Juvenile Tree Segments'],
            note: 'Clustered AoE waves',
          },
        ],
        strategy:
          'Multi-enemy waves spawn grouped — AoE Swirl / Stellar Swirl (+50% DMG) or Lunar-Charged sweeps all 3 chambers cleanly.',
        keyTags: ['AoE / Grouping', 'Stellar Swirl +50%'],
        encounterProfile: {
          id: 'abyss-f9-h1',
          name: 'Floor 9 · First Half',
          region: 'Snezhnaya',
          category: 'Abyss / Domain',
          summary: 'Clustered multi-target Snezhnaya waves favoring Stellar Swirl and AoE.',
          tacticalTip:
            'Keep enemies grouped and sweep waves with Stellar Swirl (Cryo Traveller + Mizuki/Sucrose) or AoE reactions.',
          preferredArchetypes: ['stellar-swirl', 'lunar-charged', 'stellar-conduct'],
          preferredElements: ['Anemo', 'Cryo', 'Electro', 'Hydro'],
          keywords: ['floor 9', 'first half', 'leshy', 'stellar swirl'],
        },
      },
      secondHalf: {
        chambers: [
          {
            chamber: 1,
            enemies: ['Cutting Edge All-Purpose Storm Landcruiser'],
          },
          {
            chamber: 2,
            enemies: ['Cutting Edge Fire Support Ground Effect Landcruiser'],
          },
          {
            chamber: 3,
            enemies: [
              'Cutting Edge Fire Support Ground Effect Landcruiser',
              'Cutting Edge All-Purpose Storm Landcruiser',
            ],
            note: 'Dodge charge dashes',
          },
        ],
        strategy:
          'Single-target armored Landcruisers with heavy charge attacks — bring strong single-target burst and steady sustain.',
        keyTags: ['Single-Target', 'Heavy Hits'],
        encounterProfile: {
          id: 'abyss-f9-h2',
          name: 'Floor 9 · Second Half',
          region: 'Snezhnaya',
          category: 'Abyss / Domain',
          summary: 'Single-target Landcruiser automatons hitting hard with charge attacks.',
          tacticalTip:
            'Focus high single-target DPS (Lunar-Crystallize, Lunar-Charged, or Lunar-Bloom) and dodge Landcruiser charges.',
          preferredArchetypes: ['lunar-crystallize', 'lunar-charged', 'lunar-bloom'],
          preferredElements: ['Geo', 'Hydro', 'Electro', 'Dendro', 'Pyro'],
          requiresHealer: true,
          keywords: ['floor 9', 'second half', 'landcruiser'],
        },
      },
    },
    {
      floor: 10,
      enemyLevels: 'Lv. 80 · 82 · 85',
      leyLineDisorder: 'Stellar-Conduct DMG dealt by all characters increased by 50%.',
      firstHalf: {
        chambers: [
          {
            chamber: 1,
            enemies: ['Volkodlak Lobber', 'Volkodlak Raider'],
          },
          {
            chamber: 2,
            enemies: ['Leomastiff Guard', 'Channel Contact'],
          },
          {
            chamber: 3,
            enemies: ['Glacial Warden', 'Glaciomancer'],
            note: 'Cryo barrier — break w/ Electro or Pyro',
          },
        ],
        strategy:
          'Multi-enemy chambers culminating in Glacial Warden’s Cryo barrier — Stellar-Conduct (+50% DMG) or Pyro/Electro shreds it fast.',
        keyTags: ['Stellar-Conduct +50%', 'Cryo Barrier (10-3)'],
        encounterProfile: {
          id: 'abyss-f10-h1',
          name: 'Floor 10 · First Half',
          region: 'Snezhnaya',
          category: 'Abyss / Domain',
          summary: 'Multi-target waves plus Glacial Warden Cryo barrier in 10-3.',
          tacticalTip:
            'Stellar-Conduct (+50% DMG) or Electro/Pyro breaks the 10-3 Glacial Warden Cryo barrier rapidly while clearing grouped mobs.',
          preferredArchetypes: ['stellar-conduct', 'melt-cryo-pyro', 'lunar-charged'],
          preferredElements: ['Electro', 'Pyro', 'Cryo', 'Anemo'],
          requiresElements: ['Electro', 'Pyro'],
          requiredTags: ['stellar-conduct'],
          keywords: ['floor 10', 'first half', 'glacial warden', 'cryo barrier'],
        },
      },
      secondHalf: {
        chambers: [
          {
            chamber: 1,
            enemies: ['Oprichniki Fireblade Shock Trooper'],
          },
          {
            chamber: 2,
            enemies: ['Oprichniki Thunderblitz Gvardiya'],
          },
          {
            chamber: 3,
            enemies: [
              'Oprichniki Thunderblitz Gvardiya',
              'Oprichniki Fireblade Shock Trooper',
              'Oprichniki Medic',
            ],
            note: 'High burst damage elites',
          },
        ],
        strategy:
          'Tough single-target Oprichniki elites dealing heavy burst damage — prioritize single-target DPS plus reliable healing/shielding.',
        keyTags: ['Single-Target', 'High Damage'],
        encounterProfile: {
          id: 'abyss-f10-h2',
          name: 'Floor 10 · Second Half',
          region: 'Snezhnaya',
          category: 'Abyss / Domain',
          summary: 'Hard-hitting Oprichniki Shock Troopers & Gvardiya.',
          tacticalTip:
            'Burn down the Oprichniki Medic first in 10-3; Lunar-Crystallize or Lunar-Charged with strong sustain clears comfortably.',
          preferredArchetypes: ['lunar-crystallize', 'lunar-charged', 'lunar-bloom'],
          preferredElements: ['Geo', 'Hydro', 'Electro', 'Dendro'],
          requiresHealer: true,
          keywords: ['floor 10', 'second half', 'oprichniki'],
        },
      },
    },
    {
      floor: 11,
      enemyLevels: 'Lv. 88 · 90 · 92',
      leyLineDisorder:
        'All party members gain +60% Electro DMG Bonus and +60% Geo DMG Bonus.',
      firstHalf: {
        chambers: [
          {
            chamber: 1,
            enemies: ['Voywolf Hunter', 'Fanged Zealot', 'Ruin Drake: Earthguard'],
          },
          {
            chamber: 2,
            enemies: [
              'Rugged Elder Leshy + Juvenile Tree Segments',
              'Chimeric Skorp + Chimeric Crocohoofs',
            ],
          },
          {
            chamber: 3,
            enemies: ['4× Icebound Reflections'],
            note: '100% Cryo Immune!',
          },
        ],
        strategy:
          'Avoid Cryo carries because 11-3’s Icebound Reflections are Cryo-immune! Geo / Electro (+60% DMG) and Lunar-Crystallize tear right through.',
        keyTags: ['Avoid Cryo (11-3 Immune)', 'Geo / Electro +60%'],
        encounterProfile: {
          id: 'abyss-f11-h1',
          name: 'Floor 11 · First Half',
          region: 'Snezhnaya',
          category: 'Abyss / Domain',
          summary: 'Multi-wave Snezhnaya elites ending with Cryo-immune Icebound Reflections.',
          tacticalTip:
            'Bench Cryo units for 11-3 Icebound Reflections (Cryo-immune) and capitalize on the +60% Geo & Electro DMG floor bonus.',
          preferredArchetypes: ['lunar-crystallize', 'lunar-charged', 'overloaded-chevreuse'],
          preferredElements: ['Geo', 'Electro', 'Hydro', 'Pyro'],
          avoidElements: ['Cryo'],
          keywords: ['floor 11', 'first half', 'icebound reflections', 'cryo immune'],
        },
      },
      secondHalf: {
        chambers: [
          {
            chamber: 1,
            enemies: ['12× Fishers of Hidden Depths'],
            note: 'Break 1 shield to group & stagger all 4',
          },
          {
            chamber: 2,
            enemies: ['Radiant Glacial Wolf'],
          },
          {
            chamber: 3,
            enemies: ['Wilderness Hunter'],
            note: 'Lunar DMG skips 2nd HP bar',
          },
        ],
        strategy:
          'Lunar Reactions (Flins Lunar-Charged or Lauma Lunar-Bloom) instantly shatter Fisher shields in 11-1 and skip Wilderness Hunter’s second HP bar in 11-3!',
        keyTags: ['Lunar Skips 2nd Bar', 'Electro +60%'],
        encounterProfile: {
          id: 'abyss-f11-h2',
          name: 'Floor 11 · Second Half',
          region: 'Nod-Krai',
          category: 'Abyss / Domain',
          summary: 'Fishers of Hidden Depths, Radiant Glacial Wolf, and Wilderness Hunter.',
          tacticalTip:
            'Lunar-Charged (+60% Electro DMG) or Lunar-Bloom rapidly breaks Fisher shields in 11-1 and halves Wilderness Hunter’s HP in 11-3.',
          preferredArchetypes: ['lunar-charged', 'lunar-bloom', 'ascendant-gleam-multi'],
          preferredElements: ['Electro', 'Hydro', 'Dendro', 'Anemo'],
          requiredTags: ['moonsign'],
          requiresHealer: true,
          keywords: ['floor 11', 'second half', 'wilderness hunter', 'fishers', 'glacial wolf'],
        },
      },
    },
    {
      floor: 12,
      enemyLevels: 'Lv. 95 · 98 · 100',
      leyLineDisorder:
        'First Half: Lunar-Crystallize DMG +75% · Second Half: Party Elemental Mastery +200.',
      firstHalf: {
        buff: 'Lunar-Crystallize DMG +75%',
        chambers: [
          {
            chamber: 1,
            enemies: ['Battle-Hardened Prism Slime'],
            note: 'Absorbs 1 element at a time',
          },
          {
            chamber: 2,
            enemies: ['Frostnight Herra'],
            note: 'Lunar fills Fury 6× faster w/o immunity',
          },
          {
            chamber: 3,
            enemies: ['Radiant Moongecko'],
            note: 'Needs Healer + Geo/Claymore Anchor break',
          },
        ],
        strategy:
          'Tailor-made for Zibai Lunar-Crystallize + Healer (+75% DMG): Lunar bypasses Frostnight Herra immunity, Geo/Claymore breaks Moongecko’s Anchor, and a Healer clears cocoons.',
        keyTags: ['Lunar-Crystallize +75%', 'Healer Required', 'Geo / Claymore'],
        encounterProfile: {
          id: 'abyss-f12-h1',
          name: 'Floor 12 · First Half',
          region: 'Nod-Krai',
          category: 'Abyss / Domain',
          summary:
            'Battle-Hardened Prism Slime, Frostnight Herra, and Radiant Moongecko (+75% Lunar-Crystallize DMG).',
          tacticalTip:
            'Lunar-Crystallize (Zibai + Aino + Noelle) enjoys +75% DMG, fills Frostnight Herra’s Fury bar cleanly, breaks Moongecko’s Anchor, and heals cocoons.',
          preferredArchetypes: ['lunar-crystallize', 'lunar-bloom', 'lunar-charged'],
          preferredElements: ['Geo', 'Hydro', 'Electro', 'Dendro'],
          requiredTags: ['moonsign'],
          requiresHealer: true,
          requiresClaymoreOrGeo: true,
          keywords: ['floor 12', 'first half', 'prism slime', 'frostnight herra', 'radiant moongecko'],
        },
      },
      secondHalf: {
        buff: 'Party Elemental Mastery +200',
        chambers: [
          {
            chamber: 1,
            enemies: ['Wavebinder'],
            note: 'Electro / Stellar-Conduct drains Courage',
          },
          {
            chamber: 2,
            enemies: ['Guardian Blade of Drifting Snow'],
            note: 'Stellar-Conduct / Electro / Pyro breaks ice coffin',
          },
          {
            chamber: 3,
            enemies: ['Perpetual Mechanical Array'],
            note: '70% Physical RES · target ringed Sentinel',
          },
        ],
        strategy:
          'Tailor-made for Mitya Stellar-Conduct (+200 EM + Resounding Moon): Electro & Stellar-Conduct shuts down Wavebinder’s Courage bar, shatters Guardian Blade’s ice coffin, and melts PMA.',
        keyTags: ['Party +200 EM', 'Stellar-Conduct', 'Electro Required'],
        encounterProfile: {
          id: 'abyss-f12-h2',
          name: 'Floor 12 · Second Half',
          region: 'Snezhnaya',
          category: 'Abyss / Domain',
          summary:
            'Wavebinder, Guardian Blade of Drifting Snow, and Perpetual Mechanical Array (+200 EM).',
          tacticalTip:
            'Electro Stellar-Conduct (Mitya + Cryo Traveller + Alyosha) scales directly with +200 EM, drains Wavebinder’s Courage, breaks Guardian Blade’s coffin, and triggers Resounding Moon.',
          preferredArchetypes: ['stellar-conduct', 'lunar-charged', 'melt-cryo-pyro'],
          preferredElements: ['Electro', 'Cryo', 'Anemo', 'Pyro'],
          requiresElements: ['Electro'],
          requiredTags: ['stellar-conduct'],
          requiresHealer: true,
          keywords: ['floor 12', 'second half', 'wavebinder', 'guardian blade', 'perpetual mechanical array'],
        },
      },
    },
  ],
};
