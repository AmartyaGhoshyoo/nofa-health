"use client";

import { motion } from "motion/react";
import Container from "../ui/Container";
import Button from "../ui/Button";
import VoiceOrb from "../assistant/VoiceOrb";
import { openAssistant, playDemoCall } from "../assistant/events";
import { site } from "@/config/site";

export default function CTA() {
  return (
    <section id="demo" className="scroll-mt-20 py-20 md:py-28">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "0px 0px -80px 0px" }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-[36px] bg-ocean px-6 py-16 text-center text-white sm:px-12 md:py-20"
        >
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute -left-20 -top-24 h-[380px] w-[380px] rounded-full bg-teal-bright/40 blur-[120px]" />
            <div className="absolute -bottom-32 -right-10 h-[380px] w-[380px] rounded-full bg-mint/25 blur-[120px]" />
          </div>
          <div className="relative flex flex-col items-center">
            <button type="button" onClick={() => playDemoCall()} aria-label={`Start a demo call with ${site.agent}`} className="cursor-pointer">
              <VoiceOrb state="speaking" size={120} />
            </button>
            <h2 className="mt-8 max-w-[16ch] font-display text-[2.4rem] leading-[1.04] md:text-[3.6rem]">
              Give your front desk <em className="text-gradient-light">a night off.</em>
            </h2>
            <p className="mt-5 max-w-[520px] text-[1.08rem] leading-relaxed text-white/70">
              Hear {site.agent} handle a real-world call, then let&apos;s map it to your clinic&apos;s schedule and systems.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Button as="button" type="button" variant="light" onClick={() => playDemoCall()}>
                Hear a live call
              </Button>
              <Button
                as="button"
                type="button"
                variant="ghost"
                className="border-white/25 bg-white/5 text-white hover:border-white/50 hover:bg-white/10"
                onClick={() => openAssistant("chat", "I'd like to book a demo for my clinic")}
              >
                Book a demo
              </Button>
            </div>
            <p className="mt-6 text-[0.9rem] text-white/50">
              Or email <span className="text-white/80">{site.contactEmail}</span>
            </p>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
