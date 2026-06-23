import { useSearchParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, Package } from "lucide-react";
import Seo from "../../../components/Seo";
import ProductCard from "../components/ProductCard";
import { useGetProductsQuery } from "../../products/productsApi";

/**
 * Storefront search results. Reads ?q= from the URL and queries the products
 * API with { search: q }. Shows a grid of matches (or an empty state).
 */
export default function SearchPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const q = (params.get("q") || "").trim();

  const { data, isLoading, isError } = useGetProductsQuery(
    { search: q, limit: 48 },
    { skip: !q },
  );
  const products = data?.products || [];

  return (
    <div className="container py-10">
      <Seo description={t("search.seoDesc", { q })} />

      <div className="flex items-center gap-2 text-muted-foreground">
        <Search className="h-4 w-4" />
        <span className="text-sm">{t("search.resultsFor")}</span>
      </div>
      <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">
        “{q}”
      </h1>
      {!isLoading && !isError && (
        <p className="mt-1 text-sm text-muted-foreground">
          {t("search.count", { count: products.length })}
        </p>
      )}

      {/* No query typed */}
      {!q && (
        <div className="mt-8 rounded-xl border border-border bg-secondary/30 p-12 text-center">
          <Search className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 font-medium">{t("search.empty")}</p>
        </div>
      )}

      {isLoading && (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square rounded-xl bg-muted" />
              <div className="mt-3 h-4 w-2/3 rounded bg-muted" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="mt-8 rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <p className="font-medium text-destructive">{t("search.error")}</p>
        </div>
      )}

      {q && !isLoading && !isError && products.length === 0 && (
        <div className="mt-8 rounded-xl border border-border bg-secondary/30 p-12 text-center">
          <Package className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 font-medium">{t("search.noResults", { q })}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("search.noResultsSub")}
          </p>
          <Link
            to="/store"
            className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
          >
            {t("search.backToStore")}
          </Link>
        </div>
      )}

      {q && !isLoading && !isError && products.length > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
