export const PAGES = [
  'home', 'discover', 'publish', 'collections', 'notes', 'bookmarks',
  'rooms', 'dna', 'capsule', 'insights', 'notifications', 'settings',
  'profile', 'search', 'article',
] as const;

export type PageId = (typeof PAGES)[number];

export function isPageId(v: string): v is PageId {
  return (PAGES as readonly string[]).includes(v);
}

/** Relative time, the way the prototype phrased it. */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr${h === 1 ? '' : 's'} ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'Yesterday';
  if (d < 7) return `${d} days ago`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w} week${w === 1 ? '' : 's'} ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo} month${mo === 1 ? '' : 's'} ago`;
  return `${Math.floor(d / 365)} year${Math.floor(d / 365) === 1 ? '' : 's'} ago`;
}

/** Short form used in chat thread lists: 2m, 1h, 3d. */
export function timeShort(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return `${Math.floor(d / 7)}w`;
}

/** Group notifications the way the prototype's filter rail does. */
export function notifGroup(iso: string): 'today' | 'week' | 'earlier' {
  const d = (Date.now() - new Date(iso).getTime()) / 86_400_000;
  if (d < 1) return 'today';
  if (d < 7) return 'week';
  return 'earlier';
}

export function plainText(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function countWords(text: string): number {
  return plainText(text).split(/\s+/).filter(Boolean).length;
}
