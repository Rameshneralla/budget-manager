/**
 * Light / dark theme. Sets data-bs-theme on <html>, which switches both
 * Bootstrap and the app's CSS variables (styles/_theme.scss).
 *
 * The attribute is applied immediately (not in an effect) so components that
 * read CSS variables while rendering - the charts - get the new theme's colours.
 */
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { THEMES, THEME_STORAGE_KEY } from '../constants';
import { readPreference, writePreference } from '../utils/browserStorage';

const ThemeContext = createContext(null);

function applyTheme(theme) {
  document.documentElement.setAttribute('data-bs-theme', theme);
}

function getInitialTheme() {
  const saved = readPreference(THEME_STORAGE_KEY);
  if (saved === THEMES.LIGHT || saved === THEMES.DARK) {
    return saved;
  }
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  return prefersDark ? THEMES.DARK : THEMES.LIGHT;
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const initialTheme = getInitialTheme();
    applyTheme(initialTheme);
    return initialTheme;
  });

  const toggleTheme = useCallback(() => {
    const nextTheme = theme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
    applyTheme(nextTheme);
    writePreference(THEME_STORAGE_KEY, nextTheme);
    setTheme(nextTheme);
  }, [theme]);

  const value = useMemo(
    () => ({ theme, isDark: theme === THEMES.DARK, toggleTheme }),
    [theme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used inside <ThemeProvider>.');
  }
  return context;
}
