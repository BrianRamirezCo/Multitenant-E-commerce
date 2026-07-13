import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, SlidersHorizontal, Package } from "lucide-react";
import Seo from "../../../components/Seo";
import ProductCard from "../components/ProductCard";
import { useGetProductsQuery } from "../../products/productsApi";
import { useGetCategoriesQuery } from "../../categories/categoriesApi";

/**
 * Full product catalog (/store/products). Lists every product with filters:
 *  - category (dropdown)
 *  - sort (newest / price asc / price desc / name)
 *  - search (text)
 *  - "load more" pagination
 *
 * All filtering happens server-side via the products API params.
 */
const PAGE_SIZE = 20;

export default function CatalogPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();

  // Filters come from the URL (so they're shareable / survive refresh).
  const category = params.get("category") || "";
  const sort = params.get("sort") || "newest";
  const search = params.get("q") || "";

  const [searchInput, setSearchInput] = useState(search);
  const [page, setPage] = useState(1);
  const [accumulated, setAccumulated] = useState([]);

  const { data: catData } = useGetCategoriesQuery();
  const categories = catData?.categories || [];

  const { data, isLoading, isFetching, isError } = useGetProductsQuery({
    category: category || undefined,
    sort,
    search: search || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const products = data?.products || [];
  const total = data?.total || 0;

  // Merge pages for "load more". Reset when filters change (page back to 1).
  const displayed = page === 1 ? products : [...accumulated, ...products];
  const hasMore = displayed.length < total;

  // Update a filter in the URL and reset pagination.
  const setFilter = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
    setPage(1);
    setAccumulated([]);
  };

  const onSearchSubmit = (e) => {
    e.preventDefault();
    setFilter("q", searchInput.trim());
  };

  const loadMore = () => {
    setAccumulated(displayed);
    setPage((p) => p + 1);
  };

  return (
    <>
      <Seo description={t("catalog.seoDesc")} />

      {/* Header band */}
      <section className="border-b border-border bg-secondary/30">
        <div className="container py-10 md:py-14">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Package className="h-4 w-4" />
            <span className="text-sm">{t("catalog.eyebrow")}</span>
          </div>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight md:text-4xl">
            {t("catalog.title")}
          </h1>
          {!isLoading && (
            <p className="mt-1 text-sm text-muted-foreground">
              {t("catalog.count", { count: total })}
            </p>
          )}
        </div>
      </section>

      {/* Filters bar */}
      <section className="border-b border-border bg-background">
        <div className="container flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
          {/* Search */}
          <form
            onSubmit={onSearchSubmit}
            className="relative w-full md:max-w-xs"
          >
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t("catalog.searchPlaceholder")}
              className="w-full rounded-full border border-border bg-secondary/40 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-foreground/30"
            />
          </form>

          {/* Category + sort */}
          <div className="flex items-center gap-3">
            <select
              value={category}
              onChange={(e) => setFilter("category", e.target.value)}
              className="rounded-full border border-border bg-secondary/40 px-4 py-2.5 text-sm outline-none focus:border-foreground/30"
            >
              <option value="">{t("catalog.allCategories")}</option>
              {categories.map((c) => (
                <option key={c._id} value={c.slug || c._id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={sort}
              onChange={(e) => setFilter("sort", e.target.value)}
              className="rounded-full border border-border bg-secondary/40 px-4 py-2.5 text-sm outline-none focus:border-foreground/30"
            >
              <option value="newest">{t("catalog.sortNewest")}</option>
              <option value="price_asc">{t("catalog.sortPriceAsc")}</option>
              <option value="price_desc">{t("catalog.sortPriceDesc")}</option>
              <option value="name_asc">{t("catalog.sortName")}</option>
            </select>
          </div>
        </div>
      </section>

      {/* Products */}
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

        {!isLoading && !isError && displayed.length === 0 && (
          <div className="rounded-xl border border-border bg-secondary/30 p-12 text-center">
            <Package className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 font-medium text-foreground">
              {t("catalog.empty")}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("catalog.emptySub")}
            </p>
          </div>
        )}

        {!isLoading && !isError && displayed.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {displayed.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>

            {hasMore && (
              <div className="mt-10 flex justify-center">
                <button
                  onClick={loadMore}
                  disabled={isFetching}
                  className="rounded-full border border-border px-8 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
                >
                  {isFetching ? t("catalog.loading") : t("catalog.loadMore")}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}
