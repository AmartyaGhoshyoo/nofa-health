import type { Config } from "tailwindcss";

// A theme colour from globals.css, with Tailwind's opacity modifier support.
const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Theme-aware: values live in globals.css (light by default, dark under data-theme="dark").
        canvas: { DEFAULT: v("canvas"), soft: v("canvas-soft") },
        surface: v("surface"),
        ink: { DEFAULT: v("ink"), muted: v("ink-muted"), faint: v("ink-faint") },
        teal: {
          DEFAULT: v("teal"), // buttons, accent text
          hover: v("teal-hover"),
          bright: v("teal-bright"), // chart marks
          light: v("teal-light"), // decorative only
          soft: "rgb(var(--teal) / 0.1)",
        },
        mint: { DEFAULT: v("mint"), soft: "rgb(var(--mint) / 0.12)" }, // "confirmed" status
        amber: { DEFAULT: v("amber"), soft: "rgb(var(--amber) / 0.12)" }, // "needs staff" status
        rose: { DEFAULT: v("rose"), soft: "rgb(var(--rose) / 0.1)" }, // "affected" status
        "on-accent": v("on-accent"),
        ocean: { DEFAULT: "#062A33", soft: "#0B3A45", line: "rgba(255,255,255,0.1)" },
        line: { DEFAULT: "rgb(var(--ink) / 0.1)", strong: "rgb(var(--ink) / 0.18)" },
        // Animated homepage ("night shift"): th-* follow the theme; th-on is always dark
        // (text on aqua / lime fills).
        th: {
          bg: v("th-bg"),
          panel: v("th-panel"),
          fg: v("th-fg"),
          line: "rgb(var(--th-fg) / 0.09)",
          aqua: { DEFAULT: v("th-aqua"), ink: v("th-aqua-ink") },
          spark: { DEFAULT: v("th-spark"), ink: v("th-spark-ink") },
          on: "#04080A",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        widget: ["var(--font-widget)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      maxWidth: { wrap: "1200px" },
      keyframes: {
        blink: { "0%, 50%": { opacity: "1" }, "50.01%, 100%": { opacity: "0" } },
        marquee: { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } },
        "marquee-reverse": { "0%": { transform: "translateX(-50%)" }, "100%": { transform: "translateX(0)" } },
        "spin-slow": { to: { transform: "rotate(360deg)" } },
      },
      animation: {
        blink: "blink 1s step-end infinite",
        marquee: "marquee 40s linear infinite",
        "marquee-reverse": "marquee-reverse 44s linear infinite",
        "spin-slow": "spin-slow 6s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
