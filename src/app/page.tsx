import Header from "@/components/sections/Header";
import Hero from "@/components/sections/Hero";
import Statement from "@/components/sections/Statement";
import Channels from "@/components/sections/Channels";
import Workflow from "@/components/sections/Workflow";
import Recovery from "@/components/sections/Recovery";
import Features from "@/components/sections/Features";
import Dashboard from "@/components/sections/Dashboard";
import Trust from "@/components/sections/Trust";
import FAQ from "@/components/sections/FAQ";
import CTA from "@/components/sections/CTA";
import Footer from "@/components/sections/Footer";

export default function Home() {
  return (
    <>
      {/* Scroll target for logo / "back to top" links (kept off the sticky header,
          which is always in view so the browser wouldn't scroll to it) */}
      <span id="top" aria-hidden="true" className="absolute left-0 top-0" />
      <Header />
      <main>
        <Hero />
        <Statement />
        <Channels />
        <Workflow />
        <Recovery />
        <Features />
        <Dashboard />
        <Trust />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
