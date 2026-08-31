import { useEffect, useState } from 'preact/hooks';
import { useCycleStore, logPeriodStart, logPeriodEnd, currentStatus } from '../state/cycleStore.js';
import { useSession } from '../state/session.js';
import { PHASE_CONTENT, DISCLAIMER } from '../content/phaseContent.js';
import { PhaseBadge } from '../components/PhaseBadge.jsx';
import { navigate } from '../router.js';

export function DashboardView() {
  const { session } = useSession();
  const { cycles, loading } = useCycleStore();
  const [busy, setBusy] = useState(false);
  const status = loading ? null : currentStatus();

  useEffect(() => {
    if (status && !status.hasData) navigate('/onboarding');
  }, [status?.hasData]);

  if (loading) return <p class="loading">Loading…</p>;
  if (!status.hasData) return null;

  const activeCycle = cycles[0]?.endDate ? null : cycles[0];
  const content = PHASE_CONTENT[status.phase];

  async function handleLogAction() {
    setBusy(true);
    try {
      if (activeCycle) {
        await logPeriodEnd(activeCycle.id);
      } else {
        await logPeriodStart(session.user.id);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div class="dashboard-view">
      <header class="dashboard-header">
        <PhaseBadge phase={status.phase} />
        <p class="cycle-day">Day {status.cycleDay} of your cycle</p>
      </header>

      <p class="phase-tagline">{content.tagline}</p>
      <p>{content.description}</p>

      <section class="suggestion-card">
        <h2>Today's workouts</h2>
        <ul>
          {content.workouts.map((workout) => (
            <li key={workout}>{workout}</li>
          ))}
        </ul>
      </section>

      <section class="suggestion-card">
        <h2>Today's foods</h2>
        <ul>
          {content.foods.map((food) => (
            <li key={food}>{food}</li>
          ))}
        </ul>
      </section>

      <button class="primary-button" onClick={handleLogAction} disabled={busy}>
        {activeCycle ? 'Log period end' : 'Log period start'}
      </button>

      <p class="prediction">
        {activeCycle
          ? 'Currently on your period.'
          : `Next period predicted around ${status.predictedNextStart}.`}
      </p>

      <p class="disclaimer">{DISCLAIMER}</p>
    </div>
  );
}
