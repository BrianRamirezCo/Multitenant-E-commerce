import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import { Button } from "../../../components/ui/button";

/**
 * Promo banner — a CONTAINED (not full-bleed) hero strip for the storefront.
 *
 * Reads the banner config from the current tenant (set via /tenant/me):
 *   - banner.enabled    -> if false, renders nothing
 *   - banner.imageUrl   -> shows the uploaded image; otherwise a themed gradient
 *   - banner.title/subtitle/ctaText/ctaLink -> texts (fall back to i18n defaults)
 *
 * Calm and practical: a static, legible banner, no loops.
 */
export default function PromoBanner() {
  const { t } = useTranslation();
  const tenant = useSelector((s) => s.tenant.info);
  const banner = tenant?.banner || {};

  // If the owner turned the banner off, render nothing.
  if (banner.enabled === false) return null;

  // Texts: tenant config wins; otherwise sensible i18n defaults.
  const title = banner.title || t("banner.title");
  const subtitle = banner.subtitle || t("banner.subtitle");
  const ctaText = banner.ctaText || t("banner.cta");
  const ctaLink = banner.ctaLink || "/store#productos";
  const imageUrl = banner.imageUrl || null;

  return (
    <div className="container pt-6">
      <div className="relative overflow-hidden rounded-2xl border border-border/60">
        {imageUrl ? (
          // Image banner
          <div className="relative aspect-[16/7] w-full sm:aspect-[16/6]">
            <img src={imageUrl} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-center gap-3 p-6 sm:p-8 md:p-12">
              <h2 className="max-w-md font-display text-2xl font-bold text-white sm:text-3xl md:text-4xl">
                {title}
              </h2>
              {subtitle && (
                <p className="max-w-sm text-sm text-white/85 md:text-base">
                  {subtitle}
                </p>
              )}
              {ctaText && (
                <Button className="mt-2 w-fit rounded-full" asChild>
                  <Link to={ctaLink}>
                    {ctaText} <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        ) : (
          // Gradient fallback (no image yet)
          <div
            className="relative aspect-[16/7] w-full sm:aspect-[16/6]"
            style={{
              background:
                "linear-gradient(120deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.6) 55%, hsl(var(--accent)) 120%)",
            }}
          >
            {/* Subtle decorative shapes */}
            <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-16 right-32 h-56 w-56 rounded-full bg-white/5" />

            <div className="relative flex h-full flex-col justify-center gap-3 p-6 sm:p-8 md:p-12">
              <span className="w-fit rounded-full bg-white/20 px-3 py-1 text-xs font-medium uppercase tracking-wide text-white backdrop-blur">
                {t("banner.badge")}
              </span>
              <h2 className="max-w-md font-display text-2xl font-bold text-white sm:text-3xl md:text-5xl">
                {title}
              </h2>
              {subtitle && (
                <p className="max-w-sm text-sm text-white/85 md:text-base">
                  {subtitle}
                </p>
              )}
              {ctaText && (
                <Button
                  variant="secondary"
                  className="mt-2 w-fit rounded-full"
                  asChild
                >
                  <Link to={ctaLink}>
                    {ctaText} <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
