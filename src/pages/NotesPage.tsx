import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { deleteNote, fetchNotes, upsertNote } from '../lib/api';
import type { Note } from '../lib/database.types';
import { countWords, timeAgo } from '../lib/pages';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function NotesPage() {
  const { profile } = useAuth();
  const toast = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef<number | undefined>(undefined);

  const active = notes.find(n => n.id === activeId) ?? null;

  const load = useCallback(async () => {
    if (!profile) return;
    try {
      const rows = await fetchNotes(profile.id);
      setNotes(rows);
      if (rows.length && !activeId) {
        setActiveId(rows[0].id);
        setTitle(rows[0].title);
        setBody(rows[0].body);
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not load your notes', 'error');
    }
    // activeId intentionally omitted: we only auto-select on first load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, toast]);

  useEffect(() => { void load(); }, [load]);

  function select(n: Note) {
    flush();
    setActiveId(n.id);
    setTitle(n.title);
    setBody(n.body);
  }

  const persist = useCallback(
    async (t: string, b: string) => {
      if (!profile || !activeId) return;
      setSaving(true);
      try {
        const saved = await upsertNote({ id: activeId, user_id: profile.id, title: t, body: b });
        setNotes(prev => prev.map(n => (n.id === saved.id ? saved : n)));
      } catch (err) {
        toast(err instanceof Error ? err.message : 'Note not saved', 'error');
      } finally {
        setSaving(false);
      }
    },
    [profile, activeId, toast],
  );

  /** Debounced autosave — the note saves itself a second after you stop typing. */
  function queueSave(t: string, b: string) {
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => void persist(t, b), 900);
  }

  function flush() {
    window.clearTimeout(saveTimer.current);
  }

  useEffect(() => () => window.clearTimeout(saveTimer.current), []);

  async function newNote() {
    if (!profile) return;
    try {
      const n = await upsertNote({ user_id: profile.id, title: 'Untitled note', body: '' });
      setNotes(prev => [n, ...prev]);
      setActiveId(n.id);
      setTitle(n.title);
      setBody(n.body);
      toast('New note', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not create a note', 'error');
    }
  }

  async function remove() {
    if (!active) return;
    try {
      await deleteNote(active.id);
      const rest = notes.filter(n => n.id !== active.id);
      setNotes(rest);
      setActiveId(rest[0]?.id ?? null);
      setTitle(rest[0]?.title ?? '');
      setBody(rest[0]?.body ?? '');
      toast('Note deleted', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not delete it', 'error');
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter(n => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q));
  }, [notes, query]);

  return (
    <div className="page active" id="page-notes">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '18px' }}>
        <h1 className="serif-h" style={{ fontSize: '28px' }}>Your <em>Notes</em></h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          {active && (
            <button className="btn-tb-ghost" style={{ fontSize: '12.5px' }} onClick={() => void remove()}>
              Delete
            </button>
          )}
          <button className="btn-tb-solid" style={{ fontSize: '12.5px' }} onClick={() => void newNote()}>
            New note
          </button>
        </div>
      </div>

      <div className="notes-layout" style={{ height: 'calc(100vh - 160px)' }}>
        <div className="notes-list">
          <div className="notes-search">
            <input
              type="text"
              placeholder="Search notes…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>

          {filtered.map(n => (
            <div
              className={`note-item${n.id === activeId ? ' active' : ''}`}
              key={n.id}
              onClick={() => select(n)}
            >
              <div className="ni-title">{n.title || 'Untitled note'}</div>
              <div className="ni-preview">{n.body.slice(0, 90) || 'Empty note'}</div>
              <div className="ni-meta">{timeAgo(n.updated_at)} · {countWords(n.body)} words</div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div style={{ padding: '18px', fontFamily: 'var(--sans)', fontSize: '12px', opacity: 0.55 }}>
              {query ? 'No notes match that.' : 'No notes yet — start one.'}
            </div>
          )}
        </div>

        <div className="note-editor">
          {active ? (
            <>
              <textarea
                className="ne-title"
                id="noteTitle"
                rows={1}
                value={title}
                onChange={e => { setTitle(e.target.value); queueSave(e.target.value, body); }}
                onBlur={() => { flush(); void persist(title, body); }}
              />
              <div className="ne-meta" id="noteMeta">
                {timeAgo(active.updated_at)} · {countWords(body)} words · Private
                {saving && ' · Saving…'}
              </div>
              <textarea
                className="ne-body"
                id="noteBody"
                value={body}
                onChange={e => { setBody(e.target.value); queueSave(title, e.target.value); }}
                onBlur={() => { flush(); void persist(title, body); }}
              />
            </>
          ) : (
            <div style={{ padding: '40px', fontFamily: 'var(--sans)', fontSize: '13px', opacity: 0.55 }}>
              Select a note, or start a new one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
