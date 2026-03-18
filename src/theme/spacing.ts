/**
 * Spacing scale and border radii for the GearConnect design system.
 */

// ── Spacing scale (base unit: 4px) ──────────────────────────────────────────

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

// ── Contextual padding presets ───────────────────────────────────────────────

export const padding = {
  input: 20,
  button: 16,
  card: 16,
  screen: 16,
  modal: 24,
} as const;

// ── Standard component heights ───────────────────────────────────────────────

export const heights = {
  input: 56,
  button: 56,
  smallButton: 40,
  toolbar: 60,
  tabBar: 64,
} as const;

// ── Border radii ─────────────────────────────────────────────────────────────

export const radii = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  round: 1000,
} as const;

// ── Utility: multiply base unit ──────────────────────────────────────────────

export const multiply = (factor: number): number => 8 * factor;

export default {
  ...spacing,
  padding,
  heights,
  radii,
  multiply,
};
