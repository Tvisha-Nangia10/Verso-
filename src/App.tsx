import { useEffect, useState } from 'react';
import CoverView from './views/CoverView';
import LoginView from './views/LoginView';
import SignupView from './views/SignupView';
import AppView from './views/AppView';
import { useAuth } from './context/AuthContext';
import { isSupabaseConfigured } from './lib/supabase';

type Screen = 'cover' | 'login' | 'signup';

function SetupNotice() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--cream)', padding: '40px',
    }}>
      <div style={{
        maxWidth: '560px', background: 'var(--white)', border: '1px solid var(--cream-3)',
        borderRadius: '16px', padding: '32px',
      }}>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: '26px', marginBottom: '10px' }}>
          TH<span style={{ color: 'var(--amber)' }}>-</span>INK needs a moment of setup
        </h1>
        <p style={{ fontFamily: 'var(--sans)', fontSize: '14px', lineHeight: 1.7, color: 'var(--ink-2)' }}>
          Copy <code>.env.example</code> to <code>.env</code>, fill in your Supabase project URL and
          publishable key (and a Gemini key for the writing assistant), then restart the dev server.
        </p>
        <pre style={{
          background: 'var(--cream-2)', borderRadius: '10px', padding: '14px',
          fontFamily: 'var(--mono)', fontSize: '12px', marginTop: '16px', overflowX: 'auto',
        }}>
{`VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_…
VITE_GEMINI_API_KEY=…`}
        </pre>
        <p style={{ fontFamily: 'var(--sans)', fontSize: '13px', color: 'var(--ink-3)', marginTop: '14px' }}>
          Then run <code>supabase/schema.sql</code> followed by <code>supabase/seed.sql</code> in the
          Supabase SQL editor.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const { session, loading } = useAuth();
  const [screen, setScreen] = useState<Screen>('cover');

  // Apply the saved accent before first paint of the app shell.
  useEffect(() => {
    const accent = localStorage.getItem('think.accent');
    if (accent) document.documentElement.style.setProperty('--amber', accent);
  }, []);

  if (!isSupabaseConfigured) return <SetupNotice />;

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--cream)', fontFamily: 'var(--serif)', fontSize: '20px', color: 'var(--ink-3)',
      }}>
        TH<span style={{ color: 'var(--amber)' }}>-</span>INK
      </div>
    );
  }

  if (session) return <AppView />;

  if (screen === 'login') {
    return <LoginView onBack={() => setScreen('cover')} onSignup={() => setScreen('signup')} />;
  }
  if (screen === 'signup') {
    return <SignupView onBack={() => setScreen('cover')} onLogin={() => setScreen('login')} />;
  }
  return <CoverView onSignIn={() => setScreen('login')} onGetStarted={() => setScreen('signup')} />;
}
