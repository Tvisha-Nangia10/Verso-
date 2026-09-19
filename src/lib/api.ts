import { supabase } from './supabase';
import type {
  Annotation, Article, ArticleWithAuthor, Collection, Comment, ConversationSummary,
  Message, Note, Notification, Profile, Room, RoomMessage, TimeCapsule, WritingDna,
  WritingSession,
} from './database.types';

const ARTICLE_SELECT = `
  *,
  author:profiles!articles_author_id_fkey(*),
  likes:likes(count),
  comments:comments(count),
  bookmarks:bookmarks(count)
`;

type CountAgg = { count: number }[] | null;

function shapeArticle(row: Record<string, unknown>): ArticleWithAuthor {
  const first = (agg: unknown) => ((agg as CountAgg)?.[0]?.count ?? 0);
  return {
    ...(row as unknown as Article),
    author: row.author as Profile,
    likes: first(row.likes),
    comments: first(row.comments),
    bookmarks: first(row.bookmarks),
  };
}

/* ═══════════════════════════ articles ═══════════════════════════ */

export async function fetchFeed(limit = 30): Promise<ArticleWithAuthor[]> {
  const { data, error } = await supabase
    .from('articles')
    .select(ARTICLE_SELECT)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(shapeArticle);
}

/** The feed, narrowed to people the user follows. Falls back to everything. */
export async function fetchFollowingFeed(userId: string): Promise<ArticleWithAuthor[]> {
  const { data: follows, error: fErr } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId);
  if (fErr) throw fErr;

  const ids = (follows ?? []).map(f => (f as { following_id: string }).following_id);
  if (ids.length === 0) return fetchFeed();

  const { data, error } = await supabase
    .from('articles')
    .select(ARTICLE_SELECT)
    .eq('status', 'published')
    .in('author_id', ids)
    .order('published_at', { ascending: false })
    .limit(30);
  if (error) throw error;
  return (data ?? []).map(shapeArticle);
}

