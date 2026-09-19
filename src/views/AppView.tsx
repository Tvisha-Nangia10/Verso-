import { useCallback, useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import SearchOverlay from '../components/SearchOverlay';
import ChatPanel from '../components/ChatPanel';
import ArticleReader from '../components/ArticleReader';

import HomePage from '../pages/HomePage';
import DiscoverPage from '../pages/DiscoverPage';
import PublishPage from '../pages/PublishPage';
import CollectionsPage from '../pages/CollectionsPage';
import NotesPage from '../pages/NotesPage';
import BookmarksPage from '../pages/BookmarksPage';
import RoomsPage from '../pages/RoomsPage';
import DnaPage from '../pages/DnaPage';
import CapsulePage from '../pages/CapsulePage';
import InsightsPage from '../pages/InsightsPage';
import NotificationsPage from '../pages/NotificationsPage';
import SettingsPage from '../pages/SettingsPage';
import ProfilePage from '../pages/ProfilePage';
import SearchResultsPage from '../pages/SearchResultsPage';

import { supabase } from '../lib/supabase';
import { fetchConversations, fetchNotifications, fetchRooms } from '../lib/api';
import type { ArticleWithAuthor, Profile } from '../lib/database.types';
import type { PageId } from '../lib/pages';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function AppView() {
  const { profile } = useAuth();
  const toast = useToast();

  const [page, setPage] = useState<PageId>('home');
  const [searchOpen, setSearchOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [readingId, setReadingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<ArticleWithAuthor | null>(null);
  const [viewingProfile, setViewingProfile] = useState<Profile | null>(null);

  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [liveRooms, setLiveRooms] = useState(0);

  const refreshBadges = useCallback(async () => {
    if (!profile) return;
    try {
      const [convs, notifs, rooms] = await Promise.all([
        fetchConversations(profile.id),
        fetchNotifications(profile.id),
        fetchRooms(),
      ]);
      setUnreadMessages(convs.reduce((n, c) => n + c.unread, 0));
      setUnreadNotifications(notifs.filter(n => !n.read).length);
      setLiveRooms(rooms.filter(r => r.is_live).length);
    } catch (err) {
      console.error('[TH-INK] badge refresh failed', err);
    }
  }, [profile]);

  useEffect(() => { void refreshBadges(); }, [refreshBadges]);

  // Welcome, once, when the profile lands.
  useEffect(() => {
    if (profile) toast(`Welcome back, ${profile.name.split(' ')[0]} 👋`, 'success');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  // Live notifications.
  useEffect(() => {
    if (!profile) return;
    const channel = supabase
      .channel('notifications-stream')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` },
        payload => {
          const n = payload.new as { title: string };
          setUnreadNotifications(c => c + 1);
          toast(n.title, 'info', 4000);
        },
      )
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [profile, toast]);

  // ⌘K / Ctrl-K opens search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Deep link: /?article=<id>
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('article');
    if (id) setReadingId(id);
  }, []);

  function navigate(p: PageId) {
    setPage(p);
    setDrawerOpen(false);
    if (p !== 'profile') setViewingProfile(null);
    setConfigClosed();
  }

  function setConfigClosed() {
    document.getElementById('configPanel')?.classList.remove('open');
  }

  function openArticle(id: string) {
    setReadingId(id);
  }

  function seeAll(q: string) {
    setQuery(q);
    setPage('search');
  }

  function openProfile(p: Profile) {
    setViewingProfile(p);
    setPage('profile');
  }

  function editArticle(a: ArticleWithAuthor) {
    setReadingId(null);
    setEditing(a);
    setPage('publish');
  }

  const isEditorPage = page === 'publish';

  return (
    <div
      className="view active"
      id="view-app"
      style={{ display: 'flex', flexDirection: 'row', height: '100vh', overflow: 'hidden' }}
    >
      <button className="chat-fab" onClick={() => setChatOpen(true)} aria-label="Messages">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M3 4h14v10a2 2 0 01-2 2H7l-4 3V6a2 2 0 012-2z" />
        </svg>
        {unreadMessages > 0 && <span className="chat-fab-badge">{unreadMessages}</span>}
      </button>

      {profile && (
        <ChatPanel
          open={chatOpen}
          userId={profile.id}
          onClose={() => setChatOpen(false)}
          onChanged={() => void refreshBadges()}
        />
      )}

      {drawerOpen && <div className="sidebar-scrim" onClick={() => setDrawerOpen(false)} />}

      <Sidebar
        page={page}
        open={drawerOpen}
        profile={profile}
        unreadMessages={unreadMessages}
        unreadNotifications={unreadNotifications}
        liveRooms={liveRooms}
        onNavigate={navigate}
        onOpenChat={() => { setDrawerOpen(false); setChatOpen(true); }}
      />

      <div className="main">
        <header className="topbar">
          <button
            className="sidebar-toggle"
            onClick={() => setDrawerOpen(v => !v)}
            aria-label={drawerOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={drawerOpen}
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              {drawerOpen
                ? <path d="M3 3l10 10M13 3L3 13" />
                : <path d="M2 4h12M2 8h12M2 12h12" />}
            </svg>
          </button>

          <div className="search-wrap">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="7" cy="7" r="4.5" /><path d="M11 11l2.5 2.5" />
            </svg>
            <input
              className="search-input"
              type="text"
              placeholder="Search writings, authors, topics…   ⌘K"
              id="globalSearch"
              readOnly
              onFocus={() => setSearchOpen(true)}
              onClick={() => setSearchOpen(true)}
            />
          </div>

          <div className="tb-right">
            <button className="btn-tb-ghost" onClick={() => navigate('publish')}>My drafts</button>
            <button className="btn-tb-solid" onClick={() => navigate('publish')}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <path d="M1 9.5L3 9 9 3a1.6 1.6 0 00-2.5-2L1 7z" />
              </svg>
              <span>Write</span>
            </button>
            <div className="icon-btn" style={{ position: 'relative' }} onClick={() => navigate('notifications')}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                <path d="M8 2a5 5 0 015 5v3l1.5 2h-13L3 10V7a5 5 0 015-5z" /><path d="M6.5 13a1.5 1.5 0 003 0" />
              </svg>
              {unreadNotifications > 0 && (
                <span style={{
                  position: 'absolute', top: '-3px', right: '-3px', width: '8px', height: '8px',
                  borderRadius: '50%', background: 'var(--rose)', border: '2px solid var(--cream)',
                }} />
              )}
            </div>
            <div className="icon-btn" onClick={() => navigate('profile')}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                <path d="M8 8a3 3 0 100-6 3 3 0 000 6zM4 14c0-2.2 1.8-4 4-4s4 1.8 4 4" />
              </svg>
            </div>
          </div>
        </header>

        <div
          className="content-area"
          id="contentArea"
          style={isEditorPage ? { padding: 0, overflow: 'hidden' } : { padding: '28px 30px', overflow: 'auto' }}
        >
          {page === 'home' && <HomePage onNavigate={navigate} onOpenArticle={openArticle} />}
          {page === 'discover' && <DiscoverPage onOpenArticle={openArticle} />}
          {page === 'publish' && (
            <PublishPage
              editing={editing}
              onEditingConsumed={() => setEditing(null)}
              onPublished={id => { setPage('home'); openArticle(id); void refreshBadges(); }}
            />
          )}
          {page === 'collections' && <CollectionsPage onOpenArticle={openArticle} />}
          {page === 'notes' && <NotesPage />}
          {page === 'bookmarks' && <BookmarksPage onOpenArticle={openArticle} />}
          {page === 'rooms' && <RoomsPage />}
          {page === 'dna' && <DnaPage />}
          {page === 'capsule' && <CapsulePage />}
          {page === 'insights' && <InsightsPage />}
          {page === 'notifications' && (
            <NotificationsPage onNavigate={navigate} onChanged={() => void refreshBadges()} />
          )}
          {page === 'settings' && <SettingsPage />}
          {page === 'profile' && (
            <ProfilePage
              viewing={viewingProfile}
              onOpenArticle={openArticle}
              onOpenChat={() => setChatOpen(true)}
              onEdit={() => navigate('settings')}
            />
          )}
          {page === 'search' && (
            <SearchResultsPage
              query={query}
              onOpenArticle={openArticle}
              onOpenProfile={openProfile}
              onSearchTopic={seeAll}
            />
          )}
        </div>
      </div>

      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={navigate}
        onOpenArticle={openArticle}
        onSeeAll={seeAll}
      />

      {readingId && (
        <ArticleReader
          articleId={readingId}
          onClose={() => setReadingId(null)}
          onEdit={editArticle}
          onOpenChat={() => { setReadingId(null); setChatOpen(true); }}
        />
      )}
    </div>
  );
}
