import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchBookmarkedArticles, toggleBookmark } from '../lib/api';
import type { ArticleWithAuthor } from '../lib/database.types';
import { timeAgo } from '../lib/pages';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

type Props = { onOpenArticle: (id: string) => void };
type Row = { article: ArticleWithAuthor; folder: string };

export default function BookmarksPage({ onOpenArticle }: Props) {
  const { profile } = useAuth();
  const toast = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState('All');

  const load = useCallback(async () => {
    if (!profile) return;
    try {
      setRows(await fetchBookmarkedArticles(profile.id));
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not load bookmarks', 'error');
    }
  }, [profile, toast]);

  useEffect(() => { void load(); }, [load]);

  const tags = useMemo(() => {
    const set = new Set(rows.map(r => r.article.tag).filter(Boolean));
    return ['All', ...[...set].sort()];
  }, [rows]);

  const shown = filter === 'All' ? rows : rows.filter(r => r.article.tag === filter);

  async function unsave(articleId: string, title: string) {
    if (!profile) return;
    setRows(prev => prev.filter(r => r.article.id !== articleId));
    try {
      await toggleBookmark(profile.id, articleId, true);
      toast(`Removed "${title}" from bookmarks`, 'success');
    } catch (err) {
      void load();
      toast(err instanceof Error ? err.message : 'Could not remove it', 'error');
    }
  }

  return (
    <div className="page active" id="page-bookmarks">
      <div style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        marginBottom: '20px', paddingBottom: '18px', borderBottom: '1px solid var(--cream-3)',
      }}>
        <h1 className="serif-h" style={{ fontSize: '28px' }}>Your <em>Bookmarks</em></h1>
        <span style={{ fontFamily: 'var(--sans)', fontSize: '12px', color: 'var(--ink-3)' }}>
          {rows.length} saved
        </span>
      </div>

      <div className="bm-filter-bar">
        {tags.map(t => (
          <div
            className={`bm-filter${filter === t ? ' active' : ''}`}
            key={t}
            onClick={() => setFilter(t)}
          >
            {t}
          </div>
        ))}
      </div>

      <div className="bm-list">
        {shown.map(({ article: a, folder }) => (
          <div className="bm-item" key={a.id} onClick={() => onOpenArticle(a.id)}>
            <div className="bm-ph" style={{ background: a.cover_grad }} />
            <div className="bm-info">
              <div className="bm-title">{a.title}</div>
              <div className="bm-meta">
                {a.author?.name} · {a.tag} · {a.read_time} · {folder} · Saved {timeAgo(a.created_at)}
              </div>
            </div>
            <button
              className="btn-tb-ghost"
              style={{ fontSize: '11.5px' }}
              onClick={e => { e.stopPropagation(); void unsave(a.id, a.title); }}
            >
              Remove
            </button>
          </div>
        ))}

        {shown.length === 0 && (
          <div style={{ fontFamily: 'var(--sans)', fontSize: '13px', opacity: 0.55, padding: '20px 0' }}>
            {rows.length === 0
              ? 'Nothing saved yet. Bookmark a piece while reading it.'
              : `No bookmarks tagged ${filter}.`}
          </div>
        )}
      </div>
    </div>
  );
}
