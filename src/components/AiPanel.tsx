import { useCallback, useEffect, useRef, useState } from 'react';
import { AI_ACTIONS, isGeminiConfigured, streamGemini, type ChatTurn } from '../lib/gemini';
import { fetchAiMessages, fetchOrCreateAiConversation, saveAiMessage } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

type Msg = { id: string; role: 'user' | 'model'; content: string; pending?: boolean };

const GREETING: Msg = {
  id: 'greeting',
  role: 'model',
  content:
    "Hey. I'm your writing assistant, running on Gemini. Ask me anything about the piece you're working " +
    "on — I can tighten a paragraph, suggest where it goes next, or tell you honestly what isn't landing yet.",
};

type Props = {
  /** Current draft text, sent along as context. */
  getContext: () => string;
  /** Registers a callback so the editor can push a selection into the chat. */
  onReady?: (ask: (prompt: string) => void) => void;
};

export default function AiPanel({ getContext, onReady }: Props) {
  const { profile } = useAuth();
  const toast = useToast();
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load (or start) the persisted AI conversation.
  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    (async () => {
      try {
        const id = await fetchOrCreateAiConversation(profile.id);
        if (cancelled) return;
        setConversationId(id);
        const history = await fetchAiMessages(id);
        if (cancelled) return;
        if (history.length) {
          setMessages(history.map(h => ({ id: h.id, role: h.role, content: h.content })));
        }
      } catch (err) {
        console.warn('[TH-INK] AI history unavailable', err);
      }
    })();
    return () => { cancelled = true; };
  }, [profile]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const ask = useCallback(
    async (prompt: string) => {
      if (!prompt.trim() || busy) return;

      if (!isGeminiConfigured) {
        toast('Add VITE_GEMINI_API_KEY to your .env to enable the assistant', 'error', 5000);
        return;
      }

      const userMsg: Msg = { id: `u-${Date.now()}`, role: 'user', content: prompt };
      const replyId = `m-${Date.now()}`;
      setMessages(prev => [...prev, userMsg, { id: replyId, role: 'model', content: '', pending: true }]);
      setBusy(true);

      // Only the real exchange goes into history — not the canned greeting.
      const history: ChatTurn[] = messages
        .filter(m => m.id !== 'greeting' && !m.pending)
        .map(m => ({ role: m.role, content: m.content }));

      try {
        let acc = '';
        for await (const chunk of streamGemini(prompt, { history, context: getContext() })) {
          acc += chunk;
          setMessages(prev =>
            prev.map(m => (m.id === replyId ? { ...m, content: acc, pending: false } : m)),
          );
        }
        if (!acc) throw new Error('Empty response');

        if (conversationId) {
          void saveAiMessage(conversationId, 'user', prompt);
          void saveAiMessage(conversationId, 'model', acc);
        }
      } catch (err) {
        setMessages(prev =>
          prev.map(m =>
            m.id === replyId
              ? {
                  ...m,
                  pending: false,
                  content:
                    err instanceof Error && err.message.includes('not configured')
                      ? err.message
                      : "I'm having trouble reaching Gemini right now. Your writing looks good though — keep going.",
                }
              : m,
          ),
        );
      } finally {
        setBusy(false);
      }
    },
    [busy, messages, getContext, conversationId, toast],
  );

  // Hand the editor a way to ask on our behalf (e.g. "improve this selection").
  useEffect(() => { onReady?.(p => void ask(p)); }, [onReady, ask]);

  return (
    <div className="pub-ai-panel">
      <div className="ai-panel-header">
        <div className="ai-status" />
        <div className="ai-panel-title">Writing Assistant</div>
        <div className="ai-badge">GEMINI</div>
      </div>

      <div className="ai-tools">
        <button className="ai-tool-btn" disabled={busy} onClick={() => void ask(AI_ACTIONS.improve)}>
          Improve my writing
        </button>
        <button className="ai-tool-btn" disabled={busy} onClick={() => void ask(AI_ACTIONS.suggest)}>
          Continue writing for me
        </button>
        <button className="ai-tool-btn" disabled={busy} onClick={() => void ask(AI_ACTIONS.feedback)}>
          Give me feedback
        </button>
        <button className="ai-tool-btn" disabled={busy} onClick={() => void ask(AI_ACTIONS.title)}>
          Suggest better titles
        </button>
      </div>

      <div className="ai-messages" id="aiMessages" ref={scrollRef}>
        {messages.map(m => (
          <div className={`ai-msg ${m.role === 'user' ? 'user' : 'ai'}`} key={m.id}>
            {m.pending ? (
              <div className="ai-typing"><span /><span /><span /></div>
            ) : (
              <>
                <div className="ai-bubble" style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
                <span className="ai-time">Just now</span>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="ai-input-row">
        <input
          className="ai-input"
          id="aiInput"
          type="text"
          placeholder="Ask me anything about your writing…"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && draft.trim()) { void ask(draft.trim()); setDraft(''); }
          }}
          disabled={busy}
        />
        <button
          className="ai-send"
          onClick={() => { if (draft.trim()) { void ask(draft.trim()); setDraft(''); } }}
          disabled={busy}
          aria-label="Send"
        >
          <svg viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M11 6.5H2M7.5 3l3.5 3.5L7.5 10" />
          </svg>
        </button>
      </div>
    </div>
  );
}
