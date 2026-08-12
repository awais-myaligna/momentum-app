// The 12 core emotional states tracked by Momentum. Bundled client-side
// reference copy — matches the live `GET /momentum/emotions` order/icons
// 1:1, used for local icon/order lookups without a network round trip.
// `id` is the stable identifier used across storage and charts.
// `icon` is an Ionicons glyph name (see src/components/Icon.js).
export const EMOTIONS = [
  {
    id: 'joy',
    name: 'Joy',
    icon: 'happy-outline',
    description:
      'Joy is the feeling of happiness, lightness, and fulfillment that comes from positive moments, meaningful progress, or simple experiences in daily life.',
  },
  {
    id: 'gratitude',
    name: 'Gratitude',
    icon: 'heart-outline',
    description:
      'Gratitude is the recognition and appreciation of the good in life, whether it comes from people, experiences, opportunities, or small moments of beauty.',
  },
  {
    id: 'inspiration',
    name: 'Inspiration',
    icon: 'sparkles-outline',
    description:
      'Inspiration is the spark that fuels creativity, motivation, and possibility. It helps users connect with ideas, people, or experiences that move them toward their aspirations.',
  },
  {
    id: 'focus',
    name: 'Focus',
    icon: 'locate-outline',
    description:
      'Focus is the ability to direct attention and energy toward what matters most. It helps users stay present, productive, and aligned with meaningful priorities.',
  },
  {
    id: 'determination',
    name: 'Determination',
    icon: 'flame-outline',
    description:
      'Determination is the inner resolve to keep moving forward, even when challenges appear. It reflects commitment, discipline, and persistence toward personal goals.',
  },
  {
    id: 'compassion',
    name: 'Compassion',
    icon: 'heart-circle-outline',
    description:
      'Compassion is the ability to understand and care about the experiences of others. It supports kindness, empathy, and deeper connection in relationships and daily interactions.',
  },
  {
    id: 'clarity',
    name: 'Clarity',
    icon: 'eye-outline',
    description:
      "Clarity is the sense of understanding one's path, situation, or next step. It helps reduce confusion and allows users to move forward with greater confidence.",
  },
  {
    id: 'confidence',
    name: 'Confidence',
    icon: 'shield-checkmark-outline',
    description:
      "Confidence is the belief in one's abilities, worth, and capacity to take action. It empowers users to speak up, make decisions, and pursue goals with self-assurance.",
  },
  {
    id: 'enthusiasm',
    name: 'Enthusiasm',
    icon: 'flash-outline',
    description:
      'Enthusiasm is the energetic excitement and positive anticipation a person feels toward tasks, opportunities, or future possibilities.',
  },
  {
    id: 'resilience',
    name: 'Resilience',
    icon: 'shield-outline',
    description:
      'Resilience is the ability to recover from setbacks, adapt to challenges, and remain emotionally strong during difficult moments.',
  },
  {
    id: 'hope',
    name: 'Hope',
    icon: 'sunny-outline',
    description:
      'Hope is the optimistic belief that positive outcomes are possible, even when the path ahead is not fully clear.',
  },
  {
    id: 'contentment',
    name: 'Contentment',
    icon: 'leaf-outline',
    description:
      'Contentment is the calm satisfaction of feeling grounded and at peace with where one is, without constantly needing something more.',
  },
];

export const EMOTION_MAP = EMOTIONS.reduce((acc, emotion) => {
  acc[emotion.id] = emotion;
  return acc;
}, {});

export const getEmotionById = (id) => EMOTION_MAP[id];

// Score bands used to color-code charts and detail screens.
export const SCORE_BANDS = {
  LOW: { key: 'LOW', max: 4, color: 'danger', label: 'Needs attention' },
  MID: { key: 'MID', max: 7, color: 'warning', label: 'Building' },
  HIGH: { key: 'HIGH', max: 10, color: 'success', label: 'Thriving' },
};

export const getScoreBand = (score) => {
  if (score <= SCORE_BANDS.LOW.max) return SCORE_BANDS.LOW;
  if (score <= SCORE_BANDS.MID.max) return SCORE_BANDS.MID;
  return SCORE_BANDS.HIGH;
};
