/**
 * GearConnect Design System -- barrel export.
 *
 * Usage:
 *   import { useTheme, createStyles, lightColors, spacing } from '@/theme';
 */

// Colors
export { palette, lightColors, darkColors } from './colors';
export type { ThemeColors } from './colors';

// Typography
export { fontSizes, fontWeights, lineHeights, textStyles } from './typography';
export type { FontWeight } from './typography';
export { default as typography } from './typography';

// Spacing & layout
export { spacing, padding, heights, radii, multiply } from './spacing';

// Shadows
export { shadows, applyShadow } from './shadows';
export type { Shadow } from './shadows';

// Theme provider & hook
export { ThemeProvider, useTheme, createStyles } from './ThemeProvider';
export type { Theme } from './ThemeProvider';
