import type { Character, TeamRecommendation } from '../types/genshin';
import { analyzeTeam, inferSlotRoles } from '../engine/teamAnalyzer';

const GEMINI_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
];

export interface GeminiGenerateResult {
  data: Record<string, unknown>;
  model: string;
}

/**
 * Checks whether the local Vite dev server proxy has a Gemini API key configured in .env.local.
 */
export async function checkServerGeminiStatus(): Promise<boolean> {
  if (!import.meta.env.DEV) return false;
  try {
    const res = await fetch('/api/gemini-status');
    if (!res.ok) return false;
    const json = (await res.json()) as { configured?: boolean };
    return Boolean(json.configured);
  } catch {
    return false;
  }
}

export async function callGeminiGenerateContent(
  apiKey: string,
  payload: Record<string, unknown>,
  preferredModels: string[] = GEMINI_MODELS
): Promise<GeminiGenerateResult> {
  const cleanKey = apiKey.trim();

  // In dev mode, route through the same-origin Vite proxy first so .env.local works
  // reliably even across preview frames, browser CSP rules, or stale localStorage.
  if (import.meta.env.DEV) {
    try {
      const proxyRes = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: cleanKey || undefined,
          payload,
          preferredModels,
        }),
      });

      if (proxyRes.ok) {
        const wrapped = (await proxyRes.json()) as {
          data: Record<string, unknown>;
          model?: string;
        };
        return {
          data: wrapped.data,
          model: wrapped.model || preferredModels[0] || 'gemini-3.6-flash',
        };
      }

      if (proxyRes.status !== 404) {
        let detail = `HTTP ${proxyRes.status}`;
        try {
          const err = (await proxyRes.json()) as { error?: string };
          if (err?.error) detail = err.error;
        } catch {
          // ignore
        }
        throw new Error(detail);
      }
    } catch (err) {
      // If proxy explicitly returned an upstream Gemini error, surface it instead of masking
      if (err instanceof Error && err.message.startsWith('Gemini API error')) {
        throw err;
      }
      // Otherwise (e.g. non-browser Node/tsx test where /api/gemini doesn't exist),
      // fall through to direct Gemini API call if we have a key.
      if (!cleanKey) {
        throw err instanceof Error ? err : new Error('Gemini proxy unavailable.');
      }
    }
  }

  if (!cleanKey) {
    throw new Error(
      'No Gemini API key configured. Add one in Sync & API Settings.'
    );
  }

  const encodedKey = encodeURIComponent(cleanKey);
  const bases = ['https://generativelanguage.googleapis.com/v1beta/models'];
  if (cleanKey.startsWith('AQ.')) {
    bases.push(
      'https://aiplatform.googleapis.com/v1beta1/publishers/google/models'
    );
  }

  let lastDetail = 'Request failed';

  for (let b = 0; b < bases.length; b++) {
    let authRejected = false;

    for (const model of preferredModels) {
      const url = `${bases[b]}/${model}:generateContent?key=${encodedKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        return {
          data: (await res.json()) as Record<string, unknown>,
          model,
        };
      }

      lastDetail = `HTTP ${res.status}`;
      try {
        const err = (await res.json()) as { error?: { message?: string } };
        if (err?.error?.message) lastDetail = err.error.message;
      } catch {
        // ignore parse errors
      }

      if (res.status === 401 || res.status === 403) {
        authRejected = true;
        break;
      }

      if (res.status === 404 || res.status === 429 || res.status === 503) {
        continue;
      }

      throw new Error(`Gemini API error (${lastDetail}).`);
    }

    if (!authRejected) {
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

  const { data } = await callGeminiGenerateContent(cleanKey, {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.3,
      responseMimeType: 'application/json',
    },
  });

  const candidates = data?.candidates as
    | Array<{ content?: { parts?: Array<{ text?: string }> } }>
    | undefined;
  const rawText: string =
    candidates?.[0]?.content?.parts?.[0]?.text ?? '';

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
