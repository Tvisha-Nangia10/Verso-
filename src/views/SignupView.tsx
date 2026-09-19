import { useMemo, useState, type FormEvent } from 'react';
import ConstellationCanvas, { BackChevron, GoogleIcon } from '../components/ConstellationCanvas';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

type Props = { onBack: () => void; onLogin: () => void };

const STRENGTH_COLORS = ['', '#e05a6e', '#e89640', '#5a9e78', '#3a8c60'];

function scorePassword(v: string) {
  let s = 0;
  if (v.length >= 8) s++;
  if (/[A-Z]/.test(v)) s++;
  if (/[0-9]/.test(v)) s++;
  if (/[^A-Za-z0-9]/.test(v)) s++;
  return s;
}

export default function SignupView({ onBack, onLogin }: Props) {
  const { signUp, signInWithGoogle } = useAuth();
  const toast = useToast();

  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [email, setEmail] = useState('');
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const strength = useMemo(() => scorePassword(password), [password]);

  async function handleSignup(e?: FormEvent) {
    e?.preventDefault();
    const name = `${first} ${last}`.trim();
    if (!name) return toast('What should we call you?', 'error');
    if (!email.trim()) return toast('Please enter your email', 'error');
    if (password.length < 8) return toast('Passwords need at least 8 characters', 'error');

    setBusy(true);
    toast('Creating your account…', 'info', 1200);
    try {
      const { needsConfirmation } = await signUp(email.trim(), password, name);
      if (needsConfirmation) {
        toast('Check your inbox to confirm your email, then sign in.', 'success', 6000);
        onLogin();
      }
      // Otherwise the session lands and App swaps to the app view.
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not create your account', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    toast('Connecting with Google…', 'info');
    try {
      await signInWithGoogle();
    } catch (err) {
      setBusy(false);
      toast(err instanceof Error ? err.message : 'Google sign-in failed', 'error');
    }
  }

  return (
    <div className="view active" id="view-signup" style={{ display: 'flex' }}>
      <div className="auth-left">
        <ConstellationCanvas />
        <div className="auth-left-content">
          <div className="auth-brand">TH<span className="logo-dash">-</span>INK</div>
          <div className="auth-tagline-big">Every writer<br />has a voice<br />worth <em>hearing.</em></div>
        </div>
        <blockquote className="auth-left-quote">
          "A writer only begins a book. A reader finishes it."
          <cite>— Samuel Johnson</cite>
        </blockquote>
      </div>

      <div className="auth-right" style={{ position: 'relative' }}>
        <span className="back-link" onClick={onBack}>
          <BackChevron />
          Back
        </span>

        <form className="auth-form-wrap" onSubmit={handleSignup}>
          <h2 className="auth-form-title">Create your account</h2>
          <p className="auth-form-sub">
            Already a writer? <a onClick={onLogin}>Sign in instead</a>
          </p>

          <button type="button" className="btn-social" onClick={handleGoogle} disabled={busy}>
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="auth-divider">or</div>

          <div className="field-row">
            <div className="field">
              <label className="field-label">First name</label>
              <input className="field-input" type="text" placeholder="Sarah"
                value={first} onChange={e => setFirst(e.target.value)} />
            </div>
            <div className="field">
              <label className="field-label">Last name</label>
              <input className="field-input" type="text" placeholder="Chen"
                value={last} onChange={e => setLast(e.target.value)} />
            </div>
          </div>

          <div className="field">
            <label className="field-label">Email</label>
            <input className="field-input" type="email" autoComplete="email" placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)} />
          </div>

          <div className="field">
            <label className="field-label">Username</label>
            <input
              className="field-input"
              type="text"
              placeholder="@sarahchen"
              style={{ fontFamily: 'var(--mono)', fontSize: '13px' }}
              value={handle}
              onChange={e => setHandle(e.target.value.replace(/[^a-zA-Z0-9_@]/g, ''))}
            />
          </div>

          <div className="field">
            <label className="field-label">Password</label>
            <input
              className="field-input"
              type="password"
              autoComplete="new-password"
              placeholder="Create a strong password"
              id="signupPwd"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <div className="pwd-strength">
              <div
                className="pwd-fill"
                id="pwdFill"
                style={{ width: `${strength * 25}%`, background: STRENGTH_COLORS[strength] }}
              />
            </div>
          </div>

          <button className="btn-auth" type="submit" disabled={busy}>
            {busy ? 'Creating…' : 'Create my TH-INK account'}
          </button>

          <div className="auth-terms">
            By creating an account you agree to our <a>Terms</a> and <a>Privacy Policy</a>
          </div>
        </form>
      </div>
    </div>
  );
}
