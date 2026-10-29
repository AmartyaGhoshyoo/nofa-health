import type { Viewport } from "next";
import Header from "@/components/night/Header";
import Hero from "@/components/night/Hero";
import Story from "@/components/night/Story";
import Rule from "@/components/night/Rule";
import Channels from "@/components/night/Channels";
import RecoveryLab from "@/components/night/RecoveryLab";
import StaffDesk from "@/components/night/StaffDesk";
import Guardrails from "@/components/night/Guardrails";
import Finale from "@/components/night/Finale";

// The animated "night shift" homepage: a dark, scroll-driven story of one booking,
// then the channels, the running-late planner, the staff desk and the call rules.
export const viewport: Viewport = { themeColor: "#04080A" };

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-clip bg-night text-white">
      <Header />
      <main>
        <Hero />
        <Story />
        <Rule />
        <Channels />
        <RecoveryLab />
        <StaffDesk />
        <Guardrails />
        <Finale />
      </main>
    </div>
  );
}
