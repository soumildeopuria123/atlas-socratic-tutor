'use client';

import { Moon, Sun } from './icons';
import { useTheme } from './ThemeProvider';

/**
 * Both icons are always rendered and the Tailwind `dark:` variant reveals the
 * right one, so the control is correct before hydration without a mismatch.
 */
export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle light and dark theme"
      title="Toggle theme"
      className={`relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-ink-200 bg-white text-ink-700 transition hover:bg-ink-50 hover:text-atlas-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-atlas-500 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200 dark:hover:bg-ink-800 dark:hover:text-atlas-300 ${className}`}
    >
      <Sun className="h-[18px] w-[18px] dark:hidden" />
      <Moon className="hidden h-[18px] w-[18px] dark:block" />
    </button>
  );
}
