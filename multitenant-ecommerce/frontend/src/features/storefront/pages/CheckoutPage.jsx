import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircle2, ArrowLeft, ShieldCheck, Lock } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { useCreateOrderMutation } from "../../orders/ordersApi";
import { useCreatePreferenceMutation } from "../../payments/paymentsApi";
import { useValidateCouponMutation } from "../../coupons/couponsApi";
import { useUpdateProfileMutation } from "../../auth/authApi";
import { useSaveCartMutation } from "../../cart/cartApi";
import { clearCart } from "../../cart/cartSlice";
import { formatPrice } from "../../../lib/format";

/**
 * Checkout page (premium NOVA style). Collects contact + shipping details,
 * shows the order summary (including shipping), and creates a REAL order on the
 * backend (POST /orders). The backend revalidates stock, coupon and shipping,
 * and recomputes the total server-side (never trusts client values).
 *
 * Logic is UNCHANGED from the previous version — only the visual layer is
 * upgraded. Shipping mirrors the tenant config so the displayed total matches.
 */
const EMPTY = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  zip: "",
};

export default function CheckoutPage() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const items = useSelector((s) => s.cart.items);
  const user = useSelector((s) => s.auth.user);
  const tenant = useSelector((s) => s.tenant.info);

  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState(null);
  const [order, setOrder] = useState(null);
  const [createOrder, { isLoading }] = useCreateOrderMutation();
  const [createPreference, { isLoading: payLoading }] =
    useCreatePreferenceMutation();
  const [validateCoupon, { isLoading: couponLoading }] =
    useValidateCouponMutation();
  const [updateProfile] = useUpdateProfileMutation();
  const [saveCart] = useSaveCartMutation();

  // Prefill the form from the logged-in user's profile (name, email, address).
  useEffect(() => {
    if (!user) return;
    const addr = user.profile?.address || {};
    setForm((f) => ({
      ...f,
      fullName: f.fullName || user.name || "",
      email: f.email || user.email || "",
      phone: f.phone || user.profile?.phone || "",
      address: f.address || addr.line1 || "",
      city: f.city || addr.city || "",
      state: f.state || addr.state || "",
      zip: f.zip || addr.zip || "",
    }));
  }, [user]);

  // GUEST cart persistence: when a guest types a valid email and has items,
  // save their cart (with that email) so the abandoned-cart cron can reach them.
  const guestTimer = useRef(null);
  useEffect(() => {
    if (user) return;
    if (items.length === 0) return;
    const email = form.email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;

    if (guestTimer.current) clearTimeout(guestTimer.current);
    guestTimer.current = setTimeout(() => {
      saveCart({
        email,
        items: items.map((i) => ({
          product: i.product,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          image: i.image || null,
        })),
      }).catch(() => {});
    }, 1200);

    return () => {
      if (guestTimer.current) clearTimeout(guestTimer.current);
    };
  }, [form.email, items, user, saveCart]);

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState(null); // { code, discount }
  const [couponError, setCouponError] = useState(null);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discount = coupon?.discount || 0;
  const afterDiscount = Math.max(0, subtotal - discount);

  // Shipping (mirrors the backend logic so the displayed total matches).
  const shipCfg = tenant?.shipping || {};
  let shippingCost = 0;
  if (shipCfg.enabled) {
    const freeThreshold = shipCfg.freeThreshold || 0;
    const qualifiesFree = freeThreshold > 0 && afterDiscount >= freeThreshold;
    shippingCost = qualifiesFree ? 0 : shipCfg.flatRate || 0;
  }
  const shippingFree = shipCfg.enabled && shippingCost === 0;
  const total = afterDiscount + shippingCost;

  const applyCoupon = async () => {
    setCouponError(null);
    if (!couponInput.trim()) return;
    try {
      const res = await validateCoupon({
        code: couponInput.trim(),
        subtotal,
      }).unwrap();
      if (res.valid) {
        setCoupon({ code: res.code, discount: res.discount });
      } else {
        setCoupon(null);
        setCouponError(t("checkout.couponInvalid"));
      }
    } catch {
      setCoupon(null);
      setCouponError(t("checkout.couponInvalid"));
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponInput("");
    setCouponError(null);
  };
  const update = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async () => {
    setError(null);
    if (items.length === 0) {
      setError(t("checkout.emptyCart"));
      return;
    }
    if (!form.fullName.trim() || !form.email.trim() || !form.address.trim()) {
      setError(t("checkout.fillRequired"));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError(t("checkout.invalidEmail"));
      return;
    }
    try {
      const res = await createOrder({
        items: items.map((i) => ({ product: i.product, quantity: i.quantity })),
        couponCode: coupon?.code || null,
        contact: { email: form.email.trim(), phone: form.phone.trim() },
        shippingAddress: {
          fullName: form.fullName,
          line1: form.address,
          city: form.city,
          state: form.state,
          zip: form.zip,
          country: "AR",
        },
      }).unwrap();

      if (user) {
        updateProfile({
          name: form.fullName,
          phone: form.phone.trim(),
          address: {
            line1: form.address,
            city: form.city,
            state: form.state,
            zip: form.zip,
            country: "AR",
          },
        }).catch(() => {});
      }

      try {
        const pref = await createPreference(res.order._id).unwrap();
        const url = pref.initPoint || pref.sandboxInitPoint;
        if (url) {
          dispatch(clearCart());
          window.location.href = url;
          return;
        }
      } catch {
        // No payment configured or MP error -> fall through to success screen.
      }

      dispatch(clearCart());
      setOrder(res.order);
    } catch (err) {
      setError(err?.data?.message || t("checkout.error"));
    }
  };

  // Success screen
  if (order) {
    return (
      <div className="container py-24 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 text-green-700">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h1 className="mt-6 font-display text-3xl font-bold tracking-tight">
          {t("checkout.successTitle")}
        </h1>
        <p className="mt-2 text-muted-foreground">{t("checkout.successSub")}</p>
        <p className="mt-4 inline-block rounded-lg bg-secondary px-4 py-2 font-mono text-sm">
          #{order._id}
        </p>
        <div className="mt-8">
          <Button className="rounded-full" size="lg" asChild>
            <Link to="/store">{t("cart.continueShopping")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Empty cart guard
  if (items.length === 0) {
    return (
      <div className="container py-24 text-center">
        <p className="font-display text-2xl font-bold tracking-tight">
          {t("checkout.emptyCart")}
        </p>
        <Button className="mt-6 rounded-full" asChild>
          <Link to="/store">{t("cart.continueShopping")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-10">
      {/* Header */}
      <div className="flex items-end justify-between">
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
          {t("checkout.title")}
        </h1>
        <Link
          to="/store/cart"
          className="hidden items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:flex"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("checkout.backToCart")}
        </Link>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Form */}
        <div className="space-y-6 lg:col-span-2">
          {/* Contact */}
          <div className="rounded-2xl border border-border p-6">
            <h2 className="font-semibold text-foreground">
              {t("checkout.contact")}
            </h2>
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">{t("checkout.fullName")}</Label>
                <Input
                  id="fullName"
                  value={form.fullName}
                  onChange={update("fullName")}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">{t("checkout.email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={update("email")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t("checkout.phone")}</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={update("phone")}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Shipping */}
          <div className="rounded-2xl border border-border p-6">
            <h2 className="font-semibold text-foreground">
              {t("checkout.shipping")}
            </h2>
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">{t("checkout.address")}</Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={update("address")}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="city">{t("checkout.city")}</Label>
                  <Input
                    id="city"
                    value={form.city}
                    onChange={update("city")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">{t("checkout.state")}</Label>
                  <Input
                    id="state"
                    value={form.state}
                    onChange={update("state")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">{t("checkout.zip")}</Label>
                  <Input id="zip" value={form.zip} onChange={update("zip")} />
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-2xl border border-border bg-secondary/30 p-6">
            <h2 className="font-semibold text-foreground">
              {t("checkout.orderSummary")}
            </h2>

            {/* Items */}
            <div className="mt-4 space-y-3">
              {items.map((i) => (
                <div
                  key={i.product}
                  className="flex items-center gap-3 text-sm"
                >
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-white p-1.5">
                    {i.image && (
                      <img
                        src={i.image}
                        alt={i.name}
                        className="h-full w-full object-contain"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">
                      {i.name}
                    </p>
                    <p className="text-muted-foreground">x{i.quantity}</p>
                  </div>
                  <span className="font-medium text-foreground">
                    {formatPrice(i.price * i.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="my-4 border-t border-border" />

            {/* Coupon */}
            <div className="mb-4">
              {coupon ? (
                <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm">
                  <span className="font-medium text-green-700">
                    {t("checkout.couponApplied")}:{" "}
                    <span className="font-mono">{coupon.code}</span>
                  </span>
                  <button
                    onClick={removeCoupon}
                    className="text-xs text-muted-foreground underline"
                  >
                    {t("checkout.couponRemove")}
                  </button>
                </div>
              ) : (
                <>
                  <label className="text-sm font-medium text-foreground">
                    {t("checkout.couponLabel")}
                  </label>
                  <div className="mt-1 flex gap-2">
                    <Input
                      value={couponInput}
                      onChange={(e) =>
                        setCouponInput(e.target.value.toUpperCase())
                      }
                      onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                      placeholder={t("checkout.couponPlaceholder")}
                      className="font-mono uppercase"
                    />
                    <Button
                      variant="secondary"
                      onClick={applyCoupon}
                      disabled={couponLoading || !couponInput.trim()}
                    >
                      {t("checkout.couponApply")}
                    </Button>
                  </div>
                  {couponError && (
                    <p className="mt-1 text-xs text-destructive">
                      {couponError}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Totals breakdown */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("cart.items")}</span>
                <span className="text-foreground">{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>{t("checkout.discount")}</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              {shipCfg.enabled && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("cart.shipping")}
                  </span>
                  {shippingFree ? (
                    <span className="text-green-600">{t("cart.free")}</span>
                  ) : (
                    <span className="text-foreground">
                      {formatPrice(shippingCost)}
                    </span>
                  )}
                </div>
              )}
              <div className="my-2 border-t border-border" />
              <div className="flex justify-between text-base font-semibold">
                <span className="text-foreground">{t("cart.total")}</span>
                <span className="text-foreground">{formatPrice(total)}</span>
              </div>
            </div>

            <Button
              className="mt-6 w-full rounded-full"
              size="lg"
              onClick={handleSubmit}
              disabled={isLoading || payLoading}
            >
              {isLoading || payLoading ? (
                t("checkout.placing")
              ) : (
                <>
                  <Lock className="h-4 w-4" /> {t("checkout.placeOrder")}
                </>
              )}
            </Button>

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4" />
              {t("checkout.payNote")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
