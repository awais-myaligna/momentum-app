// After the baseline assessment, Momentum checks in on 4 emotions per day,
// rotating through a 3-day cycle so the full set of 12 emotions is revisited
// every 3 days without overwhelming the user in a single session.
export const DAILY_CHECKIN_GROUPS = [
  ['joy', 'gratitude', 'inspiration', 'focus'],
  ['determination', 'compassion', 'clarity', 'confidence'],
  ['enthusiasm', 'resilience', 'hope', 'contentment'],
];

// dayNumber is 1-indexed (Day 1, Day 2, Day 3, Day 4...). The cycle repeats
// every 3 days, and the *question index* within each emotion's rotation
// advances every time that group comes back around.
export const getGroupForDay = (dayNumber) => {
  const groupIndex = (dayNumber - 1) % DAILY_CHECKIN_GROUPS.length;
  return DAILY_CHECKIN_GROUPS[groupIndex];
};

export const getQuestionRotationForDay = (dayNumber) => {
  return Math.floor((dayNumber - 1) / DAILY_CHECKIN_GROUPS.length);
};
