import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";
import ProductCard from "../components/ProductCard";
import Seo from "../../../components/Seo";
import { useGetProductsQuery } from "../../products/productsApi";

/**
 * New arrivals page (/store/new): shows the most recently added products.
 * The backend returns products sorted by createdAt desc, so we take them as-is.
 * Reuses ProductCard. Translated.
 */
export default function NewArrivalsPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useGetProductsQuery({ limit: 100 });
  const products = data?.products || [];

  return (
    <>
      <Seo title={t("newPage.title")} description={t("newPage.subtitle")} />

      {/* Header band */}
      <section className="border-b border-border bg-secondary/30">
        <div className="container py-12 text-center md:py-16">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight md:text-4xl">
            {t("newPage.title")}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground md:text-base">
            {t("newPage.subtitle")}
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="container py-10">
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
              {t("common.backendError")}
            </p>
          </div>
        )}

        {!isLoading && !isError && products.length === 0 && (
          <div className="rounded-xl border border-border bg-secondary/30 p-12 text-center">
            <p className="font-medium text-foreground">{t("newPage.empty")}</p>
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
    </>
  );
}
