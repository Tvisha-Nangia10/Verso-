import { useCallback, useEffect, useRef, useState } from 'react';
import {
  addComment, createAnnotation, fetchAnnotations, fetchArticle, fetchComments,
  fetchFollowing, fetchMyBookmarks, fetchMyLikes, notify, startConversation,
  toggleBookmark, toggleFollow, toggleLike,
} from '../lib/api';
import type { Annotation, ArticleWithAuthor, Comment } from '../lib/database.types';
import { timeAgo } from '../lib/pages';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

type Props = {
  articleId: string;
  onClose: () => void;
  onEdit: (a: ArticleWithAuthor) => void;
  onOpenChat: () => void;
};

const HL_COLORS: { id: string; label: string; css: string }[] = [
  { id: 'pastel-yellow', label: 'Yellow', css: 'rgba(232,190,58,.32)' },
  { id: 'pastel-green', label: 'Green', css: 'rgba(90,158,120,.28)' },
  { id: 'pastel-blue', label: 'Blue', css: 'rgba(74,143,212,.26)' },
  { id: 'pastel-pink', label: 'Pink', css: 'rgba(224,90,110,.24)' },
];

const btn: React.CSSProperties = {
  fontFamily: 'var(--sans)', fontSize: '12.5px', fontWeight: 500, padding: '7px 14px',
  borderRadius: '8px', border: '1.5px solid var(--cream-3)', background: 'var(--white)',
  cursor: 'pointer', color: 'var(--ink-2)', display: 'flex', alignItems: 'center', gap: '6px',
};

const pill: React.CSSProperties = { ...btn, borderRadius: '20px', background: 'transparent' };

