import { useEffect, useMemo, useState } from 'react';
import ArticleCard from '../components/ArticleCard';
import { fetchFeed, fetchTopics } from '../lib/api';
import type { ArticleWithAuthor } from '../lib/database.types';

type Props = { onOpenArticle: (id: string) => void };

export default function DiscoverPage({ onOpenArticle }: Props) {
  const [articles, setArticles] = useState<ArticleWithAuthor[]>([]);
  const [topics, setTopics] = useState<{ name: string; count: number }[]>([]);
  const [topic, setTopic] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchFeed(60), fetchTopics()])
      .then(([a, t]) => { setArticles(a); setTopics(t); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => (topic === 'All' ? articles : articles.filter(a => a.tag === topic)),
    [articles, topic],
  );

  const trending = useMemo(
    () => [...filtered].sort((a, b) => b.likes - a.likes).slice(0, 4),
    [filtered],
  );

  const staffPicks = useMemo(
    () => [...filtered].sort((a, b) => b.bookmarks - a.bookmarks).slice(0, 6),
    [filtered],
  );

  return (
    <div className="page active" id="page-discover">
      <div className="discover-hero">
        <div className="dh-lbl">Explore ideas</div>
        <div className="dh-title">Discover <em>remarkable</em> writing</div>
        <div className="dh-sub">
          Curated essays, philosophy, science, and stories from the world's most thoughtful writers.
        </div>
        <div className="topic-pills">
          <div className={`topic-pill${topic === 'All' ? ' on' : ''}`} onClick={() => setTopic('All')}>All</div>
          {topics.map(t => (
            <div
              key={t.name}
              className={`topic-pill${topic === t.name ? ' on' : ''}`}
              onClick={() => setTopic(t.name)}
            >
              {t.name}
            </div>
          ))}
        </div>
      </div>

      {loading && (
        <div style={{ fontFamily: 'var(--sans)', fontSize: '13px', opacity: 0.55, padding: '20px 0' }}>
          Loading the shelves…
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div style={{ fontFamily: 'var(--sans)', fontSize: '13px', opacity: 0.55, padding: '20px 0' }}>
          Nothing published under <strong>{topic}</strong> yet.
        </div>
      )}

      {trending.length > 0 && (
        <>
          <div className="section-bar">
            <h2 className="serif-h" style={{ fontSize: '19px' }}>Trending <em>today</em></h2>
          </div>
          <div className="gold-rule"><div className="gold-dot" /></div>
          <div className="trending-grid">
            {trending.map((a, i) => (
              <div className="trend-card" key={a.id} onClick={() => onOpenArticle(a.id)}>
                <div className="trend-num">{String(i + 1).padStart(2, '0')}</div>
                <div>
                  <div className="trend-title">{a.title}</div>
                  <div className="trend-meta">
                    {a.author?.name} · {a.tag} · {a.read_time} · {a.likes} likes
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {staffPicks.length > 0 && (
        <>
          <div className="section-bar">
            <h2 className="serif-h" style={{ fontSize: '19px' }}>Staff <em>picks</em></h2>
          </div>
          <div className="gold-rule"><div className="gold-dot" /></div>
          <div className="card-grid">
            {staffPicks.map(a => <ArticleCard key={a.id} article={a} onOpen={onOpenArticle} tagClass="" />)}
          </div>
        </>
      )}
    </div>
  );
}
