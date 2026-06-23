import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";

/**
 * Wide "feature" banner (Apple-style) that breaks the grid: a full-width dark
 * band with a large image on one side, editorial text + a single CTA on the
 * other. The CTA leads to the categories page. Static content, themed via vars.
 */
export default function FeatureBanner() {
  const { t } = useTranslation();

  return (
    <section className="container py-12 md:py-16">
      <div className="relative overflow-hidden rounded-3xl bg-neutral-950 text-white">
        <div className="grid items-center gap-8 md:grid-cols-2">
          {/* Text side */}
          <div className="p-8 md:p-12 lg:p-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
              {t("featureBanner.eyebrow")}
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight text-white md:text-4xl">
              {t("featureBanner.title")}
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70 md:text-base">
              {t("featureBanner.subtitle")}
            </p>
            <Link
              to="/store/categories"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-neutral-900 transition-opacity hover:opacity-90"
            >
              {t("featureBanner.cta")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Image side (gradient placeholder; swap for a real image anytime) */}
          <div className="relative min-h-[260px] md:min-h-[380px]">
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
          </div>
        </div>
      </div>
    </section>
  );
}
