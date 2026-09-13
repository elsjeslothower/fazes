import { useEffect, useState } from 'preact/hooks';
import { useCycleStore, logPeriodStart, logPeriodEnd, currentStatus } from '../state/cycleStore.js';
import { useSession } from '../state/session.js';
import { PHASE_CONTENT, DISCLAIMER } from '../content/phaseContent.js';
import { PhaseBadge } from '../components/PhaseBadge.jsx';
import { PhaseProgressBar } from '../components/PhaseProgressBar.jsx';
import { LoadingIndicator } from '../components/LoadingIndicator.jsx';
import { navigate } from '../router.js';

export function DashboardView() {
  const { session } = useSession();
  const { cycles, loading } = useCycleStore();
  const [busy, setBusy] = useState(false);
  const status = loading ? null : currentStatus();

  useEffect(() => {
    if (status && !status.hasData) navigate('/onboarding');
  }, [status?.hasData]);

  if (loading) return <LoadingIndicator />;
  if (!status.hasData) return null;

  const activeCycle = cycles[0]?.endDate ? null : cycles[0];
  const content = PHASE_CONTENT[status.phase];
  const nextContent = PHASE_CONTENT[status.nextPhase];

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
        <PhaseBadge phase={status.phase} size="large" />
        <p class="cycle-day">Day {status.cycleDay} of your cycle · {content.eyebrow}</p>
      </header>

      <PhaseProgressBar cycleDay={status.cycleDay} settings={status.settings} />

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

      <section class="suggestion-card coming-up-card">
        <h2>Coming up</h2>
        <div class="coming-up-row">
          <span class="coming-up-icon" aria-hidden="true">{nextContent.emoji}</span>
          <div>
            <strong>{nextContent.label}</strong>
            <p>{status.daysUntilNextPhase === 1 ? 'Starts tomorrow' : `Starts in ${status.daysUntilNextPhase} days`}</p>
          </div>
        </div>
        <div class="coming-up-row">
          <span class="coming-up-icon" aria-hidden="true">{PHASE_CONTENT.menstrual.emoji}</span>
          <div>
            <strong>Next period</strong>
            <p>Predicted around {status.predictedNextStart} ({status.daysUntilNextPeriod} days)</p>
          </div>
        </div>
      </section>

      <button class="primary-button" onClick={handleLogAction} disabled={busy}>
        {activeCycle ? 'Log period end' : 'Log period start'}
      </button>

      <p class="disclaimer">{DISCLAIMER}</p>
    </div>
  );
}