export async function fetchArticlesByTag(tag: string): Promise<ArticleWithAuthor[]> {
  const { data, error } = await supabase
    .from('articles')
    .select(ARTICLE_SELECT)
    .eq('status', 'published')
    .eq('tag', tag)
    .order('published_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(shapeArticle);
}

export async function fetchArticle(id: string): Promise<ArticleWithAuthor | null> {
  const { data, error } = await supabase
    .from('articles')
    .select(ARTICLE_SELECT)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? shapeArticle(data) : null;
}

export async function fetchArticlesByAuthor(
  authorId: string,
  status?: 'draft' | 'published',
): Promise<ArticleWithAuthor[]> {
  let q = supabase.from('articles').select(ARTICLE_SELECT).eq('author_id', authorId);
  if (status) q = q.eq('status', status);
  const { data, error } = await q.order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(shapeArticle);
}

export async function saveDraft(
  article: Partial<Article> & { author_id: string; title: string },
): Promise<Article> {
  const words = (article.body ?? '').replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  const payload = {
    ...article,
    word_count: words,
    read_time: `${Math.max(1, Math.round(words / 200))} min`,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = article.id
    ? await supabase.from('articles').update(payload).eq('id', article.id).select().single()
    : await supabase.from('articles').insert(payload).select().single();
  if (error) throw error;
  return data as Article;
}

export async function publishArticle(id: string, audience = 'everyone'): Promise<Article> {
  const { data, error } = await supabase
    .from('articles')
    .update({ status: 'published', audience, published_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Article;
}

export async function deleteArticle(id: string) {
  const { error } = await supabase.from('articles').delete().eq('id', id);
  if (error) throw error;
}

/* ═══════════════════════ likes & bookmarks ══════════════════════ */

export async function fetchMyLikes(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase.from('likes').select('article_id').eq('user_id', userId);
  if (error) throw error;
  return new Set((data ?? []).map(r => (r as { article_id: string }).article_id));
}

export async function toggleLike(userId: string, articleId: string, liked: boolean) {
  if (liked) {
    const { error } = await supabase.from('likes').delete().match({ user_id: userId, article_id: articleId });
    if (error) throw error;
  } else {
    const { error } = await supabase.from('likes').insert({ user_id: userId, article_id: articleId });
    if (error) throw error;
  }
}

export async function fetchMyBookmarks(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase.from('bookmarks').select('article_id').eq('user_id', userId);
  if (error) throw error;
  return new Set((data ?? []).map(r => (r as { article_id: string }).article_id));
}

export async function toggleBookmark(
  userId: string, articleId: string, bookmarked: boolean, folder = 'Read later',
) {
  if (bookmarked) {
    const { error } = await supabase.from('bookmarks').delete().match({ user_id: userId, article_id: articleId });
    if (error) throw error;
  } else {
    const { error } = await supabase.from('bookmarks').insert({ user_id: userId, article_id: articleId, folder });
    if (error) throw error;
  }
}

export async function fetchBookmarkedArticles(
  userId: string,
): Promise<{ article: ArticleWithAuthor; folder: string }[]> {
  const { data, error } = await supabase
    .from('bookmarks')
    .select(`folder, article:articles(${ARTICLE_SELECT})`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? [])
    .filter(r => (r as { article: unknown }).article)
    .map(r => ({
      folder: (r as { folder: string }).folder,
      article: shapeArticle((r as unknown as { article: Record<string, unknown> }).article),
    }));
}

/* ═════════════════════════ comments ═════════════════════════════ */

export async function fetchComments(articleId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*, author:profiles!comments_user_id_fkey(*)')
    .eq('article_id', articleId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Comment[];
}

export async function addComment(articleId: string, userId: string, body: string, parentId?: string) {
  const { data, error } = await supabase
    .from('comments')
    .insert({ article_id: articleId, user_id: userId, body, parent_id: parentId ?? null })
    .select('*, author:profiles!comments_user_id_fkey(*)')
    .single();
  if (error) throw error;
  return data as unknown as Comment;
}

/* ════════════════════════ collections ═══════════════════════════ */

export async function fetchCollections(userId: string): Promise<Collection[]> {
  const { data, error } = await supabase
    .from('collections')
    .select('*, collection_items(count)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(c => ({
    ...(c as unknown as Collection),
    item_count: ((c as { collection_items: CountAgg }).collection_items?.[0]?.count ?? 0),
  }));
}

export async function createCollection(
  userId: string, name: string, description = '', color = 'amber', isPublic = true,
) {
  const { data, error } = await supabase
    .from('collections')
    .insert({ user_id: userId, name, description, color, is_public: isPublic })
    .select()
    .single();
  if (error) throw error;
  return data as Collection;
}

export async function deleteCollection(id: string) {
  const { error } = await supabase.from('collections').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchCollectionArticles(collectionId: string): Promise<ArticleWithAuthor[]> {
  const { data, error } = await supabase
    .from('collection_items')
    .select(`article:articles(${ARTICLE_SELECT})`)
    .eq('collection_id', collectionId);
  if (error) throw error;
  return (data ?? [])
    .filter(r => (r as { article: unknown }).article)
    .map(r => shapeArticle((r as unknown as { article: Record<string, unknown> }).article));
}

export async function addToCollection(collectionId: string, articleId: string) {
  const { error } = await supabase
    .from('collection_items')
    .upsert({ collection_id: collectionId, article_id: articleId });
  if (error) throw error;
}

export async function removeFromCollection(collectionId: string, articleId: string) {
  const { error } = await supabase
    .from('collection_items')
    .delete()
    .match({ collection_id: collectionId, article_id: articleId });
  if (error) throw error;
}

/* ═══════════════════════════ notes ══════════════════════════════ */

export async function fetchNotes(userId: string): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Note[];
}

export async function upsertNote(note: Partial<Note> & { user_id: string }): Promise<Note> {
  const payload = { ...note, updated_at: new Date().toISOString() };
  const { data, error } = note.id
    ? await supabase.from('notes').update(payload).eq('id', note.id).select().single()
    : await supabase.from('notes').insert(payload).select().single();
  if (error) throw error;
  return data as unknown as Note;
}

export async function deleteNote(id: string) {
  const { error } = await supabase.from('notes').delete().eq('id', id);
  if (error) throw error;
}

/* ════════════════════════ annotations ═══════════════════════════ */

export async function fetchAnnotations(userId: string, articleId?: string): Promise<Annotation[]> {
  let q = supabase.from('annotations').select('*').eq('user_id', userId);
  if (articleId) q = q.eq('article_id', articleId);
  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Annotation[];
}

export async function createAnnotation(a: Omit<Annotation, 'id' | 'created_at'>) {
  const { data, error } = await supabase.from('annotations').insert(a).select().single();
  if (error) throw error;
  return data as unknown as Annotation;
}

export async function deleteAnnotation(id: string) {
  const { error } = await supabase.from('annotations').delete().eq('id', id);
  if (error) throw error;
}

/* ═══════════════════════ messaging ══════════════════════════════ */

export async function fetchConversations(userId: string): Promise<ConversationSummary[]> {
  const { data: mine, error } = await supabase
    .from('conversation_participants')
    .select('conversation_id, last_read_at')
    .eq('user_id', userId);
  if (error) throw error;

  const convIds = (mine ?? []).map(r => (r as { conversation_id: string }).conversation_id);
  if (convIds.length === 0) return [];

  const readMap = new Map(
    (mine ?? []).map(r => {
      const row = r as { conversation_id: string; last_read_at: string };
      return [row.conversation_id, row.last_read_at];
    }),
  );

  const [{ data: others }, { data: msgs }] = await Promise.all([
    supabase
      .from('conversation_participants')
      .select('conversation_id, profile:profiles(*)')
      .in('conversation_id', convIds)
      .neq('user_id', userId),
    supabase
      .from('messages')
      .select('conversation_id, body, created_at, sender_id')
      .in('conversation_id', convIds)
      .order('created_at', { ascending: false }),
  ]);

  const otherMap = new Map<string, Profile>();
  for (const r of others ?? []) {
    const row = r as unknown as { conversation_id: string; profile: Profile };
    if (row.profile) otherMap.set(row.conversation_id, row.profile);
  }

  const summaries: ConversationSummary[] = [];
  for (const cid of convIds) {
    const other = otherMap.get(cid);
    if (!other) continue;
    const all = (msgs ?? []).filter(m => (m as { conversation_id: string }).conversation_id === cid);
    const last = all[0] as { body: string; created_at: string } | undefined;
    const lastRead = readMap.get(cid) ?? new Date(0).toISOString();
    const unread = all.filter(m => {
      const row = m as { sender_id: string; created_at: string };
      return row.sender_id !== userId && row.created_at > lastRead;
    }).length;
    summaries.push({
      id: cid,
      other,
      last_message: last?.body ?? 'Say hello',
      last_at: last?.created_at ?? new Date(0).toISOString(),
      unread,
    });
  }
  return summaries.sort((a, b) => b.last_at.localeCompare(a.last_at));
}

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Message[];
}

export async function sendMessage(conversationId: string, senderId: string, body: string) {
  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, body })
    .select()
    .single();
  if (error) throw error;
  return data as unknown as Message;
}

