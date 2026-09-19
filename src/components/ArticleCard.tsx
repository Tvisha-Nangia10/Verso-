import type { ArticleWithAuthor } from '../lib/database.types';
import { plainText, timeAgo } from '../lib/pages';

export function HeartIcon() {
  return (
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <path d="M6 10.5C3 8 1 6 1 4a3 3 0 015 0 3 3 0 015 0c0 2-2 4-5 6.5z" />
    </svg>
  );
}

export function Avatar({
  initials, bg, color, size, className,
}: { initials: string; bg: string; color: string; size?: number; className?: string }) {
  return (
    <div
      className={className ?? 'a-av'}
      style={{
        background: bg,
        color,
        ...(size ? { width: size, height: size, fontSize: size * 0.38 } : {}),
      }}
    >
      {initials}
    </div>
  );
}

type Props = {
  article: ArticleWithAuthor;
  onOpen: (id: string) => void;
  tagClass?: string;
};

export default function ArticleCard({ article: a, onOpen, tagClass = 'amber' }: Props) {
  const excerpt = a.subtitle || `${plainText(a.body).slice(0, 110)}…`;

  return (
    <div className="a-card" onClick={() => onOpen(a.id)}>
      <div className="a-card-ph" style={{ background: a.cover_grad, minHeight: '110px' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 65% 35%, ${a.cover_accent} 0%, transparent 65%)`,
          }}
        />
      </div>
      <div className="a-card-body">
        <div className="a-card-author">
          {a.author && (
            <Avatar initials={a.author.initials} bg={a.author.avatar_bg} color={a.author.avatar_color} />
          )}
          <span className="a-author">{a.author?.name ?? 'Unknown'}</span>
          <span className="a-sep">·</span>
          <span className="a-date">{timeAgo(a.published_at ?? a.created_at)}</span>
        </div>
        <div className="a-title">{a.title}</div>
        <div className="a-excerpt">{excerpt}</div>
        <div className="a-footer">
          <span className={`tag ${tagClass}`}>{a.tag}</span>
          <div className="a-stats">
            <span className="a-stat"><HeartIcon />{a.likes}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
