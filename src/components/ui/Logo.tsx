import { site } from "@/config/site";

// Mark: a soft cross formed by two rounded bars inside a rounded square.
export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#0E7490" />
      <rect x="13.5" y="7" width="5" height="18" rx="2.5" fill="#fff" />
      <rect x="7" y="13.5" width="18" height="5" rx="2.5" fill="#22D3EE" />
      <circle cx="16" cy="16" r="2.2" fill="#0E7490" />
    </svg>
  );
}

export default function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className={`font-display text-[1.4rem] leading-none ${light ? "text-white" : "text-ink"}`}>{site.name}</span>
    </span>
  );
}
