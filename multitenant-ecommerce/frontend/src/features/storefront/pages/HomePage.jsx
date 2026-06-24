import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import ProductCard from "../components/ProductCard";
import StoreHero from "../components/StoreHero";
import CategoryGrid from "../components/CategoryGrid";
import TrustBar from "../components/TrustBar";
import FeatureBanner from "../components/FeatureBanner";
import NewArrivals from "../components/NewArrivals";
import NewsletterSection from "../components/NewsletterSection";
import Seo from "../../../components/Seo";
import { useGetProductsQuery } from "../../products/productsApi";
import { hasFeatureClient } from "../../../lib/planClient";

/**
 * Storefront home. Section order:
 *   1. Hero
 *   2. Category grid
 *   3. Featured products
 *   4. Trust / benefits bar
 *   5. Feature banner      ← premium (Growth+)
 *   6. New arrivals        ← premium (Growth+)
 *   7. Newsletter          ← premium (Growth+)
 *
 * The premium sections (5-7) only render when the tenant's plan includes the
 * `premiumSections` feature. Starter stores get a simpler home (just hero,
 * categories, products, trust bar) — a visible upgrade incentive.
 */
export default function HomePage() {
  const { t } = useTranslation();
  const tenant = useSelector((s) => s.tenant.info);
  const plan = tenant?.plan || "starter";
  const showPremiumSections = hasFeatureClient(plan, "premiumSections");

  const { data, isLoading, isError, error } = useGetProductsQuery({
    limit: 24,
  });
  const products = data?.products || [];

  return (
    <>
      <Seo description={t("home.seoDesc")} />

      {/* 1. Hero */}
      <StoreHero />

      {/* 2. Categories */}
      <CategoryGrid />

      {/* 3. Featured products */}
      <section id="productos" className="container py-8 md:py-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
              {t("home.bestSellers")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("home.bestSellersSub")}
            </p>
          </div>
        </div>

        {isLoading && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square rounded-xl bg-muted" />
                <div className="mt-3 h-4 w-2/3 rounded bg-muted" />
                <div className="mt-2 h-4 w-1/3 rounded bg-muted" />
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
            <p className="font-medium text-destructive">
              {t("home.loadError")}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {error?.status === 404
                ? t("home.notFound")
                : t("common.backendError")}
            </p>
          </div>
        )}

        {!isLoading && !isError && products.length === 0 && (
          <div className="rounded-xl border border-border bg-secondary/30 p-12 text-center">
            <p className="font-medium text-foreground">{t("home.empty")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("home.emptySub")}
            </p>
          </div>
        )}

        {!isLoading && !isError && products.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 4. Trust / benefits */}
      <TrustBar />

      {/* 5-7. Premium sections (Growth+) */}
      {showPremiumSections && (
        <>
          <FeatureBanner />
          <NewArrivals />
          <NewsletterSection />
        </>
      )}
    </>
  );
}
