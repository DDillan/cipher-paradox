import { useEffect, useState } from 'react';
import { applyTheme, getInitialTheme } from '../lib/theme';
import './ThemeToggle.css';

function ThemeToggle({ className = '' }) {
  const [theme, setTheme] = useState(getInitialTheme);

  // Make sure <html data-theme> matches on first mount (the inline script
  // in index.html already did this for light mode, this covers dark too
  // and keeps everything in one source of truth).
  useEffect(() => {
    applyTheme(theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = () => {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      return next;
    });
  };

  const isLight = theme === 'light';

  return (
    <button
      type="button"
      className={`theme-toggle ${className}`}
      onClick={toggle}
      aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      aria-pressed={isLight}
      title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {/* Sun icon — shown in light mode (click to go dark) */}
      <svg
        className="theme-toggle-icon theme-toggle-sun"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4.2" />
        <line x1="12" y1="1.5" x2="12" y2="4" />
        <line x1="12" y1="20" x2="12" y2="22.5" />
        <line x1="4.2" y1="4.2" x2="5.9" y2="5.9" />
        <line x1="18.1" y1="18.1" x2="19.8" y2="19.8" />
        <line x1="1.5" y1="12" x2="4" y2="12" />
        <line x1="20" y1="12" x2="22.5" y2="12" />
        <line x1="4.2" y1="19.8" x2="5.9" y2="18.1" />
        <line x1="18.1" y1="5.9" x2="19.8" y2="4.2" />
      </svg>

      {/* Moon icon — shown in dark mode (click to go light) */}
      <svg
        className="theme-toggle-icon theme-toggle-moon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20.5 14.2A8.5 8.5 0 1 1 9.8 3.5a6.8 6.8 0 0 0 10.7 10.7Z" />
      </svg>
    </button>
  );
}

export default ThemeToggle;
