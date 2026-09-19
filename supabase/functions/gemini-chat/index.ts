/**
 * Supabase Edge Function — Gemini proxy.
 *
 * Optional, but recommended for production: it keeps the Gemini API key on the
 * server instead of shipping it in the browser bundle.
 *
 * Deploy:
 *   supabase functions deploy gemini-chat
 *   supabase secrets set GEMINI_API_KEY=your-key
 *
 * Then point the client at it by setting VITE_GEMINI_PROXY_URL in .env to
 *   https://<project-ref>.supabase.co/functions/v1/gemini-chat
 */

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.0-flash';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SYSTEM = `You are the writing assistant inside TH-INK, a quiet literary platform for
essayists, poets and long-form writers.

Voice: warm, specific, unhurried. You talk like a good editor — the kind who
names the exact sentence that is not working and says why.

Rules:
- Be concrete. Quote the writer's own words back when you critique them.
- Never pad with praise you do not mean, and never open with "Great question".
- Keep answers to 2-4 short paragraphs unless the writer asks for more.
- When asked to write, match the writer's voice rather than your own.
- Plain prose. No markdown headers, no bulleted lists unless asked.`;

type Turn = { role: 'user' | 'model'; content: string };

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  if (!GEMINI_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'GEMINI_API_KEY is not set on this function.' }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } },
    );
  }

  // Only signed-in users may spend tokens.
  const auth = req.headers.get('Authorization');
  if (!auth) {
    return new Response(JSON.stringify({ error: 'Missing Authorization header.' }), {
      status: 401,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { prompt, history = [], context } = (await req.json()) as {
      prompt: string;
      history?: Turn[];
      context?: string;
    };

    if (!prompt?.trim()) {
      return new Response(JSON.stringify({ error: 'prompt is required.' }), {
        status: 400,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const contents = [
      ...history.map(t => ({ role: t.role, parts: [{ text: t.content }] })),
      {
        role: 'user',
        parts: [
          {
            text: context
              ? `Here is the piece the writer is working on:\n\n"""\n${context.slice(0, 6000)}\n"""\n\n${prompt}`
              : prompt,
          },
        ],
      },
    ];

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: SYSTEM }] },
          generationConfig: { maxOutputTokens: 1024, temperature: 0.85 },
        }),
      },
    );

    if (!res.ok) {
      const detail = await res.text();
      return new Response(JSON.stringify({ error: 'Gemini rejected the request.', detail }), {
        status: 502,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const data = await res.json();
    const text: string =
      data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? '';

    return new Response(JSON.stringify({ text }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unexpected error' }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } },
    );
  }
});
