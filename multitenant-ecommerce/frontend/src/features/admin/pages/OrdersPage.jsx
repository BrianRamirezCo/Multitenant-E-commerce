import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ShoppingBag, X, Truck, User, MapPin } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import {
  useGetOrdersQuery,
  useUpdateOrderStatusMutation,
} from "../../orders/ordersApi";
import { formatPrice } from "../../../lib/format";

/**
 * Admin Orders page. CONNECTED to the real backend (GET /orders).
 * Click a row to open a detail dialog with full info + management actions
 * (change status, set carrier/tracking). Translated via i18n.
 */
const STATUS_VARIANT = {
  pending: "warning",
  paid: "default",
  failed: "destructive",
  cancelled: "destructive",
  fulfilled: "success",
};
const STATUSES = ["all", "pending", "paid", "fulfilled", "cancelled"];
// Statuses the admin can set manually from the detail panel.
const SETTABLE = ["pending", "paid", "fulfilled", "cancelled"];

function OrderDetail({ order, onClose }) {
  const { t } = useTranslation();
  const [updateOrder, { isLoading }] = useUpdateOrderStatusMutation();
  const [carrier, setCarrier] = useState(order.shipping?.carrier || "");
  const [tracking, setTracking] = useState(order.shipping?.trackingCode || "");
  const [error, setError] = useState(null);

  useEffect(() => {
    setCarrier(order.shipping?.carrier || "");
    setTracking(order.shipping?.trackingCode || "");
    setError(null);
  }, [order]);

  const statusLabel = (s) =>
    t(`orders.status${s.charAt(0).toUpperCase() + s.slice(1)}`);
  const fmtDate = (iso) =>
    iso
      ? new Date(iso).toLocaleDateString(undefined, {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  const changeStatus = async (status) => {
    setError(null);
    try {
      await updateOrder({ id: order._id, status }).unwrap();
    } catch (err) {
      setError(err?.data?.message || t("orders.updateError"));
    }
  };

  const saveShipping = async () => {
    setError(null);
    try {
      await updateOrder({
        id: order._id,
        shipping: { carrier, trackingCode: tracking },
      }).unwrap();
    } catch (err) {
      setError(err?.data?.message || t("orders.updateError"));
    }
  };

  const addr = order.shippingAddress || {};

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t("orders.detailTitle")} #{order._id.slice(-6).toUpperCase()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Status + date */}
          <div className="flex items-center justify-between">
            <Badge variant={STATUS_VARIANT[order.status]}>
              {statusLabel(order.status)}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {fmtDate(order.createdAt)}
            </span>
          </div>

          {/* Products */}
          <div>
            <h3 className="mb-2 text-sm font-semibold">
              {t("orders.products")}
            </h3>
            <div className="rounded-lg border border-border">
              {order.items?.map((it, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between border-b border-border px-4 py-2 text-sm last:border-0"
                >
                  <span>
                    {it.name} × {it.quantity}
                  </span>
                  <span className="font-medium">
                    {formatPrice(it.price * it.quantity, order.currency)}
                  </span>
                </div>
              ))}
            </div>
            {/* Totals */}
            <div className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>{t("orders.subtotal")}</span>
                <span>
                  {formatPrice(order.subtotal || order.total, order.currency)}
                </span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>
                    {t("orders.discount")}{" "}
                    {order.couponCode ? `(${order.couponCode})` : ""}
                  </span>
                  <span>-{formatPrice(order.discount, order.currency)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-1 text-base font-semibold">
                <span>{t("cart.total")}</span>
                <span>{formatPrice(order.total, order.currency)}</span>
              </div>
            </div>
          </div>

          {/* Customer + shipping address */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border p-4">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <User className="h-4 w-4" /> {t("orders.customerInfo")}
              </h3>
              <p className="text-sm">
                {addr.fullName || order.customer?.name || t("orders.guest")}
              </p>
              <p className="text-sm text-muted-foreground">
                {order.contact?.email || "—"}
              </p>
              <p className="text-sm text-muted-foreground">
                {order.contact?.phone || t("orders.noPhone")}
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <MapPin className="h-4 w-4" /> {t("orders.shippingTo")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {addr.line1 || "—"}
                <br />
                {[addr.city, addr.state, addr.zip].filter(Boolean).join(", ")}
                <br />
                {addr.country}
              </p>
            </div>
          </div>

          {/* Change status */}
          <div>
            <h3 className="mb-2 text-sm font-semibold">
              {t("orders.changeStatus")}
            </h3>
            <div className="flex flex-wrap gap-2">
              {SETTABLE.map((s) => (
                <Button
                  key={s}
                  variant={order.status === s ? "default" : "outline"}
                  size="sm"
                  onClick={() => changeStatus(s)}
                  disabled={isLoading || order.status === s}
                >
                  {statusLabel(s)}
                </Button>
              ))}
            </div>
          </div>

          {/* Shipping info */}
          <div>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Truck className="h-4 w-4" /> {t("orders.shippingInfo")}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="carrier">{t("orders.carrier")}</Label>
                <Input
                  id="carrier"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  placeholder={t("orders.carrierPlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tracking">{t("orders.trackingCode")}</Label>
                <Input
                  id="tracking"
                  value={tracking}
                  onChange={(e) => setTracking(e.target.value)}
                  placeholder={t("orders.trackingPlaceholder")}
                />
              </div>
            </div>
            {order.shipping?.shippedAt && (
              <p className="mt-2 text-xs text-muted-foreground">
                {t("orders.shippedOn")}: {fmtDate(order.shipping.shippedAt)}
              </p>
            )}
            <Button
              className="mt-3"
              size="sm"
              onClick={saveShipping}
              disabled={isLoading}
            >
              {t("orders.saveShipping")}
            </Button>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function OrdersPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useGetOrdersQuery();
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  const allOrders = data?.orders || [];
  const orders =
    filter === "all" ? allOrders : allOrders.filter((o) => o.status === filter);

  // Keep the open detail in sync with refreshed data after an update.
  const selectedOrder = selected
    ? allOrders.find((o) => o._id === selected)
    : null;

  const statusLabel = (s) =>
    t(`orders.status${s.charAt(0).toUpperCase() + s.slice(1)}`);
  const fmtDate = (iso) =>
    iso
      ? new Date(iso).toLocaleDateString(undefined, {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          {t("orders.title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("orders.subtitle")}</p>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Button
            key={s}
            variant={filter === s ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(s)}
          >
            {s === "all" ? t("orders.all") : statusLabel(s)}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="px-0 py-0">
          {isLoading && (
            <div className="space-y-2 p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded bg-muted" />
              ))}
            </div>
          )}

          {isError && (
            <div className="p-12 text-center">
              <p className="font-medium text-destructive">
                {t("orders.loadError")}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("common.backendError")}
              </p>
            </div>
          )}

          {!isLoading && !isError && orders.length === 0 && (
            <div className="p-12 text-center">
              <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 font-medium">{t("orders.empty")}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("orders.emptySub")}
              </p>
            </div>
          )}

          {!isLoading && !isError && orders.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">{t("orders.colOrder")}</TableHead>
                  <TableHead>{t("orders.colCustomer")}</TableHead>
                  <TableHead>{t("orders.colDate")}</TableHead>
                  <TableHead>{t("orders.colItems")}</TableHead>
                  <TableHead>{t("orders.colTotal")}</TableHead>
                  <TableHead className="pr-6">
                    {t("orders.colStatus")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow
                    key={o._id}
                    className="cursor-pointer hover:bg-secondary/50"
                    onClick={() => setSelected(o._id)}
                  >
                    <TableCell className="pl-6 font-medium">
                      #{o._id.slice(-6).toUpperCase()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {o.shippingAddress?.fullName ||
                        o.customer?.name ||
                        t("orders.guest")}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {fmtDate(o.createdAt)}
                    </TableCell>
                    <TableCell>
                      {t("orders.items", { count: o.items?.length || 0 })}
                    </TableCell>
                    <TableCell>{formatPrice(o.total, o.currency)}</TableCell>
                    <TableCell className="pr-6">
                      <Badge variant={STATUS_VARIANT[o.status]}>
                        {statusLabel(o.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedOrder && (
        <OrderDetail order={selectedOrder} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
