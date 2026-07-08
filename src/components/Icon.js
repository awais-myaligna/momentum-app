import { memo } from 'react';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../styles/colors';

/**
 * Single entry point for icons app-wide (Ionicons via @expo/vector-icons).
 * Keeping this as the only place that imports Ionicons directly makes it
 * trivial to swap icon sets later without touching every screen.
 */
const Icon = ({ name, size = 22, color = COLORS.text, ...props }) => (
  <Ionicons name={name} size={size} color={color} {...props} />
);

export default memo(Icon);
