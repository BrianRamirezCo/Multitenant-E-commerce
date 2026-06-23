import { useTranslation } from "react-i18next";
import ProductCard from "../components/ProductCard";
import StoreHero from "../components/StoreHero";
import CategoryGrid from "../components/CategoryGrid";
import TrustBar from "../components/TrustBar";
import FeatureBanner from "../components/FeatureBanner";
import NewArrivals from "../components/NewArrivals";
import NewsletterSection from "../components/NewsletterSection";
import Seo from "../../../components/Seo";
import { useGetProductsQuery } from "../../products/productsApi";

/**
 * Storefront home — premium NOVA-style layout, in this exact order:
 *   1. Hero (full-width, uses the tenant's banner config)
 *   2. Category grid (editorial)
 *   3. Featured products
 *   4. Trust / benefits bar
 *   5. Feature banner (Apple-style, CTA to categories)
 *   6. New arrivals (light band, small cards)
 *   7. Newsletter
 *
 * Connected to the real backend via useGetProductsQuery. Translated via i18n.
 */
export default function HomePage() {
  const { t } = useTranslation();
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

      {/* 5. Feature banner */}
      <FeatureBanner />

      {/* 6. New arrivals */}
      <NewArrivals />

      {/* 7. Newsletter */}
      <NewsletterSection />
    </>
  );
}
