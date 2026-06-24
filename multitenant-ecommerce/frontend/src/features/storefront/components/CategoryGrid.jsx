import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import { useGetCategoriesQuery } from "../../categories/categoriesApi";

/**
 * Editorial category grid (NOVA style): square image cards with the category
 * name and an "Explore →" link in the TOP-LEFT corner, over the image.
 * Works WITH images or WITHOUT (themed gradient + initial).
 *
 * Shows up to 4 categories (one row on desktop), followed by a centered
 * "view all categories" link to /store/categories.
 */
export default function CategoryGrid() {
  const { t } = useTranslation();
  const { data, isLoading } = useGetCategoriesQuery();
  const allCategories = data?.categories || [];
  const categories = allCategories.slice(0, 4);

  if (!isLoading && categories.length === 0) return null;

  return (
    <section className="container py-14 md:py-20">
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square animate-pulse rounded-2xl bg-muted"
            />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {categories.map((cat) => {
              const slug = cat.slug || cat._id;
              const image = cat.image || cat.imageUrl || null;
              const initial = (cat.name || "?").charAt(0).toUpperCase();
              return (
                <Link
                  key={cat._id || slug}
                  to={`/store/categories/${slug}`}
                  className="group relative aspect-square overflow-hidden rounded-2xl border border-border"
                >
                  {/* Background */}
                  {image ? (
                    <img
                      src={image}
                      alt={cat.name}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div
                      className="absolute inset-0 flex items-center justify-center transition-transform duration-500 group-hover:scale-105"
                      style={{
                        background:
                          "linear-gradient(160deg, hsl(var(--secondary)) 0%, hsl(var(--background)) 100%)",
                      }}
                    >
                      <span className="font-display text-6xl font-bold text-white/20">
                        {initial}
                      </span>
                    </div>
                  )}

                  {/* Subtle dark gradient at the top for text legibility */}
                  <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-black/60 to-transparent" />

                  {/* Label top-left */}
                  <div className="absolute left-5 top-5">
                    <h3 className="font-display text-xl font-bold text-white">
                      {cat.name}
                    </h3>
                    <span className="mt-1 inline-flex items-center gap-1.5 text-sm text-white/80 transition-colors group-hover:text-white">
                      {t("catgrid.explore")}
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* View all categories */}
          <div className="mt-8 flex justify-center">
            <Link
              to="/store/categories"
              className="group inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              {t("catgrid.viewAll")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
