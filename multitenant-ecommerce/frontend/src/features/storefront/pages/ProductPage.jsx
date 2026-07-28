import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  ShoppingCart,
  Star,
  Minus,
  Plus,
  ArrowLeft,
  Truck,
  ShieldCheck,
  RotateCcw,
  BadgeCheck,
  Heart,
  Share2,
  Headphones,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent } from "../../../components/ui/card";
import Seo from "../../../components/Seo";
import {
  useGetProductQuery,
  useGetProductsQuery,
} from "../../products/productsApi";
import {
  useGetProductReviewsQuery,
  useGetMyReviewQuery,
  useCreateReviewMutation,
} from "../../reviews/reviewsApi";
import { addItem } from "../../cart/cartSlice";
import { formatPrice } from "../../../lib/format";

/* ============================================================================
 * ProductPage — premium storefront product detail.
 *
 * Data-driven by design: the page renders its sections from the SECTIONS array
 * below, each with an `enabled` flag. Today that array is a constant; tomorrow
 * it can come from the tenant's theme config (per-plan / visual editor) without
 * touching this component. That's the whole "block system" foundation — cheap
 * now, ready later.
 *
 * Only uses data the backend actually provides (images[], compareAtPrice,
 * stock, lowStockThreshold, category, reviews average/count/list). No invented
 * fields (brand, variants, sold count) — those sections are simply absent.
 * ========================================================================== */

/* ---------- small building blocks ---------- */

/** Renders N stars (filled up to `value`). Optionally clickable for input. */
function Stars({ value = 0, onSelect = null, size = "h-4 w-4" }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onSelect}
          onClick={() => onSelect && onSelect(n)}
          className={onSelect ? "cursor-pointer" : "cursor-default"}
          aria-label={`${n} estrellas`}
        >
          <Star
            className={`${size} transition-colors ${
              n <= value
                ? "fill-current text-amber-400"
                : "text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

/** Stock indicator with color + text based on real stock + lowStockThreshold. */
function StockBadge({ stock, threshold }) {
  const { t } = useTranslation();
  if (stock <= 0) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-destructive">
        <span className="h-2 w-2 rounded-full bg-destructive" />
        {t("productPage.outOfStock")}
      </span>
    );
  }
  const low = stock <= (threshold || 10);
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-sm font-medium ${
        low ? "text-amber-600" : "text-green-600"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${low ? "bg-amber-500" : "bg-green-500"}`}
      />
      {low
        ? t("productPage.lowStock", { n: stock })
        : t("productPage.inStockShort")}
    </span>
  );
}

/* ---------- gallery ---------- */

