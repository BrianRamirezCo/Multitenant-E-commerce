import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { Check, Lock, ShoppingCart, Star } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Badge } from "../../../components/ui/badge";
import { THEMES } from "../../../themes/themes";
import { allowedThemesClient, hasFeatureClient } from "../../../lib/planClient";
import {
  useUpdateAppearanceMutation,
  updateTenantTheme,
} from "../../tenant/tenantSlice";
import { cn } from "../../../lib/utils";
import ImageUpload from "../../../components/ImageUpload";

/**
 * Appearance settings — the heart of the white-label system.
 *
 * The store owner picks one of the three themes and (on Growth/Premium) a
 * custom primary color + logo. Plan gating is enforced both here (UI) and on
 * the backend (PATCH /tenant/appearance).
 *
 * A LIVE PREVIEW card re-renders instantly as choices change, using a local
 * data-theme override on the preview container so the rest of the admin panel
 * is unaffected.
 *
 * Fully bilingual via react-i18next (t('appearance.*')).
 */
export default function AppearancePage() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const tenant = useSelector((s) => s.tenant.info);
  const plan = tenant?.plan || "starter";

  const allowedThemes = allowedThemesClient(plan);
  const canCustomColor = hasFeatureClient(plan, "customColors");

  const [updateAppearance, { isLoading }] = useUpdateAppearanceMutation();

  // Local working state (saved on demand).
  const [themeName, setThemeName] = useState(tenant?.theme?.name || "minimal");
  const [primaryColor, setPrimaryColor] = useState(
    tenant?.theme?.primaryColor || "",
  );
  const [logoUrl, setLogoUrl] = useState(tenant?.theme?.logoUrl || "");
  const [error, setError] = useState(null);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    setThemeName(tenant?.theme?.name || "minimal");
    setPrimaryColor(tenant?.theme?.primaryColor || "");
    setLogoUrl(tenant?.theme?.logoUrl || "");
  }, [tenant]);

  const handleSave = async () => {
    setError(null);
    try {
      const result = await updateAppearance({
        themeName,
        primaryColor: canCustomColor ? primaryColor : undefined,
        logoUrl,
      }).unwrap();
      // Reflect immediately in the live storefront theme.
      dispatch(updateTenantTheme(result.tenant.theme));
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    } catch (err) {
      setError(err?.data?.message || t("appearance.saveError"));
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            {t("appearance.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("appearance.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {savedFlash && (
            <span className="text-sm text-green-600">{t("common.saved")}</span>
          )}
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? t("common.saving") : t("common.save")}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Settings column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Theme picker */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t("appearance.themeSection")}
              </CardTitle>
              <CardDescription>
                {t("appearance.themeSectionDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3">
                {THEMES.map((theme) => {
                  const locked = !allowedThemes.includes(theme.id);
                  const active = themeName === theme.id;
                  return (
                    <button
                      key={theme.id}
                      disabled={locked}
                      onClick={() => setThemeName(theme.id)}
                      className={cn(
                        "relative rounded-lg border-2 p-3 text-left transition-all",
                        active
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-border hover:border-primary/40",
                        locked && "cursor-not-allowed opacity-60",
                      )}
                    >
                      {/* Swatches */}
                      <div className="mb-3 flex gap-1.5">
                        {theme.swatches.map((c, i) => (
                          <span
                            key={i}
                            className="h-8 flex-1 rounded"
                            style={{ background: c }}
                          />
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{theme.name}</span>
                        {active && <Check className="h-4 w-4 text-primary" />}
                        {locked && (
                          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {theme.description}
                      </p>
                    </button>
                  );
                })}
              </div>
              {allowedThemes.length === 1 && (
                <div className="mt-4 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  <Lock className="h-3.5 w-3.5 shrink-0" />
                  {t("appearance.themeLockedNotice")}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Color */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t("appearance.colorSection")}
              </CardTitle>
              <CardDescription>
                {t("appearance.colorSectionDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {canCustomColor ? (
                <div className="space-y-3">
                  <Label htmlFor="color">
                    {t("appearance.customColorLabel")}
                  </Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={primaryColor || "#7c3aed"}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-10 w-14 cursor-pointer rounded border border-input bg-background"
                    />
                    <Input
                      id="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      placeholder="#7c3aed"
                      className="max-w-[160px] font-mono"
                    />
                    {primaryColor && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPrimaryColor("")}
                      >
                        {t("appearance.resetColor")}
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  <Lock className="h-3.5 w-3.5 shrink-0" />
                  {t("appearance.colorLockedNotice")}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Logo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t("appearance.logoSection")}
              </CardTitle>
              <CardDescription>
                {t("appearance.logoSectionDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUpload
                value={logoUrl || null}
                onChange={(url) => setLogoUrl(url || "")}
                kind="logo"
                rounded
              />
            </CardContent>
          </Card>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        {/* Live preview column */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <p className="mb-3 text-sm font-medium text-muted-foreground">
              {t("appearance.preview")}
            </p>
            {/* The preview applies the selected theme + color LOCALLY via inline style. */}
            <div
              data-theme={themeName}
              className="overflow-hidden rounded-xl border border-border"
              style={
                primaryColor
                  ? { "--primary": hexToHsl(primaryColor) }
                  : undefined
              }
            >
              <PreviewContent
                t={t}
                storeName={tenant?.name || "Store"}
                logoUrl={logoUrl}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Mini storefront preview rendered with the selected theme tokens.
 */
function PreviewContent({ t, storeName, logoUrl }) {
  return (
    <div className="bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        {logoUrl ? (
          <img src={logoUrl} alt={storeName} className="h-6 w-auto" />
        ) : (
          <span className="font-display text-sm font-bold">{storeName}</span>
        )}
        <ShoppingCart className="h-4 w-4 text-foreground/70" />
      </div>
      {/* Hero mini */}
      <div className="px-4 py-5">
        <h3 className="font-display text-lg font-bold leading-tight">
          {t("appearance.previewProduct")}
        </h3>
        <div className="mt-3 aspect-video rounded-lg bg-gradient-to-br from-secondary to-muted" />
        <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="h-3 w-3 fill-current text-amber-400" /> 4.8
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-base font-semibold">$129,99</span>
          <Badge>-20%</Badge>
        </div>
        <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2 text-xs font-medium text-primary-foreground">
          <ShoppingCart className="h-3.5 w-3.5" />
          {t("appearance.addToCart")}
        </button>
      </div>
    </div>
  );
}

/**
 * Inline hex -> "H S% L%" for the preview's --primary override.
 * (Same conversion as useTenantTheme, duplicated locally to keep preview pure.)
 */
function hexToHsl(hex) {
  if (!/^#?[0-9a-fA-F]{6}$/.test(hex)) return undefined;
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let hue = 0,
    sat = 0;
  const light = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    sat = light > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        hue = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        hue = (b - r) / d + 2;
        break;
      default:
        hue = (r - g) / d + 4;
    }
    hue /= 6;
  }
  return `${Math.round(hue * 360)} ${Math.round(sat * 100)}% ${Math.round(light * 100)}%`;
}
