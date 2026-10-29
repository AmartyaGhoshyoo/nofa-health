"use client";

import { useEffect, useRef } from "react";
import type { MotionValue } from "motion/react";

// Flowing ribbons of light drawn on a canvas: each ribbon is a bundle of thin sine
// strands blended additively, so where they cross they glow. `energy` (0–1, e.g.
// scroll progress) bends and brightens them. Pauses off-screen; one still frame
// under "reduce motion".
const RIBBONS = [
  { y: 0.78, slope: 0.42, amp: 70, freq: 0.0042, speed: 0.32, phase: 0, colors: ["#14B8A6", "#5EEAD4", "#C8F169"] },
  { y: 0.92, slope: 0.55, amp: 95, freq: 0.0031, speed: 0.22, phase: 2.1, colors: ["#0E7490", "#67E8F9", "#5EEAD4"] },
  { y: 0.66, slope: 0.3, amp: 55, freq: 0.0056, speed: 0.4, phase: 4.2, colors: ["#5EEAD4", "#C8F169", "#14B8A6"] },
];
const STRANDS = 22;

export default function LightRibbons({ energy = 0, className = "" }: { energy?: number | MotionValue<number>; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const energyRef = useRef(energy);
  energyRef.current = energy;

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let frame = 0;
    let visible = true;
    let gradients: CanvasGradient[] = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      gradients = RIBBONS.map((r) => {
        const g = ctx.createLinearGradient(0, height, width, 0);
        r.colors.forEach((c, i) => g.addColorStop(i / (r.colors.length - 1), c));
        return g;
      });
    };

    const draw = (time: number) => {
      const t = time / 1000;
      const source = energyRef.current;
      const e = typeof source === "number" ? source : source.get();
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";
      const step = width < 700 ? 16 : 12;
      RIBBONS.forEach((r, ri) => {
        ctx.strokeStyle = gradients[ri] ?? r.colors[0]!;
        for (let k = 0; k < STRANDS; k++) {
          const spread = (k - STRANDS / 2) * (2.2 + e * 1.4);
          ctx.globalAlpha = 0.05 + 0.1 * Math.sin((k / STRANDS) * Math.PI) * (0.8 + e * 0.5);
          ctx.lineWidth = k % 5 === 0 ? 1.4 : 0.8;
          ctx.beginPath();
          for (let x = -40; x <= width + 40; x += step) {
            const base = height * r.y - x * r.slope * (height / Math.max(width, 1)) * 1.4;
            const wave =
              Math.sin(x * r.freq + t * r.speed + r.phase + k * 0.05) * r.amp * (1 + e * 0.6) +
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
    const io = new IntersectionObserver(([entry]) => (visible = entry?.isIntersecting ?? true));
    io.observe(canvas);
    if (still) draw(4000);
    else frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      io.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className={`pointer-events-none h-full w-full ${className}`} />;
}
