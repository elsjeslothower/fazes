// Static, developer-authored wellness content — not stored in the database,
// so it loads instantly and works fully offline. General suggestions only;
// not medical guidance (see the disclaimer surfaced alongside this content
// in PhaseGuideView and SettingsView).
export const PHASE_CONTENT = {
  menstrual: {
    label: 'Menstrual',
    emoji: '🩸',
    eyebrow: 'period time',
    tagline: 'Energy is usually lowest — rest is productive too.',
    description:
      "Your period is a natural low point in energy for a lot of people. It's a reasonable time to move gently and prioritize recovery.",
    workouts: [
      'Easy walking',
      'Restorative or yin yoga',
      'Light stretching',
      'Rest day, if you need it',
    ],
    foods: [
      'Iron-rich foods (leafy greens, lentils, red meat)',
      'Warming foods (soups, ginger tea)',
      'Staying well-hydrated',
      'Dark chocolate, in moderation',
    ],
  },
  follicular: {
    label: 'Follicular',
    emoji: '🌱',
    eyebrow: 'things are heating up',
    tagline: 'Energy tends to rise — a good window to push a bit harder.',
    description:
      'As the period ends, energy and motivation often climb. This is a common window for trying something new or more demanding.',
    workouts: [
      'Strength training',
      'HIIT intervals',
      'Dance or cardio classes',
      'Trying a new activity',
    ],
    foods: [
      'Lean protein',
      'Fresh, light meals',
      'Fermented foods (yogurt, kimchi)',
      'Complex carbs for fuel',
    ],
  },
  ovulatory: {
    label: 'Ovulatory',
    emoji: '☀️',
    eyebrow: 'you\'re glowing!',
    tagline: 'Often the energy peak of the cycle.',
    description:
      'Many people feel strongest and most confident around ovulation. A reasonable window for higher-intensity effort.',
    workouts: [
      'High-intensity training',
      'Group fitness classes',
      'Personal-best attempts',
      'Longer or more challenging sessions',
    ],
    foods: [
      'Raw vegetables and salads',
      'Berries and other antioxidant-rich fruit',
      'High-fiber foods',
      'Light, fresh meals',
    ],
  },
  luteal: {
    label: 'Luteal',
    emoji: '🌙',
    eyebrow: 'period coming soon',
    tagline: 'Energy gradually tapers — a good time to ease off.',
    description:
      'In the back half of the cycle, energy and patience for high intensity often decline, especially closer to the next period.',
    workouts: [
      'Steady-state cardio',
      'Pilates',
      'Lower-intensity strength work',
      'Gentle mobility work',
    ],
    foods: [
      'Complex carbs (oats, sweet potato)',
      'Magnesium-rich foods (nuts, seeds, dark chocolate)',
      'Smaller, more frequent meals if cravings pick up',
      'Calming teas (chamomile, peppermint)',
    ],
  },
};

export const DISCLAIMER =
  'These are general wellness suggestions, not medical advice. Cycles vary from person to person — listen to your body, and talk to a healthcare provider about any health concerns.';
