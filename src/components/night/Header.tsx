"use client";

import { useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { LogoMark } from "../ui/Logo";
import { openAssistant } from "../assistant/events";
import { site } from "@/config/site";

const LINKS = [
  { href: "#story", label: "How it books" },
  { href: "#channels", label: "Channels" },
  { href: "#recovery", label: "Running late" },
  { href: "#staff", label: "Staff desk" },
];

// Transparent over the hero, frosted once the page scrolls.
export default function Header() {
  const { scrollY } = useScroll();
  const [solid, setSolid] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => setSolid(y > 40));

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="fixed inset-x-0 top-0 z-40"
    >
      <div
        className={`mx-auto mt-3 flex max-w-[1240px] items-center justify-between gap-4 rounded-full px-4 py-2.5 transition-all duration-500 sm:mx-4 sm:px-5 xl:mx-auto ${
          solid ? "border border-night-line bg-night/70 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl" : "border border-transparent"
        }`}
      >
        <a href="#top" className="flex items-center gap-2.5 text-white">
          <LogoMark className="h-7 w-7" />
          <span className="font-display text-[1.2rem] leading-none">{site.name}</span>
        </a>
        <nav aria-label="Main" className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-[0.88rem] text-white/60 transition-colors hover:text-white">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a
            href="/staff"
            className="hidden rounded-full px-3.5 py-2 text-[0.86rem] font-semibold text-white/70 transition-colors hover:text-white sm:block"
          >
            Staff portal
          </a>
          <button
            onClick={() => openAssistant("voice")}
            className="cursor-pointer rounded-full bg-spark px-4 py-2 text-[0.86rem] font-bold text-night transition-transform hover:scale-[1.04]"
          >
            Talk to {site.agent}
          </button>
        </div>
      </div>
    </motion.header>
  );
}
