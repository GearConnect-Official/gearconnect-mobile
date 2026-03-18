/**
 * Color palette for the GearConnect design system.
 * Provides both a base palette and light/dark semantic theme colors.
 */

// ── Base palette (raw color values) ──────────────────────────────────────────

export const palette = {
  // Primary reds
  red50: '#FFEBEE',
  red100: '#FFCDD2',
  red200: '#FF8A80',
  red300: '#FF5252',
  red400: '#F44336',
  red500: '#E53935',
  red600: '#E10600',
  red700: '#C62828',
  red800: '#B71C1C',
  red900: '#7F0000',

  // Greys
  grey50: '#F7F8F9',
  grey100: '#E8ECF4',
  grey200: '#DAE0E6',
  grey300: '#C7CDD6',
  grey400: '#B4BAC4',
  grey500: '#8391A1',
  grey600: '#6A707C',
  grey700: '#474C54',
  grey800: '#2B303A',
  grey900: '#1E232C',

  // Dark greys (for dark theme)
  darkGrey50: '#292929',
  darkGrey100: '#333333',
  darkGrey200: '#404040',
  darkGrey300: '#4D4D4D',
  darkGrey400: '#666666',
  darkGrey500: '#808080',
  darkGrey600: '#9E9E9E',
  darkGrey700: '#BDBDBD',
  darkGrey800: '#E0E0E0',
  darkGrey900: '#F5F5F5',

  // Status
  error: '#FF3B30',
  errorLight: '#FF5252',
  warning: '#FF9500',
  warningLight: '#FFB74D',
  info: '#E57373',
  infoLight: '#FF8A80',
  success: '#34C759',
  successLight: '#69F0AE',

  // Common
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

// ── Semantic theme color type ────────────────────────────────────────────────

export interface ThemeColors {
  primary: {
    main: string;
    light: string;
    dark: string;
  };
  secondary: {
    main: string;
    light: string;
    dark: string;
  };
  grey: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  text: {
    primary: string;
    secondary: string;
    disabled: string;
    hint: string;
  };
  background: {
    default: string;
    paper: string;
    input: string;
  };
  status: {
    error: string;
    warning: string;
    info: string;
    success: string;
  };
  common: {
    white: string;
    black: string;
    transparent: string;
  };
  border: {
    light: string;
    medium: string;
    dark: string;
  };
}

// ── Light theme colors ───────────────────────────────────────────────────────

export const lightColors: ThemeColors = {
  primary: {
    main: '#E53935',
    light: '#FF5252',
    dark: '#C62828',
  },
  secondary: {
    main: '#B71C1C',
    light: '#D32F2F',
    dark: '#7F0000',
  },
  grey: {
    50: '#F7F8F9',
    100: '#E8ECF4',
    200: '#DAE0E6',
    300: '#C7CDD6',
    400: '#B4BAC4',
    500: '#8391A1',
    600: '#6A707C',
    700: '#474C54',
    800: '#2B303A',
    900: '#1E232C',
  },
  text: {
    primary: '#1E232C',
    secondary: '#6A707C',
    disabled: '#8391A1',
    hint: '#8391A1',
  },
  background: {
    default: 'rgba(255, 245, 245, 1)',
    paper: '#FFFFFF',
    input: 'rgba(253, 242, 242, 1)',
  },
  status: {
    error: '#FF3B30',
    warning: '#FF9500',
    info: '#E57373',
    success: '#34C759',
  },
  common: {
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
  },
  border: {
    light: 'rgba(229, 57, 53, 0.1)',
    medium: 'rgba(229, 57, 53, 0.2)',
    dark: 'rgba(229, 57, 53, 0.3)',
  },
};

// ── Dark theme colors ────────────────────────────────────────────────────────

export const darkColors: ThemeColors = {
  primary: {
    main: '#F44336',
    light: '#FF7961',
    dark: '#BA000D',
  },
  secondary: {
    main: '#EF5350',
    light: '#FF867C',
    dark: '#B61827',
  },
  grey: {
    50: '#292929',
    100: '#333333',
    200: '#404040',
    300: '#4D4D4D',
    400: '#666666',
    500: '#808080',
    600: '#9E9E9E',
    700: '#BDBDBD',
    800: '#E0E0E0',
    900: '#F5F5F5',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#FFCDD2',
    disabled: '#757575',
    hint: '#9E9E9E',
  },
  background: {
    default: '#1F1212',
    paper: '#2C1A1A',
    input: '#2C1A1A',
  },
  status: {
    error: '#FF5252',
    warning: '#FFB74D',
    info: '#FF8A80',
    success: '#69F0AE',
  },
  common: {
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
  },
  border: {
    light: 'rgba(244, 67, 54, 0.2)',
    medium: 'rgba(244, 67, 54, 0.35)',
    dark: 'rgba(244, 67, 54, 0.5)',
  },
};
