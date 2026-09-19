import { useEffect, useMemo, useRef, useState } from 'react';
import { search as runSearch, type SearchResults } from '../lib/api';
import type { PageId } from '../lib/pages';

type Props = {
  open: boolean;
  onClose: () => void;
  onNavigate: (page: PageId) => void;
  onOpenArticle: (id: string) => void;
  onSeeAll: (query: string) => void;
};

type Row = {
  key: string;
  icon: string;
  iconBg: string;
  title: string;
  meta: string;
  badge?: string;
  run: () => void;
};

const QUICK_LINKS: { icon: string; iconBg: string; title: string; meta: string; page: PageId }[] = [
  { icon: '✍️', iconBg: 'var(--amber-light)', title: 'Start writing', meta: 'Open the editor', page: 'publish' },
  { icon: '📚', iconBg: 'var(--sage-light)', title: 'Your collections', meta: 'Saved reading lists', page: 'collections' },
  { icon: '🧬', iconBg: 'var(--lav-light)', title: 'Writing DNA', meta: 'Your literary fingerprint', page: 'dna' },
];

const EMPTY: SearchResults = { articles: [], authors: [], topics: [] };

function Highlight({ text, q }: { text: string; q: string }) {
  if (!q.trim()) return <>{text}</>;
  const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return (
    <>
      {parts.map((p, i) =>
        p.toLowerCase() === q.toLowerCase() ? <mark key={i}>{p}</mark> : <span key={i}>{p}</span>,
      )}
    </>
  );
}

export default function SearchOverlay({ open, onClose, onNavigate, onOpenArticle, onSeeAll }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>(EMPTY);
  const [index, setIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults(EMPTY);
      setIndex(-1);
      window.setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  // Debounced search.
  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (!q) { setResults(EMPTY); return; }
    const t = window.setTimeout(() => {
      runSearch(q).then(setResults).catch(err => console.error('[TH-INK] search failed', err));
    }, 180);
    return () => window.clearTimeout(t);
  }, [query, open]);

  const rows = useMemo<Row[]>(() => {
    if (!query.trim()) {
      return QUICK_LINKS.map(l => ({
        key: `q-${l.page}`,
        icon: l.icon,
        iconBg: l.iconBg,
        title: l.title,
        meta: l.meta,
        run: () => { onClose(); onNavigate(l.page); },
      }));
    }
    const out: Row[] = [];
    for (const a of results.articles) {
      out.push({
        key: `a-${a.id}`,
        icon: '📄',
        iconBg: 'var(--amber-light)',
        title: a.title,
        meta: `${a.author?.name ?? 'Unknown'} · ${a.read_time} · ${a.tag}`,
        badge: 'Article',
        run: () => { onClose(); onOpenArticle(a.id); },
      });
    }
    for (const p of results.authors) {
      out.push({
        key: `p-${p.id}`,
        icon: '👤',
        iconBg: 'var(--sage-light)',
        title: p.name,
        meta: `@${p.handle} · ${p.bio}`,
        badge: 'Author',
        run: () => { onClose(); onSeeAll(p.name); },
      });
    }
    for (const t of results.topics) {
      out.push({
        key: `t-${t.name}`,
        icon: '#',
        iconBg: 'var(--lav-light)',
        title: t.name,
        meta: `${t.count} piece${t.count === 1 ? '' : 's'}`,
        badge: 'Topic',
        run: () => { onClose(); onSeeAll(t.name); },
      });
    }
    return out;
  }, [query, results, onClose, onNavigate, onOpenArticle, onSeeAll]);

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'Enter') {
      if (index >= 0 && rows[index]) rows[index].run();
      else if (query.trim()) { onClose(); onSeeAll(query.trim()); }
      return;
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setIndex(i => Math.min(i + 1, rows.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setIndex(i => Math.max(i - 1, 0)); }
  }

  if (!open) return null;

  const grouped = query.trim()
    ? [
        ['Articles', rows.filter(r => r.badge === 'Article')] as const,
        ['Authors', rows.filter(r => r.badge === 'Author')] as const,
        ['Topics', rows.filter(r => r.badge === 'Topic')] as const,
      ].filter(([, items]) => items.length > 0)
    : [['Quick links', rows] as const];

  return (
    <div
      id="searchOverlay"
      className="open"
      style={{ display: 'flex' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="so-box">
        <div className="so-input-row">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="7" cy="7" r="4.5" /><path d="M11 11l2.5 2.5" />
          </svg>
          <input
            className="so-input"
            id="soInput"
            ref={inputRef}
            type="text"
            placeholder="Search writings, authors, topics…"
            value={query}
            onChange={e => { setQuery(e.target.value); setIndex(-1); }}
            onKeyDown={onKeyDown}
          />
          <span className="so-kbd">ESC</span>
        </div>

        <div className="so-body" id="soBody">
          {query.trim() && rows.length === 0 && (
            <div className="so-empty">
              No results for "<em>{query}</em>"<br />
              <span style={{ fontSize: '13px' }}>Try a different keyword</span>
            </div>
          )}

          {grouped.map(([label, items]) => (
            <div key={label}>
              <div className="so-section-label">{label}</div>
              {items.map(r => {
                const i = rows.indexOf(r);
                return (
                  <div
                    className={`so-result${i === index ? ' active' : ''}`}
                    key={r.key}
                    onClick={r.run}
                    onMouseEnter={() => setIndex(i)}
                  >
                    <div className="so-result-icon" style={{ background: r.iconBg }}>{r.icon}</div>
                    <div className="so-result-body">
                      <div className="so-result-title"><Highlight text={r.title} q={query} /></div>
                      <div className="so-result-meta">{r.meta}</div>
                    </div>
                    {r.badge && <span className="so-result-badge">{r.badge}</span>}
                  </div>
                );
              })}
            </div>
          ))}

          {query.trim() && rows.length > 0 && (
            <div style={{ padding: '10px 20px 4px' }}>
              <div
                className="so-result"
                style={{ background: 'var(--cream-2)', borderRadius: '8px' }}
                onClick={() => { onClose(); onSeeAll(query.trim()); }}
              >
                <div className="so-result-icon" style={{ background: 'var(--amber-light)', fontSize: '13px' }}>🔍</div>
                <div className="so-result-body">
                  <div className="so-result-title" style={{ color: 'var(--amber)' }}>
                    See all results for "{query}"
                  </div>
                  <div className="so-result-meta">{rows.length} result{rows.length === 1 ? '' : 's'} found</div>
                </div>
                <span className="so-result-badge" style={{ background: 'var(--amber-light)', color: 'var(--amber)' }}>
                  View all
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="so-footer">
          <div className="so-footer-hint"><span className="so-kbd">↑↓</span> Navigate</div>
          <div className="so-footer-hint"><span className="so-kbd">↵</span> Open</div>
          <div className="so-footer-hint"><span className="so-kbd">ESC</span> Close</div>
        </div>
      </div>
    </div>
  );
}
