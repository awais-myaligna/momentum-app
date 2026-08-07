import { Linking, Text, View } from 'react-native';

import BottomButton from '../../components/BottomButton';
import Card from '../../components/Card';
import Icon from '../../components/Icon';
import { ICONS } from '../../constants/icons';
import { useAssessment } from '../../context/AssessmentContext';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { ASSESSMENT_ROUTES } from '../../navigation/routes';
import { COLORS } from '../../styles/colors';

// Reached when the voice agent calls flag_needs_support (SYSTEM_PROMPT.md's
// crisis-language redirect / TOOLS_AND_APIS.md §2.2). This screen is a
// bridge to real help, not the help itself — Momentum is not a crisis
// service. Copy here should get a clinical/legal review before shipping;
// this is a first pass, not a final version.
const SupportResourcesScreen = ({ navigation }) => {
  const { currentEmotion } = useAssessment();

  const handleReturnToCheckIn = () => {
    navigation.replace(ASSESSMENT_ROUTES.CONVERSATION);
  };

  return (
    <ScreenWrapper
      scroll
      footer={<BottomButton label="I'm okay — return to my check-in" onPress={handleReturnToCheckIn} />}>
      <View className="mt-4 mb-6 items-center">
        <Icon name={ICONS.HELP} size={48} color={COLORS.primary} />
        <Text className="mt-4 text-center text-2xl font-bold text-text">You don&apos;t have to go through this alone</Text>
        <Text className="mt-2 text-center text-sm leading-5 text-textSecondary">
          Something you shared sounded like it might be a heavy moment. Momentum isn&apos;t able to help with a crisis
          directly, but real support is available right now.
        </Text>
      </View>

      <Card className="mb-3">
        <Text className="mb-1 text-sm font-semibold text-text">988 Suicide &amp; Crisis Lifeline (US)</Text>
        <Text className="mb-2 text-sm leading-5 text-textSecondary">Call or text 988 — free, confidential, 24/7.</Text>
        <Text className="text-sm font-semibold text-primary" onPress={() => Linking.openURL('tel:988')}>
          Call 988
        </Text>
      </Card>

      <Card className="mb-3">
        <Text className="mb-1 text-sm font-semibold text-text">Crisis Text Line</Text>
        <Text className="mb-2 text-sm leading-5 text-textSecondary">Text HOME to 741741 — free, confidential, 24/7.</Text>
        <Text className="text-sm font-semibold text-primary" onPress={() => Linking.openURL('sms:741741?body=HOME')}>
          Text 741741
        </Text>
      </Card>

      <Card className="mb-3">
        <Text className="mb-1 text-sm font-semibold text-text">In immediate danger?</Text>
        <Text className="mb-2 text-sm leading-5 text-textSecondary">Call 911 (US) or your local emergency number right away.</Text>
        <Text className="text-sm font-semibold text-danger" onPress={() => Linking.openURL('tel:911')}>
          Call 911
        </Text>
      </Card>

      <Text className="mt-2 text-center text-xs leading-5 text-textSecondary">
        When you&apos;re ready, you can pick your {currentEmotion?.name?.toLowerCase() ?? 'check-in'} question back up —
        there&apos;s no rush.
      </Text>
    </ScreenWrapper>
  );
};

export default SupportResourcesScreen;
