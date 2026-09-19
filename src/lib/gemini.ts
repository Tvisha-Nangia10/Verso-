import { GoogleGenAI } from '@google/genai';
import { supabase } from './supabase';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const model = (import.meta.env.VITE_GEMINI_MODEL as string | undefined) ?? 'gemini-2.0-flash';

/**
 * Optional Supabase Edge Function that holds the Gemini key server-side.
 * When set, the browser never sees the key — see supabase/functions/gemini-chat.
 */
const proxyUrl = import.meta.env.VITE_GEMINI_PROXY_URL as string | undefined;

export const isGeminiConfigured = Boolean(apiKey || proxyUrl);

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export type ChatTurn = { role: 'user' | 'model'; content: string };

const WRITING_ASSISTANT_SYSTEM = `You are the writing assistant inside TH-INK, a quiet literary platform for
essayists, poets and long-form writers.

Voice: warm, specific, unhurried. You talk like a good editor — the kind who
names the exact sentence that is not working and says why.

Rules:
- Be concrete. Quote the writer's own words back when you critique them.
- Never pad with praise you do not mean, and never open with "Great question".
- Keep answers to 2-4 short paragraphs unless the writer asks for more.
- When asked to write, match the writer's voice rather than your own.
- Plain prose. No markdown headers, no bulleted lists unless asked.`;

/**
 * One-shot / multi-turn call to Gemini.
 * `history` is the prior conversation; `prompt` is the new user turn.
 */
export async function askGemini(
  prompt: string,
  opts: { history?: ChatTurn[]; context?: string; system?: string } = {},
): Promise<string> {
  if (proxyUrl) return askViaProxy(prompt, opts);

  if (!ai) {
    throw new Error(
      'Gemini is not configured. Add VITE_GEMINI_API_KEY to your .env and restart the dev server.',
    );
  }

  const { history = [], context, system = WRITING_ASSISTANT_SYSTEM } = opts;

  const contents = [
    ...history.map(t => ({ role: t.role, parts: [{ text: t.content }] })),
    {
      role: 'user' as const,
      parts: [
        {
          text: context
            ? `Here is the piece the writer is working on:\n\n"""\n${context.slice(0, 6000)}\n"""\n\n${prompt}`
            : prompt,
        },
      ],
    },
  ];

  const res = await ai.models.generateContent({
    model,
    contents,
    config: {
      systemInstruction: system,
      maxOutputTokens: 1024,
      temperature: 0.85,
    },
  });

  const text = res.text?.trim();
  if (!text) throw new Error('Gemini returned an empty response.');
  return text;
}

/** Route the call through the Edge Function instead of calling Gemini directly. */
async function askViaProxy(
  prompt: string,
  opts: { history?: ChatTurn[]; context?: string } = {},
): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const res = await fetch(proxyUrl!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ prompt, history: opts.history ?? [], context: opts.context }),
  });

  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? 'The assistant is unavailable right now.');
  if (!body.text) throw new Error('Gemini returned an empty response.');
  return body.text as string;
}

/** Streaming variant — yields the reply as it arrives. */
export async function* streamGemini(
  prompt: string,
  opts: { history?: ChatTurn[]; context?: string; system?: string } = {},
): AsyncGenerator<string> {
  // The proxy returns one complete response; yield it in a single chunk.
  if (proxyUrl) {
    yield await askViaProxy(prompt, opts);
    return;
  }

  if (!ai) {
    throw new Error(
      'Gemini is not configured. Add VITE_GEMINI_API_KEY to your .env and restart the dev server.',
    );
  }

  const { history = [], context, system = WRITING_ASSISTANT_SYSTEM } = opts;

  const contents = [
    ...history.map(t => ({ role: t.role, parts: [{ text: t.content }] })),
    {
      role: 'user' as const,
      parts: [
        {
          text: context
            ? `Here is the piece the writer is working on:\n\n"""\n${context.slice(0, 6000)}\n"""\n\n${prompt}`
            : prompt,
        },
      ],
    },
  ];

  const stream = await ai.models.generateContentStream({
    model,
    contents,
    config: { systemInstruction: system, maxOutputTokens: 1024, temperature: 0.85 },
  });

  for await (const chunk of stream) {
    if (chunk.text) yield chunk.text;
  }
}

/** The quick-action prompts behind the editor's AI buttons. */
export const AI_ACTIONS: Record<string, string> = {
  improve:
    'Improve the clarity and lyrical quality of my writing. Name the specific sentences that could be stronger and show me a rewrite of each.',
  suggest:
    'Write the next 2-3 paragraphs that would naturally follow my current text. Match my voice and style exactly.',
  feedback:
    "Give me honest, specific feedback on this piece. What is working? What is not? Be the editor who tells me the truth.",
  title: 'Suggest 5 alternative titles for this piece. Make them evocative and memorable, not descriptive.',
  outline: 'Read what I have and propose an outline for where the rest of the piece should go.',
};
