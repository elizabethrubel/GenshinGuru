import type { IncomingMessage, ServerResponse } from 'node:http';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';

const DEFAULT_GEMINI_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
];

function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      try {
        const text = Buffer.concat(chunks).toString('utf8');
        resolve(text ? (JSON.parse(text) as Record<string, unknown>) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function geminiDevProxyPlugin(serverGeminiKey: string): Plugin {
  return {
    name: 'genshin-guru-gemini-proxy',
    configureServer(server) {
      server.middlewares.use('/api/gemini-status', (_req, res) => {
        sendJson(res, 200, {
          configured: Boolean(serverGeminiKey.trim()),
        });
      });

      server.middlewares.use('/api/gemini', async (req, res) => {
        if (req.method !== 'POST') {
          sendJson(res, 405, { error: 'Method not allowed' });
          return;
        }

        try {
          const body = await readJsonBody(req);
          const requestKey =
            typeof body.apiKey === 'string' ? body.apiKey.trim() : '';
          const cleanKey = requestKey || serverGeminiKey.trim();

          if (!cleanKey) {
            sendJson(res, 400, {
              error: 'No Gemini API key configured in .env.local or Settings.',
            });
            return;
          }

          const payload = body.payload as Record<string, unknown> | undefined;
          if (!payload || typeof payload !== 'object') {
            sendJson(res, 400, { error: 'Missing Gemini request payload.' });
            return;
          }

          const preferredModels =
            Array.isArray(body.preferredModels) &&
            body.preferredModels.length > 0
              ? body.preferredModels.map(String)
              : DEFAULT_GEMINI_MODELS;

          const encodedKey = encodeURIComponent(cleanKey);
          const bases = [
            'https://generativelanguage.googleapis.com/v1beta/models',
          ];
          if (cleanKey.startsWith('AQ.')) {
            bases.push(
              'https://aiplatform.googleapis.com/v1beta1/publishers/google/models'
            );
          }

          let lastStatus = 502;
          let lastDetail = 'Gemini request failed';

          for (const base of bases) {
            let authRejected = false;

            for (const model of preferredModels) {
              const url = `${base}/${model}:generateContent?key=${encodedKey}`;
              const upstream = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
              });

              if (upstream.ok) {
                const data = (await upstream.json()) as Record<string, unknown>;
                sendJson(res, 200, { data, model });
                return;
              }

              lastStatus = upstream.status;
              lastDetail = `HTTP ${upstream.status}`;
              try {
                const err = (await upstream.json()) as {
                  error?: { message?: string };
                };
                if (err?.error?.message) lastDetail = err.error.message;
              } catch {
                // ignore parse errors
              }

              if (upstream.status === 401 || upstream.status === 403) {
                authRejected = true;
                break;
              }

              if (
                upstream.status === 404 ||
                upstream.status === 429 ||
                upstream.status === 503
              ) {
                continue;
              }

              sendJson(res, upstream.status, {
                error: `Gemini API error (${lastDetail}).`,
              });
              return;
            }

            if (!authRejected) {
              break;
            }
          }

          sendJson(res, lastStatus, {
            error: `Gemini API error (${lastDetail}).`,
          });
        } catch (err) {
          const msg =
            err instanceof Error ? err.message : 'Unexpected proxy error';
          sendJson(res, 500, { error: msg });
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const serverGeminiKey = env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || '';

  return {
    plugins: [react(), geminiDevProxyPlugin(serverGeminiKey)],
  };
});
