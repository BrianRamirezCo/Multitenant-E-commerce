import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";

/**
 * Wide "feature" banner (Apple-style): a full-width dark band with a large
 * image on one side and editorial text + a single CTA on the other. The CTA
 * always leads to the categories page.
 *
 * Content is configurable per-tenant (Growth/Premium) via tenant.featureBanner.
 * Any empty field falls back to the i18n default, so the banner is never blank.
 * If a custom image is set, it replaces the gradient placeholder.
 */
export default function FeatureBanner() {
  const { t } = useTranslation();
  const tenant = useSelector((s) => s.tenant.info);
  const fb = tenant?.featureBanner || {};

  // Custom values fall back to the translated defaults.
  const eyebrow = fb.eyebrow || t("featureBanner.eyebrow");
  const title = fb.title || t("featureBanner.title");
  const subtitle = fb.subtitle || t("featureBanner.subtitle");
  const ctaText = fb.ctaText || t("featureBanner.cta");
  const imageUrl = fb.imageUrl || null;

  return (
    <section className="container py-12 md:py-16">
      <div className="relative overflow-hidden rounded-3xl bg-neutral-950 text-white">
        <div className="grid items-center gap-8 md:grid-cols-2">
          {/* Text side */}
          <div className="p-8 md:p-12 lg:p-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
              {eyebrow}
            </p>
            <h2 className="mt-3 break-words font-display text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl md:text-4xl">
              {title}
            </h2>
            <p className="mt-4 max-w-md break-words text-sm leading-relaxed text-white/70 md:text-base">
              {subtitle}
            </p>
            <Link
              to="/store/categories"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-neutral-900 transition-opacity hover:opacity-90"
            >
              {ctaText}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Image side: custom image if set, otherwise the gradient placeholder */}
          <div className="relative min-h-[260px] md:min-h-[380px]">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={title}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(135deg, hsl(var(--secondary)) 0%, hsl(var(--background)) 100%)",
                }}
              >
                <div className="pointer-events-none absolute -right-10 top-10 h-48 w-48 rounded-full bg-white/5 blur-2xl" />
                <div className="pointer-events-none absolute bottom-10 left-10 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
