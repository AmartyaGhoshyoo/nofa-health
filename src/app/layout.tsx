import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import Providers from "@/components/Providers";
import AssistantWidget from "@/components/assistant/AssistantWidget";
import { site } from "@/config/site";
import "./globals.css";

// Bricolage Grotesque for headings (characterful, modern), Plus Jakarta Sans
// for body copy (clean, friendly, highly legible at small sizes).
const display = Bricolage_Grotesque({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-display", display: "swap" });
const body = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-body", display: "swap" });
// Figtree for the assistant widget: rounded and friendly, still very legible in chat bubbles.
const widget = Figtree({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-widget", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono", display: "swap" });

const title = `${site.name} — ${site.tagline}`;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title,
  description: site.description,
  openGraph: { type: "website", url: site.url, siteName: site.name, title, description: site.description },
  twitter: { card: "summary_large_image", title, description: site.description },
};

export const viewport: Viewport = { themeColor: "#F5F9F9" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${body.variable} ${display.variable} ${mono.variable} ${widget.variable} font-body`}>
        <Providers>
          {children}
          <AssistantWidget />
        </Providers>
      </body>
    </html>
  );
}
