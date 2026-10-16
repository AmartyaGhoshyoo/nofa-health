"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import Container from "../ui/Container";
import Button from "../ui/Button";
import Logo from "../ui/Logo";
import { playDemoCall } from "../assistant/events";
import { NAV_LINKS } from "@/config/site";


export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 12));

  // Scroll-spy: highlight the section in the middle of the viewport
  useEffect(() => {
    const els = NAV_LINKS.map((l) => document.querySelector<HTMLElement>(l.href)).filter((e): e is HTMLElement => !!e);
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(`#${e.target.id}`)),
      { rootMargin: "-45% 0px -50% 0px" }
    );
    els.forEach((el) => io.observe(el));
    const atTop = () => window.scrollY < 300 && setActive(null);
    window.addEventListener("scroll", atTop, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", atTop);
    };
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-[background-color,border-color,box-shadow] duration-300 ${
        scrolled || open ? "border-b border-line bg-canvas/85 backdrop-blur-xl" : "border-b border-transparent"
      }`}
    >
      <Container className="flex h-[68px] items-center justify-between gap-6">
        <a href="#top" aria-label="Back to top">
          <Logo />
        </a>

        <nav aria-label="Main" className="hidden items-center lg:flex" onMouseLeave={() => setHovered(null)}>
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onMouseEnter={() => setHovered(l.href)}
              aria-current={active === l.href ? "location" : undefined}
              className={`relative px-4 py-2 text-[0.94rem] transition-colors ${
                active === l.href ? "font-bold text-teal" : "text-ink-muted hover:text-ink"
              }`}
            >
              {hovered === l.href && active !== l.href && (
                <motion.span layoutId="nav-hover" className="absolute inset-0 -z-10 rounded-full bg-ink/[0.05]" transition={{ type: "spring", stiffness: 380, damping: 32 }} />
              )}
              {active === l.href && (
                <motion.span layoutId="nav-active" className="absolute inset-0 -z-10 rounded-full bg-teal-soft ring-1 ring-teal/15" transition={{ type: "spring", stiffness: 380, damping: 32 }} />
              )}
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <Button as="button" type="button" size="sm" variant="ghost" className="hidden md:inline-flex" onClick={playDemoCall}>
            Hear a call
          </Button>
          <Button href="#demo" size="sm" className="hidden sm:inline-flex">
            Book a demo
          </Button>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-line-strong lg:hidden"
          >
            <motion.span animate={open ? { rotate: 45, y: 0 } : { rotate: 0, y: -4 }} className="absolute block h-0.5 w-4 rounded bg-ink" />
            <motion.span animate={open ? { rotate: -45, y: 0 } : { rotate: 0, y: 4 }} className="absolute block h-0.5 w-4 rounded bg-ink" />
          </button>
        </div>
      </Container>

      <AnimatePresence>
        {open && (
          <motion.nav
            aria-label="Mobile"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-line lg:hidden"
          >
            <Container className="flex flex-col py-3">
              {NAV_LINKS.map((l, i) => (
                <motion.a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 + i * 0.05 }}
                  className="border-b border-line py-3.5 font-display text-[1.7rem]"
                >
                  {l.label}
                </motion.a>
              ))}
              <Button href="#demo" className="mt-5" onClick={() => setOpen(false)}>
                Book a demo
              </Button>
            </Container>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
