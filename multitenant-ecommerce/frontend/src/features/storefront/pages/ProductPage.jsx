import { useState } from "react";
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
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent } from "../../../components/ui/card";
import Seo from "../../../components/Seo";
import { useGetProductQuery } from "../../products/productsApi";
import {
  useGetProductReviewsQuery,
  useGetMyReviewQuery,
  useCreateReviewMutation,
} from "../../reviews/reviewsApi";
import { addItem } from "../../cart/cartSlice";
import { formatPrice } from "../../../lib/format";

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
        >
          <Star
            className={`${size} ${n <= value ? "fill-current text-amber-400" : "text-muted-foreground/40"}`}
          />
        </button>
      ))}
    </div>
  );
}

/** Reviews block: average, list of approved reviews, and the review form. */
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
  const [msg, setMsg] = useState(null); // { type, text }

  // Seed the form with the existing review when it loads.
  const [seeded, setSeeded] = useState(false);
  if (myReview && !seeded) {
    setRating(myReview.rating);
    setComment(myReview.comment || "");
    setSeeded(true);
  }

  const submit = async () => {
    setMsg(null);
    if (!rating) {
      setMsg({ type: "err", text: t("reviews.pickRating") });
      return;
    }
    try {
      await createReview({ product: productId, rating, comment }).unwrap();
      setMsg({ type: "ok", text: t("reviews.submitted") });
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
    <div className="mt-16 border-t border-border pt-10">
      <h2 className="font-display text-2xl font-bold tracking-tight">
        {t("reviews.title")}
      </h2>

      {/* Average summary */}
      <div className="mt-3 flex items-center gap-3">
        <Stars value={Math.round(average)} size="h-5 w-5" />
        <span className="text-sm text-muted-foreground">
          {count > 0
            ? `${average} (${t("reviews.count", { count })})`
            : t("reviews.none")}
        </span>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-3">
        {/* Review form */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold">
                {myReview ? t("reviews.editYours") : t("reviews.writeOne")}
              </h3>

              {user ? (
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="mb-1 text-sm text-muted-foreground">
                      {t("reviews.yourRating")}
                    </p>
                    <Stars value={rating} onSelect={setRating} size="h-7 w-7" />
                  </div>
                  <div>
                    <p className="mb-1 text-sm text-muted-foreground">
                      {t("reviews.yourComment")}
                    </p>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={4}
                      maxLength={1000}
                      className="w-full rounded-md border border-border bg-background p-2 text-sm"
                      placeholder={t("reviews.commentPlaceholder")}
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={submit}
                    disabled={submitting}
                  >
                    {submitting ? t("reviews.sending") : t("reviews.send")}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    {t("reviews.moderationNote")}
                  </p>
                  {msg && (
                    <p
                      className={`text-xs ${msg.type === "ok" ? "text-green-600" : "text-destructive"}`}
                    >
                      {msg.text}
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-4 text-sm text-muted-foreground">
                  <p>{t("reviews.loginToReview")}</p>
                  <Button asChild variant="outline" size="sm" className="mt-3">
                    <Link to="/store/login">{t("reviews.goLogin")}</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Reviews list */}
        <div className="lg:col-span-2">
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
            <p className="text-sm text-muted-foreground">
              {t("reviews.beFirst")}
            </p>
          )}

          {!isLoading && reviews.length > 0 && (
            <div className="space-y-4">
              {reviews.map((r) => (
                <div
                  key={r._id}
                  className="border-b border-border pb-4 last:border-0"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{r.authorName}</span>
                      {r.verifiedPurchase && (
                        <span className="flex items-center gap-1 text-xs text-green-600">
                          <BadgeCheck className="h-3.5 w-3.5" />{" "}
                          {t("reviews.verified")}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {fmtDate(r.createdAt)}
                    </span>
                  </div>
                  <div className="mt-1">
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

/**
 * Product detail page. CONNECTED to the real backend (GET /products/:slug).
 * Image gallery, quantity selector, add-to-cart, buy-now, and reviews. i18n.
 */
export default function ProductPage() {
  const { t } = useTranslation();
  const { slug } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { data, isLoading, isError } = useGetProductQuery(slug);
  const product = data?.product;

  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);

  if (isLoading) {
    return (
      <div className="container py-16">
        <div className="grid gap-10 md:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-xl bg-muted" />
          <div className="space-y-4">
            <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-6 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-24 animate-pulse rounded bg-muted" />
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
  const images = product.images?.length ? product.images : [null];

  const handleAdd = () => dispatch(addItem({ product, quantity: qty }));
  const handleBuyNow = () => {
    dispatch(addItem({ product, quantity: qty }));
    navigate("/store/cart");
  };

  return (
    <>
      <Seo
        title={product.name}
        description={product.description}
        product={product}
      />
      <div className="container py-8">
        <Link
          to="/store"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> {t("productPage.back")}
        </Link>

        <div className="grid gap-10 md:grid-cols-2">
          {/* Gallery */}
          <div>
            <div className="aspect-square overflow-hidden rounded-xl border border-border bg-white p-6">
              {images[activeImg] ? (
                <img
                  src={images[activeImg]}
                  alt={product.name}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center rounded-lg"
                  style={{
                    background:
                      "linear-gradient(135deg, hsl(var(--secondary)), hsl(var(--accent)))",
                  }}
                />
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`h-16 w-16 overflow-hidden rounded-lg border-2 bg-white p-1 ${i === activeImg ? "border-primary" : "border-border"}`}
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
          </div>

          {/* Info */}
          <div>
            {product.category && (
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {product.category}
              </p>
            )}
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">
              {product.name}
            </h1>

            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-3xl font-bold">
                {formatPrice(product.price, product.currency)}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-lg text-muted-foreground line-through">
                    {formatPrice(product.compareAtPrice, product.currency)}
                  </span>
                  <Badge variant="destructive">
                    -
                    {Math.round(
                      (1 - product.price / product.compareAtPrice) * 100,
                    )}
                    %
                  </Badge>
                </>
              )}
            </div>

            {product.description && (
              <p className="mt-5 leading-relaxed text-muted-foreground">
                {product.description}
              </p>
            )}

            {/* Quantity + actions */}
            {product.stock > 0 ? (
              <>
                <div className="mt-6 flex items-center gap-4">
                  <span className="text-sm font-medium">
                    {t("productPage.quantity")}
                  </span>
                  <div className="flex items-center rounded-md border border-border">
                    <button
                      className="flex h-10 w-10 items-center justify-center hover:bg-secondary"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-10 text-center text-sm font-medium">
                      {qty}
                    </span>
                    <button
                      className="flex h-10 w-10 items-center justify-center hover:bg-secondary"
                      onClick={() =>
                        setQty((q) => Math.min(product.stock, q + 1))
                      }
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {t("productPage.inStock", { n: product.stock })}
                  </span>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button size="lg" className="flex-1" onClick={handleAdd}>
                    <ShoppingCart className="h-4 w-4" />{" "}
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
              </>
            ) : (
              <Badge variant="secondary" className="mt-6">
                {t("productPage.outOfStock")}
              </Badge>
            )}

            {/* Trust */}
            <div className="mt-8 grid grid-cols-3 gap-3 border-t border-border pt-6 text-center text-xs text-muted-foreground">
              <div className="flex flex-col items-center gap-1">
                <Truck className="h-5 w-5" />
                {t("productPage.freeShipping")}
              </div>
              <div className="flex flex-col items-center gap-1">
                <ShieldCheck className="h-5 w-5" />
                {t("productPage.secure")}
              </div>
              <div className="flex flex-col items-center gap-1">
                <RotateCcw className="h-5 w-5" />
                {t("productPage.returns")}
              </div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <ProductReviews productId={product._id} />
      </div>
    </>
  );
}
