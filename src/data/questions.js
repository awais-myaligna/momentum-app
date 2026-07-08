// Rotating reflective questions per emotion. The baseline Emotional Compass
// Check-in always uses index 0 (a warmer, open framing). Daily check-ins
// rotate through DAILY_QUESTIONS by the current rotation index so the same
// question is never repeated back-to-back across cycles.
export const BASELINE_QUESTIONS = {
  joy: "Let's start with joy. Thinking about the last few days, how much happiness or lightness have you felt?",
  gratitude:
    'How connected do you feel right now to the good things in your life — the people, moments, or opportunities you appreciate?',
  inspiration:
    'Have you felt a spark of inspiration lately — an idea, person, or experience that moved you toward something you care about?',
  focus:
    'How well have you been able to direct your attention toward what matters most to you recently?',
  determination:
    "When challenges come up, how would you describe your resolve to keep moving forward right now?",
  compassion:
    'How connected do you feel to the experiences of the people around you lately?',
  clarity: "How clear does your path or next step feel to you at this moment?",
  confidence:
    'How much do you trust your own abilities and judgment right now?',
  enthusiasm:
    'How excited do you feel about what is ahead of you these days?',
  resilience:
    'When something knocks you off balance, how quickly do you feel you bounce back these days?',
  hope: 'How optimistic do you feel about things working out, even when the path is not fully clear?',
  contentment:
    'How much peace do you feel with where you are right now, without needing something more?',
};

export const DAILY_QUESTIONS = {
  joy: [
    'How joyful do you feel today, from 1 to 10?',
    'How much lightness or happiness showed up for you today, from 1 to 10?',
    'On a scale of 1 to 10, how much positive energy did today bring you?',
  ],
  gratitude: [
    'How grateful do you feel today, from 1 to 10?',
    'From 1 to 10, how much appreciation have you felt for the good things around you today?',
    'How present has gratitude been for you today, from 1 to 10?',
  ],
  inspiration: [
    'How inspired do you feel today, from 1 to 10?',
    'From 1 to 10, how much creative spark or motivation have you felt today?',
    'How connected do you feel to your bigger goals today, from 1 to 10?',
  ],
  focus: [
    'How focused do you feel today, from 1 to 10?',
    'From 1 to 10, how well were you able to stay present with what mattered today?',
    'How clear was your attention today, from 1 to 10?',
  ],
  determination: [
    'How determined do you feel today, from 1 to 10?',
    'From 1 to 10, how strong was your resolve to keep going today?',
    'How committed did you feel to your goals today, from 1 to 10?',
  ],
  compassion: [
    'How compassionate do you feel today, from 1 to 10?',
    'From 1 to 10, how connected did you feel to the people around you today?',
    'How much kindness did you extend to others today, from 1 to 10?',
  ],
  clarity: [
    'How clear does your path feel today, from 1 to 10?',
    'From 1 to 10, how well do you understand your next step today?',
    'How much mental clarity did you have today, from 1 to 10?',
  ],
  confidence: [
    'How confident do you feel today, from 1 to 10?',
    'From 1 to 10, how much did you trust your own decisions today?',
    'How self-assured did you feel today, from 1 to 10?',
  ],
  enthusiasm: [
    'How enthusiastic do you feel today, from 1 to 10?',
    'From 1 to 10, how excited did you feel about your day?',
    'How much positive anticipation did you feel today, from 1 to 10?',
  ],
  resilience: [
    'How resilient do you feel today, from 1 to 10?',
    'From 1 to 10, how well did you recover from any setbacks today?',
    'How emotionally strong did you feel today, from 1 to 10?',
  ],
  hope: [
    'How hopeful do you feel today, from 1 to 10?',
    'From 1 to 10, how optimistic did you feel about what is ahead?',
    'How much did you believe things would work out today, from 1 to 10?',
  ],
  contentment: [
    'How content do you feel today, from 1 to 10?',
    'From 1 to 10, how at peace did you feel with where you are today?',
    'How grounded did you feel today, from 1 to 10?',
  ],
};

export const getDailyQuestion = (emotionId, rotationIndex) => {
  const set = DAILY_QUESTIONS[emotionId] || [];
  if (set.length === 0) return '';
  return set[rotationIndex % set.length];
};
