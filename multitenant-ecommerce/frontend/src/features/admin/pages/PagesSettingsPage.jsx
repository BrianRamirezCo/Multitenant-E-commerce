import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FileText, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Label } from "../../../components/ui/label";
import {
  useGetPagesQuery,
  useUpdatePagesMutation,
} from "../../tenant/tenantSlice";

/**
 * Admin → Páginas. Lets the store owner write the copy for the four info pages
 * of their storefront.
 *
 * An empty field falls back to a generic default on the storefront — one that
 * explicitly tells shoppers the store hasn't published its own conditions yet,
 * and only states what is true by law. That's deliberate: delivery times, return
 * windows and data-usage policies differ per business, so we never make one up
 * on the owner's behalf. The warning below pushes them to fill these in.
 */
const FIELDS = [
  { key: "shipping", labelKey: "pagesAdmin.shipping" },
  { key: "returns", labelKey: "pagesAdmin.returns" },
  { key: "terms", labelKey: "pagesAdmin.terms" },
  { key: "privacy", labelKey: "pagesAdmin.privacy" },
];

export default function PagesSettingsPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useGetPagesQuery();
  const [updatePages, { isLoading: saving }] = useUpdatePagesMutation();

  const [form, setForm] = useState({
    shipping: "",
    returns: "",
    terms: "",
    privacy: "",
  });
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    if (!data?.pages) return;
    setForm({
      shipping: data.pages.shipping || "",
      returns: data.pages.returns || "",
      terms: data.pages.terms || "",
      privacy: data.pages.privacy || "",
    });
  }, [data]);

  const update = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = async () => {
    setMsg(null);
    try {
      await updatePages(form).unwrap();
      setMsg({ type: "ok", text: t("pagesAdmin.saved") });
    } catch {
      setMsg({ type: "err", text: t("pagesAdmin.saveError") });
    }
  };

  const pendingCount = FIELDS.filter((f) => !form[f.key]?.trim()).length;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight">
          <FileText className="h-5 w-5" /> {t("pagesAdmin.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("pagesAdmin.subtitle")}
        </p>
      </div>

      {/* Warning — only while at least one page is still using the default. */}
      {pendingCount > 0 && (
        <div className="flex gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-foreground">
              {t("pagesAdmin.warningTitle")}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {t("pagesAdmin.warningBody")}
            </p>
          </div>
        </div>
      )}

      {FIELDS.map((f) => {
        const isEmpty = !form[f.key]?.trim();
        return (
          <Card key={f.key}>
            <CardContent className="space-y-2 p-6">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor={f.key}>{t(f.labelKey)}</Label>
                {isEmpty && (
                  <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-600">
                    {t("pagesAdmin.usingDefault")}
                  </span>
                )}
              </div>
              <textarea
                id={f.key}
                value={form[f.key]}
                onChange={update(f.key)}
                rows={8}
                placeholder={t("pagesAdmin.placeholder")}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
              />
              <p className="text-xs text-muted-foreground">
                {t("pagesAdmin.emptyHint")}
              </p>
            </CardContent>
          </Card>
        );
      })}

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving || isLoading}>
          {saving ? t("pagesAdmin.saving") : t("pagesAdmin.save")}
        </Button>
        {msg && (
          <p
            className={`text-sm ${msg.type === "ok" ? "text-green-600" : "text-destructive"}`}
          >
            {msg.text}
          </p>
        )}
      </div>
    </div>
  );
}
