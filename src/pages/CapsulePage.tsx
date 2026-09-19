import { useCallback, useEffect, useState } from 'react';
import { createCapsule, deleteCapsule, fetchCapsules } from '../lib/api';
import type { TimeCapsule } from '../lib/database.types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

function useCountdown(target: string | undefined) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  if (!target) return null;
  const ms = Math.max(0, new Date(target).getTime() - now);
  return {
    days: Math.floor(ms / 86_400_000),
    hours: Math.floor((ms / 3_600_000) % 24),
    mins: Math.floor((ms / 60_000) % 60),
    secs: Math.floor((ms / 1000) % 60),
  };
}

const pad = (n: number) => String(n).padStart(2, '0');

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function CapsulePage() {
  const { profile } = useAuth();
  const toast = useToast();
  const [capsules, setCapsules] = useState<TimeCapsule[]>([]);
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [deliverAt, setDeliverAt] = useState('');
  const [reading, setReading] = useState<TimeCapsule | null>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    try {
      setCapsules(await fetchCapsules(profile.id));
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not load your capsules', 'error');
    }
  }, [profile, toast]);

  useEffect(() => { void load(); }, [load]);

  const sealed = capsules.filter(c => new Date(c.deliver_at).getTime() > Date.now());
  const opened = capsules.filter(c => new Date(c.deliver_at).getTime() <= Date.now());
  const next = sealed[0];
  const countdown = useCountdown(next?.deliver_at);

  async function seal() {
    if (!profile) return;
    if (!title.trim()) return toast('Give your capsule a title', 'error');
    if (!deliverAt) return toast('When should it unlock?', 'error');
    if (new Date(deliverAt).getTime() <= Date.now()) return toast('Pick a date in the future', 'error');

    try {
      await createCapsule(profile.id, title.trim(), body, new Date(deliverAt).toISOString());
      setComposing(false);
      setTitle('');
      setBody('');
      setDeliverAt('');
      await load();
      toast('Sealed. See you then.', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not seal it', 'error');
    }
  }

  async function remove(c: TimeCapsule) {
    try {
      await deleteCapsule(c.id);
      setReading(null);
      await load();
      toast('Capsule deleted', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not delete it', 'error');
    }
  }

  return (
    <div className="page active" id="page-capsule">
      <div className="capsule-hero">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            fontFamily: 'var(--sans)', fontSize: '10.5px', fontWeight: 700, letterSpacing: '.12em',
            textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', marginBottom: '14px',
          }}>
            Next unlock
          </div>
          <div className="tc-clock">
            <div className="tc-unit"><div className="tc-num">{pad(countdown?.days ?? 0)}</div><div className="tc-lbl">days</div></div>
            <div className="tc-sep">:</div>
            <div className="tc-unit"><div className="tc-num">{pad(countdown?.hours ?? 0)}</div><div className="tc-lbl">hours</div></div>
            <div className="tc-sep">:</div>
            <div className="tc-unit"><div className="tc-num">{pad(countdown?.mins ?? 0)}</div><div className="tc-lbl">mins</div></div>
            <div className="tc-sep">:</div>
            <div className="tc-unit"><div className="tc-num">{pad(countdown?.secs ?? 0)}</div><div className="tc-lbl">secs</div></div>
          </div>
          <div style={{
            fontFamily: 'var(--serif)', fontSize: '16px', fontStyle: 'italic',
            color: 'rgba(255,255,255,.5)', marginTop: '10px',
          }}>
            {next
              ? `"${next.title}" unlocking ${formatDate(next.deliver_at)}`
              : 'Nothing sealed. Write something for later.'}
          </div>
        </div>
      </div>

      <div className="section-bar">
        <h2 className="serif-h" style={{ fontSize: '19px' }}>Your <em>capsules</em></h2>
        <button className="btn-tb-solid" style={{ fontSize: '12px' }} onClick={() => setComposing(true)}>
          New capsule
        </button>
      </div>
      <div className="gold-rule"><div className="gold-dot" /></div>

      {composing && (
        <div style={{
          background: 'var(--cream-2)', border: '1px solid var(--cream-3)', borderRadius: '12px',
          padding: '18px', marginBottom: '20px', display: 'grid', gap: '10px', maxWidth: '620px',
        }}>
          <input className="field-input" placeholder="Title — what is this letter about?"
            value={title} onChange={e => setTitle(e.target.value)} autoFocus />
          <textarea
            className="field-input"
            placeholder="Write to whoever you will be when this opens…"
            rows={7}
            style={{ resize: 'vertical', fontFamily: 'var(--serif)', fontSize: '15px', lineHeight: 1.7 }}
            value={body}
            onChange={e => setBody(e.target.value)}
          />
          <label className="field-label">Unlock on</label>
          <input className="field-input" type="date" value={deliverAt} onChange={e => setDeliverAt(e.target.value)} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-tb-solid" style={{ fontSize: '12.5px' }} onClick={() => void seal()}>Seal it</button>
            <button className="btn-tb-ghost" style={{ fontSize: '12.5px' }} onClick={() => setComposing(false)}>Cancel</button>
          </div>
        </div>
      )}

      {reading && (
        <div style={{
          background: 'var(--white)', border: '1px solid var(--cream-3)', borderRadius: '12px',
          padding: '26px', marginBottom: '20px', maxWidth: '680px',
        }}>
          <div className="cap-date">✦ Unlocked {formatDate(reading.deliver_at)}</div>
          <h2 className="serif-h" style={{ fontSize: '22px', margin: '8px 0 14px' }}>{reading.title}</h2>
          <div style={{
            fontFamily: 'var(--serif)', fontSize: '15.5px', lineHeight: 1.8,
            color: 'var(--ink-2)', whiteSpace: 'pre-wrap',
          }}>
            {reading.body}
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '18px' }}>
            <button className="btn-tb-ghost" style={{ fontSize: '12px' }} onClick={() => setReading(null)}>Close</button>
            <button className="btn-tb-ghost" style={{ fontSize: '12px' }} onClick={() => void remove(reading)}>Delete</button>
          </div>
        </div>
      )}

      <div className="capsule-cards">
        {sealed.map(c => {
          const days = Math.ceil((new Date(c.deliver_at).getTime() - Date.now()) / 86_400_000);
          return (
            <div className="capsule-card locked" key={c.id}>
              <div className="cap-lock">🔒</div>
              <div className="cap-date">🔒 Unlocks {formatDate(c.deliver_at)}</div>
              <div className="cap-title">{c.title}</div>
              <div className="cap-preview">Sealed — the words stay hidden until the date arrives.</div>
              <div className="cap-locked-msg">{days} day{days === 1 ? '' : 's'} remaining</div>
            </div>
          );
        })}

        {opened.map(c => (
          <div className="capsule-card" key={c.id} onClick={() => setReading(c)}>
            <div className="cap-date">✦ Unlocked {formatDate(c.deliver_at)}</div>
            <div className="cap-title">{c.title}</div>
            <div className="cap-preview">{c.body.slice(0, 140)}…</div>
          </div>
        ))}

        <div
          className="capsule-card"
          onClick={() => setComposing(true)}
          style={{
            border: '1.5px dashed var(--cream-3)', background: 'var(--cream-2)', display: 'flex',
            flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer',
          }}
        >
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%', background: 'var(--cream-3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-3)',
          }}>
            +
          </div>
          <div style={{ fontFamily: 'var(--sans)', fontSize: '13.5px', fontWeight: 500, color: 'var(--ink-2)' }}>
            Seal a new capsule
          </div>
          <div style={{ fontFamily: 'var(--sans)', fontSize: '12px', color: 'var(--ink-3)' }}>
            Write something for the future
          </div>
        </div>
      </div>
    </div>
  );
}
