import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import LanguageToggle from "../../../components/LanguageToggle";

/**
 * Shared layout for platform legal pages (Terms, Privacy, Cookies, Contact).
 * Premium dark styling to match the CommerceOS landing. Self-contained dark
 * theme (#0A0A0A), not tenant-theme dependent.
 *
 * `title` and `updated` are shown in the header; `children` is the body.
 */
export default function LegalLayout({ title, updated, children }) {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0A0A0A] font-body text-white antialiased">
      {/* Subtle grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse 70% 40% at 50% 0%, black, transparent 75%)",
        }}
      />
      {/* Top glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[300px] w-[500px] -translate-x-1/2 opacity-30"
        style={{
          background:
            "radial-gradient(50% 50% at 50% 0%, rgba(124,58,237,0.4), transparent 70%)",
        }}
      />

      {/* Top bar */}
      <header className="relative border-b border-white/10">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="font-display text-xl font-bold text-white">
            Commerce
            <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
              OS
            </span>
          </Link>
          <LanguageToggle />
        </div>
      </header>

      {/* Content */}
      <main className="container relative max-w-3xl py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-white/50 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> {t("legal.backHome")}
        </Link>

        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-white md:text-4xl">
          {title}
        </h1>
        {updated && (
          <p className="mt-2 text-sm text-white/40">
            {t("legal.lastUpdated")}: {updated}
          </p>
        )}

        {/* Legal disclaimer banner */}
        <div className="mt-6 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300/90">
          {t("legal.disclaimer")}
        </div>

        <div className="legal-prose mt-8 space-y-6 text-sm leading-relaxed text-white/70">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-white/10">
        <div className="container flex flex-col items-center justify-between gap-3 py-6 text-xs text-white/40 sm:flex-row">
          <span>
            © {year} CommerceOS. {t("legal.rights")}
          </span>
          <div className="flex gap-4">
            <Link to="/terms" className="transition-colors hover:text-white">
              {t("legal.terms")}
            </Link>
            <Link to="/privacy" className="transition-colors hover:text-white">
              {t("legal.privacy")}
            </Link>
            <Link to="/cookies" className="transition-colors hover:text-white">
              {t("legal.cookies")}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
/**
 * A legal section: a heading + its paragraphs. Use inside LegalLayout.
 */
export function LegalSection({ heading, children }) {
  return (
    <section>
      <h2 className="font-display text-lg font-bold text-white">{heading}</h2>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  );
}
