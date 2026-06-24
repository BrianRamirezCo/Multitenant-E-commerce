import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { Mail, Download, Lock } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../../components/ui/table";
import { useGetSubscribersQuery } from "../../subscribers/subscribersApi";
import { hasFeatureClient } from "../../../lib/planClient";

/**
 * Admin Subscribers page (Growth/Premium). Lists newsletter subscribers
 * captured from the storefront, with a CSV export button. Gated by the
 * `newsletter` feature — Starter sees a locked state.
 */
export default function SubscribersPage() {
  const { t } = useTranslation();
  const tenant = useSelector((s) => s.tenant.info);
  const plan = tenant?.plan || "starter";
  const canUse = hasFeatureClient(plan, "newsletter");

  const { data, isLoading, isError } = useGetSubscribersQuery(undefined, {
    skip: !canUse,
  });
  const subscribers = data?.subscribers || [];

  const fmtDate = (iso) =>
    iso
      ? new Date(iso).toLocaleDateString(undefined, {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  // Export the list as a CSV file (client-side).
  const exportCsv = () => {
    const header = "email,fecha\n";
    const rows = subscribers
      .map((s) => `${s.email},${new Date(s.createdAt).toISOString()}`)
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `suscriptores-${tenant?.slug || "tienda"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            {t("subscribers.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {canUse
              ? `${subscribers.length} · ${t("subscribers.subtitle")}`
              : t("subscribers.subtitle")}
          </p>
        </div>
        {canUse && subscribers.length > 0 && (
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="mr-1 h-4 w-4" /> {t("subscribers.export")}
          </Button>
        )}
      </div>

      {/* Locked state for Starter */}
      {!canUse ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Lock className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 font-medium">{t("subscribers.lockedTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("subscribers.lockedSub")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="px-0 py-0">
            {isLoading && (
              <div className="space-y-2 p-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-12 animate-pulse rounded bg-muted"
                  />
                ))}
              </div>
            )}

            {isError && (
              <div className="p-12 text-center">
                <p className="font-medium text-destructive">
                  {t("subscribers.loadError")}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("common.backendError")}
                </p>
              </div>
            )}

            {!isLoading && !isError && subscribers.length === 0 && (
              <div className="p-12 text-center">
                <Mail className="mx-auto h-10 w-10 text-muted-foreground/50" />
                <p className="mt-3 font-medium">{t("subscribers.empty")}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("subscribers.emptySub")}
                </p>
              </div>
            )}

            {!isLoading && !isError && subscribers.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("subscribers.email")}</TableHead>
                    <TableHead className="text-right">
                      {t("subscribers.date")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscribers.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.email}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {fmtDate(s.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
