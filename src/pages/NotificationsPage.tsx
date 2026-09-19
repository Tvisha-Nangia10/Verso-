import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchNotifications, markAllNotificationsRead, markNotificationRead, toggleFollow,
} from '../lib/api';
import type { Notification } from '../lib/database.types';
import { notifGroup, timeAgo, type PageId } from '../lib/pages';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

type Props = { onNavigate: (p: PageId) => void; onChanged: () => void };

const FILTERS: { id: string; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'follow', label: 'Followers' },
  { id: 'like', label: 'Likes' },
  { id: 'comment', label: 'Comments' },
  { id: 'room', label: 'Rooms' },
  { id: 'milestone', label: 'Milestones' },
  { id: 'system', label: 'System' },
];

const FALLBACK_ICON: Record<string, string> = {
  like: '♥', comment: '✎', room: '◉', milestone: '✦', system: '⚙', follow: '＋',
};

/** Where an action button should take you. */
const ACTION_TARGET: Record<string, { label: string; page?: PageId }> = {
  notifViewAnnotation: { label: 'View annotation', page: 'discover' },
  notifJoinRoom: { label: 'Join room', page: 'rooms' },
  notifViewPost: { label: 'Open piece', page: 'discover' },
  notifViewInsights: { label: 'View insights', page: 'insights' },
  notifViewCapsule: { label: 'Open capsule', page: 'capsule' },
  notifFollowBack: { label: 'Follow back' },
};

export default function NotificationsPage({ onNavigate, onChanged }: Props) {
  const { profile } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState<Notification[]>([]);
  const [filter, setFilter] = useState('all');
  const [showPrefs, setShowPrefs] = useState(false);

  const load = useCallback(async () => {
    if (!profile) return;
    try {
      setItems(await fetchNotifications(profile.id));
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not load notifications', 'error');
    }
  }, [profile, toast]);

  useEffect(() => { void load(); }, [load]);

  const shown = useMemo(
    () => (filter === 'all' ? items : items.filter(n => n.type === filter)),
    [items, filter],
  );

  const unread = items.filter(n => !n.read).length;
  const today = shown.filter(n => notifGroup(n.created_at) === 'today');
  const earlier = shown.filter(n => notifGroup(n.created_at) !== 'today');

  async function markRead(n: Notification) {
    if (n.read) return;
    setItems(prev => prev.map(x => (x.id === n.id ? { ...x, read: true } : x)));
    onChanged();
    try {
      await markNotificationRead(n.id);
    } catch (err) {
      console.error(err);
    }
  }

  async function markAll() {
    if (!profile) return;
    setItems(prev => prev.map(n => ({ ...n, read: true })));
    onChanged();
    try {
      await markAllNotificationsRead(profile.id);
      toast('All caught up', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not update', 'error');
      void load();
    }
  }

  async function runAction(e: React.MouseEvent, n: Notification) {
    e.stopPropagation();
    void markRead(n);

    if (n.action === 'notifFollowBack' && profile && n.actor_id) {
      try {
        await toggleFollow(profile.id, n.actor_id, false);
        toast(`You're now following ${n.actor?.name ?? 'them'}`, 'success');
      } catch {
        toast('Already following', 'info');
      }
      return;
    }
    const target = n.action ? ACTION_TARGET[n.action] : undefined;
    if (target?.page) onNavigate(target.page);
  }

  const renderItem = (n: Notification) => {
    const target = n.action ? ACTION_TARGET[n.action] : undefined;
    return (
      <div
        className={`notif-item${n.read ? '' : ' unread'}`}
        key={n.id}
        onClick={() => void markRead(n)}
      >
        {!n.read && <div className="notif-unread-dot" />}
        {n.actor ? (
          <div
            className="notif-avatar"
            style={{ background: n.actor.avatar_bg, color: n.actor.avatar_color }}
          >
            {n.actor.initials}
          </div>
        ) : (
          <div className={`notif-icon ${n.type}`}>{FALLBACK_ICON[n.type] ?? '✦'}</div>
        )}
        <div className="notif-body">
          <div className="notif-text">{n.title}</div>
          <div className="notif-time">{timeAgo(n.created_at)}</div>
        </div>
        {target && (
          <button className="notif-action-btn" onClick={e => void runAction(e, n)}>
            {target.label}
          </button>
        )}
      </div>
    );
  };

  const prefs = profile?.prefs?.notifications ?? {};

  return (
    <div className="page active" id="page-notifications">
      <div className="notif-header-row">
        <div>
          <h1 className="serif-h" style={{ fontSize: '28px' }}>Notifications</h1>
          <p style={{ fontFamily: 'var(--sans)', fontSize: '13px', color: 'var(--ink-3)', marginTop: '4px' }}>
            {unread > 0 ? (
              <>You have <strong>{unread}</strong> unread notification{unread === 1 ? '' : 's'}</>
            ) : (
              'You are all caught up'
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button className="btn-mark-all" onClick={() => void markAll()}>Mark all as read</button>
          <button className="btn-tb-ghost" style={{ fontSize: '12px' }} onClick={() => setShowPrefs(v => !v)}>
            ⚙ Preferences
          </button>
        </div>
      </div>

      {showPrefs && (
        <div style={{
          background: 'var(--cream-2)', border: '1px solid var(--cream-3)',
          borderRadius: '12px', padding: '18px', marginBottom: '18px', maxWidth: '520px',
        }}>
          <div className="nav-section-label" style={{ padding: 0, marginBottom: '10px' }}>
            What you hear about
          </div>
          {FILTERS.filter(f => f.id !== 'all').map(f => (
            <div
              key={f.id}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                fontFamily: 'var(--sans)', fontSize: '13px', padding: '7px 0',
              }}
            >
              <span>{f.label}</span>
              <span style={{ color: prefs[f.id] === false ? 'var(--ink-3)' : 'var(--sage)' }}>
                {prefs[f.id] === false ? 'Off' : 'On'}
              </span>
            </div>
          ))}
          <p style={{ fontFamily: 'var(--sans)', fontSize: '11.5px', color: 'var(--ink-3)', marginTop: '10px' }}>
            Change these in Settings → Notifications.
          </p>
        </div>
      )}

      <div className="notif-filter-bar" id="notifFilterBar">
        {FILTERS.map(f => (
          <button
            className={`notif-filter${filter === f.id ? ' active' : ''}`}
            key={f.id}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div id="notifList">
        {shown.length === 0 && (
          <div className="notif-empty">
            <div className="notif-empty-icon">🔔</div>
            <div className="notif-empty-text">
              No {filter === 'all' ? '' : `${filter} `}notifications yet
            </div>
          </div>
        )}

        {today.length > 0 && (
          <>
            <div className="notif-group-label">Today</div>
            {today.map(renderItem)}
          </>
        )}

        {earlier.length > 0 && (
          <>
            <div className="notif-group-label" style={{ marginTop: today.length ? '20px' : 0 }}>
              Earlier
            </div>
            {earlier.map(renderItem)}
          </>
        )}
      </div>
    </div>
  );
}
