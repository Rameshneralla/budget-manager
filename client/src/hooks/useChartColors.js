/**
 * Chart colours read from the active theme's CSS variables, so charts follow
 * light/dark mode. Re-reads whenever the theme changes.
 */
import { useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { CHART_SERIES_VARIABLES } from '../constants';
import { readCssVariable, readCssVariables } from '../utils/cssVariables';

export function useChartColors() {
  const { theme } = useTheme();

  return useMemo(
    () => ({
      // `theme` is only a trigger: the CSS variables change with it.
      theme,
      series: readCssVariables(CHART_SERIES_VARIABLES),
      grid: readCssVariable('--app-chart-grid'),
      text: readCssVariable('--app-text-secondary'),
      surface: readCssVariable('--app-surface'),
    }),
    [theme]
  );
}
