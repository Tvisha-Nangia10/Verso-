import { useEffect, useState } from 'react';
import { search, startConversation, toggleFollow, fetchFollowing } from '../lib/api';
import type { Profile } from '../lib/database.types';
import type { SearchResults as Results } from '../lib/api';
import { plainText, timeAgo } from '../lib/pages';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

type Filter = 'all' | 'article' | 'author' | 'topic';

type Props = {
  query: string;
  onOpenArticle: (id: string) => void;
  onOpenProfile: (p: Profile) => void;
  onSearchTopic: (topic: string) => void;
};

const EMPTY: Results = { articles: [], authors: [], topics: [] };

export default function SearchResultsPage({ query, onOpenArticle, onOpenProfile, onSearchTopic }: Props) {
  const { profile } = useAuth();
  const toast = useToast();
  const [results, setResults] = useState<Results>(EMPTY);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLoading(true);
    search(query)
      .then(setResults)
      .catch(err => toast(err instanceof Error ? err.message : 'Search failed', 'error'))
      .finally(() => setLoading(false));
  }, [query, toast]);

  useEffect(() => {
    if (profile) void fetchFollowing(profile.id).then(setFollowing).catch(console.error);
  }, [profile]);

  const total = results.articles.length + results.authors.length + results.topics.length;
  const show = (f: Filter) => filter === 'all' || filter === f;

  async function follow(p: Profile, e: React.MouseEvent) {
    e.stopPropagation();
    if (!profile) return;
    const isFollowing = following.has(p.id);
    setFollowing(prev => {
      const next = new Set(prev);
      if (isFollowing) next.delete(p.id); else next.add(p.id);
      return next;
    });
    try {
      await toggleFollow(profile.id, p.id, isFollowing);
      toast(isFollowing ? `Unfollowed ${p.name}` : `Following ${p.name}`, 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not update', 'error');
    }
  }

  async function message(p: Profile, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await startConversation(p.id);
      toast(`Conversation with ${p.name} ready — open Messages`, 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not start it', 'error');
    }
  }

  return (
    <div className="page active" id="page-search">
      <div className="sr-header">
        <div className="sr-query">Search results for "<em>{query}</em>"</div>
        <div className="sr-count">
          {loading ? 'Searching…' : `${total} result${total === 1 ? '' : 's'}`}
        </div>
      </div>

      <div className="sr-filter-bar">
        {([['all', 'All'], ['article', 'Posts'], ['author', 'Writers'], ['topic', 'Topics']] as const).map(
          ([id, label]) => (
            <button
              className={`sr-filter${filter === id ? ' active' : ''}`}
              key={id}
              onClick={() => setFilter(id)}
            >
              {label}
            </button>
          ),
        )}
      </div>

      <div id="srResults">
        {!loading && total === 0 && (
          <div className="sr-empty">
            <div className="sr-empty-icon">🔍</div>
            <div className="sr-empty-title">Nothing found for "{query}"</div>
            <div className="sr-empty-sub">Try a shorter phrase, or a writer's name.</div>
          </div>
        )}

        {show('article') && results.articles.length > 0 && (
          <>
            <div className="sr-section-label">Posts</div>
            <div className="sr-grid">
              {results.articles.map(a => (
                <div className="sr-card" key={a.id} onClick={() => onOpenArticle(a.id)}>
                  <div className="sr-card-bg" style={{ background: a.cover_grad }} />
                  <div className="sr-card-title">{a.title}</div>
                  <div className="sr-card-excerpt">
                    {a.subtitle || `${plainText(a.body).slice(0, 140)}…`}
                  </div>
                  <div className="sr-card-footer">
                    <div className="sr-card-tags">
                      <span className="sr-tag">{a.tag}</span>
                      <span className="sr-tag">{a.author?.name}</span>
                    </div>
                    <div>
                      <span className="sr-card-stat">♥ {a.likes}</span>
                      <span className="sr-card-stat"> · {timeAgo(a.published_at ?? a.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {show('author') && results.authors.length > 0 && (
          <>
            <div className="sr-section-label">Writers</div>
            <div className="sr-user-grid">
              {results.authors.map(p => (
                <div className="sr-user-card" key={p.id} onClick={() => onOpenProfile(p)}>
                  <div className="sr-user-av" style={{ background: p.avatar_bg, color: p.avatar_color }}>
                    {p.initials}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="sr-user-name">{p.name}</div>
                    <div className="sr-user-handle">@{p.handle}</div>
                    <div className="sr-user-stats">{p.bio}</div>
                  </div>
                  {p.id !== profile?.id && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        className={following.has(p.id) ? 'btn-tb-ghost' : 'btn-tb-solid'}
                        style={{ fontSize: '11.5px' }}
                        onClick={e => void follow(p, e)}
                      >
                        {following.has(p.id) ? 'Following' : 'Follow'}
                      </button>
                      <button
                        className="btn-tb-ghost"
                        style={{ fontSize: '11.5px' }}
                        onClick={e => void message(p, e)}
                      >
                        Message
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {show('topic') && results.topics.length > 0 && (
          <>
            <div className="sr-section-label">Topics</div>
            <div className="sr-topic-grid">
              {results.topics.map(t => (
                <div className="sr-topic-chip" key={t.name} onClick={() => onSearchTopic(t.name)}>
                  <div className="sr-topic-chip-name">{t.name}</div>
                  <div className="sr-topic-chip-count">
                    {t.count} piece{t.count === 1 ? '' : 's'}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
