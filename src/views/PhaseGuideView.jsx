import { PHASE_CONTENT, DISCLAIMER } from '../content/phaseContent.js';
import { PHASES } from '../cycle/phaseEngine.js';
import { PhaseBadge } from '../components/PhaseBadge.jsx';

export function PhaseGuideView() {
  return (
    <div class="phase-guide-view">
      <h1>Phase guide</h1>

      {PHASES.map((phase) => {
        const content = PHASE_CONTENT[phase];
        return (
          <section key={phase} class="suggestion-card">
            <PhaseBadge phase={phase} />
            <p class="phase-tagline">{content.tagline}</p>
            <p>{content.description}</p>

            <h3>Workouts</h3>
            <ul>
              {content.workouts.map((workout) => (
                <li key={workout}>{workout}</li>
              ))}
            </ul>

            <h3>Foods</h3>
            <ul>
              {content.foods.map((food) => (
                <li key={food}>{food}</li>
              ))}
            </ul>
          </section>
        );
      })}

      <p class="disclaimer">{DISCLAIMER}</p>
    </div>
  );
}
