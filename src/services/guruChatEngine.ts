import { ARCHETYPES } from '../data/archetypes';
import { getArtifactGuide } from '../data/artifactGuides';
import { ENCOUNTERS } from '../data/encounters';
import { GENSHIN_GURU_SKILL_INSTRUCTIONS } from '../data/genshinGuruSkill';
import {
  getContextualBuildCallouts,
  getRosterBuildPriorities,
} from '../engine/buildPriorities';
import {
  analyzeTeam,
  BATTLE_READY_LEVEL,
  inferSlotRoles,
} from '../engine/teamAnalyzer';
import {
  generateRankedStrongestTeams,
  generateRecommendedTeams,
  generateTeamsForRegion,
} from '../engine/teamBuilder';
import type {
  Character,
  ElementType,
  EncounterDefinition,
  RegionalPreset,
  TeamRecommendation,
} from '../types/genshin';
import { callGeminiGenerateContent } from './geminiApi';

export interface GuruChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  engine?: 'gemini-skill' | 'local-skill';
  suggestedTeam?: TeamRecommendation;
  suggestedAbyss?: {
    half1: TeamRecommendation;
    half2: TeamRecommendation;
  };
  mentionedCharacters?: Character[];
  followUps?: string[];
  fallbackNote?: string;
}

export interface GuruChatContext {
  roster: Character[];
  presets: RegionalPreset[];
  activeTeam: TeamRecommendation | null;
  includeUnbuilt: boolean;
  requireSurvivability: boolean;
  geminiApiKey: string;
  history: GuruChatMessage[];
}

const ELEMENTS: ElementType[] = [
  'Cryo',
  'Electro',
  'Pyro',
  'Geo',
  'Dendro',
  'Hydro',
  'Anemo',
];

const NATION_KEYWORDS: Array<{ nation: string; terms: string[] }> = [
  { nation: 'Snezhnaya', terms: ['snezhnaya', 'belovodye', 'volkodlak', 'everfrozen'] },
  { nation: 'Nod-Krai', terms: ['nod-krai', 'nod krai', 'nodkrai', 'moonsign'] },
  { nation: 'Natlan', terms: ['natlan', 'nightsoul', 'ochkanatlan'] },
  { nation: 'Fontaine', terms: ['fontaine', 'arkhe', 'ousia', 'pneuma'] },
  { nation: 'Sumeru', terms: ['sumeru', 'desert', 'rainforest'] },
  { nation: 'Inazuma', terms: ['inazuma', 'narukami', 'enkanomiya'] },
  { nation: 'Liyue', terms: ['liyue', 'chasm', 'chenyu'] },
  { nation: 'Mondstadt', terms: ['mondstadt', 'dragonspine'] },
];

function formatConstellationLabel(c: Character): string {
  const count = c.constellations.length;
  if (count === 0) return 'C0';
  return `C${count} (${c.constellations.join(', ')})`;
}

function getTierLabel(level: number): string {
  if (level >= 80) return 'Built (Lv 80–90)';
  if (level >= 40) return 'Partially Built (Lv 40–70)';
  return 'Unbuilt / Bench (Lv 1–30)';
}

function resolveRosterCharacter(
  name: string,
  roster: Character[]
): Character | undefined {
  const clean = name.trim().toLowerCase();
  if (!clean) return undefined;
  return (
    roster.find((c) => c.name.toLowerCase() === clean) ??
    roster.find((c) => c.id === clean) ??
    roster.find(
      (c) =>
        c.name.toLowerCase().includes(clean) ||
        clean.includes(c.name.toLowerCase())
    )
  );
}

function resolveFourMemberTuple(
  names: string[] | undefined,
  roster: Character[]
): [Character, Character, Character, Character] | null {
  if (!Array.isArray(names) || names.length !== 4) return null;
  const resolved: Character[] = [];
  for (const name of names) {
    const match = resolveRosterCharacter(name, roster);
    if (!match || resolved.some((r) => r.id === match.id)) {
      return null;
    }
    resolved.push(match);
  }
  return resolved as [Character, Character, Character, Character];
}

