import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ShoppingCart, Star, Heart } from "lucide-react";
import { addItem } from "../../cart/cartSlice";
import { formatPrice } from "../../../lib/format";

/**
 * Premium product card (NOVA style). Clean light image area with a wishlist
 * heart, then name, star rating, price, and an always-visible "add to cart"
 * button. Themed (CSS vars) + translated. Logic unchanged.
 */
export default function ProductCard({ product }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const hasDiscount =
    product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPct = hasDiscount
    ? Math.round((1 - product.price / product.compareAtPrice) * 100)
    : 0;

  const rating = typeof product.rating === "number" ? product.rating : 0;

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(addItem({ product, quantity: 1 }));
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Placeholder: wishlist not wired yet.
  };

  return (
    <Link to={`/store/product/${product.slug}`} className="group block">
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40">
        {/* Image area (light background) */}
        <div className="relative aspect-square overflow-hidden bg-white p-4">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
              {t("product.noImage")}
            </div>
          )}

          {/* Discount badge */}
          {hasDiscount && (
            <span className="absolute left-3 top-3 rounded-full bg-destructive px-2.5 py-1 text-xs font-semibold text-destructive-foreground">
              -{discountPct}%
            </span>
          )}

          {/* Wishlist heart */}
          <button
            onClick={handleWishlist}
            aria-label="Wishlist"
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-neutral-700 shadow-sm backdrop-blur transition-colors hover:bg-white"
          >
            <Heart className="h-4 w-4" />
          </button>

          {/* Out of stock overlay */}
          {product.stock === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm">
              <span className="rounded-full bg-neutral-900 px-3 py-1 text-sm font-medium text-white">
                {t("product.outOfStock")}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col p-4">
          <h3 className="line-clamp-1 font-body font-medium text-foreground">
            {product.name}
          </h3>

          {/* Star rating (always shown) */}
          <div className="mt-1.5 flex items-center gap-1">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3.5 w-3.5 ${
                    i < Math.round(rating)
                      ? "fill-amber-400 text-amber-400"
                      : "fill-neutral-200 text-neutral-200"
                  }`}
                />
              ))}
            </div>
            {product.reviewCount ? (
              <span className="text-xs text-muted-foreground">
                ({product.reviewCount})
              </span>
            ) : null}
          </div>

          {/* Price */}
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-lg font-semibold text-foreground">
              {formatPrice(product.price, product.currency)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(product.compareAtPrice, product.currency)}
              </span>
            )}
          </div>

          {/* Add to cart (always visible, at the bottom) */}
          <button
            onClick={handleAdd}
            disabled={product.stock === 0}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("product.addToCart")}
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Link>
  );
}
