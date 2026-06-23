import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CreditCard, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Badge } from "../../../components/ui/badge";
import {
  useGetPaymentSettingsQuery,
  useUpdatePaymentSettingsMutation,
} from "../../tenant/tenantSlice";

/**
 * Admin → Payment methods. Lets the store owner connect their own MercadoPago
 * account (Access Token + optional Public Key) so payments go to THEIR account.
 *
 * The backend never returns the full token — only whether it's configured and a
 * masked preview. So the input starts empty; saving a new value overwrites it.
 */
export default function PaymentsPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useGetPaymentSettingsQuery();
  const [updateSettings, { isLoading: saving }] =
    useUpdatePaymentSettingsMutation();

  const settings = data?.paymentSettings;
  const configured = settings?.configured;

  const [accessToken, setAccessToken] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [msg, setMsg] = useState(null); // { type, text }

  const save = async () => {
    setMsg(null);
    // Send only fields the owner actually typed (empty token wouldn't overwrite).
    const body = {};
    if (accessToken.trim()) body.accessToken = accessToken.trim();
    if (publicKey.trim()) body.publicKey = publicKey.trim();

    if (Object.keys(body).length === 0) {
      setMsg({ type: "err", text: t("payments.saveError") });
      return;
    }

    try {
      await updateSettings(body).unwrap();
      setMsg({ type: "ok", text: t("payments.saved") });
      setAccessToken("");
      setPublicKey("");
    } catch {
      setMsg({ type: "err", text: t("payments.saveError") });
    }
  };

  const remove = async () => {
    if (!window.confirm(t("payments.removeConfirm"))) return;
    setMsg(null);
    try {
      await updateSettings({ accessToken: "", publicKey: "" }).unwrap();
      setMsg({ type: "ok", text: t("payments.removed") });
      setAccessToken("");
      setPublicKey("");
    } catch {
      setMsg({ type: "err", text: t("payments.saveError") });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          {t("payments.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("payments.subtitle")}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* MercadoPago config */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold">{t("payments.mpTitle")}</h2>
                    {!isLoading && (
                      <Badge
                        variant={configured ? "success" : "secondary"}
                        className="mt-0.5"
                      >
                        {configured ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />{" "}
                            {t("payments.configured")}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />{" "}
                            {t("payments.notConfigured")}
                          </span>
                        )}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <p className="mt-4 text-sm text-muted-foreground">
                {t("payments.mpDesc")}
              </p>

              {/* Current token preview */}
              {configured && settings?.tokenPreview && (
                <div className="mt-4 rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">
                    {t("payments.currentToken")}:{" "}
                  </span>
                  <span className="font-mono">{settings.tokenPreview}</span>
                </div>
              )}

              {/* Form */}
              <div className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="accessToken">
                    {t("payments.accessTokenLabel")}
                  </Label>
                  <Input
                    id="accessToken"
                    type="password"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    placeholder={t("payments.accessTokenPlaceholder")}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="publicKey">
                    {t("payments.publicKeyLabel")}
                  </Label>
                  <Input
                    id="publicKey"
                    value={publicKey}
                    onChange={(e) => setPublicKey(e.target.value)}
                    placeholder={t("payments.publicKeyPlaceholder")}
                    className="font-mono"
                  />
                </div>

                <div className="flex gap-3">
                  <Button onClick={save} disabled={saving}>
                    {saving ? t("payments.saving") : t("payments.save")}
                  </Button>
                  {configured && (
                    <Button
                      variant="outline"
                      onClick={remove}
                      disabled={saving}
                    >
                      {t("payments.remove")}
                    </Button>
                  )}
                </div>

                {msg && (
                  <p
                    className={`text-sm ${msg.type === "ok" ? "text-green-600" : "text-destructive"}`}
                  >
                    {msg.text}
                  </p>
                )}

                <p className="text-xs text-muted-foreground">
                  {t("payments.securityNote")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* How-to sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              <h3 className="flex items-center gap-2 font-semibold">
                <Info className="h-4 w-4" /> {t("payments.howToTitle")}
              </h3>
              <ol className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="font-semibold text-foreground">1.</span>{" "}
                  {t("payments.howTo1")}
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-foreground">2.</span>{" "}
                  {t("payments.howTo2")}
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-foreground">3.</span>{" "}
                  {t("payments.howTo3")}
                </li>
              </ol>
              <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                {t("payments.howToNote")}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
