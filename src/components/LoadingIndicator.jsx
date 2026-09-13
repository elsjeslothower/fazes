import { useEffect, useState } from 'preact/hooks';

const DEFAULT_TIMEOUT_MS = 8000;

// A "Loading…" label that gives up waiting silently after `timeoutMs` and
// offers a manual reload instead — a safety net against getting stuck here
// indefinitely (a network issue, a hung request, or a future bug like the
// state-store race this app hit once before).
export function LoadingIndicator({ label = 'Loading…', timeoutMs = DEFAULT_TIMEOUT_MS }) {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), timeoutMs);
    return () => clearTimeout(timer);
  }, [timeoutMs]);

  if (timedOut) {
    return (
      <div class="loading">
        <p>This is taking longer than expected.</p>
        <button class="link-button" onClick={() => window.location.reload()}>
          Reload
        </button>
      </div>
    );
  }

  return <p class="loading">{label}</p>;
}
