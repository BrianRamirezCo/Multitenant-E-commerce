import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  Search,
  ShoppingCart,
  User,
  Heart,
  Menu,
  X,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import { useGetCategoriesQuery } from "../../categories/categoriesApi";

/**
 * Premium storefront header. Always a dark surface, but the shade depends on the
 * plan: Starter gets a sober dark-grey header, Growth/Premium get near-black
 * (the NOVA look). Sticky, centered nav, hover categories dropdown, collapsible
 * search. Light text hardcoded so it stays readable on the dark surface.
 */
export default function StorefrontHeader() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const tenant = useSelector((s) => s.tenant.info);
  const plan = tenant?.plan || "starter";
  // Starter -> dark grey; Growth/Premium -> near-black (NOVA).
  const isStarter = plan === "starter";
  const surface = isStarter ? "bg-neutral-800/95" : "bg-neutral-950/95";

  const cartCount = useSelector((s) =>
    s.cart.items.reduce((sum, i) => sum + i.quantity, 0),
  );
  const { data: catData } = useGetCategoriesQuery();
  const categories = (catData?.categories || []).slice(0, 8);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  const submitSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    navigate(`/store/search?q=${encodeURIComponent(q)}`);
    setMobileOpen(false);
    setSearchOpen(false);
  };

  return (
    <header
      className={`sticky top-0 z-40 w-full border-b border-white/10 ${surface} text-white backdrop-blur-md transition-shadow duration-300 ${
        scrolled ? "shadow-[0_2px_20px_rgba(0,0,0,0.5)]" : ""
      }`}
    >
      <div className="container flex h-16 items-center md:h-20">
        {/* Logo (left) */}
        <Link to="/store" className="flex shrink-0 items-center gap-2">
          {tenant?.theme?.logoUrl ? (
            <img
              src={tenant.theme.logoUrl}
              alt={tenant.name}
              className="h-9 w-auto"
            />
          ) : (
            <span className="font-display text-xl font-bold tracking-tight text-white md:text-2xl">
              {tenant?.name || t("nav.store")}
            </span>
          )}
        </Link>

        {/* Desktop nav (centered) */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex">
          <Link
            to="/store"
            className="group relative text-sm font-medium text-white/70 transition-colors hover:text-white"
          >
            {t("nav.store")}
            <span className="absolute -bottom-1 left-0 h-px w-0 bg-white transition-all duration-300 group-hover:w-full" />
          </Link>

          {/* Categories dropdown (hover) */}
          <div
            className="relative"
            onMouseEnter={() => setCatOpen(true)}
            onMouseLeave={() => setCatOpen(false)}
          >
            <Link
              to="/store/categories"
              className="group relative flex items-center gap-1 text-sm font-medium text-white/70 transition-colors hover:text-white"
            >
              {t("nav.categories")}
              <ChevronDown
                className={`h-3.5 w-3.5 opacity-70 transition-transform ${catOpen ? "rotate-180" : ""}`}
              />
            </Link>

            {catOpen && categories.length > 0 && (
              <div className="absolute left-1/2 top-full w-64 -translate-x-1/2 pt-3">
                <div
                  className={`overflow-hidden rounded-2xl border border-white/10 ${isStarter ? "bg-neutral-700" : "bg-neutral-900"} p-2 shadow-2xl`}
                >
                  {categories.map((cat) => {
                    const slug = cat.slug || cat._id;
                    return (
                      <Link
                        key={cat._id || slug}
                        to={`/store/categories/${slug}`}
                        className="block rounded-lg px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                      >
                        {cat.name}
                      </Link>
                    );
                  })}
                  <Link
                    to="/store/categories"
                    className="mt-1 flex items-center justify-between rounded-lg border-t border-white/10 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
                  >
                    {t("nav.viewAllCategories")}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          <Link
            to="/store/new"
            className="group relative text-sm font-medium text-white/70 transition-colors hover:text-white"
          >
            {t("nav.new")}
            <span className="absolute -bottom-1 left-0 h-px w-0 bg-white transition-all duration-300 group-hover:w-full" />
          </Link>
          <Link
            to="/store/deals"
            className="group relative text-sm font-medium text-white/70 transition-colors hover:text-white"
          >
            {t("nav.deals")}
            <span className="absolute -bottom-1 left-0 h-px w-0 bg-white transition-all duration-300 group-hover:w-full" />
          </Link>
          <Link
            to="/store/about"
            className="group relative text-sm font-medium text-white/70 transition-colors hover:text-white"
          >
            {t("nav.about")}
            <span className="absolute -bottom-1 left-0 h-px w-0 bg-white transition-all duration-300 group-hover:w-full" />
          </Link>
        </nav>

        {/* Actions (right) */}
        <div className="ml-auto flex items-center gap-1 text-white">
          {/* Collapsible search */}
          <div className="relative flex items-center">
            {searchOpen && (
              <form
                onSubmit={submitSearch}
                className="absolute right-0 top-1/2 -translate-y-1/2"
              >
                <div className="relative">
                  <input
                    ref={searchInputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onBlur={() => !query && setSearchOpen(false)}
                    placeholder={t("nav.search")}
                    className="w-56 rounded-full border border-white/15 bg-white/5 py-2 pl-4 pr-10 text-sm text-white placeholder-white/40 outline-none backdrop-blur focus:border-white/30 sm:w-64"
                  />
                  <button
                    type="submit"
                    aria-label={t("nav.search")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 transition-colors hover:text-white"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </div>
              </form>
            )}
            {!searchOpen && (
              <button
                aria-label={t("nav.search")}
                onClick={() => setSearchOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-md text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                <Search className="h-5 w-5" />
              </button>
            )}
          </div>

          <Link
            to="/store/wishlist"
            aria-label={t("nav.wishlist")}
            className="flex h-10 w-10 items-center justify-center rounded-md text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Heart className="h-5 w-5" />
          </Link>
          <Link
            to="/store/account"
            aria-label={t("nav.account")}
            className="flex h-10 w-10 items-center justify-center rounded-md text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <User className="h-5 w-5" />
          </Link>
          <Link
            to="/store/cart"
            aria-label={t("nav.cart")}
            className="relative flex h-10 w-10 items-center justify-center rounded-md text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-neutral-900 shadow-lg">
                {cartCount}
              </span>
            )}
          </Link>
          <button
            className="flex h-10 w-10 items-center justify-center rounded-md text-white/80 transition-colors hover:bg-white/10 md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className={`border-t border-white/10 ${isStarter ? "bg-neutral-800" : "bg-neutral-950"} md:hidden`}
        >
          <nav className="container flex flex-col py-3">
            <Link
              to="/store"
              className="py-3 text-sm font-medium text-white/70 hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              {t("nav.store")}
            </Link>
            <Link
              to="/store/categories"
              className="py-3 text-sm font-medium text-white/70 hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              {t("nav.categories")}
            </Link>
            <Link
              to="/store/new"
              className="py-3 text-sm font-medium text-white/70 hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              {t("nav.new")}
            </Link>
            <Link
              to="/store/deals"
              className="py-3 text-sm font-medium text-white/70 hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              {t("nav.deals")}
            </Link>
            <Link
              to="/store/wishlist"
              className="py-3 text-sm font-medium text-white/70 hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              {t("nav.wishlist")}
            </Link>
            <Link
              to="/store/about"
              className="py-3 text-sm font-medium text-white/70 hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              {t("nav.about")}
            </Link>
            <form onSubmit={submitSearch} className="relative mt-2">
              <button
                type="submit"
                aria-label={t("nav.search")}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50"
              >
                <Search className="h-4 w-4" />
              </button>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("nav.search")}
                className="w-full rounded-md border border-white/15 bg-white/5 py-2 pl-9 pr-3 text-sm text-white placeholder-white/40 outline-none"
              />
            </form>
          </nav>
        </div>
      )}
    </header>
  );
}
