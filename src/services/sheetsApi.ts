import type {
  Character,
  ElementType,
  MechanicTag,
  RegionalPreset,
  WeaponType,
} from '../types/genshin';
import { getCharacterPortrait } from '../data/characterPortraits';

export const DEFAULT_SPREADSHEET_ID =
  '1e6rLtgtdnxARNx76t5mc0kJRcjXyKbEVntzV-rSIK74';

const VALID_ELEMENTS: ElementType[] = [
  'Cryo',
  'Electro',
  'Pyro',
  'Geo',
  'Dendro',
  'Hydro',
  'Anemo',
];

const VALID_WEAPONS: WeaponType[] = [
  'Sword',
  'Polearm',
  'Bow',
  'Catalyst',
  'Claymore',
];

export function slugifyName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function parseElement(raw: string): ElementType {
  const cleaned = raw.trim().toLowerCase();
  const match = VALID_ELEMENTS.find((el) => el.toLowerCase() === cleaned);
  return match ?? 'Anemo';
}

function parseWeapon(raw: string): WeaponType {
  const cleaned = raw.trim().toLowerCase();
  const match = VALID_WEAPONS.find((w) => w.toLowerCase() === cleaned);
  return match ?? 'Sword';
}

function parseRarity(raw: string): 4 | 5 {
  return raw.includes('5') ? 5 : 4;
}

export function extractMechanicTags(
  specialMechanic: string,
  role: string
): MechanicTag[] {
  const text = `${specialMechanic} ${role}`.toLowerCase();
  const tags: MechanicTag[] = [];

  if (text.includes('stellar-conduct') || text.includes('stellar conduct')) {
    tags.push('stellar-conduct');
  }
  if (text.includes('stellar glimmer') || text.includes('stellar-conduct')) {
    tags.push('stellar-glimmer');
  }
  if (text.includes('lunar-charged') || text.includes('lunar charged')) {
    tags.push('lunar-charged');
  }
  if (text.includes('lunar-bloom') || text.includes('lunar bloom')) {
    tags.push('lunar-bloom');
  }
  if (
    text.includes('lunar-crystallize') ||
    text.includes('lunar crystallize')
  ) {
    tags.push('lunar-crystallize');
  }
  if (text.includes('moonsign') || text.includes('lunar enabler')) {
    tags.push('moonsign');
  }
  if (text.includes('nightsoul')) {
    tags.push('nightsoul');
  }
  if (text.includes('arkhe') || text.includes('ousia')) {
    tags.push('arkhe-ousia');
  }
  if (text.includes('hexerei')) {
    tags.push('hexerei');
  }
  if (text.includes('overloaded specialist')) {
    tags.push('overloaded-specialist');
  }

  if (tags.length === 0) {
    tags.push('standard');
  }
  return Array.from(new Set(tags));
}

export function parseCharactersFromRows(rows: string[][]): Character[] {
  if (!rows || rows.length < 2) return [];

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const col = (names: string[], fallbackIndex: number) => {
    for (const n of names) {
      const idx = header.findIndex((h) => h.includes(n));
      if (idx !== -1) return idx;
    }
    return fallbackIndex;
  };

  const nameIdx = col(['character', 'name'], 0);
  const levelIdx = col(['level', 'lv'], 1);
  const typeIdx = col(['type', 'element'], 2);
  const healerIdx = col(['healer'], 3);
  const constIdx = col(['constellation'], 4);
  const rarityIdx = col(['rarity'], 5);
  const weaponIdx = col(['weapon'], 6);
  const roleIdx = col(['role'], 7);
  const mechIdx = col(['special mechanic', 'archetype', 'mechanic'], 8);
  const imgIdx = header.findIndex(
    (h) => h.includes('image') || h.includes('portrait') || h.includes('avatar')
  );

  const characters: Character[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rawName = (row[nameIdx] ?? '').trim();
    if (!rawName) continue;

    const levelNum = Number.parseInt((row[levelIdx] ?? '1').trim(), 10);
    const level = Number.isFinite(levelNum) ? levelNum : 1;
    const element = parseElement(row[typeIdx] ?? '');
    const role = (row[roleIdx] ?? 'Support').trim();
    const specialMechanic = (row[mechIdx] ?? 'Standard').trim();
    const healerRaw = (row[healerIdx] ?? '').trim().toLowerCase();
    const roleLower = role.toLowerCase();
    const mechLower = specialMechanic.toLowerCase();

    const isHealer =
      healerRaw === 'yes' ||
      healerRaw === 'true' ||
      roleLower.includes('healer');
    const isShielder =
      roleLower.includes('shielder') ||
      mechLower.includes('shield') ||
      mechLower.includes('mitigation');

    const constellationsRaw = (row[constIdx] ?? '').trim();
    const constellations = constellationsRaw
      ? constellationsRaw
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean)
      : [];

    const mechanicTags = extractMechanicTags(specialMechanic, role);
    const moonsignLevel = mechanicTags.includes('moonsign') ? 1 : 0;

    const isOnField =
      roleLower.includes('on-field') ||
      roleLower.includes('main dps') ||
      roleLower.includes('driver') ||
      roleLower.includes('plunge dps') ||
      roleLower.includes('physical dps');
    const isOffField =
      roleLower.includes('off-field') || roleLower.includes('sub-dps');
    const isSupport =
      roleLower.includes('support') ||
      isHealer ||
      isShielder ||
      roleLower.includes('buffer');

    const id = slugifyName(rawName);
    const sheetImageUrl =
      imgIdx !== -1 && row[imgIdx]?.trim() ? row[imgIdx].trim() : undefined;
    const imageUrl = sheetImageUrl ?? getCharacterPortrait(id)?.url;

    characters.push({
      id,
      name: rawName,
      level,
      element,
      isHealer,
      isShielder,
      constellations,
      constellationsRaw,
      rarity: parseRarity(row[rarityIdx] ?? '4★'),
      weapon: parseWeapon(row[weaponIdx] ?? 'Sword'),
      role,
      specialMechanic,
      mechanicTags,
      moonsignLevel,
      isOnField,
      isOffField,
      isSupport,
      imageUrl,
    });
  }

  return characters;
}

