import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Instagram, Phone, Info, Check } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import {
  useGetStoreSettingsQuery,
  useUpdateStoreSettingsMutation,
} from "../../tenant/tenantSlice";

/**
 * Admin page: store owner configures their social links (Instagram + WhatsApp)
 * and the "About us" content shown on the storefront. Connected to the real
 * backend (/tenant/store-settings).
 */
export default function StoreSettingsPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useGetStoreSettingsQuery();
  const [save, { isLoading: saving }] = useUpdateStoreSettingsMutation();

  const [instagram, setInstagram] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [aboutTitle, setAboutTitle] = useState("");
  const [aboutBody, setAboutBody] = useState("");
  const [saved, setSaved] = useState(false);

  // Populate when settings load.
  useEffect(() => {
    const s = data?.settings;
    if (s) {
      setInstagram(s.social?.instagram || "");
      setWhatsapp(s.social?.whatsapp || "");
      setAboutTitle(s.about?.title || "");
      setAboutBody(s.about?.body || "");
    }
  }, [data]);

  const handleSave = async () => {
    setSaved(false);
    try {
      await save({
        social: { instagram, whatsapp },
        about: { title: aboutTitle, body: aboutBody },
      }).unwrap();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // (could show an error toast here)
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          {t("storeSettings.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("storeSettings.subtitle")}
        </p>
      </div>

      {/* Social links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("storeSettings.socialTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="instagram" className="flex items-center gap-2">
              <Instagram className="h-4 w-4" /> {t("storeSettings.instagram")}
            </Label>
            <Input
              id="instagram"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="@mitienda  (o el link completo)"
            />
            <p className="text-xs text-muted-foreground">
              {t("storeSettings.instagramHint")}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp" className="flex items-center gap-2">
              <Phone className="h-4 w-4" /> {t("storeSettings.whatsapp")}
            </Label>
            <Input
              id="whatsapp"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="5491122334455"
            />
            <p className="text-xs text-muted-foreground">
              {t("storeSettings.whatsappHint")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* About us */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4" /> {t("storeSettings.aboutTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="aboutTitle">
              {t("storeSettings.aboutHeading")}
            </Label>
            <Input
              id="aboutTitle"
              value={aboutTitle}
              onChange={(e) => setAboutTitle(e.target.value)}
              placeholder={t("storeSettings.aboutHeadingPlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="aboutBody">{t("storeSettings.aboutBody")}</Label>
            <textarea
              id="aboutBody"
              value={aboutBody}
              onChange={(e) => setAboutBody(e.target.value)}
              rows={6}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder={t("storeSettings.aboutBodyPlaceholder")}
            />
            <p className="text-xs text-muted-foreground">
              {t("storeSettings.aboutHint")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? t("common.saving") : t("common.save")}
        </Button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-green-600">
            <Check className="h-4 w-4" /> {t("storeSettings.saved")}
          </span>
        )}
      </div>
    </div>
  );
}