export async function markConversationRead(conversationId: string, userId: string) {
  await supabase
    .from('conversation_participants')
    .update({ last_read_at: new Date().toISOString() })
    .match({ conversation_id: conversationId, user_id: userId });
}

/** Start (or reuse) a direct conversation with another writer. */
export async function startConversation(otherUserId: string): Promise<string> {
  const { data, error } = await supabase.rpc('get_or_create_dm', { other_user: otherUserId });
  if (error) throw error;
  return data as string;
}

/* ═══════════════════════ reading rooms ══════════════════════════ */

export async function fetchRooms(): Promise<Room[]> {
  const { data, error } = await supabase
    .from('rooms')
    .select('*, host:profiles!rooms_host_id_fkey(*), room_participants(count)')
    .order('is_live', { ascending: false })
    .order('started_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(r => ({
    ...(r as unknown as Room),
    participant_count: ((r as { room_participants: CountAgg }).room_participants?.[0]?.count ?? 0),
  }));
}

export async function fetchRoomParticipants(roomId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('room_participants')
    .select('profile:profiles(*)')
    .eq('room_id', roomId);
  if (error) throw error;
  return (data ?? [])
    .map(r => (r as unknown as { profile: Profile }).profile)
    .filter(Boolean);
}

export async function createRoom(
  hostId: string, title: string, description: string, articleId?: string,
): Promise<Room> {
  const { data, error } = await supabase
    .from('rooms')
    .insert({ host_id: hostId, title, description, article_id: articleId ?? null })
    .select()
    .single();
  if (error) throw error;
  const room = data as unknown as Room;
  await joinRoom(room.id, hostId);
  return room;
}

