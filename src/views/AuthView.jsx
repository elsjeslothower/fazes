import { useState } from 'preact/hooks';
import { signIn, signUp } from '../auth/auth.js';

export function AuthView() {
  const [mode, setMode] = useState('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === 'signIn') {
        await signIn(email, password);
      } else {
        await signUp(email, password);
        setInfo('Check your email to confirm your account, then sign in.');
        setMode('signIn');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div class="auth-view">
      <h1>Fazes</h1>
      <p class="auth-subtitle">Workout and food suggestions matched to your cycle.</p>

      <form class="stacked-form" onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            required
            value={email}
            onInput={(e) => setEmail(e.currentTarget.value)}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onInput={(e) => setPassword(e.currentTarget.value)}
          />
        </label>

        {error && <p class="form-error">{error}</p>}
        {info && <p class="form-success">{info}</p>}

        <button type="submit" class="primary-button" disabled={busy}>
          {mode === 'signIn' ? 'Sign in' : 'Sign up'}
        </button>
      </form>

      <button
        class="link-button"
        onClick={() => {
          setMode(mode === 'signIn' ? 'signUp' : 'signIn');
          setError(null);
          setInfo(null);
        }}
      >
        {mode === 'signIn' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
      </button>
    </div>
  );
}
