"use client";

import { useScroll, useSpring, useTransform, useVelocity } from "motion/react";
import LightRibbons from "./LightRibbons";

// The light ribbons behind the whole page, fixed to the screen: they drift with how
// far you've scrolled and swell with how fast. `quiet` dims them for working pages
// (the staff portal), where they should be atmosphere, not decoration.
export default function Backdrop({ quiet = false }: { quiet?: boolean }) {
  const { scrollY, scrollYProgress } = useScroll();
  const speed = useVelocity(scrollY);
  const energy = useSpring(useTransform(speed, [-2500, 0, 2500], [1, 0, 1]), { stiffness: 50, damping: 18 });

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
      <LightRibbons progress={scrollYProgress} energy={energy} />
      <div className="absolute inset-0 bg-[radial-gradient(55%_45%_at_75%_30%,rgb(var(--th-aqua)/0.10),transparent_70%)]" />
      {quiet && <div className="absolute inset-0 bg-th-bg/60" />}
    </div>
  );
}