export default function ArticleReader({ articleId, onClose, onEdit, onOpenChat }: Props) {
  const { profile } = useAuth();
  const toast = useToast();

  const [article, setArticle] = useState<ArticleWithAuthor | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [following, setFollowing] = useState(false);
  const [draft, setDraft] = useState('');
  const [progress, setProgress] = useState(0);

  // Selection → annotate
  const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null);
  const [annotating, setAnnotating] = useState(false);
  const [annotNote, setAnnotNote] = useState('');
  const [annotColor, setAnnotColor] = useState('pastel-yellow');

  const bodyRef = useRef<HTMLDivElement>(null);
  const commentsRef = useRef<HTMLDivElement>(null);

  const isOwn = article?.author_id === profile?.id;

  const load = useCallback(async () => {
    try {
      const a = await fetchArticle(articleId);
      if (!a) { toast('That piece could not be found', 'error'); onClose(); return; }
      setArticle(a);
      setLikeCount(a.likes);
      setComments(await fetchComments(articleId));

      if (profile) {
        const [likes, marks, follows, annots] = await Promise.all([
          fetchMyLikes(profile.id),
          fetchMyBookmarks(profile.id),
          fetchFollowing(profile.id),
          fetchAnnotations(profile.id, articleId),
        ]);
        setLiked(likes.has(articleId));
        setBookmarked(marks.has(articleId));
        setFollowing(follows.has(a.author_id));
        setAnnotations(annots);
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not open that piece', 'error');
    }
  }, [articleId, profile, toast, onClose]);

  useEffect(() => { void load(); }, [load]);

  // Esc closes the reader.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !annotating) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, annotating]);

  function onScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    const max = el.scrollHeight - el.clientHeight;
    setProgress(max > 0 ? Math.min(100, (el.scrollTop / max) * 100) : 0);
  }

  function onMouseUp() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) { setSelection(null); return; }
    const text = sel.toString().trim();
    if (!text || !bodyRef.current?.contains(sel.anchorNode)) { setSelection(null); return; }
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    setSelection({ text, x: rect.left + rect.width / 2, y: rect.top - 8 });
  }

  async function like() {
    if (!profile || !article) return;
    const next = !liked;
    setLiked(next);
    setLikeCount(c => c + (next ? 1 : -1));
    try {
      await toggleLike(profile.id, article.id, liked);
      if (next) {
        void notify(article.author_id, profile.id, 'like',
          `${profile.name} liked your piece "${article.title}"`, 'notifViewPost', article.id);
      }
    } catch (err) {
      setLiked(!next);
      setLikeCount(c => c + (next ? -1 : 1));
      toast(err instanceof Error ? err.message : 'Could not register that', 'error');
    }
  }

  async function bookmark() {
    if (!profile || !article) return;
    const next = !bookmarked;
    setBookmarked(next);
    try {
      await toggleBookmark(profile.id, article.id, bookmarked);
      toast(next ? 'Saved to bookmarks' : 'Removed from bookmarks', 'success');
    } catch (err) {
      setBookmarked(!next);
      toast(err instanceof Error ? err.message : 'Could not save it', 'error');
    }
  }

  async function follow() {
    if (!profile || !article) return;
    const next = !following;
    setFollowing(next);
    try {
      await toggleFollow(profile.id, article.author_id, following);
      if (next) {
        void notify(article.author_id, profile.id, 'follow',
          `${profile.name} started following you`, 'notifFollowBack');
      }
      toast(next ? `Following ${article.author?.name}` : `Unfollowed ${article.author?.name}`, 'success');
    } catch (err) {
      setFollowing(!next);
      toast(err instanceof Error ? err.message : 'Could not update', 'error');
    }
  }

  async function post() {
    if (!profile || !article || !draft.trim()) return;
    try {
      const c = await addComment(article.id, profile.id, draft.trim());
      setComments(prev => [...prev, { ...c, author: profile }]);
      setDraft('');
      void notify(article.author_id, profile.id, 'comment',
        `${profile.name} responded to "${article.title}"`, 'notifViewPost', article.id);
      toast('Response posted', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not post that', 'error');
    }
  }

  async function saveAnnotation() {
    if (!profile || !article || !selection) return;
    try {
      const a = await createAnnotation({
        user_id: profile.id,
        article_id: article.id,
        quote: selection.text.slice(0, 400),
        note: annotNote.trim(),
        color: annotColor,
      });
      setAnnotations(prev => [a, ...prev]);
      setAnnotating(false);
      setAnnotNote('');
      setSelection(null);
      window.getSelection()?.removeAllRanges();
      toast('Annotation saved', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not save the annotation', 'error');
    }
  }

  async function share() {
    if (!article) return;
    const url = `${window.location.origin}/?article=${article.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast('Link copied to clipboard', 'success');
    } catch {
      toast(url, 'info', 6000);
    }
  }

  function readAloud() {
    if (!selection || !('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(selection.text);
    u.rate = 0.92;
    speechSynthesis.speak(u);
    toast('Reading aloud…', 'info');
    setSelection(null);
  }

  async function messageAuthor() {
    if (!article || isOwn) return onOpenChat();
    try {
      await startConversation(article.author_id);
      onOpenChat();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not start a conversation', 'error');
    }
  }

  if (!article) return null;

  return (
    <div
      id="articleReader"
      style={{
        position: 'fixed', inset: 0, zIndex: 9500, display: 'flex', background: 'var(--cream)',
        animation: 'pageIn .3s cubic-bezier(.16,1,.3,1) both', flexDirection: 'column', overflow: 'hidden',
      }}
    >
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 20px',
        borderBottom: '1px solid var(--cream-3)', background: 'var(--cream)',
        flexShrink: 0, position: 'relative', zIndex: 10,
      }}>
        <button
          onClick={onClose}
          style={{
            width: '32px', height: '32px', borderRadius: '8px', border: '1.5px solid var(--cream-3)',
            background: 'var(--white)', cursor: 'pointer', color: 'var(--ink-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          aria-label="Back"
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
            <path d="M8 2L3 6.5l5 4.5" />
          </svg>
        </button>

        <div style={{
          fontFamily: 'var(--serif)', fontSize: '18px', color: 'var(--ink)', letterSpacing: '-.2px',
          flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {article.title}
        </div>

        <div style={{ display: 'flex', gap: '7px', alignItems: 'center', flexShrink: 0 }}>
          {isOwn ? (
            <button style={btn} onClick={() => onEdit(article)}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M1 9.5L3 9 9 3a1.4 1.4 0 00-2-2L1 7z" />
              </svg>
              Edit
            </button>
          ) : (
            <button
              style={{ ...btn, color: bookmarked ? 'var(--amber)' : 'var(--ink-2)' }}
              onClick={() => void bookmark()}
            >
              {bookmarked ? '★ Saved' : '☆ Save'}
            </button>
          )}
          <button style={btn} onClick={() => void share()}>Share</button>
        </div>
      </div>

      {/* Reading progress */}
      <div style={{ height: '2px', background: 'var(--cream-3)', flexShrink: 0, position: 'relative' }}>
        <div style={{ height: '100%', background: 'var(--amber)', width: `${progress}%`, transition: 'width .1s' }} />
      </div>

      {/* Scroll area */}
      <div
        style={{ flex: 1, overflowY: 'auto', display: 'flex', justifyContent: 'center' }}
        onScroll={onScroll}
      >
        <div style={{ width: '100%', maxWidth: '720px', padding: '0 24px 80px' }}>
          {/* Cover */}
          <div style={{
            height: '280px', background: article.cover_grad, borderRadius: '0 0 16px 16px',
            position: 'relative', overflow: 'hidden', flexShrink: 0,
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: `radial-gradient(ellipse at 60% 40%, ${article.cover_accent} 0%, transparent 60%)`,
            }} />
            <div style={{ position: 'absolute', bottom: '24px', left: '28px', right: '28px' }}>
              <span style={{
                fontFamily: 'var(--sans)', fontSize: '11px', fontWeight: 600, padding: '4px 10px',
                borderRadius: '20px', background: 'rgba(255,255,255,.12)',
                border: '1px solid rgba(255,255,255,.18)', color: 'rgba(255,255,255,.75)',
              }}>
                {article.tag}
              </span>
            </div>
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
              fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: '80px',
              color: 'rgba(255,255,255,.04)', whiteSpace: 'nowrap', pointerEvents: 'none',
            }}>
              {article.form ?? 'Essay'}
            </div>
          </div>

          {/* Head */}
          <div style={{ padding: '32px 0 24px' }}>
            <h1 style={{
              fontFamily: 'var(--serif)', fontSize: 'clamp(26px,4vw,38px)', fontWeight: 600,
              color: 'var(--ink)', letterSpacing: '-.5px', lineHeight: 1.15, marginBottom: '12px',
            }}>
              {article.title}
            </h1>
            {article.subtitle && (
              <p style={{
                fontFamily: 'var(--serif)', fontSize: '17px', fontStyle: 'italic',
                color: 'var(--ink-3)', lineHeight: 1.5, marginBottom: '24px',
              }}>
                {article.subtitle}
              </p>
            )}

            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0',
              borderTop: '1px solid var(--cream-3)', borderBottom: '1px solid var(--cream-3)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: article.author?.avatar_bg, color: article.author?.avatar_color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--sans)', fontSize: '13px', fontWeight: 600,
                }}>
                  {article.author?.initials}
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--sans)', fontSize: '14px', fontWeight: 500, color: 'var(--ink)' }}>
                    {article.author?.name}
                  </div>
                  <div style={{ fontFamily: 'var(--sans)', fontSize: '12px', color: 'var(--ink-3)' }}>
                    {timeAgo(article.published_at ?? article.created_at)} · {article.read_time} read
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {!isOwn && (
                  <button
                    style={{
                      ...pill,
                      background: following ? 'transparent' : 'var(--ink)',
                      color: following ? 'var(--ink-2)' : '#fff',
                      border: following ? '1.5px solid var(--cream-3)' : 'none',
                    }}
                    onClick={() => void follow()}
                  >
                    {following ? 'Following' : 'Follow'}
                  </button>
                )}
                <button style={pill} onClick={() => void messageAuthor()}>Message</button>
              </div>
            </div>
          </div>

          {/* Body */}
          <div
            ref={bodyRef}
            onMouseUp={onMouseUp}
            className="article-body"
            style={{
              fontFamily: 'var(--serif)', fontSize: '19px', lineHeight: 1.85,
              color: 'var(--ink)', marginBottom: '40px', letterSpacing: '-.01em',
            }}
            dangerouslySetInnerHTML={{ __html: article.body }}
          />

          {/* Your annotations on this piece */}
          {annotations.length > 0 && (
            <div style={{
              background: 'var(--white)', border: '1px solid var(--cream-3)',
              borderRadius: '12px', padding: '18px 20px', marginBottom: '28px',
            }}>
              <div style={{
                fontFamily: 'var(--sans)', fontSize: '11px', fontWeight: 700,
                letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: '12px',
              }}>
                Your annotations
              </div>
              {annotations.map(a => (
                <div key={a.id} style={{
                  borderLeft: `3px solid ${HL_COLORS.find(c => c.id === a.color)?.css ?? 'var(--amber)'}`,
                  paddingLeft: '12px', marginBottom: '12px',
                }}>
                  <div style={{
                    fontFamily: 'var(--serif)', fontSize: '14px', fontStyle: 'italic', color: 'var(--ink-2)',
                  }}>
                    "{a.quote}"
                  </div>
                  {a.note && (
                    <div style={{ fontFamily: 'var(--sans)', fontSize: '13px', color: 'var(--ink-3)', marginTop: '5px' }}>
                      {a.note}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--cream-3)' }} />
            <span style={{ fontFamily: 'var(--serif)', fontSize: '20px', color: 'var(--cream-3)' }}>✦</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--cream-3)' }} />
          </div>

          {/* Reactions */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px', background: 'var(--white)', border: '1px solid var(--cream-3)',
            borderRadius: '12px', marginBottom: '28px',
          }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                style={{ ...pill, color: liked ? 'var(--rose)' : 'var(--ink-2)' }}
                onClick={() => void like()}
              >
                {liked ? '♥' : '♡'} {likeCount}
              </button>
              <button
                style={pill}
                onClick={() => commentsRef.current?.scrollIntoView({ behavior: 'smooth' })}
              >
                💬 {comments.length}
              </button>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {!isOwn && (
                <button style={pill} onClick={() => void bookmark()}>
                  {bookmarked ? 'Saved' : 'Save'}
                </button>
              )}
              <button style={pill} onClick={() => void share()}>Share</button>
            </div>
          </div>

          {/* Author card */}
          {!isOwn ? (
            <div style={{
              background: 'var(--white)', border: '1px solid var(--cream-3)', borderRadius: '14px',
              padding: '20px 22px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '14px',
            }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                background: article.author?.avatar_bg, color: article.author?.avatar_color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--sans)', fontSize: '15px', fontWeight: 600, flexShrink: 0,
              }}>
                {article.author?.initials}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: 'var(--sans)', fontSize: '14px', fontWeight: 600,
                  color: 'var(--ink)', marginBottom: '3px',
                }}>
                  Written by {article.author?.name}
                </div>
                <div style={{ fontFamily: 'var(--sans)', fontSize: '13px', color: 'var(--ink-3)', lineHeight: 1.5 }}>
                  {article.author?.bio}
                </div>
              </div>
              <button
                style={{
                  ...pill,
                  background: following ? 'transparent' : 'var(--ink)',
                  color: following ? 'var(--ink-2)' : '#fff',
                  border: following ? '1.5px solid var(--cream-3)' : 'none',
                }}
                onClick={() => void follow()}
              >
                {following ? 'Following' : 'Follow'}
              </button>
            </div>
          ) : (
            <div style={{
              background: 'var(--amber-pale)', border: '1px solid rgba(200,98,10,.15)',
              borderRadius: '14px', padding: '18px 20px', marginBottom: '32px',
              display: 'flex', alignItems: 'center', gap: '14px',
            }}>
              <div style={{ fontSize: '22px' }}>✍️</div>
              <div>
                <div style={{
                  fontFamily: 'var(--sans)', fontSize: '13.5px', fontWeight: 500,
                  color: 'var(--amber)', marginBottom: '3px',
                }}>
                  This is your piece
                </div>
                <div style={{ fontFamily: 'var(--sans)', fontSize: '12.5px', color: 'var(--ink-3)' }}>
                  {likeCount} likes · {comments.length} responses · {article.bookmarks} saves since publishing
                </div>
              </div>
              <button style={{ ...pill, marginLeft: 'auto' }} onClick={() => onEdit(article)}>Edit piece</button>
            </div>
          )}

          {/* Comments */}
          <div ref={commentsRef}>
            <div style={{
              fontFamily: 'var(--serif)', fontSize: '20px', fontWeight: 500,
              color: 'var(--ink)', marginBottom: '16px',
            }}>
              Responses{' '}
              <span style={{ fontFamily: 'var(--sans)', fontSize: '14px', fontWeight: 400, color: 'var(--ink-3)' }}>
                ({comments.length})
              </span>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '50%',
                background: profile?.avatar_bg, color: profile?.avatar_color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--sans)', fontSize: '11px', fontWeight: 600, flexShrink: 0,
              }}>
                {profile?.initials}
              </div>
              <div style={{ flex: 1 }}>
                <textarea
                  placeholder="Share your thoughts on this piece…"
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  style={{
                    width: '100%', minHeight: '72px', padding: '11px 14px', borderRadius: '10px',
                    border: '1.5px solid var(--cream-3)', background: 'var(--white)',
                    fontFamily: 'var(--sans)', fontSize: '14px', color: 'var(--ink)', resize: 'vertical',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '7px' }}>
                  <button
                    onClick={() => void post()}
                    disabled={!draft.trim()}
                    style={{
                      fontFamily: 'var(--sans)', fontSize: '12.5px', fontWeight: 500,
                      padding: '7px 18px', borderRadius: '8px', border: 'none',
                      background: 'var(--ink)', color: '#fff',
                      cursor: draft.trim() ? 'pointer' : 'not-allowed', opacity: draft.trim() ? 1 : 0.5,
                    }}
                  >
                    Respond
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {comments.map(c => (
                <div className="comment-item" key={c.id} style={{ display: 'flex', gap: '10px' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: c.author?.avatar_bg, color: c.author?.avatar_color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--sans)', fontSize: '10px', fontWeight: 600, flexShrink: 0,
                  }}>
                    {c.author?.initials}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                      <span style={{ fontFamily: 'var(--sans)', fontSize: '13px', fontWeight: 500, color: 'var(--ink)' }}>
                        {c.author?.name}
                      </span>
                      <span style={{ fontFamily: 'var(--sans)', fontSize: '11.5px', color: 'var(--ink-3)' }}>
                        {timeAgo(c.created_at)}
                      </span>
                    </div>
                    <div style={{ fontFamily: 'var(--sans)', fontSize: '14px', color: 'var(--ink-2)', lineHeight: 1.6 }}>
                      {c.body}
                    </div>
                  </div>
                </div>
              ))}

              {comments.length === 0 && (
                <div style={{ fontFamily: 'var(--sans)', fontSize: '13px', color: 'var(--ink-3)' }}>
                  No responses yet. Be the first to say something worth saying.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Selection toolbar */}
      {selection && !annotating && (
        <div
          style={{
            position: 'fixed', left: selection.x, top: Math.max(56, selection.y),
            transform: 'translate(-50%,-100%)', zIndex: 9600,
            background: 'var(--ink)', borderRadius: '10px', padding: '6px',
            display: 'flex', gap: '4px', boxShadow: '0 10px 30px rgba(14,11,9,.3)',
          }}
        >
          <button
            style={{
              background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer',
              fontFamily: 'var(--sans)', fontSize: '12px', padding: '5px 9px', borderRadius: '6px',
            }}
            onClick={() => setAnnotating(true)}
          >
            ✎ Annotate
          </button>
          <button
            style={{
              background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer',
              fontFamily: 'var(--sans)', fontSize: '12px', padding: '5px 9px', borderRadius: '6px',
            }}
            onClick={() => {
              void navigator.clipboard.writeText(selection.text);
              toast('Copied to clipboard', 'success');
              setSelection(null);
            }}
          >
            ⧉ Copy
          </button>
          <button
            style={{
              background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer',
              fontFamily: 'var(--sans)', fontSize: '12px', padding: '5px 9px', borderRadius: '6px',
            }}
            onClick={readAloud}
          >
            ▶ Read
          </button>
        </div>
      )}

      {/* Annotation composer */}
      {selection && annotating && (
        <div
          style={{
            position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', zIndex: 9700,
            background: 'var(--white)', borderRadius: '14px', padding: '20px', width: '380px',
            boxShadow: '0 24px 80px rgba(14,11,9,.25)',
          }}
        >
          <div style={{
            fontFamily: 'var(--serif)', fontSize: '14px', fontStyle: 'italic',
            color: 'var(--ink-2)', marginBottom: '12px', lineHeight: 1.5,
          }}>
            "{selection.text.slice(0, 160)}{selection.text.length > 160 ? '…' : ''}"
          </div>

          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
            {HL_COLORS.map(c => (
              <div
                key={c.id}
                onClick={() => setAnnotColor(c.id)}
                title={c.label}
                style={{
                  width: '22px', height: '22px', borderRadius: '50%', background: c.css,
                  cursor: 'pointer',
                  border: annotColor === c.id ? '2px solid var(--ink)' : '2px solid transparent',
                }}
              />
            ))}
          </div>

          <textarea
            placeholder="Why does this matter to you?"
            value={annotNote}
            onChange={e => setAnnotNote(e.target.value)}
            autoFocus
            style={{
              width: '100%', minHeight: '80px', padding: '10px 12px', borderRadius: '9px',
              border: '1.5px solid var(--cream-3)', fontFamily: 'var(--sans)',
              fontSize: '13px', resize: 'vertical', color: 'var(--ink)',
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
            <button
              className="btn-stg-cancel"
              onClick={() => { setAnnotating(false); setAnnotNote(''); setSelection(null); }}
            >
              Cancel
            </button>
            <button className="btn-stg-save" onClick={() => void saveAnnotation()}>Save annotation</button>
          </div>
        </div>
      )}
    </div>
  );
}
