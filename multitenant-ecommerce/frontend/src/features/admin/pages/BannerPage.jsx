import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Image as ImageIcon } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import ImageUpload from "../../../components/ImageUpload";
import {
  useGetBannerSettingsQuery,
  useUpdateBannerSettingsMutation,
} from "../../tenant/tenantSlice";

/**
 * Admin → Banner. Lets the store owner upload a banner image and edit the
 * banner texts (title, subtitle, CTA). A live preview shows how it looks.
 */
export default function BannerPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useGetBannerSettingsQuery();
  const [updateBanner, { isLoading: saving }] =
    useUpdateBannerSettingsMutation();

  const [enabled, setEnabled] = useState(true);
  const [imageUrl, setImageUrl] = useState(null);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [ctaLink, setCtaLink] = useState("");
  const [msg, setMsg] = useState(null);

  // Seed the form from saved config.
  useEffect(() => {
    if (!data?.banner) return;
    const b = data.banner;
    setEnabled(b.enabled !== false);
    setImageUrl(b.imageUrl || null);
    setTitle(b.title || "");
    setSubtitle(b.subtitle || "");
    setCtaText(b.ctaText || "");
    setCtaLink(b.ctaLink || "");
  }, [data]);

  const save = async () => {
    setMsg(null);
    try {
      await updateBanner({
        enabled,
        imageUrl,
        title,
        subtitle,
        ctaText,
        ctaLink,
      }).unwrap();
      setMsg({ type: "ok", text: t("bannerAdmin.saved") });
    } catch {
      setMsg({ type: "err", text: t("bannerAdmin.saveError") });
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          {t("bannerAdmin.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("bannerAdmin.subtitle")}
        </p>
      </div>

      {/* Enable toggle */}
      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <h2 className="font-semibold">{t("bannerAdmin.enableTitle")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("bannerAdmin.enableDesc")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEnabled((v) => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? "bg-primary" : "bg-muted"}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? "translate-x-6" : "translate-x-1"}`}
            />
          </button>
        </CardContent>
      </Card>

      <div className={enabled ? "" : "pointer-events-none opacity-50"}>
        {/* Image */}
        <Card>
          <CardContent className="space-y-2 p-6">
            <Label>{t("bannerAdmin.imageLabel")}</Label>
            <ImageUpload
              value={imageUrl}
              onChange={setImageUrl}
              kind="product"
            />
            <p className="text-xs text-muted-foreground">
              {t("bannerAdmin.imageHint")}
            </p>
          </CardContent>
        </Card>

        {/* Texts */}
        <Card className="mt-6">
          <CardContent className="space-y-4 p-6">
            <div className="space-y-2">
              <Label htmlFor="bt">{t("bannerAdmin.bannerTitle")}</Label>
              <Input
                id="bt"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("bannerAdmin.bannerTitlePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bs">{t("bannerAdmin.bannerSubtitle")}</Label>
              <Input
                id="bs"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder={t("bannerAdmin.bannerSubtitlePlaceholder")}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ct">{t("bannerAdmin.ctaText")}</Label>
                <Input
                  id="ct"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  placeholder={t("bannerAdmin.ctaTextPlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cl">{t("bannerAdmin.ctaLink")}</Label>
                <Input
                  id="cl"
                  value={ctaLink}
                  onChange={(e) => setCtaLink(e.target.value)}
                  placeholder={t("bannerAdmin.ctaLinkPlaceholder")}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live preview */}
        <div className="mt-6">
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            {t("bannerAdmin.previewNote")}
          </p>
          <div className="overflow-hidden rounded-2xl border border-border/60">
            {imageUrl ? (
              <div className="relative aspect-[16/6] w-full">
                <img
                  src={imageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-center gap-2 p-6">
                  <h3 className="max-w-md font-display text-2xl font-bold text-white">
                    {title || t("bannerAdmin.bannerTitlePlaceholder")}
                  </h3>
                  <p className="max-w-sm text-sm text-white/80">{subtitle}</p>
                  {ctaText && (
                    <span className="mt-1 w-fit rounded-full bg-white px-4 py-1.5 text-xs font-medium text-black">
                      {ctaText}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div
                className="relative aspect-[16/6] w-full"
                style={{
                  background:
                    "linear-gradient(120deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.6) 55%, hsl(var(--accent)) 120%)",
                }}
              >
                <div className="relative flex h-full flex-col justify-center gap-2 p-6">
                  <h3 className="max-w-md font-display text-2xl font-bold text-white">
                    {title || t("bannerAdmin.bannerTitlePlaceholder")}
                  </h3>
                  <p className="max-w-sm text-sm text-white/85">{subtitle}</p>
                  {ctaText && (
                    <span className="mt-1 w-fit rounded-full bg-white px-4 py-1.5 text-xs font-medium text-black">
                      {ctaText}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving || isLoading}>
          {saving ? t("bannerAdmin.saving") : t("bannerAdmin.save")}
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