function buildRecommendationFromTuple(
  tuple: [Character, Character, Character, Character],
  title: string,
  whyItWorks: string,
  source: TeamRecommendation['source']
): TeamRecommendation {
  const analysis = analyzeTeam(tuple);
  const slotLabels = inferSlotRoles(tuple);
  return {
    id: `guru-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: title.trim() || 'Genshin Guru Pick',
    subtitle:
      analysis.reactions
        .slice(0, 3)
        .map((r) => r.name)
        .join(' · ') || 'Balanced Squad',
    members: tuple,
    slotLabels,
    analysis,
    whyItWorks,
    source,
  };
}

function findMentionedCharacters(query: string, roster: Character[]): Character[] {
  const q = query.toLowerCase();
  const hits: Character[] = [];

  for (const char of roster) {
    const nameLower = char.name.toLowerCase();
    const aliases = [nameLower];
    if (char.id === 'traveller') aliases.push('traveler', 'cryo traveller', 'cryo traveler', 'mc');
    if (char.id === 'yumemizuki-mizuki') aliases.push('mizuki', 'yumemizuki');
    if (char.id === 'lan-yan') aliases.push('lanyan');
    if (char.id === 'shikanoin-heizou') aliases.push('heizou');
    if (char.id === 'kujou-sara') aliases.push('sara');
    if (char.id === 'kaedehara-kazuha') aliases.push('kazuha');

    const matched = aliases.some((alias) => {
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`\\b${escaped}\\b`, 'i').test(q);
    });

    if (matched) {
      hits.push(char);
    }
  }

  return hits;
}

function findMentionedEncounter(query: string): EncounterDefinition | null {
  const q = query.toLowerCase();
  const hasBossIntent =
    /\b(boss|fight|farm|farming|beat|defeat|counter|mat|mats|ascension|drop|drops|stygian|onslaught)\b/i.test(
      q
    );
  let best: EncounterDefinition | null = null;
  let bestScore = 0;

  for (const enc of ENCOUNTERS) {
    let score = 0;
    const nameLower = enc.name.toLowerCase();
    if (q.includes(nameLower)) score += 100;

    const nameWords = nameLower
      .split(/[\s/()-]+/)
      .filter((w) => w.length >= 4 && !['boss', 'world', 'lord', 'king', 'iron'].includes(w));
    for (const w of nameWords) {
      if (q.includes(w)) score += 25;
    }

    const dropNames = new Set(
      (enc.dropsFor ?? []).map((d) => d.toLowerCase())
    );

    for (const kw of enc.keywords) {
      const kwLower = kw.toLowerCase();
      if (kwLower.length >= 4 && q.includes(kwLower)) {
        // Avoid matching generic region words alone
        const isRegionOnly = NATION_KEYWORDS.some((n) =>
          n.terms.includes(kwLower)
        );
        // Avoid matching character drop names unless the user is asking about farming/bosses
        const isCharDropOnly = dropNames.has(kwLower) && !hasBossIntent;
        if (!isRegionOnly && !isCharDropOnly) score += 22;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      best = enc;
    }
  }

  return bestScore >= 22 ? best : null;
}

function findMentionedRegion(
  query: string,
  presets: RegionalPreset[]
): { regionName: string; preset: RegionalPreset | null } | null {
  const q = query.toLowerCase();

  for (const preset of presets) {
    const regLower = preset.region.toLowerCase();
    if (q.includes(regLower)) {
      return { regionName: preset.region, preset };
    }
  }

  for (const entry of NATION_KEYWORDS) {
    if (entry.terms.some((t) => q.includes(t))) {
      const preset =
        presets.find((p) =>
          p.region.toLowerCase().includes(entry.nation.toLowerCase())
        ) ?? null;
      return { regionName: preset?.region ?? entry.nation, preset };
    }
  }

  return null;
}

function findNonOverlappingAbyssPair(
  roster: Character[],
  includeUnbuilt: boolean,
  requireSurvivability: boolean
): { half1: TeamRecommendation; half2: TeamRecommendation } | null {
  const ranked = generateRankedStrongestTeams(roster, {
    includeUnbuilt,
    requireSurvivability,
    sortBy: 'ready-now',
    maxResults: 24,
  });

  if (ranked.length === 0) return null;

  let bestPair: {
    half1: TeamRecommendation;
    half2: TeamRecommendation;
    combined: number;
  } | null = null;

  for (let i = 0; i < Math.min(ranked.length, 10); i++) {
    const first = ranked[i];
    const usedIds = new Set(first.team.members.map((m) => m.id));

    for (let j = i + 1; j < ranked.length; j++) {
      const second = ranked[j];
      const overlaps = second.team.members.some((m) => usedIds.has(m.id));
      if (!overlaps) {
        const combined = first.readyScore + second.readyScore;
        if (!bestPair || combined > bestPair.combined) {
          bestPair = {
            half1: first.team,
            half2: second.team,
            combined,
          };
        }
        break;
      }
    }
  }

  if (bestPair) {
    return { half1: bestPair.half1, half2: bestPair.half2 };
  }

  // Fallback: take top team, then generate best team excluding its members
  const half1 = ranked[0].team;
  const half2Candidates = generateRecommendedTeams(
    roster,
    {
      archetypeId: null,
      encounterId: null,
      anchorCharacterId: null,
      includeUnbuilt,
      requireSurvivability,
      excludedCharacterIds: half1.members.map((m) => m.id),
    },
    1
  );

  if (half2Candidates[0]) {
    return { half1, half2: half2Candidates[0] };
  }

  return null;
}

/**
 * Local Genshin Guru Skill Engine — implements the exact genshin-guru SKILL.md
 * rules directly against the user's live roster, artifacts, bosses, and presets
 * with zero API key required.
 */
export function askGuruSkillLocal(
  query: string,
  ctx: GuruChatContext
): GuruChatMessage {
  const q = query.trim();
  const qLower = q.toLowerCase();
  const { roster, presets, activeTeam } = ctx;

  const asksSustainless =
    /\b(sustainless|glass cannon|no healer|without healer|speedrun)\b/i.test(q);
  const asksUnbuilt =
    /\b(unbuilt|lv\s*1|level\s*1|low level|future|potential|include all|worth leveling)\b/i.test(
      q
    );

  const requireSurvivability = asksSustainless
    ? false
    : ctx.requireSurvivability;
  const includeUnbuilt = asksUnbuilt ? true : ctx.includeUnbuilt;

  const builtCount = roster.filter((c) => c.level >= 80).length;
  const partialCount = roster.filter((c) => c.level >= 40 && c.level < 80).length;
  const benchCount = roster.filter((c) => c.level < 40).length;

  const mentionedChars = findMentionedCharacters(q, roster);
  const matchedEncounter = findMentionedEncounter(q);
  const matchedRegion = findMentionedRegion(q, presets);
  const matchedArchetype = ARCHETYPES.find(
    (a) =>
      qLower.includes(a.name.toLowerCase()) ||
      qLower.includes(a.id.replace(/-/g, ' ')) ||
      (a.id === 'stellar-conduct' && qLower.includes('stellar conduct')) ||
      (a.id === 'lunar-charged' && qLower.includes('lunar charged')) ||
      (a.id === 'lunar-bloom' &&
        (qLower.includes('lunar bloom') || qLower.includes('hyperbloom'))) ||
      (a.id === 'lunar-crystallize' && qLower.includes('lunar crystallize')) ||
      (a.id === 'overloaded-chevreuse' && qLower.includes('overload')) ||
      (a.id === 'melt-cryo-pyro' && /\bmelt\b/i.test(qLower))
  );

  const makeReply = (
    content: string,
    extra: Partial<GuruChatMessage> = {}
  ): GuruChatMessage => ({
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    role: 'assistant',
    content,
    createdAt: new Date().toISOString(),
    engine: 'local-skill',
    ...extra,
  });

  // 1. Review / rate / improve the active Team Circle
  if (
    /\b(current team|this team|team circle|my circle|rate my|review my|improve this|who should i swap)\b/i.test(
      qLower
    )
  ) {
    if (!activeTeam) {
      const top = generateRankedStrongestTeams(roster, {
        includeUnbuilt,
        requireSurvivability,
        sortBy: 'ready-now',
        maxResults: 1,
      })[0];
      return makeReply(
        `Your Team Circle is currently empty! Load a team into the Circle (or click **Load in Circle** below) and I can break down its reactions, sustain, and upgrades.\n\nRight now, your highest-scoring ready squad from your **Genshin Roster** spreadsheet is **${top?.team.title ?? 'your core team'}**.`,
        {
          suggestedTeam: top?.team,
          followUps: [
            'Who should I level up next?',
            'Build two Spiral Abyss teams',
          ],
        }
      );
    }

    const { analysis, members } = activeTeam;
    const callouts = getContextualBuildCallouts(members, roster, {
      archetypeId: activeTeam.archetypeId,
    });
    const reactions =
      analysis.reactions
        .slice(0, 3)
        .map((r) => r.name)
        .join(', ') || 'Basic elemental combos';
    const sustainList = members
      .filter((m) => m.isHealer || m.isShielder)
      .map((m) => `${m.name} (${m.isHealer ? 'Healer' : 'Shielder'})`)
      .join(', ');

    const lines = [
      `**Team Circle Review — ${activeTeam.title}**`,
      `• **Readiness Score:** ${analysis.score}/100 (Max Potential: ${analysis.potentialScore}/100 · Avg Lv ${Math.round(analysis.avgLevel)})`,
      `• **Key Reactions:** ${reactions}`,
      `• **Sustain Check:** ${
        sustainList
          ? `${analysis.survivability} — covered by ${sustainList}.`
          : 'Glass Cannon — no healer or shielder slotted; consider adding Bennett, Jahoda, Barbara, or Noelle for Abyss comfort.'
      }`,
    ];

    if (analysis.moonsignTier !== 'None') {
      lines.push(
        `• **Moonsign State:** ${analysis.moonsignTier} (${analysis.moonsignTotal} Moonsign unit${analysis.moonsignTotal === 1 ? '' : 's'})`
      );
    }
    if (analysis.stellarState !== 'None') {
      lines.push(`• **Stellar Glimmer:** ${analysis.stellarState}`);
    }
    if (analysis.warnings.length > 0) {
      lines.push(`• **Watch-outs:** ${analysis.warnings.join(' ')}`);
    }
    if (callouts.length > 0) {
      lines.push(
        `\n**Upgrade Opportunity:** Leveling **${callouts[0].character.name}** (currently Lv ${callouts[0].character.level}) — ${callouts[0].reason}`
      );
    }

    return makeReply(lines.join('\n'), {
      mentionedCharacters:
        callouts.length > 0 ? callouts.map((c) => c.character) : members,
      followUps: [
        `How do I build ${members[0].name}?`,
        'Who should I level up next?',
      ],
    });
  }

  // 2. Spiral Abyss / Two Teams / Imaginarium Theater
  if (
    /\b(abyss|two teams|2 teams|both halves|half 1|half 2|imaginarium|theater|theatre)\b/i.test(
      qLower
    )
  ) {
    const pair = findNonOverlappingAbyssPair(
      roster,
      includeUnbuilt,
      requireSurvivability
    );
    if (!pair) {
      return makeReply(
        `I couldn't assemble two non-overlapping 4-character teams under the current Lv 70+ filter. Try asking with *"include unbuilt"* or toggle **Pool: Lv 1–90** in the header.`
      );
    }

    const h1Names = pair.half1.members
      .map((m) => `${m.name} (Lv ${m.level})`)
      .join(', ');
    const h2Names = pair.half2.members
      .map((m) => `${m.name} (Lv ${m.level})`)
      .join(', ');

    const isTheater = /\b(imaginarium|theater|theatre)\b/i.test(qLower);
    const intro = isTheater
      ? `For **Imaginarium Theater** & endgame clears, you currently have **${builtCount} built characters (Lv 80–90)** and **${partialCount} partially built (Lv 40–70)** in your **Genshin Roster** spreadsheet. Here are two strong zero-overlap cores to anchor your run:`
      : `Here is your strongest **non-overlapping Spiral Abyss pair** from your **Genshin Roster** spreadsheet (both halves pass the sustain check):`;

    return makeReply(
      `${intro}\n\n• **Half 1 — ${pair.half1.title}** (Score ${pair.half1.analysis.score}): ${h1Names}\n• **Half 2 — ${pair.half2.title}** (Score ${pair.half2.analysis.score}): ${h2Names}\n\nClick **Load Both into Abyss** below to populate your Spiral Abyss planner immediately.`,
      {
        suggestedAbyss: pair,
        followUps: [
          'Who should I level up next?',
          'Check my healers & constellations',
        ],
      }
    );
  }

  // 3. Who to level / build / invest in next
  if (
    /\b(who (should|to) (i )?(level|build|invest|ascend|upgrade)|level(ing)? priorit|build next|invest next|worth leveling)\b/i.test(
      qLower
    )
  ) {
    const priorities = getRosterBuildPriorities(roster, 5);
    if (priorities.length === 0) {
      return makeReply(
        `All of your top-synergy characters in your **Genshin Roster** spreadsheet are already Lv 70+! You can focus on crowning key talents and refining artifacts for your Lv 90 core.`
      );
    }

    const bulletLines = priorities.map(
      (p, idx) =>
        `${idx + 1}. **${p.character.name}** (Lv ${p.character.level} ${p.character.element} · *${p.priority}*) — ${p.reason}`
    );

    return makeReply(
      `Based on your **Genshin Roster** spreadsheet (**${builtCount}** Lv 80–90 built, **${partialCount}** Lv 40–70 partial, **${benchCount}** Lv 1–30 bench), here are your highest-impact characters to level next:\n\n${bulletLines.join('\n')}\n\nClick any character chip below to inspect their ideal artifact set and stats.`,
      {
        mentionedCharacters: priorities.map((p) => p.character),
        followUps: [
          `How do I build ${priorities[0].character.name}?`,
          `Best team for ${priorities[0].character.name}`,
        ],
      }
    );
  }

  // 4. Specific character build / artifacts / stats / constellations
  if (
    mentionedChars.length > 0 &&
    /\b(build|artifact|set|sands|goblet|circlet|substat|stats|weapon|gear|how (do i|to) (play|use|build)|constellation)\b/i.test(
      qLower
    )
  ) {
    const char = mentionedChars[0];
    const guide = getArtifactGuide(char);
    const ascensionBoss = ENCOUNTERS.find((enc) =>
      enc.dropsFor?.some(
        (d) => d.toLowerCase() === char.name.toLowerCase()
      )
    );
    const bestTeam = generateRecommendedTeams(
      roster,
      {
        archetypeId: null,
        encounterId: null,
        anchorCharacterId: char.id,
        includeUnbuilt: char.level < BATTLE_READY_LEVEL ? true : includeUnbuilt,
        requireSurvivability,
        excludedCharacterIds: [],
      },
      1
    )[0];

    const lines = [
      `**${char.name} Build Guide** — Lv ${char.level} · ${char.element} ${char.weapon} · ${char.rarity}★ (${getTierLabel(char.level)})`,
      `• **Role & Mechanic:** ${char.role} — ${char.specialMechanic}`,
      `• **Constellations:** ${formatConstellationLabel(char)}`,
      `• **Best Artifact Set:** **${guide.primarySet}** *(Alt: ${guide.alternativeSet})*`,
      `• **Main Stats:** Sands: ${guide.sands} · Goblet: ${guide.goblet} · Circlet: ${guide.circlet}`,
      `• **Substats:** ${guide.substats}`,
      `• **Tip:** ${guide.note}`,
    ];

    if (ascensionBoss) {
      lines.push(
        `• **Ascension Boss:** Farm **${ascensionBoss.name}** (${ascensionBoss.region}) for ${char.name}'s ascension drops.`
      );
    }

    if (char.level < BATTLE_READY_LEVEL) {
      lines.push(
        `\n*Note: ${char.name} is currently Lv ${char.level} in your Genshin Roster — leveling them to 70/80+ unlocks the team below for endgame clears.*`
      );
    }

    return makeReply(lines.join('\n'), {
      mentionedCharacters: [char],
      suggestedTeam: bestTeam,
      followUps: [
        ascensionBoss
          ? `Best team to farm ${ascensionBoss.name}`
          : `Alternative team for ${char.name}`,
        'Who should I level up next?',
      ],
    });
  }

  // 5. Boss / Encounter counter team
  if (
    matchedEncounter &&
    !(/\b(build|artifact)\b/i.test(qLower) && mentionedChars.length > 0)
  ) {
    const recs = generateRecommendedTeams(
      roster,
      {
        archetypeId: null,
        encounterId: matchedEncounter.id,
        anchorCharacterId: null,
        includeUnbuilt,
        requireSurvivability:
          matchedEncounter.requiresHealer ? true : requireSurvivability,
        excludedCharacterIds: [],
      },
      2
    );
    const best = recs[0];

    if (!best) {
      return makeReply(
        `**${matchedEncounter.name}** (${matchedEncounter.region}): ${matchedEncounter.tacticalTip}\n\nTry enabling **Pool: Lv 1–90** to widen candidate counters from your roster.`
      );
    }

    const lines = [
      `**Counter Strategy — ${matchedEncounter.name}** (${matchedEncounter.region} · ${matchedEncounter.category})`,
      `${matchedEncounter.summary}`,
      `\n• **Tactical Key:** ${matchedEncounter.tacticalTip}`,
      `• **Recommended Squad:** ${best.members.map((m) => `${m.name} (Lv ${m.level})`).join(' · ')}`,
      `• **Sustain Check:** ${best.analysis.survivability} · Score ${best.analysis.score}/100`,
    ];

    if (matchedEncounter.dropsFor && matchedEncounter.dropsFor.length > 0) {
      lines.push(
        `• **Ascension Drops For:** ${matchedEncounter.dropsFor.join(', ')}`
      );
    }

    return makeReply(lines.join('\n'), {
      suggestedTeam: best,
      followUps: [
        matchedEncounter.dropsFor?.[0]
          ? `How do I build ${matchedEncounter.dropsFor[0]}?`
          : `How do I build ${best.members[0].name}?`,
        'Build two Spiral Abyss teams',
      ],
    });
  }

  // 6. Healers / Shielders / Sustain / Constellations / Element audit
  if (
    /\b(healer|healers|shielder|shielders|sustain|constellation|constellations|my roster|check my|how many|who do i have)\b/i.test(
      qLower
    )
  ) {
    const wantsHealers = /\b(healer|healers|heal|shield|shielder|sustain)\b/i.test(
      qLower
    );
    const wantsConstellations = /\b(constellation|constellations|c1|c2|c3|c4|c5|c6)\b/i.test(
      qLower
    );
    const askedElement = ELEMENTS.find((el) =>
      new RegExp(`\\b${el.toLowerCase()}\\b`, 'i').test(qLower)
    );

    if (askedElement) {
      const ofEl = roster
        .filter((c) => c.element === askedElement)
        .sort((a, b) => b.level - a.level);
      const list = ofEl.map(
        (c) =>
          `• **${c.name}** — Lv ${c.level} (${c.role}${c.isHealer ? ', Healer' : ''}${c.isShielder ? ', Shielder' : ''}) · ${formatConstellationLabel(c)}`
      );
      return makeReply(
        `You own **${ofEl.length} ${askedElement} characters** in your **Genshin Roster** spreadsheet:\n\n${list.join('\n')}`,
        {
          mentionedCharacters: ofEl.slice(0, 6),
          followUps: [
            ofEl[0] ? `Best team for ${ofEl[0].name}` : 'Who should I level up next?',
            'Who should I level up next?',
          ],
        }
      );
    }

    if (wantsHealers && !wantsConstellations) {
      const healers = roster
        .filter((c) => c.isHealer)
        .sort((a, b) => b.level - a.level);
      const shielders = roster
        .filter((c) => c.isShielder && !c.isHealer)
        .sort((a, b) => b.level - a.level);

      const lines = [
        `**Sustain Options in Your Genshin Roster**`,
        `\n**Healers (${healers.length}):**`,
        ...healers.map(
          (c) =>
            `• **${c.name}** — Lv ${c.level} ${c.element} (${c.specialMechanic})`
        ),
      ];
      if (shielders.length > 0) {
        lines.push(`\n**Dedicated Shielders (${shielders.length}):**`);
        lines.push(
          ...shielders.map(
            (c) =>
              `• **${c.name}** — Lv ${c.level} ${c.element} (${c.specialMechanic})`
          )
        );
      }
      return makeReply(lines.join('\n'), {
        mentionedCharacters: [...healers.slice(0, 4), ...shielders.slice(0, 2)],
        followUps: [
          'Who should I level up next?',
          'Build two Spiral Abyss teams',
        ],
      });
    }

    const withCons = roster
      .filter((c) => c.constellations.length > 0)
      .sort((a, b) => b.constellations.length - a.constellations.length || b.level - a.level);
    const readyHealers = roster
      .filter((c) => c.isHealer && c.level >= BATTLE_READY_LEVEL)
      .sort((a, b) => b.level - a.level);

    const lines = [
      `**Genshin Roster Snapshot** — ${roster.length} owned characters (**${builtCount}** Lv 80–90 built · **${partialCount}** Lv 40–70 partial · **${benchCount}** Lv 1–30 bench)`,
      `\n**Battle-Ready Healers (Lv 70+):** ${readyHealers.map((c) => `${c.name} (Lv ${c.level})`).join(', ') || 'None'}`,
      `\n**Unlocked Constellations (${withCons.length} characters):**`,
      ...withCons.slice(0, 10).map(
        (c) => `• **${c.name}** (Lv ${c.level}) — **C${c.constellations.length}**: ${c.constellations.join(', ')}`
      ),
    ];

    return makeReply(lines.join('\n'), {
      mentionedCharacters: withCons.slice(0, 5),
      followUps: [
        'Who should I level up next?',
        'Build two Spiral Abyss teams',
      ],
    });
  }

  // 7. Archetype / Elemental Reaction question
  if (matchedArchetype) {
    const needsUnbuilt =
      matchedArchetype.id === 'overloaded-chevreuse' ||
      matchedArchetype.id === 'nightsoul-geo' ||
      matchedArchetype.id === 'arkhe-ousia';
    const recs = generateRecommendedTeams(
      roster,
      {
        archetypeId: matchedArchetype.id,
        encounterId: null,
        anchorCharacterId: mentionedChars[0]?.id ?? null,
        includeUnbuilt: needsUnbuilt ? true : includeUnbuilt,
        requireSurvivability,
        excludedCharacterIds: [],
      },
      1
    );
    const best = recs[0];
    const lines = [
      `**${matchedArchetype.name}** (${matchedArchetype.category})`,
      matchedArchetype.summary,
      `\n• **How to Play It:** ${matchedArchetype.highlightNote}`,
    ];
    if (best) {
      lines.push(
        `• **Best Owned Squad:** ${best.members.map((m) => `${m.name} (Lv ${m.level})`).join(' · ')} (Score ${best.analysis.score}/100 · Sustain: ${best.analysis.survivability})`
      );
      const unbuiltInTeam = best.members.filter(
        (m) => m.level < BATTLE_READY_LEVEL
      );
      if (unbuiltInTeam.length > 0) {
        lines.push(
          `• **Leveling Note:** ${unbuiltInTeam.map((m) => `${m.name} (Lv ${m.level})`).join(', ')} will need leveling to 70/80+ for endgame comfort.`
        );
      }
    }

    return makeReply(lines.join('\n'), {
      suggestedTeam: best,
      followUps: [
        best ? `How do I build ${best.members[0].name}?` : 'Who should I level up next?',
        'Build two Spiral Abyss teams',
      ],
    });
  }

  // 8. Region / Overworld party
  if (matchedRegion) {
    const alts = generateTeamsForRegion(roster, matchedRegion.regionName, {
      includeUnbuilt,
      requireSurvivability,
      maxResults: 3,
    });
    const best = alts[0];
    const presetLine = matchedRegion.preset
      ? `Your saved **${matchedRegion.preset.region}** squad is **${matchedRegion.preset.teamName}** (${matchedRegion.preset.slots.mainDps}, ${matchedRegion.preset.slots.subDps}, ${matchedRegion.preset.slots.utility}, ${matchedRegion.preset.slots.healer}).`
      : `Here is a tailored **${matchedRegion.regionName}** exploration & combat squad from your roster.`;

    const lines = [
      `**${matchedRegion.regionName} Party Recommendation**`,
      presetLine,
    ];
    if (best) {
      lines.push(
        `\n• **Top Roster Pick:** **${best.title}** — ${best.members.map((m) => `${m.name} (Lv ${m.level})`).join(' · ')} (Score ${best.analysis.score}/100)`
      );
      lines.push(`• **Why it works:** ${best.whyItWorks}`);
    }

    return makeReply(lines.join('\n'), {
      suggestedTeam: best,
      followUps: [
        'Best team to farm Wavebinder',
        'Who should I level up next?',
      ],
    });
  }

  // 9. Character-anchored team building (1 or more specific characters mentioned)
  if (mentionedChars.length > 0) {
    const anchor = mentionedChars[0];
    const allowUnbuiltForAnchor =
      anchor.level < BATTLE_READY_LEVEL ? true : includeUnbuilt;
    const recs = generateRecommendedTeams(
      roster,
      {
        archetypeId: null,
        encounterId: null,
        anchorCharacterId: anchor.id,
        includeUnbuilt: allowUnbuiltForAnchor,
        requireSurvivability,
        excludedCharacterIds: [],
      },
      2
    );
    const best = recs[0];
    const guide = getArtifactGuide(anchor);

    const lines = [
      `**Best Team for ${anchor.name}** (Lv ${anchor.level} ${anchor.element} · ${formatConstellationLabel(anchor)})`,
    ];

    if (best) {
      const reactions =
        best.analysis.reactions
          .slice(0, 3)
          .map((r) => r.name)
          .join(', ') || 'Elemental synergy';
      lines.push(
        `• **Recommended Squad:** ${best.members.map((m) => `${m.name} (Lv ${m.level})`).join(' · ')}`
      );
      lines.push(
        `• **Synergy & Reactions:** ${reactions} (Score ${best.analysis.score}/100 · Sustain: ${best.analysis.survivability})`
      );
      lines.push(`• **Why it works:** ${best.whyItWorks}`);
      lines.push(
        `• **Quick Artifact Tip:** Run **${guide.primarySet}** on ${anchor.name} (${guide.sands} / ${guide.goblet} / ${guide.circlet}).`
      );
      if (anchor.level < BATTLE_READY_LEVEL) {
        lines.push(
          `\n*Heads-up: ${anchor.name} is currently Lv ${anchor.level} in your Genshin Roster — bring them to 70/80+ to unlock this squad's full potential (${best.analysis.potentialScore}/100).*`
        );
      }
    } else {
      lines.push(
        `I couldn't assemble a full 4-character squad around ${anchor.name} with the current pool filters. Try enabling **Pool: Lv 1–90** in the header.`
      );
    }

    return makeReply(lines.join('\n'), {
      suggestedTeam: best,
      mentionedCharacters: [anchor],
      followUps: [
        `How do I build ${anchor.name}?`,
        'Who should I level up next?',
      ],
    });
  }

  // 10. General strongest team / fallback
  const topTeams = generateRankedStrongestTeams(roster, {
    includeUnbuilt,
    requireSurvivability,
    sortBy: 'ready-now',
    maxResults: 3,
  });
  const top = topTeams[0];

  const lines = [
    `I'm grounded in your **Genshin Roster** spreadsheet (**${roster.length}** characters · **${builtCount}** Lv 80–90 built).`,
  ];

  if (top) {
    lines.push(
      `\nYour strongest Battle-Ready squad right now is **${top.team.title}** (Score **${top.readyScore}/100**): ${top.team.members.map((m) => `${m.name} (Lv ${m.level})`).join(' · ')}.`
    );
    lines.push(`• ${top.team.whyItWorks}`);
  }

  lines.push(
    `\nTry asking me about a specific **character**, **boss fight**, **region**, **Spiral Abyss**, **artifact build**, or **who to level up next** — or add a Gemini API key in **Settings** for open-ended AI conversations with your Genshin Guru skill.`
  );

  return makeReply(lines.join('\n'), {
    suggestedTeam: top?.team,
    followUps: [
      'Who should I level up next?',
      'Build two Spiral Abyss teams',
      'Best team to farm Wavebinder',
    ],
  });
}

