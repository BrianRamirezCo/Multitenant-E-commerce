import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Heart } from "lucide-react";
import Seo from "../../../components/Seo";
import ProductCard from "../components/ProductCard";
import { useGetWishlistQuery } from "../../auth/authApi";

/**
 * Wishlist page (/store/wishlist). Shows the logged-in customer's saved
 * products. Reuses ProductCard (whose heart lets them remove items). If not
 * logged in, prompts to sign in. Header band matches the other listing pages.
 */
export default function WishlistPage() {
  const { t } = useTranslation();
  const user = useSelector((s) => s.auth.user);

  const { data, isLoading } = useGetWishlistQuery(undefined, { skip: !user });
  const products = data?.products || [];

  return (
    <>
      <Seo description={t("wishlist.seoDesc")} />

      {/* Header band */}
      <section className="border-b border-border bg-secondary/30">
        <div className="container py-10 md:py-14">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Heart className="h-4 w-4" />
            <span className="text-sm">{t("wishlist.eyebrow")}</span>
          </div>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight md:text-4xl">
            {t("wishlist.title")}
          </h1>
          {user && !isLoading && products.length > 0 && (
            <p className="mt-1 text-sm text-muted-foreground">
              {t("wishlist.count", { count: products.length })}
            </p>
          )}
        </div>
      </section>

      <section className="container py-10">
        {/* Not logged in */}
        {!user && (
          <div className="rounded-xl border border-border bg-secondary/30 p-12 text-center">
            <Heart className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 font-medium text-foreground">
              {t("wishlist.loginTitle")}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("wishlist.loginSub")}
            </p>
            <Link
              to="/store/login"
              className="mt-4 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              {t("wishlist.loginBtn")}
            </Link>
          </div>
        )}

        {/* Loading */}
        {user && isLoading && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square rounded-xl bg-muted" />
                <div className="mt-3 h-4 w-2/3 rounded bg-muted" />
                <div className="mt-2 h-4 w-1/3 rounded bg-muted" />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {user && !isLoading && products.length === 0 && (
          <div className="rounded-xl border border-border bg-secondary/30 p-12 text-center">
            <Heart className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 font-medium text-foreground">
              {t("wishlist.empty")}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("wishlist.emptySub")}
            </p>
            <Link
              to="/store"
              className="mt-4 inline-block text-sm font-medium text-foreground hover:underline"
            >
              {t("wishlist.browse")}
            </Link>
          </div>
        )}

        {/* Products */}
        {user && !isLoading && products.length > 0 && (
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
