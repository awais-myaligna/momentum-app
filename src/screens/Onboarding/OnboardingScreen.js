import { useRef, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';

import BottomButton from '../../components/BottomButton';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { ONBOARDING_ROUTES } from '../../navigation/routes';

// Copy drawn directly from the Momentum roadmap (Section 1: Introduction).
const SLIDES = [
  {
    icon: '🧭',
    title: 'Welcome to Momentum',
    description:
      'Momentum helps you build emotional awareness over time by understanding patterns across 12 core emotional states, not just recording daily moods.',
  },
  {
    icon: '💬',
    title: 'A conversation, not a survey',
    description:
      'Momentum uses conversational AI to guide you through natural, reflective questions that help you understand how you currently feel.',
  },
  {
    icon: '📈',
    title: 'See your progress, visually',
    description:
      'Over time, Momentum creates visual charts that reveal emotional trends, helping you recognize strengths, growth areas, and opportunities.',
  },
  {
    icon: '🌱',
    title: 'Gentle, judgment-free support',
    description:
      "When an emotion stays low, Momentum gently offers thoughtful prompts and simple actions. The goal isn't perfection. It's awareness and growth.",
  },
];

const OnboardingScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const scrollRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const isLastSlide = activeIndex === SLIDES.length - 1;

  const goToIntroduction = () => navigation.navigate(ONBOARDING_ROUTES.INTRODUCTION);

  const handleNext = () => {
    if (isLastSlide) {
      goToIntroduction();
      return;
    }
    scrollRef.current?.scrollTo({ x: (activeIndex + 1) * width, animated: true });
  };

  const handleScrollEnd = (event) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
  };

  return (
    <ScreenWrapper padded={false}>
      <View className="flex-row justify-end px-5 pt-2">
        <TouchableOpacity
          onPress={goToIntroduction}
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text className="text-sm font-medium text-textSecondary">Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        className="flex-1">
        {SLIDES.map((slide) => (
          <View key={slide.title} style={{ width }} className="flex-1 items-center justify-center px-8">
            <Text className="text-6xl">{slide.icon}</Text>
            <Text className="mt-6 text-center text-2xl font-bold text-text">{slide.title}</Text>
            <Text className="mt-3 text-center text-base leading-6 text-textSecondary">{slide.description}</Text>
          </View>
        ))}
      </ScrollView>

      <View className="flex-row justify-center py-4">
        {SLIDES.map((slide, index) => (
          <View
            key={slide.title}
            className={`mx-1 h-2 rounded-full ${index === activeIndex ? 'w-6 bg-primary' : 'w-2 bg-gray300'}`}
          />
        ))}
      </View>

      <BottomButton label={isLastSlide ? 'Get Started' : 'Next'} onPress={handleNext} />
    </ScreenWrapper>
  );
};

export default OnboardingScreen;
