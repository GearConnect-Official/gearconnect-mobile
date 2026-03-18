/**
 * Theme provider and useTheme hook.
 * Combines system color-scheme detection with manual override.
 * Provides the full Theme object via React context.
 */

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useColorScheme, StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { lightColors, darkColors, type ThemeColors } from './colors';
import typography from './typography';
import { spacing, padding, heights, radii, multiply } from './spacing';
import { shadows, applyShadow } from './shadows';

// ── Theme shape ──────────────────────────────────────────────────────────────

export interface Theme {
  colors: ThemeColors;
  typography: typeof typography;
  spacing: typeof spacing;
  padding: typeof padding;
  heights: typeof heights;
  radii: typeof radii;
  multiply: typeof multiply;
  shadows: typeof shadows;
  applyShadow: typeof applyShadow;
  isDark: boolean;
}

// ── Build theme objects ──────────────────────────────────────────────────────

const buildTheme = (colors: ThemeColors, isDark: boolean): Theme => ({
  colors,
  typography,
  spacing,
  padding,
  heights,
  radii,
  multiply,
  shadows,
  applyShadow,
  isDark,
});

const lightTheme = buildTheme(lightColors, false);
const darkTheme = buildTheme(darkColors, true);

// ── Context ──────────────────────────────────────────────────────────────────

type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  isDarkMode: boolean;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: lightTheme,
  isDarkMode: false,
  toggleTheme: () => {},
  setTheme: () => {},
});

// ── Provider ─────────────────────────────────────────────────────────────────

interface ThemeProviderProps {
  children: React.ReactNode;
  initialTheme?: ThemeMode | 'system';
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  initialTheme = 'system',
}) => {
  const systemScheme = useColorScheme();

  const [mode, setMode] = useState<ThemeMode>(
    initialTheme === 'system'
      ? systemScheme === 'dark' ? 'dark' : 'light'
      : initialTheme,
  );

  // Follow system changes when in "system" mode
  useEffect(() => {
    if (initialTheme === 'system') {
      setMode(systemScheme === 'dark' ? 'dark' : 'light');
    }
  }, [systemScheme, initialTheme]);

  const isDarkMode = mode === 'dark';
  const theme = isDarkMode ? darkTheme : lightTheme;

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      isDarkMode,
      toggleTheme: () => setMode((prev) => (prev === 'light' ? 'dark' : 'light')),
      setTheme: (m: ThemeMode) => setMode(m),
    }),
    [theme, isDarkMode],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// ── Hook ─────────────────────────────────────────────────────────────────────

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a <ThemeProvider>');
  }
  return ctx;
};

// ── createStyles helper ──────────────────────────────────────────────────────

type NamedStyles<T> = {
  [P in keyof T]: ViewStyle | TextStyle | ImageStyle;
};

/**
 * Helper that takes a theme and returns a StyleSheet.
 *
 * Usage:
 * ```ts
 * const makeStyles = createStyles((theme) => ({
 *   container: { backgroundColor: theme.colors.background.default },
 * }));
 *
 * // Inside a component:
 * const { theme } = useTheme();
 * const styles = makeStyles(theme);
 * ```
 */
export const createStyles = <T extends NamedStyles<T>>(
  factory: (theme: Theme) => T,
) => {
  return (theme: Theme) => StyleSheet.create(factory(theme));
};

export default ThemeProvider;
