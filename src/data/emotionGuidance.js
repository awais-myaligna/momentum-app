// Personalized, per-band guidance shown on Emotion Detail screens.
// low: score 1-4, mid: score 5-7, high: score 8-10 (see SCORE_BANDS in emotions.js)
export const EMOTION_GUIDANCE = {
  joy: {
    low: 'Joy may feel out of reach right now. Try noticing one small, simple moment today that felt good, even briefly.',
    mid: "You're finding pockets of joy. Consider setting aside a few minutes today for something that reliably lifts your mood.",
    high: "Joy is flowing well for you. Keep making space for the moments and people that bring you lightness.",
  },
  gratitude: {
    low: 'Gratitude can be hard to access during busy or difficult stretches. Try naming one thing, however small, that you appreciate today.',
    mid: "You're noticing the good around you. A short gratitude note each evening can help this grow.",
    high: "Your sense of appreciation is strong. Sharing your gratitude with someone else can deepen it further.",
  },
  inspiration: {
    low: 'Inspiration may feel distant right now. Revisiting something that once excited you can help reconnect the spark.',
    mid: "You're finding some sources of inspiration. Carve out time to explore an idea or interest that pulls at you.",
    high: "You're deeply inspired right now. Channel that energy into a project or idea you care about.",
  },
  focus: {
    low: 'Staying focused may feel difficult lately. Try breaking your next task into one small, clear step.',
    mid: "Your focus is holding up reasonably well. A short distraction-free block of time could sharpen it further.",
    high: "Your focus is strong. Protect it by keeping your priorities visible and your distractions minimal.",
  },
  determination: {
    low: "Your resolve may feel tested right now. Revisit why your goal matters to you, and take one small step forward.",
    mid: "Your determination is steady. Keep reinforcing it by tracking small wins along the way.",
    high: "Your determination is strong right now. Use this momentum to tackle something you've been putting off.",
  },
  compassion: {
    low: 'Compassion for others can be hard to access when you\'re stretched thin. Start with a small act of kindness toward yourself.',
    mid: "You're staying connected to others' experiences. A brief check-in with someone you care about can deepen that.",
    high: "Your compassion is flowing freely. Consider channeling it into supporting someone who could use it today.",
  },
  clarity: {
    low: 'Your next step may feel unclear right now. Try writing down what you know for certain, even if the rest feels foggy.',
    mid: "You have a reasonable sense of direction. Reflecting for a few minutes could sharpen your next step.",
    high: "Your path feels clear right now. Use this clarity to make a decision you've been sitting on.",
  },
  confidence: {
    low: 'Confidence may feel shaky right now. Recall a recent moment, even small, where you handled something well.',
    mid: "Your confidence is holding steady. Setting one small, achievable goal can help build on it.",
    high: "Your confidence is strong. Use it to speak up or take on something slightly outside your comfort zone.",
  },
  enthusiasm: {
    low: "Enthusiasm may feel low right now, and that's okay. Notice if there's one small thing you're mildly curious about today.",
    mid: "You're carrying some genuine excitement. Let yourself lean into what's sparking it.",
    high: "Your enthusiasm is high right now. Use this energy to start something you've been looking forward to.",
  },
  resilience: {
    low: 'Bouncing back may feel harder than usual right now. Be gentle with yourself and take recovery one step at a time.',
    mid: "You're recovering from setbacks reasonably well. Reflecting on what helped you get through a recent challenge can reinforce that skill.",
    high: "Your resilience is strong right now. Recognize the strategies that are working so you can lean on them again.",
  },
  hope: {
    low: 'Hope can be hard to hold onto right now. Try focusing on one small positive possibility, even if the full picture feels unclear.',
    mid: "Your sense of hope is present. Recall a past moment when things worked out better than expected.",
    high: "Your hope is strong right now. Let it fuel a step toward something you're looking forward to.",
  },
  contentment: {
    low: "Contentment may feel far away right now. Try noticing one thing about your current situation that is genuinely okay.",
    mid: "You're finding some sense of peace with where you are. A few quiet, unhurried minutes today could deepen that.",
    high: "You're feeling grounded and at peace right now. Take a moment to acknowledge how far you've come.",
  },
};

export const getGuidanceForScore = (emotionId, band) => {
  const entry = EMOTION_GUIDANCE[emotionId];
  if (!entry) return '';
  if (band === 'LOW') return entry.low;
  if (band === 'MID') return entry.mid;
  return entry.high;
};