function buildRosterContextForGemini(ctx: GuruChatContext): string {
  const rosterLines = ctx.roster.map((c) => {
    const conText =
      c.constellations.length > 0
        ? `C${c.constellations.length} [${c.constellations.join(', ')}]`
        : 'C0';
    return `- ${c.name} | Lv ${c.level} | ${c.element} | ${c.weapon} | ${c.rarity}★ | Healer: ${c.isHealer ? 'Yes' : 'No'} | Shielder: ${c.isShielder ? 'Yes' : 'No'} | Constellations: ${conText} | Role: ${c.role} | Mechanic: ${c.specialMechanic}`;
  });

  const activeCircleSummary = ctx.activeTeam
    ? `Active Team Circle: "${ctx.activeTeam.title}" — ${ctx.activeTeam.members.map((m) => `${m.name} (Lv ${m.level})`).join(', ')} (Score ${ctx.activeTeam.analysis.score}/100, Reactions: ${ctx.activeTeam.analysis.reactions.map((r) => r.name).join(', ') || 'None'})`
    : 'Active Team Circle: Empty';

  const presetLines = ctx.presets
    .slice(0, 12)
    .map(
      (p) =>
        `- ${p.region}: ${p.teamName} (${p.slots.mainDps}, ${p.slots.subDps}, ${p.slots.utility}, ${p.slots.healer})`
    );

  return `${GENSHIN_GURU_SKILL_INSTRUCTIONS}

## Live Genshin Roster (${ctx.roster.length} owned characters)
${rosterLines.join('\n')}

## Current Workspace Context
- ${activeCircleSummary}
- Active Pool Toggle: ${ctx.includeUnbuilt ? 'All Owned Characters (Lv 1-90)' : 'Battle-Ready Priority (Lv 70+)'}
- Survivability Rule: ${ctx.requireSurvivability ? 'Require Healer or Shielder unless user asks for sustainless/glass cannon' : 'Glass Cannon allowed'}

## Saved Party by Region Presets
${presetLines.join('\n')}

## Response Format
Return ONLY valid JSON matching this schema:
{
  "reply": "Helpful, concise, markdown-friendly answer (use **bold** and bullet lists with •). Never expose internal file or spreadsheet IDs.",
  "suggestedTeam": {
    "title": "Short team name",
    "members": ["Exact Name 1", "Exact Name 2", "Exact Name 3", "Exact Name 4"],
    "reason": "1-2 sentences on why this team works"
  },
  "suggestedAbyss": {
    "half1Title": "Half 1 name",
    "half1Members": ["Exact Name 1", "Exact Name 2", "Exact Name 3", "Exact Name 4"],
    "half2Title": "Half 2 name",
    "half2Members": ["Exact Name 5", "Exact Name 6", "Exact Name 7", "Exact Name 8"]
  },
  "mentionedCharacters": ["Exact Character Name"],
  "followUps": ["Short follow-up question 1", "Short follow-up question 2"]
}
Notes on optional fields:
- Only include "suggestedTeam" if recommending a single 4-character team (must use 4 distinct EXACT names from the Live Genshin Roster above). Otherwise omit it or set to null.
- Only include "suggestedAbyss" if the user asked for two Spiral Abyss teams (must use 8 distinct EXACT names from the Live Genshin Roster above). Otherwise omit it or set to null.
- Include up to 4 "mentionedCharacters" (EXACT names from the roster) when discussing builds or leveling priorities.
- Include 2-3 short, useful "followUps".`;
}

