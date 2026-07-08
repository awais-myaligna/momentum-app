import { useEffect } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

import { COLORS } from '../styles/colors';

/**
 * Plays a pre-recorded voice prompt (see Momentum roadmap: check-in
 * questions are pre-recorded audio rather than live TTS to keep the
 * experience fast, offline-friendly, and cheap to run at scale).
 * `source` is a require()'d local audio asset or a { uri } object.
 */
const VoicePlayer = ({ source, label = 'Play prompt', autoPlay = false }) => {
  const player = useAudioPlayer(source);
  const status = useAudioPlayerStatus(player);
  const isPlaying = status?.playing ?? false;

  useEffect(() => {
    if (autoPlay && source) {
      player.play();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  const togglePlayback = () => {
    if (isPlaying) {
      player.pause();
    } else {
      if (status?.didJustFinish) {
        player.seekTo(0);
      }
      player.play();
    }
  };

  const progress = status?.duration ? Math.min(status.currentTime / status.duration, 1) : 0;

  return (
    <View className="flex-row items-center rounded-2xl bg-white px-4 py-3">
      <TouchableOpacity
        onPress={togglePlayback}
        accessibilityRole="button"
        accessibilityLabel={isPlaying ? 'Pause voice prompt' : `Play voice prompt: ${label}`}
        className="h-11 w-11 items-center justify-center rounded-full bg-primary">
        <Text className="text-base text-white">{isPlaying ? '❚❚' : '▶'}</Text>
      </TouchableOpacity>
      <View className="ml-3 flex-1">
        <Text className="text-sm font-medium text-text" numberOfLines={1}>
          {label}
        </Text>
        <View className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray200">
          <View
            className="h-1.5 rounded-full"
            style={{ width: `${progress * 100}%`, backgroundColor: COLORS.primary }}
          />
        </View>
      </View>
    </View>
  );
};

export default VoicePlayer;
