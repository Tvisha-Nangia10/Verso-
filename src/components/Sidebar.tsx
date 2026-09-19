import type { ReactNode } from 'react';
import type { Profile } from '../lib/database.types';
import type { PageId } from '../lib/pages';

type Props = {
  page: PageId;
  /** Drawer state — only meaningful at tablet width and below. */
  open: boolean;
  profile: Profile | null;
  unreadMessages: number;
  unreadNotifications: number;
  liveRooms: number;
  onNavigate: (page: PageId) => void;
  onOpenChat: () => void;
};

const I = {
  home: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M2 6l6-4 6 4v8H2z" /><rect x="5" y="10" width="3" height="4" rx=".5" />
    </svg>
  ),
  discover: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <circle cx="7" cy="7" r="4.5" /><path d="M11 11l2.5 2.5" />
    </svg>
  ),
  publish: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M3 3h10v2H3zM3 7.5h7M3 10.5h5M11 10l1.5 1.5L15 9" />
    </svg>
  ),
  collections: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <rect x="2" y="3" width="5" height="10" rx="1" /><rect x="9" y="3" width="5" height="10" rx="1" />
    </svg>
  ),
  notes: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M3 3h10v9a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><path d="M6 7h4M6 10h2" />
    </svg>
  ),
  bookmarks: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M4 2h8a1 1 0 011 1v11l-4.5-2.5L4 14V3a1 1 0 011-1z" />
    </svg>
  ),
  messages: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M3 3h10v9a2 2 0 01-2 2H7l-4 3V5a2 2 0 012-2z" />
    </svg>
  ),
  rooms: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <circle cx="5" cy="6" r="2" /><circle cx="11" cy="6" r="2" />
      <path d="M1 13c0-2 1.8-3.5 4-3.5s4 1.5 4 3.5M10 10c1.2.5 2 1.8 2 3.2" />
    </svg>
  ),
  dna: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M5 2c0 4 6 4 6 8s-6 4-6 8" /><path d="M11 2c0 4-6 4-6 8s6 4 6 8" /><path d="M3 6h10M3 10h10" />
    </svg>
  ),
  capsule: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <circle cx="8" cy="8" r="6" /><path d="M8 4v4l2.5 2.5" /><path d="M2 2l12 12" strokeDasharray="2 2" />
    </svg>
  ),
  insights: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M2 12l3-4 3 2 3-6 3 3" /><rect x="1" y="1" width="14" height="14" rx="2" />
    </svg>
  ),
  notifications: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M8 2a5 5 0 015 5v3l1.5 2h-13L3 10V7a5 5 0 015-5z" /><path d="M6.5 13a1.5 1.5 0 003 0" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <circle cx="8" cy="8" r="2.5" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.1 3.1l1.4 1.4M11.5 11.5l1.4 1.4M3.1 12.9l1.4-1.4M11.5 4.5l1.4-1.4" />
    </svg>
  ),
};

const PILL: React.CSSProperties = {
  marginLeft: 'auto', color: '#fff', fontSize: '8.5px', fontWeight: 700,
  padding: '1px 5px', borderRadius: '10px',
};

export default function Sidebar({
  page, open, profile, unreadMessages, unreadNotifications, liveRooms, onNavigate, onOpenChat,
}: Props) {
  const item = (id: PageId, icon: ReactNode, label: string, badge?: ReactNode) => (
    <div
      className={`nav-item${page === id ? ' active' : ''}`}
      id={`nav-${id}`}
      onClick={() => onNavigate(id)}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigate(id); } }}
    >
      {icon}
      {label}
      {badge}
    </div>
  );

  return (
    <aside className={open ? 'sidebar open' : 'sidebar'}>
      <div className="sb-logo" onClick={() => onNavigate('home')}>
        TH<span className="logo-dash">-</span>INK <div className="sb-dot" />
      </div>

      <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
        <div className="nav-section-label">Navigate</div>
        {item('home', I.home, 'Home')}
        {item('discover', I.discover, 'Discover')}
        {item('publish', I.publish, 'Write')}

        <div className="nav-section-label" style={{ marginTop: '4px' }}>Library</div>
        {item('collections', I.collections, 'Collections')}
        {item('notes', I.notes, 'Notes')}
        {item('bookmarks', I.bookmarks, 'Bookmarks')}

        <div className="nav-item" id="nav-messages" onClick={onOpenChat} role="button" tabIndex={0}
          onKeyDown={e => { if (e.key === 'Enter') onOpenChat(); }}>
          {I.messages}
          Messages
          {unreadMessages > 0 && (
            <span style={{ ...PILL, background: 'var(--rose)' }} id="msgBadge">{unreadMessages}</span>
          )}
        </div>

        <div className="nav-section-label" style={{ marginTop: '4px' }}>Unique to TH-INK</div>
        {item('rooms', I.rooms, 'Reading Rooms',
          liveRooms > 0 ? (
            <span style={{ ...PILL, background: 'var(--sage)', fontSize: '7.5px', letterSpacing: '.04em' }}>LIVE</span>
          ) : undefined)}
        {item('dna', I.dna, 'Writing DNA')}
        {item('capsule', I.capsule, 'Time Capsule')}
        {item('insights', I.insights, 'Craft Insights')}

        <div className="nav-section-label" style={{ marginTop: '4px' }}>Account</div>
        {item('notifications', I.notifications, 'Notifications',
          unreadNotifications > 0 ? (
            <span style={{ ...PILL, background: 'var(--rose)' }} id="notifBadge">{unreadNotifications}</span>
          ) : undefined)}
        {item('settings', I.settings, 'Settings')}
      </nav>

      <div className="sb-footer">
        <div className="sb-user" onClick={() => onNavigate('profile')}>
          <div
            className="sb-av"
            style={profile ? { background: profile.avatar_bg, color: profile.avatar_color } : undefined}
          >
            {profile?.initials || '··'}
          </div>
          <div>
            <div className="sb-name">{profile?.name ?? 'Loading…'}</div>
            <div className="sb-role">
              Writer{profile?.streak_days ? ` · ${profile.streak_days} day streak 🔥` : ''}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
