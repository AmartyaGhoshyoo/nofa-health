import Container from "../ui/Container";
import Logo from "../ui/Logo";
import { NAV_LINKS, site } from "@/config/site";

export default function Footer() {
  return (
    <footer className="border-t border-line">
      <Container className="grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <a href="#top" aria-label="Back to top">
            <Logo />
          </a>
          <p className="mt-4 max-w-[320px] text-[0.95rem] leading-relaxed text-ink-muted">{site.tagline}. Answers, books and repairs the schedule — 24/7.</p>
        </div>
        <nav aria-label="Footer">
          <p className="mb-4 text-[0.78rem] font-bold uppercase tracking-[0.14em] text-ink-faint">Product</p>
          <ul className="space-y-2.5">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="text-[0.95rem] text-ink-muted transition-colors hover:text-teal">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <p className="mb-4 text-[0.78rem] font-bold uppercase tracking-[0.14em] text-ink-faint">Contact</p>
          <p className="text-[0.95rem] text-ink-muted">{site.contactEmail}</p>
          <a href="#demo" className="mt-2.5 inline-block text-[0.95rem] font-bold text-teal hover:underline">
            Book a demo →
          </a>
        </div>
      </Container>
      {/* Credit: centred on its own line, with bottom room so the floating
          "Talk to Nofa" button never sits on top of it */}
      <div className="border-t border-line">
        <Container className="flex flex-col items-center gap-4 pb-28 pt-10 text-center">
          <a
            href={site.builtBy.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-3 rounded-full bg-surface px-6 py-3 shadow-[0_14px_30px_-18px_rgba(6,42,51,0.35)] ring-1 ring-line transition-all duration-300 hover:-translate-y-0.5 hover:ring-teal/30"
          >
            <span className="text-[0.95rem] font-medium text-ink-muted">A product by</span>
            <span className="font-display text-[1.35rem] font-bold tracking-[-0.02em] text-ink transition-colors group-hover:text-teal">
              {site.builtBy.name}
            </span>
            <span aria-hidden="true" className="text-teal transition-transform duration-300 group-hover:translate-x-0.5">
              ↗
            </span>
          </a>
          <p className="text-[0.85rem] text-ink-faint">
            © {new Date().getFullYear()} {site.name}. Not for medical emergencies.
          </p>
        </Container>
      </div>
    </footer>
  );
}
