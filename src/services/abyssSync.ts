import {
  VERIFIED_ABYSS_ROTATION,
  type AbyssChamberLineup,
  type AbyssFloorNumber,
  type AbyssFloorSchedule,
  type AbyssRotationSchedule,
} from '../data/abyssRotation';
import { ENCOUNTERS } from '../data/encounters';
import {
  buildCustomEncounterFromQuery,
  searchEncounters,
} from '../engine/encounterResolver';
import type { ElementType, EncounterDefinition, MechanicTag } from '../types/genshin';

const WIKI_API_URL =
  'https://genshin-impact.fandom.com/api.php?action=parse&page=Spiral_Abyss/Floors&prop=wikitext&format=json&origin=*';

function stripWikiMarkup(raw: string): string {
  return raw
    .replace(/\{\{[^}]+\}\}/g, '')
    .replace(/\[\[(?:[^|\]]+\|)?([^\]]+)\]\]/g, '$1')
    .replace(/'''?/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function synthesizeHalfProfile(
  floor: AbyssFloorNumber,
  half: 1 | 2,
  enemies: string[],
  buffText: string
): EncounterDefinition {
  const avoidSet = new Set<ElementType>();
  const preferredSet = new Set<ElementType>();
  const requiresSet = new Set<ElementType>();
  const archSet = new Set<string>();
  const tagSet = new Set<MechanicTag>();
  let requiresHealer = false;
  let requiresShielder = false;
  let avoidShielder = false;
  let requiresBow = false;
  let requiresClaymoreOrGeo = false;

  for (const name of enemies) {
    const exactMatch =
      searchEncounters(name, ENCOUNTERS)[0] ??
      buildCustomEncounterFromQuery(name);
    if (!exactMatch) continue;
    exactMatch.avoidElements?.forEach((el) => avoidSet.add(el));
    exactMatch.preferredElements.forEach((el) => preferredSet.add(el));
    exactMatch.requiresElements?.forEach((el) => requiresSet.add(el));
    exactMatch.preferredArchetypes.forEach((a) => archSet.add(a));
    exactMatch.requiredTags?.forEach((t) => tagSet.add(t));
    if (exactMatch.requiresHealer) requiresHealer = true;
    if (exactMatch.requiresShielder) requiresShielder = true;
    if (exactMatch.avoidShielder) avoidShielder = true;
    if (exactMatch.requiresBow) requiresBow = true;
    if (exactMatch.requiresClaymoreOrGeo) requiresClaymoreOrGeo = true;
  }

  const buffLower = buffText.toLowerCase();
  if (buffLower.includes('lunar-crystallize')) {
    archSet.add('lunar-crystallize');
    preferredSet.add('Geo');
    preferredSet.add('Hydro');
    tagSet.add('moonsign');
  }
  if (buffLower.includes('lunar-charged')) {
    archSet.add('lunar-charged');
    preferredSet.add('Electro');
    preferredSet.add('Hydro');
    tagSet.add('moonsign');
  }
  if (buffLower.includes('lunar-bloom')) {
    archSet.add('lunar-bloom');
    preferredSet.add('Dendro');
    preferredSet.add('Hydro');
    tagSet.add('moonsign');
  }
  if (buffLower.includes('stellar-conduct') || buffLower.includes('stellar glimmer')) {
    archSet.add('stellar-conduct');
    preferredSet.add('Electro');
    preferredSet.add('Cryo');
    tagSet.add('stellar-conduct');
  }
  if (buffLower.includes('stellar swirl') || buffLower.includes('swirl')) {
    archSet.add('stellar-swirl');
    preferredSet.add('Anemo');
    preferredSet.add('Cryo');
  }
  if (buffLower.includes('electro dmg')) preferredSet.add('Electro');
  if (buffLower.includes('geo dmg')) preferredSet.add('Geo');
  if (buffLower.includes('pyro dmg')) preferredSet.add('Pyro');
  if (buffLower.includes('cryo dmg')) preferredSet.add('Cryo');
  if (buffLower.includes('hydro dmg')) preferredSet.add('Hydro');
  if (buffLower.includes('dendro dmg')) preferredSet.add('Dendro');
  if (buffLower.includes('anemo dmg')) preferredSet.add('Anemo');

  // Remove any avoided element from preferred elements
  for (const av of avoidSet) {
    preferredSet.delete(av);
  }

  const preferredElements: ElementType[] =
    preferredSet.size > 0
      ? Array.from(preferredSet)
      : ['Electro', 'Hydro', 'Cryo', 'Pyro', 'Geo', 'Dendro'];

  const preferredArchetypes =
    archSet.size > 0
      ? Array.from(archSet)
      : ['lunar-charged', 'stellar-conduct', 'lunar-crystallize', 'lunar-bloom'];

  const enemySummary = enemies.slice(0, 4).join(', ');
  return {
    id: `abyss-live-f${floor}-h${half}`,
    name: `Floor ${floor} · ${half === 1 ? 'First Half' : 'Second Half'}`,
    region: 'Spiral Abyss',
    category: 'Abyss / Domain',
    summary: `Live Spiral Abyss Floor ${floor} ${half === 1 ? 'First' : 'Second'} Half: ${enemySummary}.`,
    tacticalTip: buffText
      ? `Counters ${enemySummary} while taking advantage of: ${buffText}`
      : `Built to counter ${enemySummary}.`,
    preferredArchetypes,
    preferredElements,
    avoidElements: avoidSet.size > 0 ? Array.from(avoidSet) : undefined,
    requiresElements: requiresSet.size > 0 ? Array.from(requiresSet) : undefined,
    requiredTags: tagSet.size > 0 ? Array.from(tagSet) : undefined,
    requiresHealer: requiresHealer || floor >= 11,
    requiresShielder: requiresShielder || undefined,
    avoidShielder: avoidShielder || undefined,
    requiresBow: requiresBow || undefined,
    requiresClaymoreOrGeo: requiresClaymoreOrGeo || undefined,
    keywords: enemies.map((e) => e.toLowerCase()),
  };
}

function parseEnemyList(segment: string): string[] {
  const names: string[] = [];
  // Match {{Enemy List|...}} or [[Enemy Name]] entries
  const enemyListMatches = segment.matchAll(/\{\{Enemy List\|([^}]+)\}\}/gi);
  for (const m of enemyListMatches) {
    const parts = m[1].split(';');
    for (const part of parts) {
      const clean = part
        .split('*')[0]
        .split('{')[0]
        .replace(/delim=.*$/i, '')
        .trim();
      if (clean && !clean.includes('=') && clean.length >= 3) {
        names.push(clean);
      }
    }
  }
  if (names.length > 0) return Array.from(new Set(names)).slice(0, 5);

  const linkMatches = segment.matchAll(/\[\[(?:[^|\]]+\|)?([A-Za-z0-9 :'’-]+)\]\]/g);
  for (const m of linkMatches) {
    const candidate = m[1].trim();
    if (
      candidate.length >= 4 &&
      !/^(Floor|Chamber|First Half|Second Half|Spiral Abyss|Category|File)/i.test(
        candidate
      )
    ) {
      names.push(candidate);
    }
  }
  return Array.from(new Set(names)).slice(0, 5);
}

function tryParseLiveWikiRotation(wikitext: string): AbyssRotationSchedule | null {
  const lower = wikitext.toLowerCase();

  // If the live wiki confirms our verified Version 7.2 Phase 1 rotation, keep our curated rich mechanics!
  const matchesVerifiedV72 =
    lower.includes('radiant moongecko') &&
    lower.includes('wavebinder') &&
    lower.includes('frostnight herra');

  if (matchesVerifiedV72) {
    return {
      ...VERIFIED_ABYSS_ROTATION,
      source: 'live-wiki',
      sourceNote: 'Confirmed live via Genshin Impact Wiki',
      checkedAt: new Date().toISOString(),
    };
  }

  // Otherwise, attempt to parse a newer live rotation from the wikitext
  const floors: AbyssFloorSchedule[] = [];
  const floorNums: AbyssFloorNumber[] = [9, 10, 11, 12];

  for (const floorNum of floorNums) {
    const floorRe = new RegExp(
      `===\\s*Floor\\s+${floorNum}\\s*===([\\s\\S]*?)(?====\\s*Floor\\s+\\d|==\\s*[^=]|$)`,
      'i'
    );
    const floorMatch = wikitext.match(floorRe);
    if (!floorMatch) continue;

    const section = floorMatch[1];
    const leyLineMatch = section.match(/Ley Line Disorder[^:\n]*:?\s*([^\n]+)/i);
    const leyLineDisorder = leyLineMatch
      ? stripWikiMarkup(leyLineMatch[1])
      : VERIFIED_ABYSS_ROTATION.floors.find((f) => f.floor === floorNum)
          ?.leyLineDisorder ?? 'Standard Spiral Abyss Ley Line Disorder.';

    const h1Chambers: AbyssChamberLineup[] = [];
    const h2Chambers: AbyssChamberLineup[] = [];

    for (const ch of [1, 2, 3] as const) {
      const chRe = new RegExp(
        `Chamber\\s+${ch}([\\s\\S]*?)(?=Chamber\\s+${ch + 1}|$)`,
        'i'
      );
      const chBlock = section.match(chRe)?.[1] ?? '';
      const splitSecond = chBlock.split(/Second Half/i);
      const firstEnemies = parseEnemyList(splitSecond[0] ?? '');
      const secondEnemies = parseEnemyList(splitSecond[1] ?? '');

      if (firstEnemies.length > 0) {
        h1Chambers.push({ chamber: ch, enemies: firstEnemies });
      }
      if (secondEnemies.length > 0) {
        h2Chambers.push({ chamber: ch, enemies: secondEnemies });
      }
    }

    if (h1Chambers.length === 3 && h2Chambers.length === 3) {
      const allH1 = h1Chambers.flatMap((c) => c.enemies);
      const allH2 = h2Chambers.flatMap((c) => c.enemies);
      const levelDefaults: Record<AbyssFloorNumber, string> = {
        9: 'Lv. 72 · 74 · 76',
        10: 'Lv. 80 · 82 · 85',
        11: 'Lv. 88 · 90 · 92',
        12: 'Lv. 95 · 98 · 100',
      };

      floors.push({
        floor: floorNum,
        enemyLevels: levelDefaults[floorNum],
        leyLineDisorder,
        firstHalf: {
          chambers: h1Chambers as [
            AbyssChamberLineup,
            AbyssChamberLineup,
            AbyssChamberLineup,
          ],
          strategy: `Auto-detected live Floor ${floorNum} First Half bosses (${allH1.slice(0, 3).join(', ')}).`,
          keyTags: ['Live Wiki Lineup'],
          encounterProfile: synthesizeHalfProfile(
            floorNum,
            1,
            allH1,
            leyLineDisorder
          ),
        },
        secondHalf: {
          chambers: h2Chambers as [
            AbyssChamberLineup,
            AbyssChamberLineup,
            AbyssChamberLineup,
          ],
          strategy: `Auto-detected live Floor ${floorNum} Second Half bosses (${allH2.slice(0, 3).join(', ')}).`,
          keyTags: ['Live Wiki Lineup'],
          encounterProfile: synthesizeHalfProfile(
            floorNum,
            2,
            allH2,
            leyLineDisorder
          ),
        },
      });
    }
  }

  if (floors.length >= 2) {
    // Fill any missing lower floors from verified fallback so all 4 floors are always present
    const byNum = new Map(floors.map((f) => [f.floor, f]));
    const completeFloors = floorNums.map(
      (num) =>
        byNum.get(num) ??
        VERIFIED_ABYSS_ROTATION.floors.find((f) => f.floor === num)!
    );
    return {
      ...VERIFIED_ABYSS_ROTATION,
      id: `live-${new Date().toISOString().slice(0, 10)}`,
      cycleLabel: `Live Rotation (${new Date().toLocaleDateString(undefined, { month: 'short', year: 'numeric' })})`,
      source: 'live-wiki',
      sourceNote: 'Updated live from Genshin Impact Wiki',
      checkedAt: new Date().toISOString(),
      floors: completeFloors,
    };
  }

  return null;
}

/**
 * Checks the live Genshin Impact Wiki Spiral Abyss page to verify or update
 * the current Floors 9–12 boss lineups. Always resolves quickly and safely
 * falls back to the verified current Version 7.2 cycle if offline.
 */
export async function checkCurrentSpiralAbyss(): Promise<AbyssRotationSchedule> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 4500);

  try {
    const res = await fetch(WIKI_API_URL, { signal: controller.signal });
    if (res.ok) {
      const json = (await res.json()) as {
        parse?: { wikitext?: { '*'?: string } };
      };
      const wikitext = json?.parse?.wikitext?.['*'];
      if (wikitext && wikitext.length > 200) {
        const parsed = tryParseLiveWikiRotation(wikitext);
        if (parsed) return parsed;
      }
    }
  } catch {
    // Network/CORS fallback below
  } finally {
    window.clearTimeout(timeout);
  }

  return {
    ...VERIFIED_ABYSS_ROTATION,
    source: 'verified-cycle',
    sourceNote: 'Verified Ver. 7.2 cycle (Nov 16 – Dec 16, 2026)',
    checkedAt: new Date().toISOString(),
  };
}
