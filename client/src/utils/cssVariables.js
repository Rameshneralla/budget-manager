/**
 * Reads theme colours (CSS custom properties from styles/_theme.scss) so charts
 * use exactly the same palette as the rest of the UI, in light and dark mode.
 */
export function readCssVariable(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function readCssVariables(names) {
  return names.map(readCssVariable);
}
