import { useState } from 'preact/hooks';
import { useSession } from '../state/session.js';
import { useCycleStore, saveSettings } from '../state/cycleStore.js';
import { signOut } from '../auth/auth.js';
import { DISCLAIMER } from '../content/phaseContent.js';

export function SettingsView() {
  const { session } = useSession();
  const { profile, loading } = useCycleStore();
  const [avgCycleLength, setAvgCycleLength] = useState(profile?.avgCycleLength ?? 28);
  const [avgPeriodLength, setAvgPeriodLength] = useState(profile?.avgPeriodLength ?? 5);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  if (loading) return <p class="loading">Loading…</p>;

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setSaved(false);
    try {
      await saveSettings(session.user.id, {
        avgCycleLength: Number(avgCycleLength),
        avgPeriodLength: Number(avgPeriodLength),
      });
      setSaved(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div class="settings-view">
      <h1>Settings</h1>

      <form class="stacked-form" onSubmit={handleSubmit}>
        <label>
          Typical cycle length (days)
          <input
            type="number"
            min="21"
            max="35"
            value={avgCycleLength}
            onInput={(e) => setAvgCycleLength(e.currentTarget.value)}
          />
        </label>
        <label>
          Typical period length (days)
          <input
            type="number"
            min="2"
            max="10"
            value={avgPeriodLength}
            onInput={(e) => setAvgPeriodLength(e.currentTarget.value)}
          />
        </label>
        <p class="hint">These refine automatically once you've logged a couple of cycles.</p>

        <button type="submit" class="primary-button" disabled={busy}>
          Save
        </button>
        {saved && <p class="form-success">Saved.</p>}
      </form>

      <button class="link-button" onClick={() => signOut()}>
        Sign out
      </button>

      <p class="disclaimer">{DISCLAIMER}</p>
    </div>
  );
}
