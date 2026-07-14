import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FileText } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Label } from "../../../components/ui/label";
import {
  useGetPagesQuery,
  useUpdatePagesMutation,
} from "../../tenant/tenantSlice";

/**
 * Admin → Páginas. Lets the store owner write the copy for the four info pages
 * of their storefront. Leaving a field empty falls back to a generic default,
 * so no page is ever blank.
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

      {FIELDS.map((f) => (
        <Card key={f.key}>
          <CardContent className="space-y-2 p-6">
            <Label htmlFor={f.key}>{t(f.labelKey)}</Label>
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
      ))}

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
