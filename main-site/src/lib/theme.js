export const THEME_CHANGE_EVENT = 'cipher-themechange';

/**
 * CIPHER always boots into dark mode — the dark terminal look is the
 * intended first impression, on every visit. The toggle still lets someone
 * switch to light mode, but that only lasts for the current page load; the
 * choice is deliberately not saved.
 */
export function getInitialTheme() {
  return 'dark';
}

/**
 * Writes the theme to <html data-theme="..."> (what every CSS variable in
 * index.css keys off of), then tells anything that can't just read CSS
 * variables (canvas-drawn pieces) that it changed. Not persisted — see
 * getInitialTheme().
 */
export function applyTheme(theme) {
  if (typeof document === 'undefined') return;

  document.documentElement.setAttribute('data-theme', theme);

  window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: theme }));
}
