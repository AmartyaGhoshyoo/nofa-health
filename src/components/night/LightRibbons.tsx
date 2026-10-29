"use client";

import { useEffect, useRef } from "react";
import type { MotionValue } from "motion/react";

// Flowing ribbons of light on a canvas: each ribbon is a bundle of thin sine strands.
// `progress` (0–1, how far down the page) drifts, tilts and recolours them as you
// scroll; `energy` (0–1, scroll speed) makes them swell and glow. Dark theme blends
// the strands additively so crossings glow; light theme draws them as soft ink.
// Pauses when hidden; a single still frame under "reduce motion".
const RIBBONS = [
  { y: 0.72, slope: 0.42, amp: 70, freq: 0.0042, speed: 0.32, phase: 0, dark: ["#14B8A6", "#5EEAD4", "#C8F169"], light: ["#0F766E", "#0D9488", "#65A30D"] },
  { y: 0.9, slope: 0.55, amp: 95, freq: 0.0031, speed: 0.22, phase: 2.1, dark: ["#0E7490", "#67E8F9", "#5EEAD4"], light: ["#0E7490", "#0891B2", "#0D9488"] },
  { y: 0.58, slope: 0.3, amp: 55, freq: 0.0056, speed: 0.4, phase: 4.2, dark: ["#5EEAD4", "#C8F169", "#14B8A6"], light: ["#0D9488", "#4D7C0F", "#0F766E"] },
];
const STRANDS = 22;

type Source = number | MotionValue<number>;
const read = (s: Source) => (typeof s === "number" ? s : s.get());

export default function LightRibbons({
  progress = 0,
  energy = 0,
  className = "",
}: {
  progress?: Source;
  energy?: Source;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputs = useRef({ progress, energy });
  inputs.current = { progress, energy };

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let frame = 0;
    let visible = true;
    let theme = "";
    let gradients: CanvasGradient[] = [];

    const isDark = () => document.documentElement.dataset.theme === "dark";

    const paint = () => {
      theme = isDark() ? "dark" : "light";
      gradients = RIBBONS.map((r) => {
        const g = ctx.createLinearGradient(0, height, width, 0);
        const colors = theme === "dark" ? r.dark : r.light;
        colors.forEach((c, i) => g.addColorStop(i / (colors.length - 1), c));
        return g;
      });
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paint();
    };

    const draw = (time: number) => {
      if ((isDark() ? "dark" : "light") !== theme) paint();
      const dark = theme === "dark";
      const t = time / 1000;
      const p = read(inputs.current.progress);
      const e = Math.min(1, Math.max(0, read(inputs.current.energy)));
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = dark ? "lighter" : "source-over";
      const step = width < 700 ? 16 : 12;
      RIBBONS.forEach((r, ri) => {
        ctx.strokeStyle = gradients[ri] ?? r.dark[0]!;
        // Scrolling down the page sweeps each ribbon up and across, and tilts it.
        const drift = Math.sin(p * Math.PI * 2 + r.phase) * 0.22 - p * 0.18;
        const slope = r.slope * (1 + Math.sin(p * Math.PI + ri) * 0.35);
        for (let k = 0; k < STRANDS; k++) {
          const spread = (k - STRANDS / 2) * (2.2 + e * 2.4);
          const strength = Math.sin((k / STRANDS) * Math.PI);
          ctx.globalAlpha = dark ? 0.05 + 0.1 * strength * (0.8 + e * 0.8) : 0.05 + 0.09 * strength * (0.8 + e * 0.6);
          ctx.lineWidth = k % 5 === 0 ? 1.4 : 0.8;
          ctx.beginPath();
          for (let x = -40; x <= width + 40; x += step) {
            const base = height * (r.y + drift) - x * slope * (height / Math.max(width, 1)) * 1.4;
            const wave =
              Math.sin(x * r.freq + t * r.speed + r.phase + p * 6 + k * 0.05) * r.amp * (1 + e * 0.9) +
              Math.cos(x * r.freq * 0.5 - t * r.speed * 0.7 + k * 0.08) * r.amp * 0.45;
            const y = base + wave + spread;
            if (x === -40) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      });
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    };

    const loop = (time: number) => {
      if (visible) draw(time);
      frame = requestAnimationFrame(loop);
    };

    resize();
    const onResize = () => {
      resize();
      if (still) draw(4000);
    };
    window.addEventListener("resize", onResize);
    const onVisibility = () => (visible = document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);
    // Under reduced motion, redraw the still frame when the theme changes.
    const themeWatch = new MutationObserver(() => still && draw(4000));
    themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    if (still) draw(4000);
    else frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      themeWatch.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className={`pointer-events-none h-full w-full ${className}`} />;
}
