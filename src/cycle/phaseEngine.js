// Pure cycle-phase logic: no Preact, no Supabase, no DOM. Everything here
// takes plain data in and returns plain data out, so it's independently
// testable and portable if a later Capacitor build ever wants this logic
// running natively instead.

export const PHASES = ['menstrual', 'follicular', 'ovulatory', 'luteal'];

export const DEFAULT_SETTINGS = {
  avgCycleLength: 28,
  avgPeriodLength: 5,
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MIN_CYCLE_LENGTH = 21;
const MAX_CYCLE_LENGTH = 35;
const MIN_PERIOD_LENGTH = 2;
const MAX_PERIOD_LENGTH = 10;
const LUTEAL_PHASE_LENGTH = 14; // widely-used clinical assumption: fairly constant across cycle lengths

export function parseDateOnly(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function formatDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

// Inclusive list of 'YYYY-MM-DD' strings from startDateString to
// endDateString — used to enumerate a cycle's days for the daily-log view.
export function datesInRange(startDateString, endDateString) {
  const start = parseDateOnly(startDateString);
  const end = parseDateOnly(endDateString);
  const dates = [];

  for (let d = start; d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    dates.push(formatDateOnly(d));
  }
  return dates;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function daysBetween(fromDate, toDate) {
  return Math.round((toDate.getTime() - fromDate.getTime()) / MS_PER_DAY);
}

/**
 * Derives personalized cycle/period length from logged history once there's
 * enough of it, falling back to the given settings (typically the user's
 * profile defaults) otherwise. Outliers are clamped to a sane physiological
 * range so one unusually long/short cycle doesn't skew everything.
 */
export function personalizeSettings(cycles, fallbackSettings = DEFAULT_SETTINGS) {
  if (!cycles || cycles.length < 2) {
    return { ...fallbackSettings };
  }

  const sorted = [...cycles].sort(
    (a, b) => parseDateOnly(a.startDate) - parseDateOnly(b.startDate)
  );

  const cycleLengths = [];
  for (let i = 1; i < sorted.length; i++) {
    const gap = daysBetween(parseDateOnly(sorted[i - 1].startDate), parseDateOnly(sorted[i].startDate));
    if (gap > 0) cycleLengths.push(clamp(gap, MIN_CYCLE_LENGTH, MAX_CYCLE_LENGTH));
  }

  const periodLengths = sorted
    .filter((c) => c.endDate)
    .map((c) => daysBetween(parseDateOnly(c.startDate), parseDateOnly(c.endDate)) + 1)
    .map((length) => clamp(length, MIN_PERIOD_LENGTH, MAX_PERIOD_LENGTH));

  const average = (values, fallback) =>
    values.length ? Math.round(values.reduce((sum, v) => sum + v, 0) / values.length) : fallback;

  return {
    avgCycleLength: average(cycleLengths, fallbackSettings.avgCycleLength),
    avgPeriodLength: average(periodLengths, fallbackSettings.avgPeriodLength),
  };
}

/**
 * Non-overlapping day-range phase buckets — the simplified model consumer
 * cycle apps use for UX purposes, not the overlapping physiological
 * definition (follicular phase technically spans the whole pre-ovulation
 * window including menstruation).
 */
function phaseBuckets({ avgCycleLength, avgPeriodLength }) {
  const ovulationDay = avgCycleLength - LUTEAL_PHASE_LENGTH;
  const ovulationWindowStart = clamp(ovulationDay - 1, avgPeriodLength + 1, avgCycleLength - 1);
  const ovulationWindowEnd = clamp(ovulationDay + 1, ovulationWindowStart, avgCycleLength - 1);

  return {
    menstrualEnd: avgPeriodLength,
    follicularEnd: ovulationWindowStart - 1,
    ovulatoryEnd: ovulationWindowEnd,
    // luteal runs from ovulatoryEnd + 1 through avgCycleLength
  };
}

export function phaseForDay(cycleDay, settings) {
  const { menstrualEnd, follicularEnd, ovulatoryEnd } = phaseBuckets(settings);

  if (cycleDay <= menstrualEnd) return 'menstrual';
  if (cycleDay <= follicularEnd) return 'follicular';
  if (cycleDay <= ovulatoryEnd) return 'ovulatory';
  return 'luteal';
}

/**
 * The four phases as contiguous day ranges over a full cycle — used to draw
 * a segmented progress bar and to figure out how many days remain in the
 * current phase.
 */
export function phaseSegments(settings) {
  const { menstrualEnd, follicularEnd, ovulatoryEnd } = phaseBuckets(settings);

  return [
    { phase: 'menstrual', startDay: 1, endDay: menstrualEnd },
    { phase: 'follicular', startDay: menstrualEnd + 1, endDay: follicularEnd },
    { phase: 'ovulatory', startDay: follicularEnd + 1, endDay: ovulatoryEnd },
    { phase: 'luteal', startDay: ovulatoryEnd + 1, endDay: settings.avgCycleLength },
  ];
}

/**
 * How many days remain in the current phase, and which phase comes next
 * (wrapping back to menstrual for luteal).
 */
export function nextPhaseInfo(cycleDay, settings) {
  const segments = phaseSegments(settings);
  const currentIndex = segments.findIndex((s) => cycleDay >= s.startDay && cycleDay <= s.endDay);
  const current = segments[currentIndex];
  const next = segments[(currentIndex + 1) % segments.length];

  return {
    daysUntilNextPhase: current.endDay - cycleDay + 1,
    nextPhase: next.phase,
  };
}

/**
 * Given logged cycle history and a reference date (defaults to today),
 * returns where the user currently is in their cycle. Returns
 * `{ hasData: false }` if there's no logged period to count from yet —
 * callers should route to onboarding in that case.
 */
export function getCycleStatus({ cycles, settings = DEFAULT_SETTINGS, referenceDate = new Date() }) {
  if (!cycles || cycles.length === 0) {
    return { hasData: false };
  }

  const mostRecent = [...cycles].sort(
    (a, b) => parseDateOnly(b.startDate) - parseDateOnly(a.startDate)
  )[0];

  const effectiveSettings = personalizeSettings(cycles, settings);
  const lastPeriodStart = parseDateOnly(mostRecent.startDate);
  const today = new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), referenceDate.getUTCDate()));

  const daysSinceStart = Math.max(0, daysBetween(lastPeriodStart, today));
  const cycleDay = (daysSinceStart % effectiveSettings.avgCycleLength) + 1;
  const phase = phaseForDay(cycleDay, effectiveSettings);
  const daysUntilNextPeriod = effectiveSettings.avgCycleLength - cycleDay + 1;
  const { daysUntilNextPhase, nextPhase } = nextPhaseInfo(cycleDay, effectiveSettings);

  const predictedNextStart = new Date(lastPeriodStart);
  predictedNextStart.setUTCDate(predictedNextStart.getUTCDate() + effectiveSettings.avgCycleLength);

  return {
    hasData: true,
    cycleDay,
    phase,
    daysUntilNextPeriod,
    daysUntilNextPhase,
    nextPhase,
    predictedNextStart: formatDateOnly(predictedNextStart),
    settings: effectiveSettings,
  };
}
