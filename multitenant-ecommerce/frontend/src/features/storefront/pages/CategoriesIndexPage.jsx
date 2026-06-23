import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Tags } from "lucide-react";
import Seo from "../../../components/Seo";
import { useGetCategoriesQuery } from "../../categories/categoriesApi";

/**
 * Storefront categories index (premium style). A grid of all categories
 * (image or initial), each linking to its products page. Header band matches
 * the other listing pages for visual consistency.
 */
export default function CategoriesIndexPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useGetCategoriesQuery();
  const categories = data?.categories || [];

  return (
    <>
      <Seo description={t("storeCategories.seoDesc")} />

      {/* Header band */}
      <section className="border-b border-border bg-secondary/30">
        <div className="container py-10 md:py-14">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Tags className="h-4 w-4" />
            <span className="text-sm">{t("storeCategories.eyebrow")}</span>
          </div>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight md:text-4xl">
            {t("storeCategories.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("storeCategories.subtitle")}
          </p>
        </div>
      </section>

      <section className="container py-10">
        {isLoading && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[4/3] animate-pulse rounded-xl bg-muted"
              />
            ))}
          </div>
        )}

        {isError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
            <p className="font-medium text-destructive">
              {t("storeCategories.loadError")}
            </p>
          </div>
        )}

        {!isLoading && !isError && categories.length === 0 && (
          <div className="rounded-xl border border-border bg-secondary/30 p-12 text-center">
            <Tags className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 font-medium">{t("storeCategories.empty")}</p>
          </div>
        )}

        {!isLoading && !isError && categories.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((cat) => {
              const slug = cat.slug || cat._id;
              const image = cat.image || cat.imageUrl || null;
              const initial = (cat.name || "?").charAt(0).toUpperCase();
              return (
                <Link
                  key={cat._id || slug}
                  to={`/store/categories/${slug}`}
                  className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-border/60"
                >
                  <div className="h-full w-full bg-gradient-to-br from-secondary to-muted">
                    {image ? (
                      <img
                        src={image}
                        alt={cat.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="font-display text-4xl font-bold text-primary/40">
                          {initial}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <h3 className="font-display text-lg font-bold text-white">
                      {cat.name}
                    </h3>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
