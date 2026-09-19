/**
 * Hand-maintained row types for the TH-INK schema.
 * Regenerate with:  supabase gen types typescript --project-id <ref> > src/lib/database.types.ts
 */

export type Profile = {
  id: string;
  handle: string;
  name: string;
  bio: string;
  initials: string;
  avatar_bg: string;
  avatar_color: string;
  avatar_url: string | null;
  accent: string;
  location: string;
  website: string;
  topics: string[];
  prefs: Prefs;
  craft_score: number;
  streak_days: number;
  created_at: string;
};

export type Prefs = {
  notifications?: Record<string, boolean>;
  theme?: string;
  accent?: string;
  accentHex?: string;
  font?: string;
  fontSize?: number;
  lineHeight?: number;
  autosave?: boolean;
  spellcheck?: boolean;
  reduceMotion?: boolean;
  publicProfile?: boolean;
  discoverable?: boolean;
  openDMs?: boolean;
  showActivity?: boolean;
  /** Anything else the UI stores on the profile. */
  [key: string]: unknown;
};

export type Article = {
  id: string;
  author_id: string;
  title: string;
  subtitle: string;
  body: string;
  tag: string;
  genre: string | null;
  form: string | null;
  theme: string | null;
  tone: string | null;
  cover_grad: string;
  cover_accent: string;
  read_time: string;
  word_count: number;
  status: 'draft' | 'published';
  audience: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

/** An article joined with its author and engagement counts. */
export type ArticleWithAuthor = Article & {
  author: Profile;
  likes: number;
  comments: number;
  bookmarks: number;
  liked_by_me?: boolean;
  bookmarked_by_me?: boolean;
};

export type Comment = {
  id: string;
  article_id: string;
  user_id: string;
  parent_id: string | null;
  body: string;
  created_at: string;
  author?: Profile;
};

export type Collection = {
  id: string;
  user_id: string;
  name: string;
  description: string;
  color: string;
  is_public: boolean;
  created_at: string;
  item_count?: number;
};

export type Note = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  color: string;
  created_at: string;
  updated_at: string;
};

export type Annotation = {
  id: string;
  user_id: string;
  article_id: string | null;
  quote: string;
  note: string;
  color: string;
  created_at: string;
};

export type Conversation = {
  id: string;
  created_at: string;
};

export type ConversationSummary = {
  id: string;
  other: Profile;
  last_message: string;
  last_at: string;
  unread: number;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export type Room = {
  id: string;
  host_id: string;
  article_id: string | null;
  title: string;
  description: string;
  is_live: boolean;
  started_at: string;
  host?: Profile;
  participant_count?: number;
  participants?: Profile[];
};

export type RoomMessage = {
  id: string;
  room_id: string;
  user_id: string;
  body: string | null;
  emoji: string | null;
  created_at: string;
  author?: Profile;
};

export type Notification = {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: string;
  title: string;
  body: string;
  action: string | null;
  target_id: string | null;
  read: boolean;
  created_at: string;
  actor?: Profile | null;
};

export type TimeCapsule = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  deliver_at: string;
  delivered: boolean;
  created_at: string;
};

export type WritingSession = {
  id: string;
  user_id: string;
  day: string;
  words: number;
  minutes: number;
};

export type Trait = { name: string; value: number; color: string };
export type SignatureWord = { w: string; size: number; c: string };
export type Influence = { name: string; match: number };
export type Rhythm = {
  avgSentence: number;
  avgParagraph: number;
  varianceScore: number;
  readingLevel: string;
};

export type WritingDna = {
  user_id: string;
  craft_score: number;
  traits: Trait[];
  signature_words: SignatureWord[];
  influences: Influence[];
  rhythm: Rhythm;
  updated_at: string;
};

export type AiConversation = {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
};

export type AiMessage = {
  id: string;
  conversation_id: string;
  role: 'user' | 'model';
  content: string;
  created_at: string;
};

