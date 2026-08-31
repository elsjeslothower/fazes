import { PHASE_CONTENT } from '../content/phaseContent.js';

const PHASE_CLASS = {
  menstrual: 'phase-menstrual',
  follicular: 'phase-follicular',
  ovulatory: 'phase-ovulatory',
  luteal: 'phase-luteal',
};

export function PhaseBadge({ phase, size = 'default' }) {
  const content = PHASE_CONTENT[phase];
  if (!content) return null;

  return (
    <span class={`phase-badge ${PHASE_CLASS[phase]} ${size === 'large' ? 'phase-badge-large' : ''}`}>
      <span aria-hidden="true">{content.emoji}</span> {content.label}
    </span>
  );
}
