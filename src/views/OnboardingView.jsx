import { useState } from 'preact/hooks';
import { useSession } from '../state/session.js';
import { logPeriodStart, saveSettings } from '../state/cycleStore.js';
import { DEFAULT_SETTINGS, formatDateOnly } from '../cycle/phaseEngine.js';
import { navigate } from '../router.js';

export function OnboardingView() {
  const { session } = useSession();
  const [lastPeriodStart, setLastPeriodStart] = useState(formatDateOnly(new Date()));
  const [avgCycleLength, setAvgCycleLength] = useState(DEFAULT_SETTINGS.avgCycleLength);
  const [avgPeriodLength, setAvgPeriodLength] = useState(DEFAULT_SETTINGS.avgPeriodLength);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const userId = session.user.id;
      await saveSettings(userId, {
        avgCycleLength: Number(avgCycleLength),
        avgPeriodLength: Number(avgPeriodLength),
      });
      await logPeriodStart(userId, lastPeriodStart);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div class="onboarding-view">
      <h1>Let's get set up</h1>
      <p>A few details to estimate where you are in your cycle. You can refine this later in Settings.</p>

      <form class="stacked-form" onSubmit={handleSubmit}>
        <label>
          When did your last period start?
          <input
            type="date"
            required
            value={lastPeriodStart}
            onInput={(e) => setLastPeriodStart(e.currentTarget.value)}
          />
        </label>
        <label>
          Typical cycle length (days)
          <input
            type="number"
            min="21"
            max="35"
            required
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
            required
            value={avgPeriodLength}
            onInput={(e) => setAvgPeriodLength(e.currentTarget.value)}
          />
        </label>

        {error && <p class="form-error">{error}</p>}

        <button type="submit" class="primary-button" disabled={busy}>
          Get started
        </button>
      </form>
    </div>
  );
}
