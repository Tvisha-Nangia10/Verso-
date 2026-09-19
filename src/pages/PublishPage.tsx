import { useCallback, useEffect, useRef, useState } from 'react';
import AiPanel from '../components/AiPanel';
import { fetchArticlesByAuthor, publishArticle, recordWriting, saveDraft } from '../lib/api';
import type { Article, ArticleWithAuthor } from '../lib/database.types';
import { META_COLORS, META_LABELS, META_TAXONOMY, type MetaGroup } from '../lib/taxonomy';
import { countWords, timeAgo } from '../lib/pages';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

type Props = {
  /** When set, the editor opens straight onto this piece. */
  editing: ArticleWithAuthor | null;
  onEditingConsumed: () => void;
  onPublished: (id: string) => void;
};

const FONT_MAP: Record<string, string> = {
  playfair: "'Playfair Display', serif",
  lora: "'Lora', serif",
  merriweather: "'Merriweather', serif",
  'garamond-eb': "'EB Garamond', serif",
  cormorant: "'Cormorant Garamond', serif",
  'libre-baskerville': "'Libre Baskerville', serif",
  crimson: "'Crimson Pro', serif",
  'source-serif': "'Source Serif 4', serif",
  'dm-sans': "'DM Sans', sans-serif",
  inter: "'Inter', sans-serif",
  nunito: "'Nunito', sans-serif",
  josefin: "'Josefin Sans', sans-serif",
  raleway: "'Raleway', sans-serif",
  karla: "'Karla', sans-serif",
  'ibm-plex': "'IBM Plex Sans', sans-serif",
  'work-sans': "'Work Sans', sans-serif",
  'space-mono': "'Space Mono', monospace",
  'fira-code': "'Fira Code', monospace",
  jetbrains: "'JetBrains Mono', monospace",
  courier: "'Courier Prime', monospace",
};

const FONT_GROUPS: { label: string; options: [string, string][] }[] = [
  { label: '✦ Serif', options: [
    ['playfair', 'Playfair Display'], ['lora', 'Lora'], ['merriweather', 'Merriweather'],
    ['garamond-eb', 'EB Garamond'], ['cormorant', 'Cormorant Garamond'],
    ['libre-baskerville', 'Libre Baskerville'], ['crimson', 'Crimson Pro'], ['source-serif', 'Source Serif 4'],
  ] },
  { label: '✦ Sans-Serif', options: [
    ['dm-sans', 'DM Sans'], ['inter', 'Inter'], ['nunito', 'Nunito'], ['josefin', 'Josefin Sans'],
    ['raleway', 'Raleway'], ['karla', 'Karla'], ['ibm-plex', 'IBM Plex Sans'], ['work-sans', 'Work Sans'],
  ] },
  { label: '✦ Monospace', options: [
    ['space-mono', 'Space Mono'], ['fira-code', 'Fira Code'],
    ['jetbrains', 'JetBrains Mono'], ['courier', 'Courier Prime'],
  ] },
];

const HL_TABS: { id: string; label: string; swatches: [string, string][] }[] = [
  { id: 'pastel', label: 'Pastel', swatches: [
    ['pastel-yellow', '#fff9c2'], ['pastel-pink', '#ffd6e0'], ['pastel-mint', '#c8f5e0'],
    ['pastel-sky', '#bde4ff'], ['pastel-lavender', '#e0d4ff'], ['pastel-peach', '#ffe5cc'],
  ] },
  { id: 'normal', label: 'Classic', swatches: [
    ['amber', '#c8620a'], ['rose', '#c93050'], ['sage', '#2d8c58'],
    ['sky', '#2470b8'], ['lav', '#6448b0'], ['gold', '#d4af37'],
  ] },
  { id: 'glow', label: '✨ Glow', swatches: [
    ['glow-amber', '#ffa01e'], ['glow-rose', '#ff3c64'], ['glow-cyan', '#1edcdc'],
    ['glow-lime', '#78e650'], ['glow-violet', '#a050ff'], ['glow-blue', '#3c78ff'],
  ] },
];

const TODAYS_PROMPT = 'Write about a moment when silence said more than words ever could.';

