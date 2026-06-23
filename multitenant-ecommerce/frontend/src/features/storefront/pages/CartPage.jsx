import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { removeItem, updateQuantity } from "../../cart/cartSlice";
import { formatPrice } from "../../../lib/format";

/**
 * Cart page (premium NOVA style). Reads items from the Redux cart, lets the
 * user change quantities or remove items, shows an order summary and a CTA to
 * checkout. Logic unchanged — only the visual layer is upgraded. Themed + i18n.
 */
export default function CartPage() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const items = useSelector((s) => s.cart.items);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const totalUnits = items.reduce((sum, i) => sum + i.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="container py-24 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
          <ShoppingBag
            className="h-7 w-7 text-muted-foreground"
            strokeWidth={1.5}
          />
        </div>
        <p className="mt-6 font-display text-2xl font-bold tracking-tight">
          {t("cart.empty")}
        </p>
        <p className="mt-1 text-muted-foreground">{t("cart.emptySub")}</p>
        <Button className="mt-8 rounded-full" size="lg" asChild>
          <Link to="/store">{t("cart.continueShopping")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-10">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            {t("cart.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("cart.itemCount", { count: totalUnits })}
          </p>
        </div>
        <Link
          to="/store"
          className="hidden items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:flex"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("cart.continueShopping")}
        </Link>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Items */}
        <div className="lg:col-span-2">
          <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
            {items.map((item) => (
              <div
                key={item.product}
                className="flex items-center gap-4 p-4 sm:p-5"
              >
                {/* Image */}
                <Link
                  to={item.slug ? `/store/product/${item.slug}` : "#"}
                  className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-white p-2"
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="h-full w-full rounded-lg bg-secondary" />
                  )}
                </Link>

                {/* Name + unit price */}
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-medium text-foreground">
                    {item.name}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatPrice(item.price)}
                  </p>

                  {/* Quantity (mobile-friendly, under the name) */}
                  <div className="mt-3 inline-flex items-center rounded-full border border-border">
                    <button
                      className="flex h-9 w-9 items-center justify-center rounded-l-full hover:bg-secondary"
                      onClick={() =>
                        dispatch(
                          updateQuantity({
                            product: item.product,
                            quantity: Math.max(1, item.quantity - 1),
                          }),
                        )
                      }
                      aria-label="-"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-10 text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    <button
                      className="flex h-9 w-9 items-center justify-center rounded-r-full hover:bg-secondary"
                      onClick={() =>
                        dispatch(
                          updateQuantity({
                            product: item.product,
                            quantity: item.quantity + 1,
                          }),
                        )
                      }
                      aria-label="+"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Line total + remove */}
                <div className="flex flex-col items-end gap-3">
                  <span className="font-semibold text-foreground">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                  <button
                    className="text-muted-foreground transition-colors hover:text-destructive"
                    onClick={() => dispatch(removeItem(item.product))}
                    aria-label={t("cart.remove")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-2xl border border-border bg-secondary/30 p-6">
            <h2 className="font-semibold text-foreground">
              {t("cart.summary")}
            </h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("cart.items")}</span>
                <span className="text-foreground">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("cart.shipping")}
                </span>
                <span className="text-muted-foreground">
                  {t("cart.shippingAtCheckout")}
                </span>
              </div>
              <div className="my-3 border-t border-border" />
              <div className="flex justify-between text-base font-semibold">
                <span className="text-foreground">{t("cart.total")}</span>
                <span className="text-foreground">{formatPrice(subtotal)}</span>
              </div>
            </div>
            <Button
              className="mt-6 w-full rounded-full"
              size="lg"
              onClick={() => navigate("/store/checkout")}
            >
              {t("cart.checkout")} <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              {t("cart.secureCheckout")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
