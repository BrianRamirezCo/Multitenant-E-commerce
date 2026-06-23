import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronLeft, Package } from "lucide-react";
import Seo from "../../../components/Seo";
import ProductCard from "../components/ProductCard";
import { useGetProductsQuery } from "../../products/productsApi";
import { useGetCategoriesQuery } from "../../categories/categoriesApi";

/**
 * Storefront category page. Shows the products of a single category, filtered
 * server-side via the products API (params: { category: slug }).
 */
export default function CategoryProductsPage() {
  const { t } = useTranslation();
  const { slug } = useParams();

  const { data, isLoading, isError } = useGetProductsQuery({
    category: slug,
    limit: 48,
  });
  const products = data?.products || [];

  const { data: catData } = useGetCategoriesQuery();
  const category = (catData?.categories || []).find(
    (c) => (c.slug || c._id) === slug,
  );
  const categoryName = category?.name || slug;

  return (
    <div className="container py-10">
      <Seo
        description={t("storeCategory.seoDesc", { category: categoryName })}
      />

      <Link
        to="/store/categories"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> {t("storeCategory.back")}
      </Link>

      <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">
        {categoryName}
      </h1>

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
          <p className="font-medium text-destructive">
            {t("storeCategory.loadError")}
          </p>
        </div>
      )}

      {!isLoading && !isError && products.length === 0 && (
        <div className="mt-8 rounded-xl border border-border bg-secondary/30 p-12 text-center">
          <Package className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 font-medium">{t("storeCategory.empty")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("storeCategory.emptySub")}
          </p>
          <Link
            to="/store"
            className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
          >
            {t("storeCategory.backToStore")}
          </Link>
        </div>
      )}

      {!isLoading && !isError && products.length > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
