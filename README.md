# TH-INK

> Think deeply. Write honestly.

A quiet place on the internet for people who believe writing is still one of the
most human things we do — reading rooms, annotations, writing DNA, time capsules,
and an AI writing assistant that talks like an editor rather than a chatbot.

This is a **React + TypeScript + Vite** application backed by **Supabase**
(Postgres, Auth, Realtime, RLS) with **Google Gemini** powering the writing
assistant. It is a full conversion of the original single-file HTML prototype,
which is archived at [`reference/verso_search_original.html`](reference/verso_search_original.html)
for comparison — the CSS is carried over verbatim so the design is unchanged.

---

## Quick start

```bash
npm install
cp .env.example .env    # then fill it in — see below
npm run dev             # http://localhost:5173
```

### 1. Environment

Create `.env` in the project root:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_…
VITE_GEMINI_API_KEY=…
VITE_GEMINI_MODEL=gemini-2.0-flash
```

- **Supabase URL / publishable key** — Supabase dashboard → Project Settings →
  API Keys. The older `anon` key also works; the app accepts either.
- **Gemini key** — <https://aistudio.google.com/apikey>. Without it the app runs
  fine; only the writing assistant is disabled.

> ⚠️ Anything prefixed `VITE_` is compiled into the browser bundle and is
> **public**. Never put the Supabase *secret* key (`sb_secret_…`) in `.env`.
> For production, deploy the Edge Function described below so the Gemini key
> stays server-side too.

### 2. Database

In the Supabase dashboard → **SQL Editor**, run these two files in order:

1. [`supabase/schema.sql`](supabase/schema.sql) — tables, RLS policies, the
   new-user trigger, realtime publication, and helper functions.
2. [`supabase/seed.sql`](supabase/seed.sql) — seven demo writers with articles,
   conversations, rooms, collections, notes, notifications and 90 days of
   writing history.

Both are re-runnable: the seed deletes its own rows before reinserting.

**Demo accounts** (all share the password `think1234`):

| Email | Writer |
|---|---|
| `sarah@think.app` | Sarah Chen — the fullest account, start here |
| `marcus@think.app` | Marcus Reid |
| `lena@think.app` | Lena Torres |
| `aisha@think.app` | Aisha Patel |
| `james@think.app` | James Wu |
| `david@think.app` | David Kim |
| `sophie@think.app` | Sophie Clark |

### 3. Google sign-in

Supabase dashboard → **Authentication → Providers → Google**:

1. Create an OAuth client in the
   [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   (type: *Web application*).
2. Add the redirect URI Supabase shows you:
   `https://<project-ref>.supabase.co/auth/v1/callback`
3. Paste the client ID and secret into Supabase and enable the provider.
4. Under **Authentication → URL Configuration**, add `http://localhost:5173`
   to the redirect allow-list.

New Google users get a profile automatically — the `handle_new_user` trigger in
`schema.sql` creates one from their Google display name and avatar.

---

## What works

Everything is backed by real Postgres tables, not mock data.

| Feature | Backed by |
|---|---|
| Email + password and **Google** auth | Supabase Auth, `profiles` trigger |
| Home feed, Discover, topic filters | `articles`, `likes`, `bookmarks` |
| Full article reader | likes, bookmarks, follows, comments, share links |
| Text selection → **annotations** | `annotations` |
| **Messages** with live delivery | `conversations`, `messages`, Realtime |
| **Reading Rooms** — join, chat, react live | `rooms`, `room_messages`, Realtime |
| **Notifications** with live toasts | `notifications`, Realtime |
| Writing editor — autosave, highlights, fonts | `articles` (draft → published) |
| **AI writing assistant** (streaming) | Google Gemini, history in `ai_messages` |
| Collections, Notes, Bookmarks | `collections`, `notes`, `bookmarks` |
| Writing DNA, Craft Insights | `writing_dna`, `writing_sessions` |
| Time Capsule with live countdown | `time_capsules` |
| Global search (⌘K) | Postgres `ilike` across articles, authors, tags |
| Settings — profile, prefs, privacy | `profiles.prefs` (JSONB) |

---

## Project layout

```
src/
  components/      Sidebar, ChatPanel, SearchOverlay, ArticleReader, AiPanel…
  context/         AuthContext (session + profile), ToastContext
  lib/
    supabase.ts    client
    api.ts         every query in one place
    gemini.ts      AI assistant (direct or via Edge Function)
    database.types.ts
    taxonomy.ts    the genre/form/theme/tone taxonomy
  pages/           one file per screen
  styles/global.css   carried over verbatim from the prototype
  views/           Cover, Login, Signup, AppView (shell)
supabase/
  schema.sql       tables, RLS, triggers, realtime
  seed.sql         demo data
  functions/gemini-chat/   optional server-side Gemini proxy
reference/
  verso_search_original.html   the original prototype, archived
```

---

## Optional: keep the Gemini key off the client

```bash
supabase functions deploy gemini-chat
supabase secrets set GEMINI_API_KEY=your-key
```

Then in `.env`, replace `VITE_GEMINI_API_KEY` with:

```env
VITE_GEMINI_PROXY_URL=https://<project-ref>.supabase.co/functions/v1/gemini-chat
```

The client detects the proxy and routes through it instead.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on <http://localhost:5173> |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Serve the production build on 5173 |
| `npm run lint` | ESLint |
