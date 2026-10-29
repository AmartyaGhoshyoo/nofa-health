import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: { DEFAULT: "#F5F9F9", soft: "#EAF3F3" },
        surface: "#FFFFFF",
        ink: { DEFAULT: "#0F2B33", muted: "#46606A", faint: "#5B737C" },
        teal: {
          DEFAULT: "#0E7490", // buttons, accent text (AA on white)
          hover: "#0B5F77",
          bright: "#0891B2", // chart marks
          light: "#22D3EE", // decorative only
          soft: "rgba(14,116,144,0.08)",
        },
        mint: { DEFAULT: "#059669", soft: "rgba(5,150,105,0.1)" }, // "confirmed" status
        amber: { DEFAULT: "#B45309", soft: "rgba(180,83,9,0.1)" }, // "needs staff" status
        rose: { DEFAULT: "#BE123C", soft: "rgba(190,18,60,0.08)" }, // "affected" status
        ocean: { DEFAULT: "#062A33", soft: "#0B3A45", line: "rgba(255,255,255,0.1)" },
        line: { DEFAULT: "rgba(15,43,51,0.09)", strong: "rgba(15,43,51,0.16)" },
        // Animated homepage ("night shift"): near-black canvas, luminous aqua, lime spark.
        night: { DEFAULT: "#04080A", 900: "#070D10", 800: "#0B1418", 700: "#122027", line: "rgba(255,255,255,0.08)" },
        aqua: { DEFAULT: "#5EEAD4", deep: "#14B8A6", sky: "#67E8F9" },
        spark: { DEFAULT: "#C8F169", deep: "#A3D63A" },
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
