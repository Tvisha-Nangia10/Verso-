import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  createRoom, endRoom, fetchArticlesByAuthor, fetchFeed, fetchRoomMessages,
  fetchRoomParticipants, fetchRooms, joinRoom, leaveRoom, sendRoomMessage,
} from '../lib/api';
import type { ArticleWithAuthor, Profile, Room, RoomMessage } from '../lib/database.types';
import { timeAgo } from '../lib/pages';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const REACTIONS = ['🔥', '💭', '✨', '❤️'];

function minutesIn(iso: string) {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
}

export default function RoomsPage() {
  const { profile } = useAuth();
  const toast = useToast();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [participants, setParticipants] = useState<Profile[]>([]);
  const [draft, setDraft] = useState('');
  const [hosting, setHosting] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [articleId, setArticleId] = useState('');
  const [myArticles, setMyArticles] = useState<ArticleWithAuthor[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const active = rooms.find(r => r.id === activeId) ?? null;

  const load = useCallback(async () => {
    try {
      setRooms(await fetchRooms());
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not load rooms', 'error');
    }
  }, [toast]);

  useEffect(() => { void load(); }, [load]);

  // Live room chat + arrivals.
  useEffect(() => {
    if (!activeId) return;
    const channel = supabase
      .channel(`room-${activeId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'room_messages', filter: `room_id=eq.${activeId}` },
        () => { void fetchRoomMessages(activeId).then(setMessages).catch(console.error); },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_participants', filter: `room_id=eq.${activeId}` },
        () => {
          void fetchRoomParticipants(activeId).then(setParticipants).catch(console.error);
          void load();
        },
      )
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [activeId, load]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function enterRoom(r: Room) {
    if (!profile) return;
    try {
      await joinRoom(r.id, profile.id);
      setActiveId(r.id);
      const [msgs, people] = await Promise.all([fetchRoomMessages(r.id), fetchRoomParticipants(r.id)]);
      setMessages(msgs);
      setParticipants(people);
      await load();
      toast(`Joined "${r.title.slice(0, 30)}${r.title.length > 30 ? '…' : ''}"`, 'success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not join that room', 'error');
    }
  }

  async function exitRoom() {
    if (!profile || !activeId) return;
    try {
      await leaveRoom(activeId, profile.id);
    } catch (err) {
      console.error(err);
    }
    setActiveId(null);
    setMessages([]);
    setParticipants([]);
    await load();
  }

  async function send(body: string | null, emoji: string | null = null) {
    if (!profile || !activeId) return;
    try {
      await sendRoomMessage(activeId, profile.id, body, emoji);
      setMessages(await fetchRoomMessages(activeId));
      if (body) toast('Comment shared with the room', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Not sent', 'error');
    }
  }

  async function openHostForm() {
    setHosting(true);
    if (!profile) return;
    try {
      const mine = await fetchArticlesByAuthor(profile.id, 'published');
      setMyArticles(mine.length ? mine : await fetchFeed(20));
    } catch (err) {
      console.error(err);
    }
  }

  async function host() {
    if (!profile) return;
    if (!title.trim()) return toast('Give your room a title', 'error');
    toast('Setting up your reading room…', 'info');
    try {
      const room = await createRoom(profile.id, title.trim(), description.trim(), articleId || undefined);
      setHosting(false);
      setTitle('');
      setDescription('');
      setArticleId('');
      await load();
      await enterRoom({ ...room, participant_count: 1 });
      toast('Your room is live.', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not start the room', 'error');
    }
  }

  async function close() {
    if (!activeId) return;
    try {
      await endRoom(activeId);
      setActiveId(null);
      await load();
      toast('Room closed', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not close the room', 'error');
    }
  }

  const reactionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of REACTIONS) counts[e] = 0;
    for (const m of messages) if (m.emoji && counts[m.emoji] !== undefined) counts[m.emoji]++;
    return counts;
  }, [messages]);

  const live = rooms.filter(r => r.is_live);
  const past = rooms.filter(r => !r.is_live);

  return (
    <div className="page active" id="page-rooms">
      <div className={`room-active${active ? ' visible' : ''}`} id="activeRoom">
        <div className="room-active-header">
          <div className="live-badge"><div className="live-dot" />LIVE</div>
          <div className="room-active-title">{active?.title}</div>
          <div className="room-active-count">{participants.length} reading together</div>
          {active?.host_id === profile?.id && (
            <button
              onClick={() => void close()}
              style={{
                background: 'rgba(255,255,255,.08)', border: 'none', color: 'rgba(255,255,255,.5)',
                fontFamily: 'var(--sans)', fontSize: '11px', padding: '6px 10px', borderRadius: '7px', cursor: 'pointer',
              }}
            >
              End room
            </button>
          )}
          <button
            onClick={() => void exitRoom()}
            style={{
              background: 'rgba(255,255,255,.08)', border: 'none', color: 'rgba(255,255,255,.5)',
              width: '28px', height: '28px', borderRadius: '7px', cursor: 'pointer',
            }}
            aria-label="Leave room"
          >
            ✕
          </button>
        </div>

        <div className="room-reading-progress">
          <div className="room-progress-bar">
            <div
              className="room-progress-fill"
              id="roomProgress"
              style={{ width: `${Math.min(100, minutesIn(active?.started_at ?? new Date().toISOString()) * 3)}%` }}
            />
          </div>
          <div className="room-progress-text">
            <span>{active ? `${minutesIn(active.started_at)} min in` : ''}</span>
            <span>{messages.filter(m => m.body).length} comments</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 1 }}>
          <div className="room-reactions">
            {REACTIONS.map(e => (
              <button className="react-btn" key={e} onClick={() => void send(null, e)}>
                {e} {reactionCounts[e]}
              </button>
            ))}
          </div>
        </div>

        <div
          ref={scrollRef}
          style={{ maxHeight: '160px', overflowY: 'auto', margin: '12px 0', position: 'relative', zIndex: 1 }}
        >
          {messages.filter(m => m.body).map(m => (
            <div
              key={m.id}
              style={{
                fontFamily: 'var(--sans)', fontSize: '12px', color: 'rgba(255,255,255,.75)',
                padding: '5px 0', lineHeight: 1.5,
              }}
            >
              <strong style={{ color: 'rgba(255,255,255,.95)' }}>{m.author?.name ?? 'Someone'}</strong>{' '}
              <span style={{ color: 'rgba(255,255,255,.35)', fontSize: '10.5px' }}>{timeAgo(m.created_at)}</span>
              <br />
              {m.body}
            </div>
          ))}
        </div>

        <div className="room-chat-strip">
          <input
            className="room-chat-input"
            id="roomChatInput"
            type="text"
            placeholder="Share a thought as you read…"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && draft.trim()) { void send(draft.trim()); setDraft(''); }
            }}
          />
          <button
            className="room-send-btn"
            onClick={() => { if (draft.trim()) { void send(draft.trim()); setDraft(''); } }}
            aria-label="Send"
          >
            <svg viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M11 6.5H2M7.5 3l3.5 3.5L7.5 10" />
            </svg>
          </button>
        </div>
      </div>

      <div className="rooms-hero">
        <div className="rooms-hero-label">
          <div className="live-badge"><div className="live-dot" />LIVE NOW</div>
          Reading Rooms
        </div>
        <div className="rooms-hero-title">Read together,<br /><em>think together.</em></div>
        <div className="rooms-hero-sub">
          Join a live reading session or host your own. React, annotate, and discuss in real time — like a
          book club that never sleeps.
        </div>
        <div className="rooms-hero-actions">
          <button className="btn-sage" onClick={() => void openHostForm()}>Host a room</button>
          <button className="btn-outline-sage" onClick={() => void load()}>Refresh rooms</button>
        </div>
      </div>

      {hosting && (
        <div style={{
          background: 'var(--cream-2)', border: '1px solid var(--cream-3)', borderRadius: '12px',
          padding: '18px', marginBottom: '20px', display: 'grid', gap: '10px', maxWidth: '560px',
        }}>
          <input className="field-input" placeholder="What are you reading together?"
            value={title} onChange={e => setTitle(e.target.value)} autoFocus />
          <input className="field-input" placeholder="A line about the session (optional)"
            value={description} onChange={e => setDescription(e.target.value)} />
          <select className="field-input" value={articleId} onChange={e => setArticleId(e.target.value)}>
            <option value="">No specific piece</option>
            {myArticles.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
          </select>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-sage" onClick={() => void host()}>Go live</button>
            <button className="btn-tb-ghost" style={{ fontSize: '12.5px' }} onClick={() => setHosting(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="section-bar">
        <h2 className="serif-h" style={{ fontSize: '19px' }}>Live <em>right now</em></h2>
      </div>
      <div className="gold-rule"><div className="gold-dot" /></div>

      <div className="rooms-grid">
        {live.map(r => (
          <div className="room-card" key={r.id} onClick={() => void enterRoom(r)}>
            <div className="room-card-top live-now">
              <div className="room-listeners">
                <div className="listener-av" style={{ background: r.host?.avatar_bg, color: r.host?.avatar_color, zIndex: 5 }}>
                  {r.host?.initials}
                </div>
                <span className="listener-count">{r.participant_count} reading</span>
              </div>
              <div className="room-title">{r.title}</div>
              <div className="room-host">Hosted by {r.host?.name}</div>
            </div>
            <div className="room-card-footer">
              <div className="room-status live">
                <div className="live-dot" style={{ background: 'var(--sage)' }} />
                Live · {minutesIn(r.started_at)} min in
              </div>
              <button className="room-join-btn live">Join room</button>
            </div>
          </div>
        ))}

        {live.length === 0 && (
          <div style={{ fontFamily: 'var(--sans)', fontSize: '13px', opacity: 0.55 }}>
            No rooms are live. Host the first one.
          </div>
        )}
      </div>

      <div className="section-bar" style={{ marginTop: '8px' }}>
        <h2 className="serif-h" style={{ fontSize: '19px' }}>Recent <em>rooms</em></h2>
      </div>
      <div className="gold-rule"><div className="gold-dot" /></div>

      <div className="rooms-grid">
        {past.map(r => (
          <div className="room-card" key={r.id}>
            <div className="room-card-top">
              <div className="room-listeners">
                <span style={{ fontSize: '12px', color: 'var(--ink-3)' }}>{r.participant_count} attended</span>
              </div>
              <div className="room-title" style={{ color: 'var(--ink)' }}>{r.title}</div>
              <div className="room-host">Hosted by {r.host?.name}</div>
            </div>
            <div className="room-card-footer">
              <div className="room-status soon">Ended {timeAgo(r.started_at)}</div>
            </div>
          </div>
        ))}

        <div
          className="room-card"
          style={{ border: '1.5px dashed var(--cream-3)', background: 'var(--cream-2)', cursor: 'pointer' }}
          onClick={() => void openHostForm()}
        >
          <div className="room-card-top" style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', minHeight: '100px', gap: '10px',
          }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%', background: 'var(--cream-3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-3)',
            }}>
              +
            </div>
            <div style={{ fontFamily: 'var(--sans)', fontSize: '13px', fontWeight: 500, color: 'var(--ink-2)' }}>
              Start a new room
            </div>
            <div style={{
              fontFamily: 'var(--sans)', fontSize: '11.5px', color: 'var(--ink-3)',
              textAlign: 'center', padding: '0 16px',
            }}>
              Host a reading session around any article
            </div>
          </div>
          <div className="room-card-footer">
            <div />
            <button className="room-join-btn live" style={{ background: 'var(--ink)' }}>Create room</button>
          </div>
        </div>
      </div>
    </div>
  );
}
