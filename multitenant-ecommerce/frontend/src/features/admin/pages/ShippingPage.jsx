import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Truck } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import {
  useGetShippingSettingsQuery,
  useUpdateShippingSettingsMutation,
} from "../../tenant/tenantSlice";

/**
 * Admin → Shipping. Simple flat-rate config: a fixed shipping cost + an optional
 * free-shipping threshold. Amounts are shown in pesos but stored in cents, so we
 * convert on load (cents -> pesos) and on save (pesos -> cents).
 */
export default function ShippingPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useGetShippingSettingsQuery();
  const [updateSettings, { isLoading: saving }] =
    useUpdateShippingSettingsMutation();

  const [enabled, setEnabled] = useState(false);
  const [flatRate, setFlatRate] = useState(""); // in pesos (display)
  const [freeThreshold, setFreeThreshold] = useState(""); // in pesos (display)
  const [msg, setMsg] = useState(null);

  // Seed the form from the saved config (convert cents -> pesos).
  useEffect(() => {
    if (!data?.shipping) return;
    const s = data.shipping;
    setEnabled(Boolean(s.enabled));
    setFlatRate(s.flatRate ? String(s.flatRate / 100) : "");
    setFreeThreshold(s.freeThreshold ? String(s.freeThreshold / 100) : "");
  }, [data]);

  const save = async () => {
    setMsg(null);
    // Convert pesos -> cents before sending.
    const flatCents = Math.round((parseFloat(flatRate) || 0) * 100);
    const freeCents = Math.round((parseFloat(freeThreshold) || 0) * 100);

    try {
      await updateSettings({
        enabled,
        flatRate: flatCents,
        freeThreshold: freeCents,
      }).unwrap();
      setMsg({ type: "ok", text: t("shipping.saved") });
    } catch {
      setMsg({ type: "err", text: t("shipping.saveError") });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          {t("shipping.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("shipping.subtitle")}
        </p>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <Truck className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold">{t("shipping.enableTitle")}</h2>
                <p className="text-sm text-muted-foreground">
                  {t("shipping.enableDesc")}
                </p>
              </div>
              {/* Toggle */}
              <button
                type="button"
                onClick={() => setEnabled((v) => !v)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? "bg-primary" : "bg-muted"}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? "translate-x-6" : "translate-x-1"}`}
                />
              </button>
            </div>

            {/* Fields (only relevant when enabled) */}
            <div
              className={`mt-6 space-y-4 ${enabled ? "" : "opacity-50 pointer-events-none"}`}
            >
              <div className="space-y-2">
                <Label htmlFor="flatRate">{t("shipping.flatRateLabel")}</Label>
                <Input
                  id="flatRate"
                  type="number"
                  min="0"
                  value={flatRate}
                  onChange={(e) => setFlatRate(e.target.value)}
                  placeholder={t("shipping.flatRatePlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="freeThreshold">
                  {t("shipping.freeThresholdLabel")}
                </Label>
                <Input
                  id="freeThreshold"
                  type="number"
                  min="0"
                  value={freeThreshold}
                  onChange={(e) => setFreeThreshold(e.target.value)}
                  placeholder={t("shipping.freeThresholdPlaceholder")}
                />
                <p className="text-xs text-muted-foreground">
                  {t("shipping.freeThresholdHelp")}
                </p>
              </div>
            </div>

            {!enabled && (
              <p className="mt-4 rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">
                {t("shipping.disabledNote")}
              </p>
            )}

            <div className="mt-6">
              <Button onClick={save} disabled={saving || isLoading}>
                {saving ? t("shipping.saving") : t("shipping.save")}
              </Button>
              {msg && (
                <p
                  className={`mt-3 text-sm ${msg.type === "ok" ? "text-green-600" : "text-destructive"}`}
                >
                  {msg.text}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