export default function PublishPage({ editing, onEditingConsumed, onPublished }: Props) {
  const { profile } = useAuth();
  const toast = useToast();

  const [mode, setMode] = useState<'landing' | 'editor'>('landing');
  const [drafts, setDrafts] = useState<ArticleWithAuthor[]>([]);
  const [pendingTitle, setPendingTitle] = useState('');
  const [meta, setMeta] = useState<Record<MetaGroup, string | null>>({
    genre: null, form: null, theme: null, tone: null,
  });
  const [metaTab, setMetaTab] = useState<MetaGroup>('genre');

  // Editor state
  const [article, setArticle] = useState<Partial<Article> | null>(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [words, setWords] = useState(0);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  // Editor chrome
  const [configOpen, setConfigOpen] = useState(false);
  const [cfgTab, setCfgTab] = useState<'settings' | 'markup' | 'content'>('settings');
  const [font, setFont] = useState('playfair');
  const [fontSize, setFontSize] = useState(18);
  const [lineHeight, setLineHeight] = useState(190);
  const [preview, setPreview] = useState(false);

  // Selection toolbar
  const [selRect, setSelRect] = useState<{ x: number; y: number } | null>(null);
  const [hlTab, setHlTab] = useState('pastel');
  const [publishing, setPublishing] = useState(false);
  const [audience, setAudience] = useState('Everyone');

  const bodyRef = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);
  const askAi = useRef<((p: string) => void) | null>(null);
  const saveTimer = useRef<number | undefined>(undefined);

  const loadDrafts = useCallback(async () => {
    if (!profile) return;
    try {
      setDrafts(await fetchArticlesByAuthor(profile.id, 'draft'));
    } catch (err) {
      console.error(err);
    }
  }, [profile]);

  useEffect(() => { void loadDrafts(); }, [loadDrafts]);

  // Open straight into an existing piece when asked to.
  useEffect(() => {
    if (!editing) return;
    openEditor(editing);
    onEditingConsumed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  function openEditor(a: Partial<Article>) {
    setArticle(a);
    setTitle(a.title ?? '');
    setSubtitle(a.subtitle ?? '');
    setMode('editor');
    setWords(countWords(a.body ?? ''));
    window.setTimeout(() => {
      if (bodyRef.current) bodyRef.current.innerHTML = a.body || '';
    }, 0);
  }

  function startWriting(overrideTitle?: string) {
    openEditor({
      title: overrideTitle ?? pendingTitle ?? '',
      subtitle: '',
      body: '',
      status: 'draft',
      genre: meta.genre,
      form: meta.form,
      theme: meta.theme,
      tone: meta.tone,
      tag: meta.theme ?? meta.genre ?? 'Essays',
    });
  }

  const persist = useCallback(
    async (opts: { silent?: boolean } = {}) => {
      if (!profile) return null;
      const body = bodyRef.current?.innerHTML ?? '';
      setSaving(true);
      try {
        const saved = await saveDraft({
          ...article,
          id: article?.id,
          author_id: profile.id,
          title: title.trim() || 'Untitled',
          subtitle,
          body,
        });
        setArticle(saved);
        setSavedAt(new Date());
        void recordWriting(profile.id, countWords(body), Math.max(1, Math.round(countWords(body) / 28)));
        if (!opts.silent) toast('Draft saved', 'success');
        return saved;
      } catch (err) {
        toast(err instanceof Error ? err.message : 'Could not save the draft', 'error');
        return null;
      } finally {
        setSaving(false);
      }
    },
    [profile, article, title, subtitle, toast],
  );

  /** Autosave a couple of seconds after typing stops. */
  function queueAutosave() {
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => void persist({ silent: true }), 2200);
  }

  useEffect(() => () => window.clearTimeout(saveTimer.current), []);

  function onInput() {
    setWords(countWords(bodyRef.current?.innerText ?? ''));
    queueAutosave();
  }

  function onMouseUp() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) { setSelRect(null); return; }
    if (!bodyRef.current?.contains(sel.anchorNode)) { setSelRect(null); return; }
    savedRange.current = sel.getRangeAt(0).cloneRange();
    const r = sel.getRangeAt(0).getBoundingClientRect();
    setSelRect({ x: r.left + r.width / 2, y: r.top - 10 });
  }

  function applyHighlight(key: string) {
    const range = savedRange.current;
    if (!range) return;
    const span = document.createElement('span');
    span.className = `hl-${key}`;
    try {
      span.appendChild(range.extractContents());
      range.insertNode(span);
    } catch {
      toast('Try selecting within a single paragraph', 'error');
      return;
    }
    window.getSelection()?.removeAllRanges();
    setSelRect(null);
    onInput();
  }

  function clearHighlight() {
    const range = savedRange.current;
    if (!range || !bodyRef.current) return;
    const frag = range.cloneContents();
    if (frag.querySelector('[class^="hl-"]') || (range.commonAncestorContainer.parentElement?.className ?? '').startsWith('hl-')) {
      const el = range.commonAncestorContainer.parentElement;
      if (el && el.className.startsWith('hl-')) {
        el.replaceWith(...Array.from(el.childNodes));
      }
    }
    window.getSelection()?.removeAllRanges();
    setSelRect(null);
    onInput();
  }

  function selectedText() {
    return savedRange.current?.toString() ?? '';
  }

  async function doPublish() {
    const saved = await persist({ silent: true });
    if (!saved) return;
    try {
      await publishArticle(saved.id, audience.toLowerCase());
      setPublishing(false);
      toast('Published ✦ Your piece is live.', 'success', 4000);
      await loadDrafts();
      onPublished(saved.id);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not publish', 'error');
    }
  }

  async function copyMarkdown() {
    const text = bodyRef.current?.innerText ?? '';
    try {
      await navigator.clipboard.writeText(`# ${title}\n\n${text}`);
      toast('Copied as Markdown', 'success');
    } catch {
      toast('Could not access the clipboard', 'error');
    }
  }

  /* ─────────────────────────── LANDING ─────────────────────────── */
  if (mode === 'landing') {
    const picks = (Object.entries(meta) as [MetaGroup, string | null][]).filter(([, v]) => v);

    return (
      <div className="page active" id="page-publish" style={{ padding: 0, height: '100%', overflow: 'auto' }}>
        <div className="pub-landing" id="pubLanding" style={{ display: 'flex' }}>
          <div className="pub-landing-inner">
            <div className="pli-hero">
              <div className="pli-hero-left">
                <div className="pli-icon">✍️</div>
                <h2 className="pli-title">What will you write today?</h2>
                <p className="pli-sub">
                  Give your piece a title, set the genre, form, theme and tone below — then start writing.
                </p>
                <div className="pli-input-wrap">
                  <input
                    className="pli-input"
                    id="pliInput"
                    type="text"
                    placeholder="Give your piece a title…"
                    value={pendingTitle}
                    onChange={e => setPendingTitle(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') startWriting(); }}
                  />
                  <button className="pli-start-btn" onClick={() => startWriting()}>Start →</button>
                </div>
              </div>

              <div className="pli-drafts-col">
                <div className="pli-drafts-lbl">Continue a draft</div>
                {drafts.map(d => (
                  <div className="pli-draft" key={d.id} onClick={() => openEditor(d)}>
                    <div className="pli-draft-icon" style={{ background: d.cover_grad }} />
                    <div className="pli-draft-body">
                      <div className="pli-draft-title">{d.title}</div>
                      <div className="pli-draft-meta">
                        Draft · {d.word_count} words · {timeAgo(d.updated_at)}
                      </div>
                    </div>
                    <div className="pli-draft-progress">
                      <div
                        className="pli-dp-fill"
                        style={{ width: `${Math.min(100, (d.word_count / 600) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
                {drafts.length === 0 && (
                  <div style={{ fontFamily: 'var(--sans)', fontSize: '12px', color: 'var(--ink-3)', padding: '8px 0' }}>
                    No drafts yet.
                  </div>
                )}

                <div className="pli-prompt-card">
                  <div className="pli-prompt-label">✦ Today's prompt</div>
                  <div className="pli-prompt-text">"{TODAYS_PROMPT}"</div>
                  <button className="pli-prompt-btn" onClick={() => startWriting('On Silence')}>
                    Write to this prompt →
                  </button>
                </div>
              </div>
            </div>

            <div style={{ height: '1px', background: 'var(--cream-3)', marginBottom: '36px', position: 'relative' }}>
              <span style={{
                position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
                background: 'var(--cream)', padding: '0 12px',
                fontFamily: 'var(--serif)', fontSize: '16px', color: 'var(--cream-3)',
              }}>
                ✦
              </span>
            </div>

            <div className="pli-meta-section">
              <h3 className="pli-section-title">Set your piece's identity</h3>
              <p className="pli-section-sub">
                Choose a genre, form, theme and tone. Your selections appear on the published piece and help
                readers find you.
              </p>

              {picks.length > 0 && (
                <div className="pli-selected-strip" id="selectedMeta">
                  <span className="pli-selected-label">Selected</span>
                  {picks.map(([g, v]) => (
                    <span
                      className={`meta-chip ${g}`}
                      key={g}
                      onClick={() => setMeta(m => ({ ...m, [g]: null }))}
                      style={{ cursor: 'pointer' }}
                      title="Remove"
                    >
                      {v} ✕
                    </span>
                  ))}
                </div>
              )}

              <div className="cfg-tabs" style={{ marginBottom: '14px' }}>
                {(Object.keys(META_LABELS) as MetaGroup[]).map(g => (
                  <button
                    className={`cfg-tab${metaTab === g ? ' active' : ''}`}
                    key={g}
                    onClick={() => setMetaTab(g)}
                  >
                    {META_LABELS[g]}
                  </button>
                ))}
              </div>

              <div className="pli-meta-col">
                <div className="pli-meta-col-label" style={{ color: META_COLORS[metaTab] }}>
                  {META_LABELS[metaTab]}
                </div>
                {META_TAXONOMY[metaTab].map(section => (
                  <div key={section.label || 'main'}>
                    {section.label && (
                      <div style={{
                        fontFamily: 'var(--sans)', fontSize: '9.5px', fontWeight: 700,
                        letterSpacing: '.09em', textTransform: 'uppercase', color: 'var(--ink-3)',
                        margin: '10px 0 7px',
                      }}>
                        {section.label}
                      </div>
                    )}
                    <div className="pli-meta-pills" style={{ marginBottom: '12px' }}>
                      {section.items.map(item => (
                        <span
                          className={`meta-pill${meta[metaTab] === item ? ' on' : ''}`}
                          key={item}
                          onClick={() =>
                            setMeta(m => ({ ...m, [metaTab]: m[metaTab] === item ? null : item }))
                          }
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pli-start-row" style={{ marginTop: '20px' }}>
                <button className="pli-start-btn" onClick={() => startWriting()}>
                  Start writing{picks.length ? ` — ${picks.map(([, v]) => v).join(' · ')}` : ''} →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─────────────────────────── EDITOR ──────────────────────────── */
  const goal = 600;

  return (
    <div className="page active" id="page-publish" style={{ padding: 0, height: '100%', overflow: 'hidden' }}>
      <div className="pub-shell" id="pubShell" style={{ display: 'flex' }}>
        <div className="pub-editor" style={{ position: 'relative' }}>
          <div className="pub-topbar">
            <button
              className="pub-tb-btn"
              onClick={() => { setMode('landing'); void loadDrafts(); }}
              title="Back"
            >
              ←
            </button>
            <div className="pub-chap-badge" id="pubChapBadge">
              {article?.status === 'published' ? 'PUBLISHED' : 'DRAFT'}
            </div>
            <div className="pub-prog-text" id="pubProgText">{words} / {goal}</div>
            {savedAt && (
              <span style={{ fontFamily: 'var(--sans)', fontSize: '10.5px', color: 'rgba(255,255,255,.35)' }}>
                {saving ? 'Saving…' : `Saved ${timeAgo(savedAt.toISOString())}`}
              </span>
            )}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '7px' }}>
              <button className="pub-tb-btn" onClick={() => setConfigOpen(v => !v)} title="Settings">⚙</button>
              <button className="pub-tb-btn" onClick={() => void persist()} title="Save">💾</button>
              <button className="pub-publish-btn" onClick={() => setPublishing(true)}>Publish ✦</button>
            </div>
          </div>

          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            <div className="pub-content" id="pubContent" style={{ flex: 1 }} onMouseUp={onMouseUp}>
              <input
                className="pub-art-title"
                id="pubTitle"
                type="text"
                placeholder="Title your piece…"
                value={title}
                onChange={e => { setTitle(e.target.value); queueAutosave(); }}
              />
              <input
                className="pub-art-sub"
                id="pubSub"
                type="text"
                placeholder="Add a subtitle or tagline…"
                value={subtitle}
                onChange={e => { setSubtitle(e.target.value); queueAutosave(); }}
              />
              <div className="pub-art-meta">
                {profile?.name} · {article?.form ?? meta.form ?? 'Essay'} ·{' '}
                {Math.max(1, Math.round(words / 200))} min read
                {(Object.entries(meta) as [MetaGroup, string | null][])
                  .filter(([, v]) => v)
                  .map(([g, v]) => (
                    <span className={`meta-chip ${g}`} key={g} style={{ fontSize: '10.5px', padding: '2px 8px', marginLeft: '6px' }}>
                      {v}
                    </span>
                  ))}
              </div>
              <div
                className="pub-art-body"
                id="artBody"
                ref={bodyRef}
                contentEditable={!preview}
                suppressContentEditableWarning
                spellCheck={profile?.prefs?.spellcheck !== false}
                data-ph="Begin writing — your words go here…"
                onInput={onInput}
                style={{
                  fontFamily: FONT_MAP[font],
                  fontSize: `${fontSize}px`,
                  lineHeight: (lineHeight / 100).toFixed(2),
                }}
              />
            </div>

            <AiPanel
              getContext={() => bodyRef.current?.innerText ?? ''}
              onReady={fn => { askAi.current = fn; }}
            />
          </div>

          {/* Selection toolbar */}
          {selRect && (
            <div
              className="sel-toolbar show"
              id="selToolbar"
              style={{
                position: 'fixed',
                left: selRect.x,
                top: Math.max(70, selRect.y),
                transform: 'translate(-50%,-100%)',
                zIndex: 400,
              }}
            >
              <div className="sel-tb-tabs">
                {HL_TABS.map(t => (
                  <button
                    className={`sel-tb-tab${hlTab === t.id ? ' active' : ''}`}
                    key={t.id}
                    onClick={() => setHlTab(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {HL_TABS.map(t => (
                <div
                  className={`sel-tb-panel${hlTab === t.id ? ' active' : ''}`}
                  key={t.id}
                  style={{ display: hlTab === t.id ? 'block' : 'none' }}
                >
                  <div className="sel-hl-grid">
                    {t.swatches.map(([key, hex]) => (
                      <button
                        className={`sel-hl-swatch${t.id === 'glow' ? ' glow-sw' : ''}`}
                        key={key}
                        style={{ background: hex, ['--sw-color' as string]: hex }}
                        onClick={() => applyHighlight(key)}
                        title={key}
                      />
                    ))}
                  </div>
                </div>
              ))}

              <div className="sel-tb-actions">
                <button
                  className="sel-btn"
                  onClick={() => {
                    void navigator.clipboard.writeText(selectedText());
                    toast('Copied to clipboard', 'success');
                    setSelRect(null);
                  }}
                >
                  Copy
                </button>
                <button
                  className="sel-btn"
                  onClick={() => {
                    const text = selectedText();
                    if (text && 'speechSynthesis' in window) {
                      const u = new SpeechSynthesisUtterance(text);
                      u.rate = 0.92;
                      speechSynthesis.speak(u);
                      toast('Reading aloud…', 'info');
                    }
                    setSelRect(null);
                  }}
                >
                  Read
                </button>
                <button
                  className="sel-btn"
                  onClick={() => {
                    const text = selectedText();
                    setSelRect(null);
                    if (text) {
                      askAi.current?.(
                        `Improve this passage — keep my meaning and voice, make it more precise and lyrical. Show me the rewrite:\n\n"${text}"`,
                      );
                    }
                  }}
                >
                  AI ✦
                </button>
                <button className="sel-btn" onClick={clearHighlight}>Clear</button>
              </div>
            </div>
          )}

          {/* Config panel */}
          <div className={`config-panel${configOpen ? ' open' : ''}`} id="configPanel">
            <div className="cfg-header">
              <span className="cfg-title">Editor</span>
              <button className="cfg-close" onClick={() => setConfigOpen(false)}>×</button>
            </div>
            <div className="cfg-tabs">
              {(['settings', 'markup', 'content'] as const).map(t => (
                <button
                  className={`cfg-tab${cfgTab === t ? ' active' : ''}`}
                  key={t}
                  onClick={() => setCfgTab(t)}
                >
                  {t[0].toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {cfgTab === 'settings' && (
              <div className="cfg-body-wrap">
                <div style={{ marginBottom: '14px' }}>
                  <span className="cfg-lbl">Font family</span>
                  <select className="cfg-select" value={font} onChange={e => setFont(e.target.value)}>
                    {FONT_GROUPS.map(g => (
                      <optgroup label={g.label} key={g.label}>
                        {g.options.map(([v, l]) => <option value={v} key={v}>{l}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <span className="cfg-lbl" style={{ display: 'block' }}>Font size — {fontSize}px</span>
                <input
                  type="range" className="cfg-range" min={14} max={24}
                  value={fontSize} onChange={e => setFontSize(Number(e.target.value))}
                />

                <span className="cfg-lbl" style={{ display: 'block' }}>Line height — {(lineHeight / 100).toFixed(2)}</span>
                <input
                  type="range" className="cfg-range" min={130} max={220}
                  value={lineHeight} onChange={e => setLineHeight(Number(e.target.value))}
                />

                <div className="cfg-row">
                  <span style={{ fontFamily: 'var(--sans)', fontSize: '13px', color: 'var(--ink-2)' }}>
                    Preview mode
                  </span>
                  <div className="toggle-wrap" onClick={() => setPreview(v => !v)}>
                    <div className={`toggle-track${preview ? ' on' : ''}`}><div className="toggle-knob" /></div>
                  </div>
                </div>
              </div>
            )}

            {cfgTab === 'markup' && (
              <div className="cfg-body-wrap">
                <div className="cfg-lbl" style={{ marginBottom: '10px' }}>Highlight colours</div>
                {HL_TABS.map(t => (
                  <div key={t.id} style={{ marginBottom: '12px' }}>
                    <div style={{
                      fontFamily: 'var(--sans)', fontSize: '9.5px', fontWeight: 700,
                      letterSpacing: '.1em', textTransform: 'uppercase',
                      color: 'var(--ink-3)', marginBottom: '6px',
                    }}>
                      {t.label}
                    </div>
                    <div style={{ display: 'flex', gap: '7px' }}>
                      {t.swatches.map(([key, hex]) => (
                        <button
                          className="cfg-hl-sw"
                          key={key}
                          onClick={() => applyHighlight(key)}
                          title={key}
                          style={{
                            width: '26px', height: '26px', borderRadius: '50%', background: hex,
                            border: '2px solid var(--cream-3)', cursor: 'pointer',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
                <p style={{ fontFamily: 'var(--sans)', fontSize: '11.5px', color: 'var(--ink-3)' }}>
                  Select text in the editor first, then pick a colour.
                </p>
              </div>
            )}

            {cfgTab === 'content' && (
              <div className="cfg-body-wrap">
                <button className="cfg-content-btn" onClick={() => window.print()}>Export as PDF</button>
                <button className="cfg-content-btn" onClick={() => void copyMarkdown()}>Copy as Markdown</button>
                <button
                  className="cfg-content-btn"
                  onClick={() => {
                    setConfigOpen(false);
                    askAi.current?.('Read what I have and propose an outline for where the rest of the piece should go.');
                  }}
                >
                  AI Outline Generator
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Publish modal */}
      {publishing && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9800, background: 'rgba(14,11,9,.4)',
            backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={e => { if (e.target === e.currentTarget) setPublishing(false); }}
        >
          <div style={{
            background: 'var(--white)', borderRadius: '16px', width: '460px',
            padding: '26px', boxShadow: '0 24px 80px rgba(14,11,9,.25)',
          }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: '21px', color: 'var(--ink)', marginBottom: '6px' }}>
              Publish "{title || 'Untitled'}"
            </div>
            <div style={{ fontFamily: 'var(--sans)', fontSize: '13px', color: 'var(--ink-3)', marginBottom: '18px' }}>
              {words} words · {Math.max(1, Math.round(words / 200))} min read
            </div>

            <div className="cfg-lbl" style={{ display: 'block', marginBottom: '8px' }}>Who can read it</div>
            <div style={{ display: 'flex', gap: '7px', marginBottom: '20px' }}>
              {['Everyone', 'Followers', 'Unlisted'].map(a => (
                <button
                  className={`meta-pill${audience === a ? ' on' : ''}`}
                  key={a}
                  onClick={() => setAudience(a)}
                >
                  {a}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '9px' }}>
              <button className="btn-stg-cancel" onClick={() => setPublishing(false)}>Not yet</button>
              <button className="btn-stg-save" onClick={() => void doPublish()}>Publish ✦</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
