import { phaseSegments } from '../cycle/phaseEngine.js';

const PHASE_CLASS = {
  menstrual: 'phase-menstrual',
  follicular: 'phase-follicular',
  ovulatory: 'phase-ovulatory',
  luteal: 'phase-luteal',
};

// A segmented bar spanning the full cycle, colored per phase, with a marker
// at the current day — makes "where am I right now" legible at a glance
// instead of relying on the badge text alone.
export function PhaseProgressBar({ cycleDay, settings }) {
  const segments = phaseSegments(settings);
  const cycleLength = settings.avgCycleLength;
  const markerPercent = ((cycleDay - 0.5) / cycleLength) * 100;

  return (
    <div class="phase-progress">
      <div class="phase-progress-track">
        {segments.map((segment) => (
          <div
            key={segment.phase}
            class={`phase-progress-segment ${PHASE_CLASS[segment.phase]}`}
            style={{ width: `${((segment.endDay - segment.startDay + 1) / cycleLength) * 100}%` }}
          />
        ))}
        <div class="phase-progress-marker" style={{ left: `${markerPercent}%` }} />
      </div>
      <div class="phase-progress-labels">
        <span>Day 1</span>
        <span>Day {cycleLength}</span>
      </div>
    </div>
  );
}
