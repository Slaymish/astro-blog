import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark";

function SunIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>("dark");

  useEffect(() => {
    const stored = (localStorage.getItem("theme") as ThemeMode) || "dark";
    setMode(stored);
    applyTheme(stored);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if ((localStorage.getItem("theme") || "dark") === "dark") {
        applyTheme("dark");
      }
    };
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, []);

  function applyTheme(m: ThemeMode) {
    const html = document.documentElement;
    html.classList.remove("light", "dark");
    html.classList.add(m);
    html.setAttribute("data-theme", m);
    localStorage.setItem("theme", m);
  }

  function toggle() {
    const next: ThemeMode = mode === "light" ? "dark" : "light";
    setMode(next);
    applyTheme(next);
  }

  const labels: Record<ThemeMode, string> = {
    light: "Theme: light (click for dark)",
    dark: "Theme: dark (click for light)",
  };

  return (
    <button
      onClick={toggle}
      className="cursor-pointer bg-[var(--surface)] border-none rounded-full p-2 flex items-center justify-center text-[var(--text)] transition-all duration-200 hover:text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-2"
      style={{ boxShadow: "var(--shadow-neu)" }}
      aria-label={labels[mode]}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={mode}
          initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
          transition={{ duration: 0.2 }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {mode === "light" ? <SunIcon /> : <MoonIcon />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
