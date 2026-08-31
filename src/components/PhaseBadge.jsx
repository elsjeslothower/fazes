import { PHASE_CONTENT } from '../content/phaseContent.js';

const PHASE_CLASS = {
  menstrual: 'phase-menstrual',
  follicular: 'phase-follicular',
  ovulatory: 'phase-ovulatory',
  luteal: 'phase-luteal',
};

export function PhaseBadge({ phase }) {
  const content = PHASE_CONTENT[phase];
  if (!content) return null;
  return <span class={`phase-badge ${PHASE_CLASS[phase]}`}>{content.label}</span>;
}
