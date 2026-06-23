import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PackageX, Check, X } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../../components/ui/table";
import {
  useGetReturnsQuery,
  useResolveReturnMutation,
} from "../../returns/returnsApi";
import { formatPrice } from "../../../lib/format";

/**
 * Admin → Returns. Lists return requests and lets the owner approve (restores
 * stock + cancels the order) or reject. Money refund is manual (MercadoPago).
 */
const FILTERS = ["pending", "approved", "rejected", "all"];

export default function ReturnsPage() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState("pending");
  const statusParam = filter === "all" ? undefined : filter;

  const { data, isLoading, isError } = useGetReturnsQuery(statusParam);
  const [resolveReturn] = useResolveReturnMutation();
  const [msg, setMsg] = useState(null);

  const returns = data?.returns || [];

  const fmtDate = (iso) =>
    iso
      ? new Date(iso).toLocaleDateString(undefined, {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  const badge = (status) => {
    if (status === "pending")
      return <Badge variant="secondary">{t("adminReturns.pending")}</Badge>;
    if (status === "approved")
      return <Badge variant="success">{t("adminReturns.approved")}</Badge>;
    return <Badge variant="destructive">{t("adminReturns.rejected")}</Badge>;
  };

  const resolve = async (id, action) => {
    const confirmMsg =
      action === "approve"
        ? t("adminReturns.approveConfirm")
        : t("adminReturns.rejectConfirm");
    if (!window.confirm(confirmMsg)) return;
    setMsg(null);
    try {
      await resolveReturn({ id, action }).unwrap();
      setMsg({ type: "ok", text: t("adminReturns.resolved") });
    } catch {
      setMsg({ type: "err", text: t("adminReturns.resolveError") });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          {t("adminReturns.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("adminReturns.subtitle")}
        </p>
      </div>

      {/* Refund reminder */}
      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        {t("adminReturns.refundNote")}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {t(`adminReturns.filter${f.charAt(0).toUpperCase() + f.slice(1)}`)}
          </Button>
        ))}
      </div>

      {msg && (
        <p
          className={`text-sm ${msg.type === "ok" ? "text-green-600" : "text-destructive"}`}
        >
          {msg.text}
        </p>
      )}

      <Card>
        <CardContent className="px-0 py-0">
          {isLoading && (
            <div className="space-y-2 p-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded bg-muted" />
              ))}
            </div>
          )}

          {isError && (
            <div className="p-12 text-center text-destructive">
              {t("adminReturns.resolveError")}
            </div>
          )}

          {!isLoading && !isError && returns.length === 0 && (
            <div className="p-12 text-center">
              <PackageX className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <p className="mt-3 font-medium">{t("adminReturns.empty")}</p>
            </div>
          )}

          {!isLoading && !isError && returns.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">
                    {t("adminReturns.order")}
                  </TableHead>
                  <TableHead>{t("adminReturns.customer")}</TableHead>
                  <TableHead>{t("adminReturns.reason")}</TableHead>
                  <TableHead>{t("adminReturns.date")}</TableHead>
                  <TableHead>{t("adminReturns.status")}</TableHead>
                  <TableHead className="pr-6 text-right">
                    {t("adminReturns.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returns.map((r) => (
                  <TableRow key={r._id}>
                    <TableCell className="pl-6 font-mono text-xs">
                      #
                      {String(r.order?._id || r.order)
                        .slice(-6)
                        .toUpperCase()}
                      {r.order?.total != null && (
                        <span className="ml-2 font-sans text-sm text-muted-foreground">
                          {formatPrice(r.order.total)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.customerEmail || "—"}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {r.reason}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {fmtDate(r.createdAt)}
                    </TableCell>
                    <TableCell>{badge(r.status)}</TableCell>
                    <TableCell className="pr-6 text-right">
                      {r.status === "pending" && (
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => resolve(r._id, "approve")}
                          >
                            <Check className="mr-1 h-3.5 w-3.5" />{" "}
                            {t("adminReturns.approve")}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => resolve(r._id, "reject")}
                          >
                            <X className="mr-1 h-3.5 w-3.5" />{" "}
                            {t("adminReturns.reject")}
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
