import ScreenWrapper from '../../layouts/ScreenWrapper';
import EmptyState from '../../components/EmptyState';

// Conversational per-emotion question (QuestionCard + VoicePlayer) lands in Phase 3.
const ConversationScreen = () => (
  <ScreenWrapper>
    <EmptyState icon="💬" title="Conversation" description="The check-in conversation flow is coming in Phase 3." />
  </ScreenWrapper>
);

export default ConversationScreen;