interface GeminiSkillJson {
  reply?: string;
  suggestedTeam?: {
    title?: string;
    members?: string[];
    reason?: string;
  } | null;
  suggestedAbyss?: {
    half1Title?: string;
    half1Members?: string[];
    half2Title?: string;
    half2Members?: string[];
  } | null;
  mentionedCharacters?: string[] | null;
  followUps?: string[] | null;
}

/**
 * Live Gemini API call powered by the exact genshin-guru SKILL.md system prompt
 * and the user's live roster + conversation history.
 */
export async function askGuruSkill(
  query: string,
  ctx: GuruChatContext
): Promise<GuruChatMessage> {
  const cleanKey = ctx.geminiApiKey.trim();
  if (!cleanKey) {
    return askGuruSkillLocal(query, ctx);
  }

  const systemPrompt = buildRosterContextForGemini(ctx);
  const recentHistory = ctx.history.slice(-8).map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }));

  const contents = [
    ...recentHistory,
    { role: 'user', parts: [{ text: query }] },
  ];

  try {
    const data = (await callGeminiGenerateContent(cleanKey, {
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents,
      generationConfig: {
        temperature: 0.45,
        responseMimeType: 'application/json',
      },
    })) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    const rawText: string =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    const parsed = JSON.parse(rawText) as GeminiSkillJson;
    const replyText =
      parsed.reply?.trim() ||
      'Here is my recommendation based on your Genshin Roster spreadsheet.';

    let suggestedTeam: TeamRecommendation | undefined;
    if (parsed.suggestedTeam?.members) {
      const tuple = resolveFourMemberTuple(
        parsed.suggestedTeam.members,
        ctx.roster
      );
      if (tuple) {
        suggestedTeam = buildRecommendationFromTuple(
          tuple,
          parsed.suggestedTeam.title || 'Genshin Guru Pick',
          parsed.suggestedTeam.reason ||
            'Recommended by your Genshin Guru skill.',
          'gemini'
        );
      }
    }

    let suggestedAbyss:
      | { half1: TeamRecommendation; half2: TeamRecommendation }
      | undefined;
    if (
      parsed.suggestedAbyss?.half1Members &&
      parsed.suggestedAbyss?.half2Members
    ) {
      const t1 = resolveFourMemberTuple(
        parsed.suggestedAbyss.half1Members,
        ctx.roster
      );
      const t2 = resolveFourMemberTuple(
        parsed.suggestedAbyss.half2Members,
        ctx.roster
      );
      if (t1 && t2) {
        const ids1 = new Set(t1.map((c) => c.id));
        const noOverlap = t2.every((c) => !ids1.has(c.id));
        if (noOverlap) {
          suggestedAbyss = {
            half1: buildRecommendationFromTuple(
              t1,
              parsed.suggestedAbyss.half1Title || 'Abyss Half 1',
              'Half 1 squad recommended by Genshin Guru.',
              'gemini'
            ),
            half2: buildRecommendationFromTuple(
              t2,
              parsed.suggestedAbyss.half2Title || 'Abyss Half 2',
              'Half 2 squad recommended by Genshin Guru.',
              'gemini'
            ),
          };
        }
      }
    }

    const mentionedCharacters: Character[] = [];
    if (Array.isArray(parsed.mentionedCharacters)) {
      for (const name of parsed.mentionedCharacters) {
        const match = resolveRosterCharacter(name, ctx.roster);
        if (match && !mentionedCharacters.some((c) => c.id === match.id)) {
          mentionedCharacters.push(match);
        }
      }
    }

    const followUps = Array.isArray(parsed.followUps)
      ? parsed.followUps
          .map((s) => String(s).trim())
          .filter(Boolean)
          .slice(0, 3)
      : undefined;

    return {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      role: 'assistant',
      content: replyText,
      createdAt: new Date().toISOString(),
      engine: 'gemini-skill',
      suggestedTeam,
      suggestedAbyss,
      mentionedCharacters:
        mentionedCharacters.length > 0 ? mentionedCharacters : undefined,
      followUps,
    };
  } catch (err) {
    const localReply = askGuruSkillLocal(query, ctx);
    const reason = err instanceof Error ? err.message : 'Gemini request failed';
    return {
      ...localReply,
      fallbackNote: `${reason} — answered with built-in Genshin Guru Skill Engine instead.`,
    };
  }
}
