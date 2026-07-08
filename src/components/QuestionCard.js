import { memo } from 'react';
import { Text, View } from 'react-native';

import Card from './Card';
import VoicePlayer from './VoicePlayer';

/**
 * Displays the current conversational check-in question, optionally with
 * its pre-recorded voice prompt (see roadmap section 10, "Rotating
 * Questions", and the Voice Prompt Strategy appendix).
 */
const QuestionCard = ({ emotionName, question, audioSource, children }) => {
  return (
    <Card>
      {emotionName ? (
        <Text className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">{emotionName}</Text>
      ) : null}
      <Text className="text-lg font-medium leading-6 text-text">{question}</Text>
      {audioSource ? (
        <View className="mt-4">
          <VoicePlayer source={audioSource} label={`Listen: ${emotionName ?? 'question'}`} />
        </View>
      ) : null}
      {children ? <View className="mt-5">{children}</View> : null}
    </Card>
  );
};

export default memo(QuestionCard);
