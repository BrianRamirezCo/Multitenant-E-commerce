import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Package,
  LogOut,
  User,
  MapPin,
  RotateCcw,
  ShoppingBag,
  Lock,
  CreditCard,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { useGetOrdersQuery } from "../../orders/ordersApi";
import {
  useLogoutMutation,
  useUpdateProfileMutation,
  useChangePasswordMutation,
} from "../../auth/authApi";
import {
  useGetMyReturnsQuery,
  useCreateReturnMutation,
} from "../../returns/returnsApi";
import { useCreatePreferenceMutation } from "../../payments/paymentsApi";
import { formatPrice } from "../../../lib/format";

/**
 * Customer account page (premium style). Shows the customer's profile (editable
 * phone), an editable saved address, a password change form, and order history.
 * Pending orders can retry payment; paid orders can request a return.
 */
const STATUS_VARIANT = {
  pending: "warning",
  paid: "default",
  failed: "destructive",
  cancelled: "destructive",
  fulfilled: "success",
};

export default function AccountPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const { data, isLoading, isError } = useGetOrdersQuery();
  const { data: returnsData } = useGetMyReturnsQuery();
  const [logout] = useLogoutMutation();
  const [updateProfile, { isLoading: saving }] = useUpdateProfileMutation();
  const [changePassword, { isLoading: changingPass }] =
    useChangePasswordMutation();
  const [createReturn, { isLoading: requesting }] = useCreateReturnMutation();
  const [createPreference, { isLoading: payLoading }] =
    useCreatePreferenceMutation();

  const orders = data?.orders || [];
  const myReturns = returnsData?.returns || [];

  // Map orderId -> its latest return (to show status / hide the button).
  const returnByOrder = {};
  for (const r of myReturns) {
    const oid = String(r.order?._id || r.order);
    if (!returnByOrder[oid]) returnByOrder[oid] = r;
  }

  const [openReturn, setOpenReturn] = useState(null);
  const [reason, setReason] = useState("");
  const [returnMsg, setReturnMsg] = useState(null);

  const [phone, setPhone] = useState("");
  const [addr, setAddr] = useState({ line1: "", city: "", state: "", zip: "" });
  const [msg, setMsg] = useState(null);
  const [pass, setPass] = useState({ current: "", next: "", confirm: "" });
  const [passMsg, setPassMsg] = useState(null);
  const [payingId, setPayingId] = useState(null);
  const [payError, setPayError] = useState(null);

  useEffect(() => {
    if (!user) return;
    const a = user.profile?.address || {};
    setPhone(user.profile?.phone || "");
    setAddr({
      line1: a.line1 || "",
      city: a.city || "",
      state: a.state || "",
      zip: a.zip || "",
    });
  }, [user]);

  const updAddr = (field) => (e) =>
    setAddr((a) => ({ ...a, [field]: e.target.value }));

  const save = async () => {
    setMsg(null);
    try {
      await updateProfile({
        phone,
        address: {
          line1: addr.line1,
          city: addr.city,
          state: addr.state,
          zip: addr.zip,
          country: "AR",
        },
      }).unwrap();
      setMsg({ type: "ok", text: t("account.addressSaved") });
    } catch {
      setMsg({ type: "err", text: t("account.addressError") });
    }
  };

  const changePass = async () => {
    setPassMsg(null);
    if (pass.next.length < 8) {
      setPassMsg({ type: "err", text: t("account.passwordTooShort") });
      return;
    }
    if (pass.next !== pass.confirm) {
      setPassMsg({ type: "err", text: t("account.passwordMismatch") });
      return;
    }
    try {
      await changePassword({
        currentPassword: pass.current,
        newPassword: pass.next,
      }).unwrap();
      setPassMsg({ type: "ok", text: t("account.passwordChanged") });
      setPass({ current: "", next: "", confirm: "" });
    } catch (err) {
      const text =
        err?.status === 401
          ? t("account.passwordWrongCurrent")
          : err?.data?.message || t("account.passwordError");
      setPassMsg({ type: "err", text });
    }
  };

  // Retry payment for a PENDING order: rebuilds the MercadoPago preference for
  // that same order and redirects to checkout. The backend rejects this if the
  // order is already paid, so it's safe to call.
  const payOrder = async (orderId) => {
    setPayError(null);
    setPayingId(orderId);
    try {
      const pref = await createPreference(orderId).unwrap();
      const url = pref.initPoint || pref.sandboxInitPoint;
      if (url) {
        window.location.href = url;
        return;
      }
      setPayError(t("account.payNoUrl"));
    } catch (err) {
      setPayError(err?.data?.message || t("account.payError"));
    } finally {
      setPayingId(null);
    }
  };

  const submitReturn = async (orderId) => {
    setReturnMsg(null);
    if (!reason.trim()) return;
    try {
      await createReturn({ orderId, reason: reason.trim() }).unwrap();
      setReturnMsg({ type: "ok", text: t("returns.submitted") });
      setOpenReturn(null);
      setReason("");
    } catch (err) {
      const text =
        err?.status === 409
          ? t("returns.alreadyRequested")
          : t("returns.submitError");
      setReturnMsg({ type: "err", text });
    }
  };

  const returnStatusLabel = (s) =>
    t(`returns.status${s.charAt(0).toUpperCase() + s.slice(1)}`);
  const returnBadgeVariant = (s) =>
    s === "approved"
      ? "success"
      : s === "rejected"
        ? "destructive"
        : "secondary";

  const statusLabel = (s) =>
    t(`account.status${s.charAt(0).toUpperCase() + s.slice(1)}`);
  const fmtDate = (iso) =>
    iso
      ? new Date(iso).toLocaleDateString(undefined, {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } finally {
      navigate("/store");
    }
  };

  const initial = (user?.name || "?").charAt(0).toUpperCase();

  return (
    <>
      {/* Header band with avatar */}
      <section className="border-b border-border bg-secondary/30">
        <div className="container py-10 md:py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground">
                {initial}
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
                  {user?.name || t("account.title")}
                </h1>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" /> {t("account.logout")}
            </Button>
          </div>
        </div>
      </section>

      <div className="container py-10">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left column: profile + address + password */}
          <div className="space-y-6 lg:col-span-1">
            {/* Profile */}
            <div className="rounded-2xl border border-border p-6">
              <h2 className="mb-4 flex items-center gap-2 font-semibold">
                <User className="h-4 w-4" /> {t("account.profile")}
              </h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">{t("account.name")}</p>
                  <p className="font-medium">{user?.name || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("account.email")}</p>
                  <p className="font-medium">{user?.email || "—"}</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">{t("account.phone")}</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Editable address */}
            <div className="rounded-2xl border border-border p-6">
              <h2 className="mb-1 flex items-center gap-2 font-semibold">
                <MapPin className="h-4 w-4" /> {t("account.addressTitle")}
              </h2>
              <p className="mb-4 text-xs text-muted-foreground">
                {t("account.addressSubtitle")}
              </p>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="line1">{t("account.addressLine")}</Label>
                  <Input
                    id="line1"
                    value={addr.line1}
                    onChange={updAddr("line1")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="city">{t("account.city")}</Label>
                  <Input
                    id="city"
                    value={addr.city}
                    onChange={updAddr("city")}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="state">{t("account.state")}</Label>
                    <Input
                      id="state"
                      value={addr.state}
                      onChange={updAddr("state")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="zip">{t("account.zip")}</Label>
                    <Input
                      id="zip"
                      value={addr.zip}
                      onChange={updAddr("zip")}
                    />
                  </div>
                </div>

                <Button
                  className="w-full rounded-full"
                  size="sm"
                  onClick={save}
                  disabled={saving}
                >
                  {saving
                    ? t("account.savingAddress")
                    : t("account.saveAddress")}
                </Button>
                {msg && (
                  <p
                    className={`text-xs ${msg.type === "ok" ? "text-green-600" : "text-destructive"}`}
                  >
                    {msg.text}
                  </p>
                )}
              </div>
            </div>

            {/* Change password */}
            <div className="rounded-2xl border border-border p-6">
              <h2 className="mb-1 flex items-center gap-2 font-semibold">
                <Lock className="h-4 w-4" /> {t("account.securityTitle")}
              </h2>
              <p className="mb-4 text-xs text-muted-foreground">
                {t("account.securitySubtitle")}
              </p>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="currentPassword">
                    {t("account.currentPassword")}
                  </Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={pass.current}
                    onChange={(e) =>
                      setPass((p) => ({ ...p, current: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="newPassword">
                    {t("account.newPassword")}
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={pass.next}
                    onChange={(e) =>
                      setPass((p) => ({ ...p, next: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">
                    {t("account.confirmPassword")}
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={pass.confirm}
                    onChange={(e) =>
                      setPass((p) => ({ ...p, confirm: e.target.value }))
                    }
                  />
                </div>

                <Button
                  className="w-full rounded-full"
                  size="sm"
                  onClick={changePass}
                  disabled={
                    changingPass || !pass.current || !pass.next || !pass.confirm
                  }
                >
                  {changingPass
                    ? t("account.savingPassword")
                    : t("account.changePassword")}
                </Button>
                {passMsg && (
                  <p
                    className={`text-xs ${passMsg.type === "ok" ? "text-green-600" : "text-destructive"}`}
                  >
                    {passMsg.text}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right column: orders */}
          <div className="lg:col-span-2">
            <h2 className="mb-4 flex items-center gap-2 font-semibold">
              <ShoppingBag className="h-4 w-4" /> {t("account.myOrders")}
            </h2>

            {isLoading && (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-24 animate-pulse rounded-2xl bg-muted"
                  />
                ))}
              </div>
            )}

            {isError && (
              <div className="rounded-2xl border border-border p-6 text-center text-sm text-destructive">
                {t("account.loadError")}
              </div>
            )}

            {!isLoading && !isError && orders.length === 0 && (
              <div className="rounded-2xl border border-border bg-secondary/20 p-10 text-center">
                <Package className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <p className="mt-3 font-medium">{t("account.emptyOrders")}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("account.emptyOrdersSub")}
                </p>
                <Button className="mt-4 rounded-full" asChild>
                  <Link to="/store">{t("account.startShopping")}</Link>
                </Button>
              </div>
            )}

            {!isLoading && !isError && orders.length > 0 && (
              <div className="space-y-3">
                {orders.map((o) => {
                  const oid = String(o._id);
                  const existingReturn = returnByOrder[oid];
                  const canReturn =
                    ["paid", "fulfilled"].includes(o.status) && !existingReturn;
                  const isFormOpen = openReturn === oid;
                  return (
                    <div
                      key={o._id}
                      className="rounded-2xl border border-border p-5"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            #{o._id.slice(-6).toUpperCase()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {fmtDate(o.createdAt)}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {t("orders.items", { count: o.items?.length || 0 })}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={STATUS_VARIANT[o.status]}>
                            {statusLabel(o.status)}
                          </Badge>
                          <p className="mt-2 font-semibold">
                            {formatPrice(o.total, o.currency)}
                          </p>
                        </div>
                      </div>

                      {/* Pending payment: let the buyer finish paying */}
                      {o.status === "pending" && (
                        <div className="mt-3 border-t border-border pt-3">
                          <Button
                            size="sm"
                            className="rounded-full"
                            onClick={() => payOrder(oid)}
                            disabled={payLoading && payingId === oid}
                          >
                            <CreditCard className="mr-1 h-3.5 w-3.5" />
                            {payLoading && payingId === oid
                              ? t("account.paying")
                              : t("account.payNow")}
                          </Button>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {t("account.payPendingHint")}
                          </p>
                        </div>
                      )}

                      {/* Return status (if one exists) */}
                      {existingReturn && (
                        <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
                          <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
                          <Badge
                            variant={returnBadgeVariant(existingReturn.status)}
                          >
                            {returnStatusLabel(existingReturn.status)}
                          </Badge>
                        </div>
                      )}

                      {/* Request-return button + inline form */}
                      {canReturn && (
                        <div className="mt-3 border-t border-border pt-3">
                          {!isFormOpen ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setOpenReturn(oid);
                                setReason("");
                                setReturnMsg(null);
                              }}
                            >
                              <RotateCcw className="mr-1 h-3.5 w-3.5" />
                              {t("returns.requestButton")}
                            </Button>
                          ) : (
                            <div className="space-y-2">
                              <Label htmlFor={`reason-${oid}`}>
                                {t("returns.reasonLabel")}
                              </Label>
                              <Input
                                id={`reason-${oid}`}
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder={t("returns.reasonPlaceholder")}
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => submitReturn(oid)}
                                  disabled={requesting || !reason.trim()}
                                >
                                  {requesting
                                    ? t("returns.submitting")
                                    : t("returns.submit")}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setOpenReturn(null);
                                    setReason("");
                                  }}
                                >
                                  {t("returns.cancel")}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {payError && (
                  <p className="text-sm text-destructive">{payError}</p>
                )}
                {returnMsg && (
                  <p
                    className={`text-sm ${returnMsg.type === "ok" ? "text-green-600" : "text-destructive"}`}
                  >
                    {returnMsg.text}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
