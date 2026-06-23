import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { ArrowRight, Sparkles } from "lucide-react";

/**
 * Premium full-width storefront hero (NOVA style): a large full-bleed image
 * with the editorial text overlaid on the left, like Apple/Nike landing heroes.
 *
 * Reuses the tenant's banner config (set via /tenant/me):
 *   - banner.enabled    -> if false, renders nothing
 *   - banner.imageUrl   -> full-width background image; otherwise a themed gradient
 *   - banner.title/subtitle/ctaText/ctaLink -> texts (fall back to i18n defaults)
 *
 * Colors come from the active theme's CSS variables, so each tenant keeps its
 * own identity (the dark base is the 'premium-dark' theme).
 */
export default function StoreHero() {
  const { t } = useTranslation();
  const tenant = useSelector((s) => s.tenant.info);
  const banner = tenant?.banner || {};

  if (banner.enabled === false) return null;

  const title = banner.title || t("banner.title");
  const subtitle = banner.subtitle || t("banner.subtitle");
  const ctaText = banner.ctaText || t("banner.cta");
  const ctaLink = banner.ctaLink || "/store#productos";
  const imageUrl = banner.imageUrl || null;

  return (
    <section className="relative w-full overflow-hidden border-b border-border">
      {/* Background: image or themed gradient */}
      {imageUrl ? (
        <>
          <img
            src={imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* Dark overlay so the text is always legible over any image */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/10" />
        </>
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(120deg, hsl(var(--background)) 0%, hsl(var(--primary) / 0.5) 60%, hsl(var(--primary)) 120%)",
          }}
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute bottom-0 right-40 h-80 w-80 rounded-full bg-white/5 blur-2xl" />
        </div>
      )}

      {/* Content */}
      <div className="container relative flex min-h-[78vh] flex-col justify-center py-20">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-white backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            {banner.badge || t("banner.badge")}
          </span>

          <h1 className="mt-6 font-display text-5xl font-bold leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-5xl">
            {title}
          </h1>

          {subtitle && (
            <p className="mt-6 max-w-lg text-base leading-relaxed text-white/85 md:text-lg">
              {subtitle}
            </p>
          )}

          <div className="mt-9 flex flex-wrap items-center gap-3">
            {ctaText && (
              <Link
                to={ctaLink}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-xl transition-all hover:opacity-90"
              >
                {ctaText} <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            <Link
              to="/store#productos"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/5 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/15"
            >
              {t("storefront.exploreAll")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
