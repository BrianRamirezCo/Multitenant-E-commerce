import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useGetCategoriesQuery } from "../../categories/categoriesApi";

/**
 * Category quick-access strip (ML/Amazon style). A horizontal row of clickable
 * category tiles. Works WITH images (shows the image) or WITHOUT (shows a themed
 * circle with the category initial), so it looks fine even before images exist.
 */
export default function CategoryStrip() {
  const { t } = useTranslation();
  const { data, isLoading } = useGetCategoriesQuery();
  const categories = (data?.categories || []).slice(0, 10);

  if (!isLoading && categories.length === 0) return null;

  return (
    <section className="container py-8">
      <h2 className="mb-4 font-display text-lg font-bold tracking-tight">
        {t("catstrip.title")}
      </h2>

      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex shrink-0 flex-col items-center gap-2">
              <div className="h-16 w-16 animate-pulse rounded-full bg-muted" />
              <div className="h-3 w-12 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-5 overflow-x-auto pb-2 [scrollbar-width:thin]">
          {categories.map((cat) => {
            const slug = cat.slug || cat._id;
            const image = cat.image || cat.imageUrl || null;
            const initial = (cat.name || "?").charAt(0).toUpperCase();
            return (
              <Link
                key={cat._id || slug}
                to={`/store/categories/${slug}`}
                className="group flex w-20 shrink-0 flex-col items-center gap-2 text-center"
              >
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary transition-transform duration-200 group-hover:scale-105 group-hover:border-primary">
                  {image ? (
                    <img
                      src={image}
                      alt={cat.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="font-display text-xl font-bold text-primary">
                      {initial}
                    </span>
                  )}
                </div>
                <span className="line-clamp-2 text-xs font-medium text-foreground/80 group-hover:text-foreground">
                  {cat.name}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
