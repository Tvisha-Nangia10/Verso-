import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  fetchConversations, fetchMessages, fetchProfiles, markConversationRead,
  sendMessage, startConversation,
} from '../lib/api';
import type { ConversationSummary, Message, Profile } from '../lib/database.types';
import { timeAgo, timeShort } from '../lib/pages';
import { useToast } from '../context/ToastContext';

type Props = {
  open: boolean;
  userId: string;
  onClose: () => void;
  onChanged: () => void;
};

export default function ChatPanel({ open, userId, onClose, onChanged }: Props) {
  const toast = useToast();
  const [threads, setThreads] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [picking, setPicking] = useState(false);
  const [people, setPeople] = useState<Profile[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const active = threads.find(t => t.id === activeId) ?? null;

  const loadThreads = useCallback(async () => {
    try {
      setThreads(await fetchConversations(userId));
    } catch (err) {
      console.error(err);
    }
  }, [userId]);

  useEffect(() => {
    if (open) void loadThreads();
  }, [open, loadThreads]);

  // Live message stream across every conversation the user is in.
  useEffect(() => {
    const channel = supabase
      .channel('messages-stream')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        payload => {
          const msg = payload.new as Message;
          setMessages(prev =>
            msg.conversation_id === activeId && !prev.some(m => m.id === msg.id)
              ? [...prev, msg]
              : prev,
          );
          void loadThreads();
          onChanged();
        },
      )
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [activeId, loadThreads, onChanged]);

  async function openThread(id: string) {
    setActiveId(id);
    try {
      setMessages(await fetchMessages(id));
      await markConversationRead(id, userId);
      await loadThreads();
      onChanged();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not open that conversation', 'error');
    }
  }

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function send() {
    const body = draft.trim();
    if (!body || !activeId) return;
    setDraft('');
    // Optimistic: show it immediately, realtime reconciles by id.
    const temp: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: activeId,
      sender_id: userId,
      body,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, temp]);
    try {
      const saved = await sendMessage(activeId, userId, body);
      setMessages(prev => prev.map(m => (m.id === temp.id ? saved : m)));
      await loadThreads();
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== temp.id));
      setDraft(body);
      toast(err instanceof Error ? err.message : 'Message not sent', 'error');
    }
  }

  async function openPicker() {
    setPicking(true);
    try {
      const all = await fetchProfiles();
      setPeople(all.filter(p => p.id !== userId));
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not load writers', 'error');
    }
  }

  async function startWith(p: Profile) {
    try {
      const id = await startConversation(p.id);
      setPicking(false);
      await loadThreads();
      await openThread(id);
      toast(`Conversation with ${p.name} opened`, 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not start that conversation', 'error');
    }
  }

  return (
    <div className={`chat-panel${open ? ' open' : ''}`} id="chatPanel">
      <div className="chat-header">
        <span className="chat-header-title">Messages</span>
        <button
          style={{
            fontFamily: 'var(--sans)', fontSize: '10.5px', fontWeight: 600, padding: '5px 11px',
            background: 'var(--amber)', color: 'var(--ink)', border: 'none', borderRadius: '6px', cursor: 'pointer',
          }}
          onClick={openPicker}
        >
          + New
        </button>
        <button className="chat-close" onClick={onClose} aria-label="Close messages">
          <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M2 2l8 8M10 2l-8 8" />
          </svg>
        </button>
      </div>

      {picking ? (
        <div className="chat-threads" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="nav-section-label" style={{ padding: '10px 14px 4px' }}>Start a conversation</div>
          {people.map(p => (
            <div className="chat-thread" key={p.id} onClick={() => void startWith(p)}>
              <div className="ct-av" style={{ background: p.avatar_bg, color: p.avatar_color }}>{p.initials}</div>
              <div className="ct-body">
                <div className="ct-name">{p.name}</div>
                <div className="ct-preview">@{p.handle}</div>
              </div>
            </div>
          ))}
          <div
            style={{ padding: '12px 14px', fontFamily: 'var(--sans)', fontSize: '11.5px', cursor: 'pointer', color: 'var(--amber)' }}
            onClick={() => setPicking(false)}
          >
            ← Back to messages
          </div>
        </div>
      ) : (
        <div
          className="chat-threads"
          id="chatThreads"
          style={{ display: activeId ? 'none' : 'flex', flexDirection: 'column' }}
        >
          {threads.length === 0 && (
            <div style={{ padding: '24px 16px', fontFamily: 'var(--sans)', fontSize: '12px', opacity: 0.6 }}>
              No conversations yet. Hit <strong>+ New</strong> to write to someone.
            </div>
          )}
          {threads.map(t => (
            <div
              className={`chat-thread${t.id === activeId ? ' active' : ''}`}
              key={t.id}
              onClick={() => void openThread(t.id)}
            >
              <div className="ct-av" style={{ background: t.other.avatar_bg, color: t.other.avatar_color }}>
                {t.other.initials}
              </div>
              <div className="ct-body">
                <div className="ct-name">{t.other.name}</div>
                <div className="ct-preview">{t.last_message}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                <span className="ct-time">{timeShort(t.last_at)}</span>
                {t.unread > 0 && <div className="ct-unread" />}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={`chat-active${activeId && !picking ? ' visible' : ''}`} id="chatActive">
        <div className="chat-active-header">
          <button className="ca-back" onClick={() => { setActiveId(null); setMessages([]); }} aria-label="Back">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M8 2L3 6.5l5 4.5" />
            </svg>
          </button>
          <div
            className="ca-av"
            style={active ? { background: active.other.avatar_bg, color: active.other.avatar_color } : undefined}
          >
            {active?.other.initials}
          </div>
          <div>
            <div className="ca-name">{active?.other.name}</div>
            <div className="ca-status" style={{ color: 'var(--ink-3)' }}>@{active?.other.handle}</div>
          </div>
        </div>

        <div className="chat-msgs" id="chatMessages" ref={scrollRef}>
          {messages.map(m => (
            <div className={`msg ${m.sender_id === userId ? 'mine' : 'theirs'}`} key={m.id}>
              <div className="msg-bubble">{m.body}</div>
              <span className="msg-time">{timeAgo(m.created_at)}</span>
            </div>
          ))}
        </div>

        <div className="chat-input-row">
          <input
            className="chat-input"
            id="chatInput"
            type="text"
            placeholder="Write a message…"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') void send(); }}
          />
          <button className="chat-send" onClick={() => void send()} aria-label="Send">
            <svg viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M11 6.5H2M7.5 3l3.5 3.5L7.5 10" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
