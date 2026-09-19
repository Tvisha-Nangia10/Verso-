import { useState, type FormEvent } from 'react';
import ConstellationCanvas, { BackChevron, GoogleIcon } from '../components/ConstellationCanvas';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

type Props = { onBack: () => void; onSignup: () => void };

export default function LoginView({ onBack, onSignup }: Props) {
  const { signIn, signInWithGoogle } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState('sarah@think.app');
  const [password, setPassword] = useState('think1234');
  const [busy, setBusy] = useState(false);

  async function handleLogin(e?: FormEvent) {
    e?.preventDefault();
    if (!email.trim()) return toast('Please enter your email', 'error');
    if (!password) return toast('Please enter your password', 'error');

    setBusy(true);
    toast('Signing in…', 'info', 1200);
    try {
      await signIn(email.trim(), password);
      // AuthProvider picks up the session and App swaps to the app view.
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not sign in', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    toast('Connecting with Google…', 'info');
    try {
      await signInWithGoogle(); // redirects away
    } catch (err) {
      setBusy(false);
      toast(err instanceof Error ? err.message : 'Google sign-in failed', 'error');
    }
  }

  return (
    <div className="view active" id="view-login" style={{ display: 'flex' }}>
      <div className="auth-left">
        <ConstellationCanvas />
        <div className="auth-left-content">
          <div className="auth-brand">TH<span className="logo-dash">-</span>INK</div>
          <div className="auth-tagline-big">Good writing<br />is the art of<br /><em>noticing.</em></div>
        </div>
        <blockquote className="auth-left-quote">
          "The role of a writer is not to say what we can all say, but what we are unable to say."
          <cite>— Anaïs Nin</cite>
        </blockquote>
      </div>

      <div className="auth-right" style={{ position: 'relative' }}>
        <span className="back-link" onClick={onBack}>
          <BackChevron />
          Back
        </span>

        <form className="auth-form-wrap" onSubmit={handleLogin}>
          <h2 className="auth-form-title">Welcome back</h2>
          <p className="auth-form-sub">
            Don't have an account? <a onClick={onSignup}>Create one — it's free</a>
          </p>

          <button type="button" className="btn-social" onClick={handleGoogle} disabled={busy}>
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="auth-divider">or</div>

          <div className="field">
            <label className="field-label" htmlFor="loginEmail">Email</label>
            <input
              className="field-input"
              id="loginEmail"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="loginPwd">Password</label>
            <input
              className="field-input"
              id="loginPwd"
              type="password"
              autoComplete="current-password"
              placeholder="Your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button className="btn-auth" type="submit" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in to TH-INK'}
          </button>

          <div className="auth-terms">
            Demo account: <strong>sarah@think.app</strong> / <strong>think1234</strong>
          </div>
        </form>
      </div>
    </div>
  );
}
