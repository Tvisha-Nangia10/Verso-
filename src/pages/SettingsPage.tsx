import { useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';
import type { Prefs } from '../lib/database.types';

type TabId = 'profile' | 'account' | 'writing' | 'notifications' | 'appearance' | 'privacy';

const AVATAR_COLORS = ['#c8620a', '#2d8c58', '#2470b8', '#6448b0', '#c93050', '#1a1410'];

const NOTIF_ROWS: { key: string; label: string; desc: string }[] = [
  { key: 'follow', label: 'New followers', desc: 'When someone follows your profile' },
  { key: 'like', label: 'Likes on your writing', desc: 'When readers like your pieces' },
  { key: 'comment', label: 'Annotations & comments', desc: 'When readers leave annotations' },
  { key: 'room', label: 'Reading Room invites', desc: 'When someone starts a room with your work' },
  { key: 'milestone', label: 'Milestones', desc: 'Word counts, streaks, top-writer alerts' },
  { key: 'system', label: 'System & digests', desc: 'Weekly digest, capsule reminders, updates' },
];

const TABS: { id: TabId; label: string; icon: ReactNode }[] = [
  { id: 'profile', label: 'Profile', icon: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M8 8a3 3 0 100-6 3 3 0 000 6zM4 14c0-2.2 1.8-4 4-4s4 1.8 4 4" />
    </svg>
  ) },
  { id: 'account', label: 'Account', icon: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <rect x="2" y="3" width="12" height="10" rx="2" /><path d="M2 7h12" /><path d="M6 11h1M9 11h1" />
    </svg>
  ) },
  { id: 'writing', label: 'Writing', icon: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M3 3h10v2H3zM3 8h7M3 11h5" />
    </svg>
  ) },
  { id: 'notifications', label: 'Notifications', icon: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M8 2a5 5 0 015 5v3l1.5 2h-13L3 10V7a5 5 0 015-5z" /><path d="M6.5 13a1.5 1.5 0 003 0" />
    </svg>
  ) },
  { id: 'appearance', label: 'Appearance', icon: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <circle cx="8" cy="8" r="6" /><path d="M8 2v2M8 12v2M2 8h2M12 8h2" />
    </svg>
  ) },
  { id: 'privacy', label: 'Privacy', icon: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M8 2L3 4v4c0 3 2.5 5.5 5 6.5 2.5-1 5-3.5 5-6.5V4z" />
    </svg>
  ) },
];

function Row({ label, desc, children }: { label: string; desc: string; children: ReactNode }) {
  return (
    <div className="settings-row">
      <div className="settings-row-left">
        <div className="settings-row-label">{label}</div>
        <div className="settings-row-desc">{desc}</div>
      </div>
      {children}
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="stg-toggle">
      <input type="checkbox" checked={on} onChange={e => onChange(e.target.checked)} />
      <span className="stg-slider" />
    </label>
  );
}

