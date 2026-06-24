import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  Instagram,
  Phone,
  Info,
  Check,
  Image as ImageIcon,
  Lock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import ImageUpload from "../../../components/ImageUpload";
import { hasFeatureClient } from "../../../lib/planClient";
import {
  useGetStoreSettingsQuery,
  useUpdateStoreSettingsMutation,
} from "../../tenant/tenantSlice";

/**
 * Admin page: store owner configures social links (Instagram + WhatsApp), the
 * "About us" content, and the home Feature Banner (Growth/Premium only).
 * Connected to the real backend (/tenant/store-settings).
 */
export default function StoreSettingsPage() {
  const { t } = useTranslation();
  const tenant = useSelector((s) => s.tenant.info);
  const plan = tenant?.plan || "starter";
  const canBanner = hasFeatureClient(plan, "premiumSections");

  const { data, isLoading } = useGetStoreSettingsQuery();
  const [save, { isLoading: saving }] = useUpdateStoreSettingsMutation();

  const [instagram, setInstagram] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [aboutTitle, setAboutTitle] = useState("");
  const [aboutBody, setAboutBody] = useState("");
  // Feature banner fields
  const [fbEyebrow, setFbEyebrow] = useState("");
  const [fbTitle, setFbTitle] = useState("");
  const [fbSubtitle, setFbSubtitle] = useState("");
  const [fbCtaText, setFbCtaText] = useState("");
  const [fbImageUrl, setFbImageUrl] = useState("");
  const [saved, setSaved] = useState(false);

  // Populate when settings load.
  useEffect(() => {
    const s = data?.settings;
    if (s) {
      setInstagram(s.social?.instagram || "");
      setWhatsapp(s.social?.whatsapp || "");
      setAboutTitle(s.about?.title || "");
      setAboutBody(s.about?.body || "");
      const fb = s.featureBanner || {};
      setFbEyebrow(fb.eyebrow || "");
      setFbTitle(fb.title || "");
      setFbSubtitle(fb.subtitle || "");
      setFbCtaText(fb.ctaText || "");
      setFbImageUrl(fb.imageUrl || "");
    }
  }, [data]);

  const handleSave = async () => {
    setSaved(false);
    try {
      await save({
        social: { instagram, whatsapp },
        about: { title: aboutTitle, body: aboutBody },
        // Only send banner fields if the plan allows it.
        ...(canBanner && {
          featureBanner: {
            eyebrow: fbEyebrow,
            title: fbTitle,
            subtitle: fbSubtitle,
            ctaText: fbCtaText,
            imageUrl: fbImageUrl,
          },
        }),
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

      {/* Feature banner (Growth/Premium) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ImageIcon className="h-4 w-4" /> {t("storeSettings.bannerTitle")}
            {!canBanner && (
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!canBanner ? (
            <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <Lock className="h-3.5 w-3.5 shrink-0" />
              {t("storeSettings.bannerLocked")}
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                {t("storeSettings.bannerHint")}
              </p>
              <div className="space-y-2">
                <Label htmlFor="fbEyebrow">
                  {t("storeSettings.bannerEyebrow")}
                </Label>
                <Input
                  id="fbEyebrow"
                  value={fbEyebrow}
                  onChange={(e) => setFbEyebrow(e.target.value)}
                  placeholder={t("storeSettings.bannerEyebrowPlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fbTitle">
                  {t("storeSettings.bannerHeading")}
                </Label>
                <Input
                  id="fbTitle"
                  value={fbTitle}
                  onChange={(e) => setFbTitle(e.target.value)}
                  placeholder={t("storeSettings.bannerHeadingPlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fbSubtitle">
                  {t("storeSettings.bannerSubtitle")}
                </Label>
                <textarea
                  id="fbSubtitle"
                  value={fbSubtitle}
                  onChange={(e) => setFbSubtitle(e.target.value)}
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder={t("storeSettings.bannerSubtitlePlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fbCtaText">
                  {t("storeSettings.bannerCta")}
                </Label>
                <Input
                  id="fbCtaText"
                  value={fbCtaText}
                  onChange={(e) => setFbCtaText(e.target.value)}
                  placeholder={t("storeSettings.bannerCtaPlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("storeSettings.bannerImage")}</Label>
                <ImageUpload
                  value={fbImageUrl || null}
                  onChange={(url) => setFbImageUrl(url || "")}
                  kind="banner"
                />
                <p className="text-xs text-muted-foreground">
                  {t("storeSettings.bannerImageHint")}
                </p>
              </div>
            </>
          )}
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
