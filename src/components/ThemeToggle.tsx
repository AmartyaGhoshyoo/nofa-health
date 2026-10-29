"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

export type Theme = "dark" | "light";
export const THEME_KEY = "nofa-theme";

// Runs in <head> before the page paints, so a saved light theme never flashes dark.
export const THEME_SCRIPT = `try{document.documentElement.dataset.theme=localStorage.getItem("${THEME_KEY}")||"dark"}catch(e){document.documentElement.dataset.theme="dark"}`;

/** Sun / moon switch. Dark is the default; the choice is remembered in this browser. */
export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme | null>(null);
  useEffect(() => setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark"), []);

  const flip = () => {
    const next: Theme = theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* private mode: the choice lasts for this visit only */
    }
    setTheme(next);
  };

  return (
    <button
      type="button"
      onClick={flip}
      aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
      title={theme === "light" ? "Dark theme" : "Light theme"}
      className={`relative flex h-9 w-9 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-line-strong transition-colors hover:bg-ink/5 ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.svg
          key={theme ?? "none"}
          viewBox="0 0 24 24"
          className="h-[18px] w-[18px]"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          initial={{ y: 14, opacity: 0, rotate: -40 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: -14, opacity: 0, rotate: 40 }}
          transition={{ duration: 0.3 }}
          aria-hidden="true"
        >
          {theme === "light" ? (
            // Moon: switch to dark
            <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
          ) : (
            // Sun: switch to light
            <>
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </>
          )}
        </motion.svg>
      </AnimatePresence>
    </button>
  );
}