export async function joinRoom(roomId: string, userId: string) {
  const { error } = await supabase.from('room_participants').upsert({ room_id: roomId, user_id: userId });
  if (error) throw error;
}

export async function leaveRoom(roomId: string, userId: string) {
  const { error } = await supabase
    .from('room_participants')
    .delete()
    .match({ room_id: roomId, user_id: userId });
  if (error) throw error;
}

export async function endRoom(roomId: string) {
  const { error } = await supabase.from('rooms').update({ is_live: false }).eq('id', roomId);
  if (error) throw error;
}

export async function fetchRoomMessages(roomId: string): Promise<RoomMessage[]> {
  const { data, error } = await supabase
    .from('room_messages')
    .select('*, author:profiles!room_messages_user_id_fkey(*)')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as RoomMessage[];
}

export async function sendRoomMessage(
  roomId: string, userId: string, body: string | null, emoji: string | null = null,
) {
  const { data, error } = await supabase
    .from('room_messages')
    .insert({ room_id: roomId, user_id: userId, body, emoji })
    .select('*, author:profiles!room_messages_user_id_fkey(*)')
    .single();
  if (error) throw error;
  return data as unknown as RoomMessage;
}

/* ══════════════════════ notifications ═══════════════════════════ */

export async function fetchNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*, actor:profiles!notifications_actor_id_fkey(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as unknown as Notification[];
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
  if (error) throw error;
}

export async function markAllNotificationsRead(userId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);
  if (error) throw error;
}

/** Fire-and-forget: tell someone something happened. Never throws. */
export async function notify(
  userId: string, actorId: string, type: string, title: string, action?: string, targetId?: string,
) {
  if (userId === actorId) return;
  await supabase
    .from('notifications')
    .insert({ user_id: userId, actor_id: actorId, type, title, action: action ?? null, target_id: targetId ?? null })
    .then(({ error }) => {
      if (error) console.warn('[TH-INK] notification not delivered', error.message);
    });
}

/* ════════════════════════ follows ═══════════════════════════════ */

export async function fetchFollowing(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase.from('follows').select('following_id').eq('follower_id', userId);
  if (error) throw error;
  return new Set((data ?? []).map(r => (r as { following_id: string }).following_id));
}

export async function toggleFollow(followerId: string, followingId: string, following: boolean) {
  if (following) {
    const { error } = await supabase
      .from('follows')
      .delete()
      .match({ follower_id: followerId, following_id: followingId });
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('follows')
      .insert({ follower_id: followerId, following_id: followingId });
    if (error) throw error;
  }
}

export async function fetchFollowCounts(userId: string) {
  const [{ count: followers }, { count: following }] = await Promise.all([
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
  ]);
  return { followers: followers ?? 0, following: following ?? 0 };
}

/* ════════════════════════ profiles ══════════════════════════════ */

export async function fetchProfiles(limit = 50): Promise<Profile[]> {
  const { data, error } = await supabase.from('profiles').select('*').limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as Profile[];
}

export async function fetchProfileByHandle(handle: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('handle', handle).maybeSingle();
  if (error) throw error;
  return (data as Profile | null) ?? null;
}

/* ════════════════════════ search ════════════════════════════════ */

export type SearchResults = {
  articles: ArticleWithAuthor[];
  authors: Profile[];
  topics: { name: string; count: number }[];
};

