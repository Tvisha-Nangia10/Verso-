import { useCallback, useEffect, useState } from 'react';
import ArticleCard from '../components/ArticleCard';
import {
  createCollection, deleteCollection, fetchCollectionArticles, fetchCollections,
} from '../lib/api';
import type { ArticleWithAuthor, Collection } from '../lib/database.types';
import { timeAgo } from '../lib/pages';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

type Props = { onOpenArticle: (id: string) => void };

const THUMBS = [
  'linear-gradient(135deg,#1a0f20,#2a1438)',
  'linear-gradient(135deg,#0f1a1a,#1a2e28)',
  'linear-gradient(135deg,#1e1810,#3a2518)',
  'linear-gradient(135deg,#181010,#2a1010)',
];

export default function CollectionsPage({ onOpenArticle }: Props) {
  const { profile } = useAuth();
  const toast = useToast();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [open, setOpen] = useState<Collection | null>(null);
  const [items, setItems] = useState<ArticleWithAuthor[]>([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const load = useCallback(async () => {
    if (!profile) return;
    try {
      setCollections(await fetchCollections(profile.id));
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not load collections', 'error');
    }
  }, [profile, toast]);

  useEffect(() => { void load(); }, [load]);

  async function openCollection(c: Collection) {
    setOpen(c);
    try {
      setItems(await fetchCollectionArticles(c.id));
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not open that collection', 'error');
    }
  }

  async function submit() {
    if (!profile || !name.trim()) return toast('Give the collection a name', 'error');
    try {
      await createCollection(profile.id, name.trim(), description.trim());
      setCreating(false);
      setName('');
      setDescription('');
      await load();
      toast('Collection created', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not create that collection', 'error');
    }
  }

  async function remove(c: Collection) {
    try {
      await deleteCollection(c.id);
      setOpen(null);
      await load();
      toast(`"${c.name}" deleted`, 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not delete it', 'error');
    }
  }

  if (open) {
    return (
      <div className="page active">
        <div style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          marginBottom: '20px', paddingBottom: '18px', borderBottom: '1px solid var(--cream-3)',
        }}>
          <div>
            <span className="sec-link" onClick={() => setOpen(null)}>← All collections</span>
            <h1 className="serif-h" style={{ fontSize: '28px', marginTop: '8px' }}>{open.name}</h1>
            <p style={{ fontFamily: 'var(--sans)', fontSize: '13px', color: 'var(--ink-3)', marginTop: '4px' }}>
              {open.description || 'No description'} · {items.length} piece{items.length === 1 ? '' : 's'}
            </p>
          </div>
          <button className="btn-tb-ghost" style={{ fontSize: '12.5px' }} onClick={() => void remove(open)}>
            Delete collection
          </button>
        </div>

        <div className="card-grid">
          {items.map(a => <ArticleCard key={a.id} article={a} onOpen={onOpenArticle} />)}
        </div>
        {items.length === 0 && (
          <div style={{ fontFamily: 'var(--sans)', fontSize: '13px', opacity: 0.55 }}>
            Nothing here yet. Add pieces from an article's Save menu.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="page active" id="page-collections">
      <div style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        marginBottom: '20px', paddingBottom: '18px', borderBottom: '1px solid var(--cream-3)',
      }}>
        <h1 className="serif-h" style={{ fontSize: '28px' }}>Your <em>Collections</em></h1>
        <button className="btn-tb-solid" style={{ fontSize: '12.5px' }} onClick={() => setCreating(true)}>
          New collection
        </button>
      </div>

      {creating && (
        <div style={{
          background: 'var(--cream-2)', border: '1px solid var(--cream-3)', borderRadius: '12px',
          padding: '18px', marginBottom: '20px', display: 'grid', gap: '10px', maxWidth: '520px',
        }}>
          <input
            className="field-input"
            placeholder="Collection name"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') void submit(); }}
            autoFocus
          />
          <input
            className="field-input"
            placeholder="What is it for? (optional)"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-tb-solid" style={{ fontSize: '12.5px' }} onClick={() => void submit()}>Create</button>
            <button className="btn-tb-ghost" style={{ fontSize: '12.5px' }} onClick={() => setCreating(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="col-grid">
        {collections.map(c => (
          <div className="col-card" key={c.id} onClick={() => void openCollection(c)}>
            <div className="col-cover">
              {THUMBS.map((t, i) => <div className="col-thumb" key={i} style={{ background: t }} />)}
            </div>
            <div className="col-body">
              <div className="col-title">{c.name}</div>
              <div className="col-meta">
                {c.item_count ?? 0} article{c.item_count === 1 ? '' : 's'} · Created {timeAgo(c.created_at)}
                {!c.is_public && ' · Private'}
              </div>
            </div>
          </div>
        ))}

        <div className="col-new" onClick={() => setCreating(true)}>
          <div className="col-new-icon">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M8 3v10M3 8h10" />
            </svg>
          </div>
          <div className="col-new-label">New collection</div>
        </div>
      </div>
    </div>
  );
}
