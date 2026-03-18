/**
 * Shadow definitions for iOS and Android.
 * iOS uses shadowColor/shadowOffset/shadowOpacity/shadowRadius.
 * Android uses elevation.
 */

import { Platform, ViewStyle } from 'react-native';

export interface Shadow {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

// ── Factory ──────────────────────────────────────────────────────────────────

const createShadow = (
  offsetHeight: number,
  radius: number,
  opacity: number,
  elevation: number,
): Shadow => ({
  shadowColor: '#000',
  shadowOffset: { width: 0, height: offsetHeight },
  shadowOpacity: opacity,
  shadowRadius: radius,
  elevation: Platform.OS === 'android' ? elevation : 0,
});

// ── Scale ────────────────────────────────────────────────────────────────────

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  } as Shadow,

  xs: createShadow(1, 2, 0.05, 1),
  sm: createShadow(2, 3, 0.1, 2),
  md: createShadow(2, 4, 0.12, 4),
  lg: createShadow(4, 6, 0.15, 8),
  xl: createShadow(6, 8, 0.2, 12),

  // Component-specific presets
  card: createShadow(2, 4, 0.12, 4),
  modal: createShadow(8, 10, 0.25, 16),
  topBar: createShadow(2, 3, 0.12, 4),
  bottomBar: createShadow(-2, 3, 0.12, 4),
} as const;

// ── Helper: merge a shadow level onto an existing style ──────────────────────

export const applyShadow = (
  style: ViewStyle,
  level: keyof typeof shadows,
): ViewStyle => {
  if (level === 'none') return style;
  return { ...style, ...shadows[level] };
};

export default shadows;