export default function SettingsPage() {
  const { profile, user, updateProfile, signOut } = useAuth();
  const toast = useToast();

  const [tab, setTab] = useState<TabId>('profile');
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [avatarBg, setAvatarBg] = useState('#c8620a');
  const [prefs, setPrefs] = useState<Prefs>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setName(profile.name);
    setHandle(profile.handle);
    setBio(profile.bio);
    setLocation(profile.location);
    setAvatarBg(profile.avatar_bg);
    setPrefs(profile.prefs ?? {});
  }, [profile]);

  async function saveProfile() {
    if (!profile) return;
    setSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        handle: handle.replace(/^@/, '').trim(),
        bio: bio.trim(),
        location: location.trim(),
        avatar_bg: avatarBg,
        avatar_color: avatarBg === '#1a1410' ? '#fff' : '#fff',
        initials: name.trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase(),
      });
      toast('Profile updated', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not save', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function savePrefs(next: Prefs) {
    setPrefs(next);
    try {
      await updateProfile({ prefs: next });
      toast('Preference saved', 'success', 1500);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not save', 'error');
    }
  }

  function setNotif(key: string, on: boolean) {
    void savePrefs({ ...prefs, notifications: { ...(prefs.notifications ?? {}), [key]: on } });
  }

  async function resetPassword() {
    if (!user?.email) return;
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/`,
      });
      if (error) throw error;
      toast('Password reset email sent', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not send the email', 'error');
    }
  }

  const initials = name.trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="page active" id="page-settings">
      <h1 className="serif-h" style={{ fontSize: '28px', marginBottom: '20px' }}>Settings</h1>

      <div className="settings-layout">
        <div className="settings-nav">
          {TABS.map(t => (
            <div
              className={`sn-item${tab === t.id ? ' active' : ''}`}
              key={t.id}
              onClick={() => setTab(t.id)}
            >
              {t.icon}
              {t.label}
            </div>
          ))}
          <div
            className="sn-item"
            style={{ marginTop: '10px', color: 'var(--rose)' }}
            onClick={() => void signOut()}
          >
            Sign out
          </div>
        </div>

        <div className="settings-content">
          {tab === 'profile' && (
            <div className="settings-section active" id="stg-profile">
              <div className="settings-h">Profile</div>
              <div className="settings-sub">How you appear to other writers on TH-INK.</div>

              <div className="settings-card">
                <Row label="Avatar" desc="Choose a colour for your initials avatar">
                  <div className="stg-avatar-row">
                    <div className="stg-av-preview" style={{ background: avatarBg, color: '#fff' }}>
                      {initials || '··'}
                    </div>
                    <div className="stg-color-row">
                      {AVATAR_COLORS.map(c => (
                        <div
                          className={`stg-color${avatarBg === c ? ' picked' : ''}`}
                          key={c}
                          style={{ background: c }}
                          onClick={() => setAvatarBg(c)}
                        />
                      ))}
                    </div>
                  </div>
                </Row>

                <Row label="Display name" desc="Shown on your pieces and profile">
                  <input className="stg-input" value={name} onChange={e => setName(e.target.value)} />
                </Row>

                <Row label="Username" desc="Your unique handle on TH-INK">
                  <input
                    className="stg-input"
                    style={{ fontFamily: 'var(--mono)', fontSize: '12.5px' }}
                    value={`@${handle}`}
                    onChange={e => setHandle(e.target.value.replace(/^@/, ''))}
                  />
                </Row>

                <Row label="Bio" desc="A line or two about what you write">
                  <input
                    className="stg-input"
                    style={{ width: '260px' }}
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                  />
                </Row>

                <Row label="Location" desc="Optional — where you write from">
                  <input className="stg-input" value={location} onChange={e => setLocation(e.target.value)} />
                </Row>
              </div>

              <div className="settings-actions">
                <button
                  className="btn-stg-cancel"
                  onClick={() => {
                    if (!profile) return;
                    setName(profile.name); setHandle(profile.handle); setBio(profile.bio);
                    setLocation(profile.location); setAvatarBg(profile.avatar_bg);
                    toast('Changes discarded', 'info');
                  }}
                >
                  Cancel
                </button>
                <button className="btn-stg-save" onClick={() => void saveProfile()} disabled={saving}>
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </div>
          )}

          {tab === 'account' && (
            <div className="settings-section active" id="stg-account">
              <div className="settings-h">Account</div>
              <div className="settings-sub">Your sign-in details and plan.</div>

              <div className="settings-card">
                <Row label="Email" desc="Used for sign-in and notifications">
                  <input className="stg-input" type="email" value={user?.email ?? ''} readOnly />
                </Row>
                <Row label="Password" desc="We'll email you a secure reset link">
                  <button className="btn-stg-cancel" onClick={() => void resetPassword()}>
                    Change password
                  </button>
                </Row>
                <Row label="Signed in with" desc="How this session was authenticated">
                  <span style={{ fontFamily: 'var(--sans)', fontSize: '13px', color: 'var(--ink-2)' }}>
                    {user?.app_metadata?.provider === 'google' ? 'Google' : 'Email & password'}
                  </span>
                </Row>
                <Row label="Plan" desc="TH-INK Free — unlimited drafts, 3 collections">
                  <button
                    className="btn-stg-save"
                    style={{ padding: '8px 18px', fontSize: '12.5px' }}
                    onClick={() => toast('Upgrade coming soon ✦', 'info')}
                  >
                    Upgrade to Pro
                  </button>
                </Row>
              </div>
            </div>
          )}

          {tab === 'writing' && (
            <div className="settings-section active" id="stg-writing">
              <div className="settings-h">Writing</div>
              <div className="settings-sub">Defaults for the editor.</div>

              <div className="settings-card">
                <Row label="Editor font" desc="The typeface your drafts open in">
                  <select
                    className="stg-select"
                    value={prefs.font ?? 'playfair'}
                    onChange={e => void savePrefs({ ...prefs, font: e.target.value })}
                  >
                    <option value="playfair">Playfair Display</option>
                    <option value="lora">Lora</option>
                    <option value="merriweather">Merriweather</option>
                    <option value="garamond">EB Garamond</option>
                    <option value="crimson">Crimson Pro</option>
                    <option value="inter">Inter</option>
                    <option value="jetbrains">JetBrains Mono</option>
                  </select>
                </Row>

                <Row label="Base font size" desc="How large the draft text starts">
                  <select
                    className="stg-select"
                    value={String(prefs.fontSize ?? 18)}
                    onChange={e => void savePrefs({ ...prefs, fontSize: Number(e.target.value) })}
                  >
                    {[15, 16, 17, 18, 19, 20, 22].map(s => <option key={s} value={s}>{s}px</option>)}
                  </select>
                </Row>

                <Row label="Auto-save" desc="Drafts save themselves as you write">
                  <Toggle on={prefs.autosave !== false} onChange={v => void savePrefs({ ...prefs, autosave: v })} />
                </Row>

                <Row label="Spell check" desc="Underline misspellings in the editor">
                  <Toggle on={prefs.spellcheck !== false} onChange={v => void savePrefs({ ...prefs, spellcheck: v })} />
                </Row>
              </div>
            </div>
          )}

          {tab === 'notifications' && (
            <div className="settings-section active" id="stg-notifications">
              <div className="settings-h">Notifications</div>
              <div className="settings-sub">What you want to hear about.</div>

              <div className="settings-card">
                {NOTIF_ROWS.map(r => (
                  <Row key={r.key} label={r.label} desc={r.desc}>
                    <Toggle
                      on={prefs.notifications?.[r.key] !== false}
                      onChange={v => setNotif(r.key, v)}
                    />
                  </Row>
                ))}
              </div>
            </div>
          )}

          {tab === 'appearance' && (
            <div className="settings-section active" id="stg-appearance">
              <div className="settings-h">Appearance</div>
              <div className="settings-sub">How TH-INK looks to you.</div>

              <div className="settings-card">
                <Row label="Theme" desc="Light, dark, or follow your system">
                  <select
                    className="stg-select"
                    value={prefs.theme ?? 'system'}
                    onChange={e => void savePrefs({ ...prefs, theme: e.target.value })}
                  >
                    <option value="system">Match system</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </Row>

                <Row label="Accent colour" desc="Used for highlights and buttons">
                  <div className="stg-color-row">
                    {AVATAR_COLORS.slice(0, 5).map(c => (
                      <div
                        className={`stg-color${(prefs.accentHex ?? '#c8620a') === c ? ' picked' : ''}`}
                        key={c}
                        style={{ background: c }}
                        onClick={() => {
                          document.documentElement.style.setProperty('--amber', c);
                          void savePrefs({ ...prefs, accentHex: c });
                        }}
                      />
                    ))}
                  </div>
                </Row>

                <Row label="Reduce motion" desc="Turn off the drifting background animations">
                  <Toggle
                    on={prefs.reduceMotion === true}
                    onChange={v => void savePrefs({ ...prefs, reduceMotion: v })}
                  />
                </Row>
              </div>
            </div>
          )}

          {tab === 'privacy' && (
            <div className="settings-section active" id="stg-privacy">
              <div className="settings-h">Privacy</div>
              <div className="settings-sub">Who can see and reach you.</div>

              <div className="settings-card">
                <Row label="Public profile" desc="Anyone can view your profile and published pieces">
                  <Toggle on={prefs.publicProfile !== false} onChange={v => void savePrefs({ ...prefs, publicProfile: v })} />
                </Row>
                <Row label="Show in discovery" desc="Let TH-INK suggest you to other readers">
                  <Toggle on={prefs.discoverable !== false} onChange={v => void savePrefs({ ...prefs, discoverable: v })} />
                </Row>
                <Row label="Messages from anyone" desc="Off means only people you follow can write to you">
                  <Toggle on={prefs.openDMs === true} onChange={v => void savePrefs({ ...prefs, openDMs: v })} />
                </Row>
                <Row label="Show reading activity" desc="Let followers see what you are reading">
                  <Toggle on={prefs.showActivity !== false} onChange={v => void savePrefs({ ...prefs, showActivity: v })} />
                </Row>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
