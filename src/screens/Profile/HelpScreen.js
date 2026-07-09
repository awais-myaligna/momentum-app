import { Text } from 'react-native';

import Card from '../../components/Card';
import Header from '../../components/Header';
import ScreenWrapper from '../../layouts/ScreenWrapper';

const FAQS = [
  {
    question: 'How does the daily check-in work?',
    answer:
      'After your baseline, Momentum checks in on four emotions per day in a rotating 3-day cycle. Each time a group comes back around, you get a fresh question, so the full set of 12 emotions is revisited every 3 days.',
  },
  {
    question: 'What if I miss a day?',
    answer:
      "That's okay. Daily check-ins only take a couple of minutes, but consistency matters more than perfection. You can simply pick up where you left off whenever you return.",
  },
  {
    question: 'What do the chart colors mean?',
    answer:
      'Lower scores appear in red, mid-range scores in yellow or orange, and higher scores in green. Lower scores are not something to fear — they simply show where you may benefit from more awareness, attention, or support.',
  },
  {
    question: 'How is my data used?',
    answer:
      'Your emotional data is stored in your shared Aligna profile, accessible across the Aligna suite, so trends from Momentum can help other Aligna apps provide more relevant, personalized support.',
  },
];

// Static FAQ content grounded in the Momentum Roadmap (sections 9, 6, 13, 14).
const HelpScreen = ({ navigation }) => {
  return (
    <ScreenWrapper scroll>
      <Header
        title="Help & Support"
        onBack={navigation.canGoBack() ? navigation.goBack : undefined}
      />

      {FAQS.map((faq) => (
        <Card key={faq.question} className="mb-3">
          <Text className="mb-1 text-sm font-semibold text-text">{faq.question}</Text>
          <Text className="text-sm leading-5 text-textSecondary">{faq.answer}</Text>
        </Card>
      ))}
    </ScreenWrapper>
  );
};

export default HelpScreen;