export async function search(q: string): Promise<SearchResults> {
  const term = q.trim();
  if (!term) return { articles: [], authors: [], topics: [] };
  const like = `%${term}%`;

  const [{ data: articles }, { data: authors }, { data: tags }] = await Promise.all([
    supabase
      .from('articles')
      .select(ARTICLE_SELECT)
      .eq('status', 'published')
      .or(`title.ilike.${like},subtitle.ilike.${like},body.ilike.${like}`)
      .limit(20),
    supabase
      .from('profiles')
      .select('*')
      .or(`name.ilike.${like},handle.ilike.${like},bio.ilike.${like}`)
      .limit(10),
    supabase.from('articles').select('tag').eq('status', 'published').ilike('tag', like).limit(50),
  ]);

  const counts = new Map<string, number>();
  for (const r of tags ?? []) {
    const t = (r as { tag: string }).tag;
    if (t) counts.set(t, (counts.get(t) ?? 0) + 1);
  }

  return {
    articles: (articles ?? []).map(shapeArticle),
    authors: (authors ?? []) as unknown as Profile[],
    topics: [...counts.entries()].map(([name, count]) => ({ name, count })),
  };
}

/** Every distinct tag with a count — powers the Discover topic rail. */
export async function fetchTopics(): Promise<{ name: string; count: number }[]> {
  const { data, error } = await supabase.from('articles').select('tag').eq('status', 'published');
  if (error) throw error;
  const counts = new Map<string, number>();
  for (const r of data ?? []) {
    const t = (r as { tag: string }).tag;
    if (t) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

/* ═══════════════════════ time capsules ══════════════════════════ */

export async function fetchCapsules(userId: string): Promise<TimeCapsule[]> {
  const { data, error } = await supabase
    .from('time_capsules')
    .select('*')
    .eq('user_id', userId)
    .order('deliver_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as TimeCapsule[];
}

export async function createCapsule(userId: string, title: string, body: string, deliverAt: string) {
  const { data, error } = await supabase
    .from('time_capsules')
    .insert({ user_id: userId, title, body, deliver_at: deliverAt })
    .select()
    .single();
  if (error) throw error;
  return data as unknown as TimeCapsule;
}

export async function deleteCapsule(id: string) {
  const { error } = await supabase.from('time_capsules').delete().eq('id', id);
  if (error) throw error;
}

/* ══════════════════ insights & writing DNA ══════════════════════ */

export async function fetchSessions(userId: string, days = 90): Promise<WritingSession[]> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('writing_sessions')
    .select('*')
    .eq('user_id', userId)
    .gte('day', since)
    .order('day', { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as WritingSession[];
}

export async function recordWriting(userId: string, words: number, minutes: number) {
  const day = new Date().toISOString().slice(0, 10);
  const { error } = await supabase
    .from('writing_sessions')
    .upsert({ user_id: userId, day, words, minutes }, { onConflict: 'user_id,day' });
  if (error) console.warn('[TH-INK] could not record writing session', error.message);
}

export async function fetchDna(userId: string): Promise<WritingDna | null> {
  const { data, error } = await supabase
    .from('writing_dna')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as WritingDna) ?? null;
}

/* ═══════════════════════ AI conversations ═══════════════════════ */

export async function fetchOrCreateAiConversation(userId: string): Promise<string> {
  const { data } = await supabase
    .from('ai_conversations')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (data) return (data as { id: string }).id;

  const { data: created, error } = await supabase
    .from('ai_conversations')
    .insert({ user_id: userId, title: 'Writing assistant' })
    .select('id')
    .single();
  if (error) throw error;
  return (created as { id: string }).id;
}

export async function fetchAiMessages(conversationId: string) {
  const { data, error } = await supabase
    .from('ai_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as { id: string; role: 'user' | 'model'; content: string; created_at: string }[];
}

export async function saveAiMessage(conversationId: string, role: 'user' | 'model', content: string) {
  const { error } = await supabase
    .from('ai_messages')
    .insert({ conversation_id: conversationId, role, content });
  if (error) console.warn('[TH-INK] could not persist AI message', error.message);
}
