import { useEffect, useMemo, useState } from 'react';
import ArticleCard from '../components/ArticleCard';
import { fetchCapsules, fetchFeed, fetchRooms, fetchSessions } from '../lib/api';
import type { ArticleWithAuthor, Room, TimeCapsule, WritingSession } from '../lib/database.types';
import type { PageId } from '../lib/pages';
import { useAuth } from '../context/AuthContext';

type Props = { onNavigate: (p: PageId) => void; onOpenArticle: (id: string) => void };

function daysUntil(iso: string) {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
}

export default function HomePage({ onNavigate, onOpenArticle }: Props) {
  const { profile } = useAuth();
  const [feed, setFeed] = useState<ArticleWithAuthor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [capsules, setCapsules] = useState<TimeCapsule[]>([]);
  const [sessions, setSessions] = useState<WritingSession[]>([]);

  useEffect(() => {
    if (!profile) return;
    void fetchFeed(12).then(setFeed).catch(console.error);
    void fetchRooms().then(setRooms).catch(console.error);
    void fetchCapsules(profile.id).then(setCapsules).catch(console.error);
    void fetchSessions(profile.id, 30).then(setSessions).catch(console.error);
  }, [profile]);

  const stats = useMemo(() => {
    const words = sessions.reduce((s, r) => s + r.words, 0);
    const pieces = feed.filter(a => a.author_id === profile?.id).length;
    return { words, pieces };
  }, [sessions, feed, profile]);

  const liveRooms = rooms.filter(r => r.is_live);
  const topRoom = liveRooms[0];
  const nextCapsule = capsules.find(c => !c.delivered);
  const trending = [...feed].sort((a, b) => b.likes - a.likes).slice(0, 3);

  const featureCard = (
    page: PageId, bg: string, border: string, glow: string, accent: string,
    icon: React.ReactNode, title: string, body: string, footer: React.ReactNode,
  ) => (
    <div
      onClick={() => onNavigate(page)}
      style={{
        background: bg, border: `1px solid ${border}`, borderRadius: '14px', padding: '22px 20px',
        cursor: 'pointer', transition: 'transform .2s, box-shadow .2s',
      }}
      onMouseOver={e => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = `0 10px 30px ${glow}`;
      }}
      onMouseOut={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      <div style={{
        width: '36px', height: '36px', borderRadius: '9px', background: glow.replace(/,[\d.]+\)$/, ',.2)'),
        border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '14px', color: accent,
      }}>
        {icon}
      </div>
      <div style={{ fontFamily: 'var(--serif)', fontSize: '16px', fontWeight: 500, color: '#fff', marginBottom: '5px' }}>
        {title}
      </div>
      <div style={{ fontFamily: 'var(--sans)', fontSize: '11.5px', color: 'rgba(255,255,255,.4)', lineHeight: 1.5 }}>
        {body}
      </div>
      <div style={{ marginTop: '12px', fontFamily: 'var(--sans)', fontSize: '11px', color: accent }}>{footer}</div>
    </div>
  );

  return (
    <div className="page active" id="page-home">
      <div className="hero-strip">
        <div className="hero-card hc-stats">
          <div className="stats-lbl">Your writing this month</div>
          <div className="stats-row">
            <div>
              <div className="stat-num" id="wordCountStat">{stats.words.toLocaleString()}</div>
              <div className="stat-sub">words</div>
            </div>
            <div>
              <div className="stat-num">{stats.pieces}</div>
              <div className="stat-sub">pieces</div>
            </div>
            <div>
              <div className="stat-num">{profile?.streak_days ?? 0}</div>
              <div className="stat-sub">day streak 🔥</div>
            </div>
          </div>
        </div>

        <div
          className="hero-card"
          style={{ background: '#1a1714', border: '1px solid rgba(90,158,120,.2)', cursor: 'pointer' }}
          onClick={() => onNavigate('rooms')}
        >
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at 80% 20%,rgba(90,158,120,.25) 0%,transparent 55%)',
          }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
              <div className="live-badge"><div className="live-dot" />LIVE NOW</div>
              <span style={{ fontSize: '10.5px', color: 'rgba(255,255,255,.4)' }}>
                {liveRooms.length} room{liveRooms.length === 1 ? '' : 's'} active
              </span>
            </div>
            <div style={{
              fontFamily: 'var(--serif)', fontSize: '15px', fontStyle: 'italic',
              color: 'rgba(255,255,255,.88)', lineHeight: 1.4, marginBottom: '8px',
            }}>
              {topRoom ? `"${topRoom.title}"` : 'No rooms live right now'}
            </div>
            <div style={{ fontSize: '11.5px', color: 'rgba(255,255,255,.35)' }}>
              {topRoom
                ? `${topRoom.participant_count} reader${topRoom.participant_count === 1 ? '' : 's'} in the room right now →`
                : 'Host one and invite your followers →'}
            </div>
          </div>
        </div>

        <div
          className="hero-card"
          style={{ background: 'linear-gradient(135deg,#1e1810,#2e2010)', cursor: 'pointer' }}
          onClick={() => onNavigate('capsule')}
        >
          <div className="p-label">⏰ Time Capsule</div>
          <div className="p-text">
            {nextCapsule ? (
              <>
                "{nextCapsule.title}" unlocks in{' '}
                <strong style={{ color: 'var(--amber)' }}>{daysUntil(nextCapsule.deliver_at)} days</strong>
              </>
            ) : (
              'Nothing sealed yet. Write a letter to your future self.'
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
            <button className="btn-amber" onClick={e => { e.stopPropagation(); onNavigate('capsule'); }}>
              View capsules →
            </button>
          </div>
        </div>
      </div>

      <div className="section-bar">
        <h2 className="serif-h" style={{ fontSize: '21px' }}>Trending <em>this week</em></h2>
        <span className="sec-link" onClick={() => onNavigate('discover')}>See all on Discover →</span>
      </div>
      <div className="gold-rule"><div className="gold-dot" /></div>

      <div className="card-grid">
        {trending.map(a => <ArticleCard key={a.id} article={a} onOpen={onOpenArticle} />)}
        {trending.length === 0 && (
          <div style={{ fontFamily: 'var(--sans)', fontSize: '13px', opacity: 0.55 }}>
            Nothing published yet — be the first.
          </div>
        )}
      </div>

      <div style={{ marginTop: '40px', marginBottom: '8px' }}>
        <div className="section-bar">
          <h2 className="serif-h" style={{ fontSize: '21px' }}>Only on <em>TH-INK</em></h2>
        </div>
        <div className="gold-rule"><div className="gold-dot" /></div>

        <div className="feature-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px' }}>
          {featureCard(
            'rooms', 'linear-gradient(135deg,#162014,#1e2e1a)', 'rgba(90,158,120,.3)',
            'rgba(90,158,120,.15)', '#5a9e78',
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="5" cy="6" r="2" /><circle cx="11" cy="6" r="2" />
              <path d="M1 13c0-2 1.8-3.5 4-3.5s4 1.5 4 3.5M10 10.5c1.2.5 2 1.7 2 3" />
            </svg>,
            'Reading Rooms', 'Read together live. React, annotate & discuss in real time.',
            <div className="live-badge" style={{ fontSize: '8px' }}>
              <div className="live-dot" />{liveRooms.length} LIVE NOW
            </div>,
          )}
          {featureCard(
            'dna', 'linear-gradient(135deg,#1a1020,#20152e)', 'rgba(138,114,200,.3)',
            'rgba(138,114,200,.15)', '#8a72c8',
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M5 2c0 4 6 4 6 8s-6 4-6 8" /><path d="M11 2c0 4-6 4-6 8s6 4 6 8" /><path d="M3 6h10M3 10h10" />
            </svg>,
            'Writing DNA', 'Your literary fingerprint. Voice traits, style echoes & signature words.',
            `Craft score: ${profile?.craft_score ?? 0} →`,
          )}
          {featureCard(
            'capsule', 'linear-gradient(135deg,#10101a,#181828)', 'rgba(74,143,212,.3)',
            'rgba(74,143,212,.12)', '#4a8fd4',
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="8" cy="8" r="6" /><path d="M8 4v4l2.5 2.5" /><path d="M2 2l12 12" strokeDasharray="2 2" />
            </svg>,
            'Time Capsule', 'Seal posts for the future. Letters, milestones, scheduled revelations.',
            nextCapsule ? `1 unlocking in ${daysUntil(nextCapsule.deliver_at)} days →` : 'Seal your first letter →',
          )}
          {featureCard(
            'insights', 'linear-gradient(135deg,#1a1008,#2a1e10)', 'rgba(232,150,58,.3)',
            'rgba(232,150,58,.12)', 'var(--amber)',
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M2 12l3-4 3 2 3-6 3 3" /><rect x="1" y="1" width="14" height="14" rx="2" />
            </svg>,
            'Craft Insights', 'Reader retention, best writing times, habit tracking & craft tips.',
            `${sessions.filter(s => s.words > 0).length} writing days tracked →`,
          )}
        </div>
      </div>
    </div>
  );
}