export function resolveSlotToCharacterId(
  slotText: string,
  characters: Character[]
): string | null {
  const cleaned = slotText.trim();
  if (!cleaned) return null;

  // Handle "Lynette (25) / Lisa (90)" -> pick first candidate, or fall back to second
  const parts = cleaned.split('/').map((p) => p.trim());

  for (const part of parts) {
    // Strip "(90)" or "- Cryo (90)"
    const baseName = part
      .replace(/\(\d+\)/g, '')
      .replace(/-\s*(cryo|electro|pyro|geo|dendro|hydro|anemo)/gi, '')
      .trim()
      .toLowerCase();

    const exact = characters.find((c) => c.name.toLowerCase() === baseName);
    if (exact) return exact.id;

    // Handle "Traveller" vs "Traveler"
    if (baseName.includes('travel')) {
      const trav = characters.find((c) =>
        c.name.toLowerCase().includes('travel')
      );
      if (trav) return trav.id;
    }

    const partial = characters.find(
      (c) =>
        c.name.toLowerCase().includes(baseName) ||
        baseName.includes(c.name.toLowerCase())
    );
    if (partial) return partial.id;
  }

  return null;
}

export function parsePresetsFromRows(
  rows: string[][],
  characters: Character[]
): RegionalPreset[] {
  if (!rows || rows.length < 2) return [];

  const presets: RegionalPreset[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const region = (row[0] ?? '').trim();
    const teamName = (row[1] ?? '').trim();
    if (!region && !teamName) continue;

    const mainDps = (row[2] ?? '').trim();
    const subDps = (row[3] ?? '').trim();
    const utility = (row[4] ?? '').trim();
    const healer = (row[5] ?? '').trim();

    presets.push({
      id: slugifyName(`${region}-${teamName}-${i}`),
      region: region || 'Custom',
      teamName: teamName || `${region} Party`,
      slots: { mainDps, subDps, utility, healer },
      resolvedCharacterIds: [
        resolveSlotToCharacterId(mainDps, characters),
        resolveSlotToCharacterId(subDps, characters),
        resolveSlotToCharacterId(utility, characters),
        resolveSlotToCharacterId(healer, characters),
      ],
    });
  }

  return presets;
}

export interface SheetsSyncResult {
  characters: Character[];
  presets: RegionalPreset[];
  syncedAt: string;
}

export async function fetchRosterFromSheets(
  spreadsheetId: string,
  apiKey: string
): Promise<SheetsSyncResult> {
  const cleanId = spreadsheetId.trim();
  const cleanKey = apiKey.trim();

  if (!cleanId) {
    throw new Error('Please provide a Google Spreadsheet ID.');
  }
  if (!cleanKey) {
    throw new Error('Please provide a Google Sheets API v4 key.');
  }

  const ranges = ['All Characters!A1:J200', 'Party by Region!A1:F100'];
  const params = new URLSearchParams();
  for (const r of ranges) {
    params.append('ranges', r);
  }
  params.set('key', cleanKey);

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
    cleanId
  )}/values:batchGet?${params.toString()}`;

  const response = await fetch(url);
  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson?.error?.message) {
        detail = errJson.error.message;
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(
      `Google Sheets API error (${detail}). Make sure your Sheet is link-viewable ("Anyone with the link can view") and your API key has Google Sheets API enabled.`
    );
  }

  const data = await response.json();
  const valueRanges: Array<{ values?: string[][] }> = data.valueRanges ?? [];
  const charRows = valueRanges[0]?.values ?? [];
  const presetRows = valueRanges[1]?.values ?? [];

  const characters = parseCharactersFromRows(charRows);
  if (characters.length === 0) {
    throw new Error(
      'Connected to the sheet, but found no characters in the "All Characters" tab.'
    );
  }

  const presets = parsePresetsFromRows(presetRows, characters);

  return {
    characters,
    presets,
    syncedAt: new Date().toISOString(),
  };
}
