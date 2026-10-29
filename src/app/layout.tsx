import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree, Instrument_Serif, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import Providers from "@/components/Providers";
import { THEME_SCRIPT } from "@/components/ThemeToggle";
import AssistantWidget from "@/components/assistant/AssistantWidget";
import { site } from "@/config/site";
import "./globals.css";

// Bricolage Grotesque for headings (characterful, modern), Plus Jakarta Sans
// for body copy (clean, friendly, highly legible at small sizes).
const display = Bricolage_Grotesque({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-display", display: "swap" });
const body = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-body", display: "swap" });
// Figtree for the assistant widget: rounded and friendly, still very legible in chat bubbles.
const widget = Figtree({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-widget", display: "swap" });
// Instrument Serif italic for the accent words in the big homepage headlines.
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-serif", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono", display: "swap" });

const title = `${site.name} — ${site.tagline}`;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title,
  description: site.description,
  openGraph: { type: "website", url: site.url, siteName: site.name, title, description: site.description },
  twitter: { card: "summary_large_image", title, description: site.description },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#04080A" },
    { media: "(prefers-color-scheme: light)", color: "#F4F7F5" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The theme script sets data-theme before React loads, hence suppressHydrationWarning.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className={`${body.variable} ${display.variable} ${mono.variable} ${widget.variable} ${serif.variable} font-body`}>
        <Providers>
          {children}
          <AssistantWidget />
        </Providers>
      </body>
    </html>
  );
}
