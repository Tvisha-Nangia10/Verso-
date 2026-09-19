import { useCallback, useEffect, useState } from 'react';
import {
  fetchArticlesByAuthor, fetchBookmarkedArticles, fetchFollowCounts, fetchFollowing,
  startConversation, toggleFollow,
} from '../lib/api';
import type { ArticleWithAuthor, Profile } from '../lib/database.types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

type Tab = 'Posts' | 'Drafts' | 'Saved';

type Props = {
  /** Whose profile to show. Omitted means the signed-in user's own. */
  viewing?: Profile | null;
  onOpenArticle: (id: string) => void;
  onOpenChat: () => void;
  onEdit: () => void;
};

function compact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export default function ProfilePage({ viewing, onOpenArticle, onOpenChat, onEdit }: Props) {
  const { profile: me } = useAuth();
  const toast = useToast();
  const person = viewing ?? me;
  const isMe = person?.id === me?.id;

  const [tab, setTab] = useState<Tab>('Posts');
  const [posts, setPosts] = useState<ArticleWithAuthor[]>([]);
  const [drafts, setDrafts] = useState<ArticleWithAuthor[]>([]);
  const [saved, setSaved] = useState<ArticleWithAuthor[]>([]);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [topic, setTopic] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!person) return;
    try {
      const [published, followCounts] = await Promise.all([
        fetchArticlesByAuthor(person.id, 'published'),
        fetchFollowCounts(person.id),
      ]);
      setPosts(published);
      setCounts(followCounts);

      if (isMe && me) {
        const [d, b] = await Promise.all([
          fetchArticlesByAuthor(me.id, 'draft'),
          fetchBookmarkedArticles(me.id),
        ]);
        setDrafts(d);
        setSaved(b.map(r => r.article));
      } else if (me) {
        const following = await fetchFollowing(me.id);
        setIsFollowing(following.has(person.id));
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not load this profile', 'error');
    }
  }, [person, isMe, me, toast]);

  useEffect(() => { void load(); }, [load]);

  async function follow() {
    if (!me || !person) return;
    const next = !isFollowing;
    setIsFollowing(next);
    setCounts(c => ({ ...c, followers: c.followers + (next ? 1 : -1) }));
    try {
      await toggleFollow(me.id, person.id, isFollowing);
      toast(next ? `Following ${person.name}` : `Unfollowed ${person.name}`, 'success');
    } catch (err) {
      setIsFollowing(!next);
      toast(err instanceof Error ? err.message : 'Could not update', 'error');
    }
  }

  async function message() {
    if (!person || isMe) return onOpenChat();
    try {
      await startConversation(person.id);
      onOpenChat();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not open a conversation', 'error');
    }
  }

  if (!person) return <div className="page active" />;

  const source = tab === 'Posts' ? posts : tab === 'Drafts' ? drafts : saved;
  const shown = topic ? source.filter(a => a.tag === topic) : source;
  const totalLikes = posts.reduce((n, a) => n + a.likes, 0);
  const totalReads = posts.reduce((n, a) => n + a.likes * 12 + a.bookmarks * 30, 0);
  const memberYear = new Date(person.created_at).getFullYear();

  return (
    <div className="page active" id="page-profile">
      <div className="prof-cover"><div className="prof-cover-inner" /></div>

      <div className="prof-identity">
        <div className="prof-av-wrap">
          <div className="prof-av" style={{ background: person.avatar_bg, color: person.avatar_color }}>
            {person.initials}
          </div>
          <div className="prof-av-ring" />
        </div>

        <div className="prof-id-body">
          <div className="prof-name-row">
            <h1 className="prof-name">{person.name}</h1>
            <span className="prof-handle">@{person.handle}</span>
            {person.craft_score >= 85 && <span className="prof-badge">✦ Verified writer</span>}
          </div>
          <div className="prof-bio">{person.bio || 'No bio yet.'}</div>
          <div className="prof-meta-row">
            {person.location && <span className="prof-meta-item">{person.location}</span>}
            <span className="prof-meta-item">Member since {memberYear}</span>
            <span className="prof-meta-item">{counts.following} following</span>
          </div>
        </div>

        <div className="prof-actions">
          {isMe ? (
            <button className="btn-tb-ghost" style={{ fontSize: '12px' }} onClick={onEdit}>Edit profile</button>
          ) : (
            <button
              className={isFollowing ? 'btn-tb-ghost' : 'btn-tb-solid'}
              style={{ fontSize: '12px' }}
              onClick={() => void follow()}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
          <button className="btn-tb-solid" style={{ fontSize: '12px' }} onClick={() => void message()}>
            Message
          </button>
        </div>
      </div>

      <div className="prof-stats-strip">
        <div className="prof-stat"><div className="prof-stat-num">{posts.length}</div><div className="prof-stat-lbl">Articles</div></div>
        <div className="prof-stat-div" />
        <div className="prof-stat"><div className="prof-stat-num">{compact(counts.followers)}</div><div className="prof-stat-lbl">Followers</div></div>
        <div className="prof-stat-div" />
        <div className="prof-stat"><div className="prof-stat-num">{compact(totalReads)}</div><div className="prof-stat-lbl">Reads</div></div>
        <div className="prof-stat-div" />
        <div className="prof-stat"><div className="prof-stat-num">{compact(totalLikes)}</div><div className="prof-stat-lbl">Likes</div></div>
        <div className="prof-stat-div" />
        <div className="prof-stat">
          <div className="prof-stat-num" style={{ color: 'var(--amber)' }}>{person.streak_days}</div>
          <div className="prof-stat-lbl">Day streak ✦</div>
        </div>
      </div>

      {person.topics.length > 0 && (
        <div className="prof-topics">
          {person.topics.map(t => (
            <span
              className={`prof-topic${topic === t ? ' active' : ''}`}
              key={t}
              onClick={() => setTopic(topic === t ? null : t)}
            >
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="prof-tabs">
        {(isMe ? (['Posts', 'Drafts', 'Saved'] as Tab[]) : (['Posts'] as Tab[])).map(t => (
          <div className={`ptab${tab === t ? ' active' : ''}`} key={t} onClick={() => setTab(t)}>
            {t}
          </div>
        ))}
      </div>

      <div className="prof-grid">
        {shown.map(a => (
          <div
            className="prof-post"
            key={a.id}
            style={{ background: a.cover_grad }}
            onClick={() => onOpenArticle(a.id)}
          >
            <div style={{
              position: 'absolute', inset: 0,
              background: `radial-gradient(ellipse at 65% 35%, ${a.cover_accent} 0%, transparent 65%)`,
            }} />
            <div className="prof-post-overlay">
              <span className="pp-stat">♥ {a.likes}</span>
              <span className="pp-stat">💬 {a.comments}</span>
            </div>
            <div className="prof-post-label">{a.title}</div>
          </div>
        ))}
      </div>

      {shown.length === 0 && (
        <div style={{ fontFamily: 'var(--sans)', fontSize: '13px', opacity: 0.55, padding: '20px 0' }}>
          {tab === 'Drafts' ? 'No drafts in progress.' : tab === 'Saved' ? 'Nothing saved yet.' : 'Nothing published yet.'}
        </div>
      )}
    </div>
  );
}
