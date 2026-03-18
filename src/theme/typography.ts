/**
 * Typography definitions for the GearConnect design system.
 * Font sizes, weights, line heights, and pre-built text style presets.
 */

import { TextStyle } from 'react-native';

// ── Font weight type ─────────────────────────────────────────────────────────

export type FontWeight = '300' | '400' | '500' | '600' | '700' | '800' | '900';

// ── Size scale ───────────────────────────────────────────────────────────────

export const fontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 24,
  xxxl: 30,
} as const;

// ── Weight scale ─────────────────────────────────────────────────────────────

export const fontWeights: Record<string, FontWeight> = {
  light: '300',
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
  extraBold: '800',
  black: '900',
} as const;

// ── Line heights ─────────────────────────────────────────────────────────────

export const lineHeights = {
  xs: 18,
  sm: 20,
  md: 22,
  lg: 24,
  xl: 26,
  xxl: 28,
  xxxl: 30,
  heading1: 38,
  heading2: 32,
} as const;

// ── Pre-built text styles (color-agnostic, theme applies color) ──────────────

export const textStyles: Record<string, TextStyle> = {
  // Headings
  h1: {
    fontSize: fontSizes.xxxl,
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.heading1,
  },
  h2: {
    fontSize: fontSizes.xxl,
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.heading2,
  },
  h3: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.xxxl,
  },
  h4: {
    fontSize: 20,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.xxl,
  },
  h5: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.xl,
  },
  h6: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.lg,
  },

  // Body text
  body1: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.lg,
  },
  body2: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.md,
  },

  // Subtitles
  subtitle1: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semiBold,
    lineHeight: lineHeights.lg,
  },
  subtitle2: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semiBold,
    lineHeight: lineHeights.md,
  },

  // Functional
  caption: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.xs,
  },
  button: {
    fontSize: 15,
    fontWeight: fontWeights.semiBold,
    lineHeight: lineHeights.md,
    letterSpacing: 0.5,
  },
  label: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.sm,
  },
  error: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.xs,
  },
};

const typography = {
  fontSizes,
  fontWeights,
  lineHeights,
  textStyles,
};

export default typography;
