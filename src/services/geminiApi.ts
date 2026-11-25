import type { Character, TeamRecommendation } from '../types/genshin';
import { analyzeTeam, inferSlotRoles } from '../engine/teamAnalyzer';

export async function callGeminiGenerateContent(
  apiKey: string,
  payload: Record<string, unknown>,
  model = 'gemini-2.5-flash'
): Promise<Record<string, unknown>> {
  const cleanKey = apiKey.trim();
  const encodedKey = encodeURIComponent(cleanKey);

  const endpoints = [
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodedKey}`,
  ];

  // Google issues AQ.-prefixed keys for both AI Studio and Vertex AI Express Mode;
  // try AI Studio first and automatically fall back to Vertex Express on 401/403.
  if (cleanKey.startsWith('AQ.')) {
    endpoints.push(
      `https://aiplatform.googleapis.com/v1beta1/publishers/google/models/${model}:generateContent?key=${encodedKey}`
    );
  }

  let lastDetail = 'Request failed';

  for (let i = 0; i < endpoints.length; i++) {
    const res = await fetch(endpoints[i], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      return (await res.json()) as Record<string, unknown>;
    }

    lastDetail = `HTTP ${res.status}`;
    try {
      const err = (await res.json()) as { error?: { message?: string } };
      if (err?.error?.message) lastDetail = err.error.message;
    } catch {
      // ignore parse errors
    }

    const canRetryFallback =
      i + 1 < endpoints.length && (res.status === 401 || res.status === 403);
    if (!canRetryFallback) {
      break;
    }
  }

  throw new Error(`Gemini API error (${lastDetail}).`);
}

export async function askGenshinGuruGemini(
  query: string,
  roster: Character[],
  apiKey: string,
  includeUnbuilt: boolean,
  requireSurvivability: boolean
): Promise<TeamRecommendation> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    throw new Error(
      'Add a Gemini API key in Sync & API Settings to run freeform AI queries.'
    );
  }

  const eligible = includeUnbuilt
    ? roster
    : roster.filter((c) => c.level >= 70);

  const rosterSummary = eligible
    .map(
      (c) =>
        `${c.name} (Lv ${c.level}, ${c.element}, ${c.weapon}, ${c.role}${
          c.isHealer ? ', Healer' : ''
        }${c.isShielder ? ', Shielder' : ''}, Mechanic: ${c.specialMechanic})`
    )
    .join('\n');

  const prompt = `You are Genshin Guru, an expert Genshin Impact 7.x team-building strategist.
The player asks: "${query}"

Player's available roster:
${rosterSummary}

Rules:
- Pick EXACTLY 4 distinct characters from the player's available roster above. Use their EXACT names.
- ${
    requireSurvivability
      ? 'Include at least 1 Healer or Shielder for survivability.'
      : 'Glass Cannon mode allowed (healer/shielder optional).'
  }
- Respect Genshin 7.x mechanics: Moonsign (2+ Moonsign units = Ascendant Gleam for Flins/Lauma/Zibai), Stellar Glimmer (Cryo + Electro = Stellar-Conduct for Cryo Traveller/Alyosha), and Chevreuse (Pyro + Electro only).
- Return ONLY valid JSON with this exact schema:
{
  "title": "Short team name",
  "subtitle": "Key reactions (e.g. Stellar-Conduct · Melt)",
  "members": ["Exact Name 1", "Exact Name 2", "Exact Name 3", "Exact Name 4"],
  "whyItWorks": "2-3 concise sentences explaining why this team answers the player's question and how to play it."
}`;

  const data = (await callGeminiGenerateContent(cleanKey, {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.3,
      responseMimeType: 'application/json',
    },
  })) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const rawText: string =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  const parsed = JSON.parse(rawText) as {
    title?: string;
    subtitle?: string;
    members?: string[];
    whyItWorks?: string;
  };

  if (!Array.isArray(parsed.members) || parsed.members.length !== 4) {
    throw new Error('Gemini did not return a 4-character team.');
  }

  const resolved: Character[] = [];
  for (const name of parsed.members) {
    const clean = name.trim().toLowerCase();
    const match =
      roster.find((c) => c.name.toLowerCase() === clean) ??
      roster.find(
        (c) =>
          c.name.toLowerCase().includes(clean) ||
          clean.includes(c.name.toLowerCase())
      );
    if (!match || resolved.some((r) => r.id === match.id)) {
      throw new Error(
        `Gemini suggested "${name}", which could not be matched uniquely to your roster.`
      );
    }
    resolved.push(match);
  }

  const tuple = resolved as [Character, Character, Character, Character];
  const analysis = analyzeTeam(tuple);
  const slotLabels = inferSlotRoles(tuple);

  return {
    id: `gemini-${Date.now()}`,
    title: parsed.title?.trim() || 'Genshin Guru Pick',
    subtitle:
      parsed.subtitle?.trim() ||
      analysis.reactions
        .slice(0, 3)
        .map((r) => r.name)
        .join(' · '),
    members: tuple,
    slotLabels,
    analysis,
    whyItWorks:
      parsed.whyItWorks?.trim() ||
      'Generated by Genshin Guru based on your live character roster.',
    source: 'gemini',
  };
}