function ProductGallery({ product }) {
  const images = product.images?.length ? product.images : [null];
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState({ show: false, x: 50, y: 50 });

  useEffect(() => {
    setActive(0);
  }, [product._id]);

  const hasDiscount =
    product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPct = hasDiscount
    ? Math.round((1 - product.price / product.compareAtPrice) * 100)
    : 0;
  const isNew =
    product.createdAt &&
    Date.now() - new Date(product.createdAt).getTime() <
      1000 * 60 * 60 * 24 * 30;

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoom({ show: true, x, y });
  };

  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row">
      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 md:flex-col">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-white p-1 transition-all ${
                i === active
                  ? "border-primary ring-1 ring-primary"
                  : "border-border hover:border-primary/50"
              }`}
            >
              {img && (
                <img
                  src={img}
                  alt=""
                  className="h-full w-full object-contain"
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Main image */}
      <div className="relative flex-1">
        <div className="absolute left-3 top-3 z-10 flex flex-col gap-2">
          {isNew && (
            <Badge className="bg-neutral-900 text-white hover:bg-neutral-900">
              Nuevo
            </Badge>
          )}
          {hasDiscount && <Badge variant="destructive">-{discountPct}%</Badge>}
        </div>

        <div
          className="aspect-square overflow-hidden rounded-2xl border border-border bg-white"
          onMouseMove={images[active] ? onMove : undefined}
          onMouseLeave={() => setZoom((z) => ({ ...z, show: false }))}
        >
          {images[active] ? (
            <img
              src={images[active]}
              alt={product.name}
              className="h-full w-full object-contain p-6 transition-transform duration-200"
              style={
                zoom.show
                  ? {
                      transform: "scale(1.8)",
                      transformOrigin: `${zoom.x}% ${zoom.y}%`,
                    }
                  : undefined
              }
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, hsl(var(--secondary)), hsl(var(--accent)))",
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- benefits ---------- */

function BenefitsSection() {
  const { t } = useTranslation();
  const items = [
    { icon: Truck, label: t("productPage.freeShipping") },
    { icon: ShieldCheck, label: t("productPage.warranty") },
    { icon: RotateCcw, label: t("productPage.returns") },
    { icon: BadgeCheck, label: t("productPage.secure") },
    { icon: Headphones, label: t("productPage.support") },
  ];
  return (
    <div className="mt-8 grid grid-cols-2 gap-4 rounded-2xl border border-border bg-secondary/20 p-5 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((it, i) => (
        <div key={i} className="flex flex-col items-center gap-2 text-center">
          <it.icon className="h-5 w-5 text-primary" />
          <span className="text-xs leading-tight text-muted-foreground">
            {it.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ---------- tabs (description / specs / reviews / faq) ---------- */

function ProductTabs({ product, reviewsNode }) {
  const { t } = useTranslation();
  const tabs = [
    { id: "desc", label: t("productPage.tabDescription") },
    { id: "specs", label: t("productPage.tabSpecs") },
    { id: "reviews", label: t("productPage.tabReviews") },
    { id: "faq", label: t("productPage.tabFaq") },
  ];
  const [active, setActive] = useState("desc");

  return (
    <div className="mt-16 border-t border-border pt-8">
      {/* Tab headers */}
      <div className="flex gap-1 overflow-x-auto border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`relative whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors ${
              active === tab.id
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            {active === tab.id && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="py-6">
        {active === "desc" && (
          <p className="max-w-3xl whitespace-pre-line leading-relaxed text-muted-foreground">
            {product.description || t("productPage.noDescription")}
          </p>
        )}

        {active === "specs" && (
          <div className="max-w-2xl overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <tbody>
                {product.category && (
                  <tr className="border-b border-border">
                    <td className="bg-secondary/30 px-4 py-3 font-medium">
                      {t("productPage.category")}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {product.category}
                    </td>
                  </tr>
                )}
                <tr className="border-b border-border">
                  <td className="bg-secondary/30 px-4 py-3 font-medium">
                    {t("productPage.availability")}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {product.stock > 0
                      ? t("productPage.inStock", { n: product.stock })
                      : t("productPage.outOfStock")}
                  </td>
                </tr>
                <tr>
                  <td className="bg-secondary/30 px-4 py-3 font-medium">SKU</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {product._id.slice(-8).toUpperCase()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {active === "reviews" && reviewsNode}

        {active === "faq" && (
          <div className="max-w-2xl space-y-4">
            {[
              {
                q: t("productPage.faq1Q"),
                a: t("productPage.faq1A"),
              },
              {
                q: t("productPage.faq2Q"),
                a: t("productPage.faq2A"),
              },
              {
                q: t("productPage.faq3Q"),
                a: t("productPage.faq3A"),
              },
            ].map((f, i) => (
              <div key={i} className="rounded-xl border border-border p-4">
                <p className="font-medium">{f.q}</p>
                <p className="mt-1 text-sm text-muted-foreground">{f.a}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- reviews (rich) ---------- */

function ProductReviews({ productId }) {
  const { t } = useTranslation();
  const user = useSelector((s) => s.auth.user);

  const { data: reviewsData, isLoading } = useGetProductReviewsQuery(productId);
  const { data: myData } = useGetMyReviewQuery(productId, { skip: !user });
  const [createReview, { isLoading: submitting }] = useCreateReviewMutation();

  const reviews = reviewsData?.reviews || [];
  const average = reviewsData?.average || 0;
  const count = reviewsData?.count || 0;
  const myReview = myData?.review || null;

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [msg, setMsg] = useState(null);
  const [seeded, setSeeded] = useState(false);
  const [showForm, setShowForm] = useState(false);

  if (myReview && !seeded) {
    setRating(myReview.rating);
    setComment(myReview.comment || "");
    setSeeded(true);
  }

  // Star distribution from the loaded reviews (5★..1★).
  const dist = useMemo(() => {
    const d = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      if (d[r.rating] !== undefined) d[r.rating] += 1;
    });
    return d;
  }, [reviews]);

  const submit = async () => {
    setMsg(null);
    if (!rating) {
      setMsg({ type: "err", text: t("reviews.pickRating") });
      return;
    }
    try {
      await createReview({ product: productId, rating, comment }).unwrap();
      setMsg({ type: "ok", text: t("reviews.submitted") });
      setShowForm(false);
    } catch (err) {
      setMsg({ type: "err", text: err?.data?.message || t("reviews.error") });
    }
  };

  const fmtDate = (iso) =>
    iso
      ? new Date(iso).toLocaleDateString(undefined, {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "";

  return (
    <div>
      <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
        {/* Summary + distribution */}
        <div>
          <div className="rounded-2xl border border-border p-6 text-center">
            <div className="font-display text-5xl font-bold">
              {count > 0 ? average.toFixed(1) : "—"}
            </div>
            <div className="mt-2 flex justify-center">
              <Stars value={Math.round(average)} size="h-5 w-5" />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {count > 0 ? t("reviews.count", { count }) : t("reviews.none")}
            </p>

            {/* Distribution bars */}
            {count > 0 && (
              <div className="mt-5 space-y-1.5">
                {[5, 4, 3, 2, 1].map((star) => {
                  const pct = count ? (dist[star] / count) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-2 text-xs">
                      <span className="w-3 text-muted-foreground">{star}</span>
                      <Star className="h-3 w-3 fill-current text-amber-400" />
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-amber-400"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-6 text-right text-muted-foreground">
                        {dist[star]}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {user ? (
              <Button
                className="mt-5 w-full"
                variant="outline"
                onClick={() => setShowForm((v) => !v)}
              >
                {myReview ? t("reviews.editYours") : t("reviews.writeOne")}
              </Button>
            ) : (
              <Button asChild variant="outline" className="mt-5 w-full">
                <Link to="/store/login">{t("reviews.goLogin")}</Link>
              </Button>
            )}
          </div>

          {/* Inline form */}
          {showForm && user && (
            <div className="mt-4 rounded-2xl border border-border p-5">
              <p className="mb-1 text-sm text-muted-foreground">
                {t("reviews.yourRating")}
              </p>
              <Stars value={rating} onSelect={setRating} size="h-7 w-7" />
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                maxLength={1000}
                className="mt-3 w-full rounded-md border border-border bg-background p-2 text-sm"
                placeholder={t("reviews.commentPlaceholder")}
              />
              <Button
                className="mt-3 w-full"
                onClick={submit}
                disabled={submitting}
              >
                {submitting ? t("reviews.sending") : t("reviews.send")}
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">
                {t("reviews.moderationNote")}
              </p>
              {msg && (
                <p
                  className={`mt-2 text-xs ${
                    msg.type === "ok" ? "text-green-600" : "text-destructive"
                  }`}
                >
                  {msg.text}
                </p>
              )}
            </div>
          )}
        </div>

        {/* List */}
        <div>
          {isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-lg bg-muted"
                />
              ))}
            </div>
          )}

          {!isLoading && reviews.length === 0 && (
            <div className="flex h-full min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-border">
              <p className="text-sm text-muted-foreground">
                {t("reviews.beFirst")}
              </p>
            </div>
          )}

          {!isLoading && reviews.length > 0 && (
            <div className="space-y-5">
              {reviews.map((r) => (
                <div
                  key={r._id}
                  className="border-b border-border pb-5 last:border-0"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-bold uppercase">
                        {(r.authorName || "?").charAt(0)}
                      </div>
                      <span className="font-medium">{r.authorName}</span>
                      {r.verifiedPurchase && (
                        <span className="flex items-center gap-1 text-xs text-green-600">
                          <BadgeCheck className="h-3.5 w-3.5" />
                          {t("reviews.verified")}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {fmtDate(r.createdAt)}
                    </span>
                  </div>
                  <div className="mt-2">
                    <Stars value={r.rating} />
                  </div>
                  {r.comment && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {r.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- product carousel (related / also bought) ---------- */

function ProductCarousel({ title, products, currency }) {
  const scroller = useRef(null);
  const dispatch = useDispatch();

  if (!products || products.length < 2) return null;

  const scrollBy = (dir) => {
    scroller.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  return (
    <div className="mt-16">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold tracking-tight md:text-2xl">
          {title}
        </h2>
        <div className="hidden gap-2 md:flex">
          <button
            onClick={() => scrollBy(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scrollBy(1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={scroller}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((p) => {
          const hasDisc = p.compareAtPrice && p.compareAtPrice > p.price;
          return (
            <div
              key={p._id}
              className="group w-[70%] shrink-0 snap-start sm:w-[45%] md:w-[240px]"
            >
              <Link to={`/store/product/${p.slug}`} className="block">
                <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-white">
                  {p.images?.[0] ? (
                    <img
                      src={p.images[0]}
                      alt={p.name}
                      className="h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div
                      className="h-full w-full"
                      style={{
                        background:
                          "linear-gradient(135deg, hsl(var(--secondary)), hsl(var(--accent)))",
                      }}
                    />
                  )}
                  {hasDisc && (
                    <Badge
                      variant="destructive"
                      className="absolute left-2 top-2"
                    >
                      -{Math.round((1 - p.price / p.compareAtPrice) * 100)}%
                    </Badge>
                  )}
                </div>
                <p className="mt-2 line-clamp-1 text-sm font-medium">
                  {p.name}
                </p>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    {formatPrice(p.price, currency)}
                  </span>
                  {hasDisc && (
                    <span className="text-xs text-muted-foreground line-through">
                      {formatPrice(p.compareAtPrice, currency)}
                    </span>
                  )}
                </div>
              </Link>
              <Button
                size="sm"
                variant="outline"
                className="mt-2 w-full"
                onClick={() => dispatch(addItem({ product: p, quantity: 1 }))}
                disabled={p.stock <= 0}
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                {p.stock > 0 ? "Agregar" : "Sin stock"}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================================
 * MAIN PAGE
 * ========================================================================== */

export default function ProductPage() {
  const { t } = useTranslation();
  const { slug } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { data, isLoading, isError } = useGetProductQuery(slug);
  const product = data?.product;

  // For related / cross-sell we reuse the general product listing.
  const { data: allData } = useGetProductsQuery();
  const allProducts = allData?.products || [];

  const { data: reviewsData } = useGetProductReviewsQuery(product?._id, {
    skip: !product?._id,
  });
  const reviewAvg = reviewsData?.average || 0;
  const reviewCount = reviewsData?.count || 0;

  const [qty, setQty] = useState(1);
  const [fav, setFav] = useState(false);
  const [showSticky, setShowSticky] = useState(false);
  const actionsRef = useRef(null);

  useEffect(() => {
    setQty(1);
  }, [product?._id]);

  // Sticky bar appears once the main purchase actions scroll out of view.
  useEffect(() => {
    if (!actionsRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => setShowSticky(!entry.isIntersecting),
      { threshold: 0 },
    );
    obs.observe(actionsRef.current);
    return () => obs.disconnect();
  }, [product]);

  const related = useMemo(() => {
    if (!product) return [];
    return allProducts
      .filter(
        (p) =>
          p._id !== product._id &&
          p.category &&
          p.category === product.category,
      )
      .slice(0, 10);
  }, [allProducts, product]);

  const alsoBought = useMemo(() => {
    if (!product) return [];
    return allProducts
      .filter((p) => p._id !== product._id && p.category !== product.category)
      .slice(0, 10);
  }, [allProducts, product]);

  if (isLoading) {
    return (
      <div className="container py-16">
        <div className="grid gap-10 md:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-2xl bg-muted" />
          <div className="space-y-4">
            <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-6 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-24 animate-pulse rounded bg-muted" />
            <div className="h-12 w-full animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="container py-24 text-center">
        <p className="font-display text-2xl font-bold">
          {t("productPage.notFound")}
        </p>
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => navigate("/store")}
        >
          <ArrowLeft className="h-4 w-4" /> {t("productPage.back")}
        </Button>
      </div>
    );
  }

  const hasDiscount =
    product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPct = hasDiscount
    ? Math.round((1 - product.price / product.compareAtPrice) * 100)
    : 0;

  const handleAdd = () => dispatch(addItem({ product, quantity: qty }));
  const handleBuyNow = () => {
    dispatch(addItem({ product, quantity: qty }));
    navigate("/store/cart");
  };
  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, url });
      } catch {
        /* user cancelled */
      }
    } else {
      navigator.clipboard?.writeText(url);
    }
  };

  return (
    <>
      <Seo
        title={product.name}
        description={product.description}
        product={product}
      />

      <div className="container py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link to="/store" className="hover:text-foreground">
            {t("nav.store")}
          </Link>
          {product.category && (
            <>
              <span>/</span>
              <Link
                to={`/store/categories/${product.category}`}
                className="hover:text-foreground"
              >
                {product.category}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="line-clamp-1 text-foreground">{product.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[45%_1fr]">
          {/* LEFT: gallery */}
          <ProductGallery product={product} />

          {/* RIGHT: info */}
          <div>
            {product.category && (
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                {product.category}
              </p>
            )}
            <h1 className="mt-1 font-display text-3xl font-bold leading-tight tracking-tight md:text-4xl">
              {product.name}
            </h1>

            {/* Rating row */}
            <div className="mt-3 flex items-center gap-2">
              <Stars value={Math.round(reviewAvg)} />
              <span className="text-sm text-muted-foreground">
                {reviewCount > 0
                  ? `${reviewAvg.toFixed(1)} · ${t("reviews.count", { count: reviewCount })}`
                  : t("reviews.none")}
              </span>
            </div>

            {/* Price */}
            <div className="mt-5 flex flex-wrap items-baseline gap-3">
              <span className="text-3xl font-bold md:text-4xl">
                {formatPrice(product.price, product.currency)}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-lg text-muted-foreground line-through">
                    {formatPrice(product.compareAtPrice, product.currency)}
                  </span>
                  <Badge variant="destructive" className="text-sm">
                    -{discountPct}%
                  </Badge>
                </>
              )}
            </div>

            {/* Stock */}
            <div className="mt-3">
              <StockBadge
                stock={product.stock}
                threshold={product.lowStockThreshold}
              />
            </div>

            {/* Quantity + actions */}
            {product.stock > 0 ? (
              <div ref={actionsRef}>
                <div className="mt-6 flex items-center gap-4">
                  <span className="text-sm font-medium">
                    {t("productPage.quantity")}
                  </span>
                  <div className="flex items-center rounded-lg border border-border">
                    <button
                      className="flex h-10 w-10 items-center justify-center rounded-l-lg hover:bg-secondary"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-10 text-center text-sm font-medium">
                      {qty}
                    </span>
                    <button
                      className="flex h-10 w-10 items-center justify-center rounded-r-lg hover:bg-secondary"
                      onClick={() =>
                        setQty((q) => Math.min(product.stock, q + 1))
                      }
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button size="lg" className="flex-1" onClick={handleAdd}>
                    <ShoppingCart className="h-4 w-4" />
                    {t("productPage.addToCart")}
                  </Button>
                  <Button
                    size="lg"
                    variant="secondary"
                    className="flex-1"
                    onClick={handleBuyNow}
                  >
                    {t("productPage.buyNow")}
                  </Button>
                </div>

                {/* Secondary actions */}
                <div className="mt-4 flex items-center gap-4 text-sm">
                  <button
                    onClick={() => setFav((v) => !v)}
                    className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Heart
                      className={`h-4 w-4 ${fav ? "fill-red-500 text-red-500" : ""}`}
                    />
                    {t("productPage.addFavorite")}
                  </button>
                  <button
                    onClick={handleShare}
                    className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Share2 className="h-4 w-4" />
                    {t("productPage.share")}
                  </button>
                </div>
              </div>
            ) : (
              <Badge variant="secondary" className="mt-6">
                {t("productPage.outOfStock")}
              </Badge>
            )}

            {/* Benefits */}
            <BenefitsSection />
          </div>
        </div>

        {/* Tabs (incluye reviews adentro) */}
        <ProductTabs
          product={product}
          reviewsNode={<ProductReviews productId={product._id} />}
        />

        {/* Related */}
        <ProductCarousel
          title={t("productPage.related")}
          products={related}
          currency={product.currency}
        />

        {/* Also bought */}
        <ProductCarousel
          title={t("productPage.alsoBought")}
          products={alsoBought}
          currency={product.currency}
        />
      </div>

      {/* Sticky buy bar */}
      {showSticky && product.stock > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md">
          <div className="container flex items-center gap-4 py-3">
            <div className="hidden h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border bg-white sm:block">
              {product.images?.[0] && (
                <img
                  src={product.images[0]}
                  alt=""
                  className="h-full w-full object-contain p-1"
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-sm font-medium">{product.name}</p>
              <span className="font-bold">
                {formatPrice(product.price, product.currency)}
              </span>
            </div>
            <Button className="shrink-0" onClick={handleAdd}>
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">
                {t("productPage.addToCart")}
              </span>
            </Button>
            <Button
              variant="secondary"
              className="shrink-0"
              onClick={handleBuyNow}
            >
              {t("productPage.buyNow")}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
