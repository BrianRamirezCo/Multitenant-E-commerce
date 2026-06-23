import { useRef } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useGetProductsQuery } from "../../products/productsApi";
import ProductCard from "./ProductCard";

/**
 * "New arrivals" section (NOVA style): a LIGHT full-width band with a horizontal
 * carousel of the most recently added products, arrows, and a "view all" link.
 * The light background breaks the monotony of the dark sections, like NOVA.
 *
 * The backend already returns products sorted by createdAt desc, so we take the
 * first N. Reuses ProductCard.
 */
export default function NewArrivals() {
  const { t } = useTranslation();
  const { data, isLoading } = useGetProductsQuery({ limit: 12 });
  const products = (data?.products || []).slice(0, 12);
  const scrollerRef = useRef(null);

  const scrollBy = (dir) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  if (!isLoading && products.length === 0) return null;

  return (
    <section className="bg-neutral-50 py-12 text-neutral-900 md:py-16">
      <div className="container">
        {/* Header */}
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
              {t("newArrivals.eyebrow")}
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">
              {t("newArrivals.title")}
            </h2>
          </div>

          <Link
            to="/store/new"
            className="flex items-center gap-1 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900"
          >
            {t("newArrivals.viewAll")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Carousel */}
        {isLoading ? (
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-[260px] shrink-0">
                <div className="aspect-square rounded-2xl bg-neutral-200" />
                <div className="mt-3 h-4 w-2/3 rounded bg-neutral-200" />
                <div className="mt-2 h-4 w-1/3 rounded bg-neutral-200" />
              </div>
            ))}
          </div>
        ) : (
          <div
            ref={scrollerRef}
            className="flex snap-x gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {products.map((product) => (
              <div key={product._id} className="w-[260px] shrink-0 snap-start">
                <NewArrivalCard product={product} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Light-themed product card for the new-arrivals band (so it reads well on the
 * light background instead of the dark ProductCard).
 */
function NewArrivalCard({ product }) {
  const { t } = useTranslation();
  return (
    <Link to={`/store/product/${product.slug}`} className="group block">
      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200 transition-all duration-300 hover:-translate-y-1 hover:ring-neutral-300">
        <div className="aspect-square overflow-hidden bg-white">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-neutral-400">
              {t("product.noImage")}
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="line-clamp-1 font-medium text-neutral-900">
            {product.name}
          </h3>
          <p className="mt-1 text-sm font-semibold text-neutral-900">
            {new Intl.NumberFormat("es-AR", {
              style: "currency",
              currency: product.currency || "ARS",
              minimumFractionDigits: 0,
            }).format((product.price || 0) / 100)}
          </p>
        </div>
      </div>
    </Link>
  );
}
