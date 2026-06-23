import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { Lock, Sparkles, ArrowRight } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { hasFeatureClient } from "../../../lib/planClient";

/**
 * Generic page for premium/upsell admin sections whose feature isn't built yet
 * or isn't included in the current plan.
 *
 * - If the current plan does NOT include the feature -> upsell ("upgrade plan").
 * - If the plan DOES include it but it's not built yet -> "coming soon".
 *
 * Pass `feature` (the plan flag) and `titleKey`/`descKey` (i18n) per route.
 */
export default function PremiumFeaturePage({
  feature,
  titleKey,
  descKey,
  requiredPlan = "Growth",
}) {
  const { t } = useTranslation();
  const tenant = useSelector((s) => s.tenant.info);
  const plan = tenant?.plan || "starter";

  const included = feature ? hasFeatureClient(plan, feature) : true;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          {t(titleKey)}
        </h1>
        <p className="text-sm text-muted-foreground">{t(descKey)}</p>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {included ? (
              <Sparkles className="h-7 w-7" />
            ) : (
              <Lock className="h-7 w-7" />
            )}
          </div>

          {included ? (
            <>
              <h2 className="mt-5 font-display text-xl font-bold">
                {t("premiumFeature.comingTitle")}
              </h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                {t("premiumFeature.comingDesc")}
              </p>
            </>
          ) : (
            <>
              <h2 className="mt-5 font-display text-xl font-bold">
                {t("premiumFeature.lockedTitle")}
              </h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                {t("premiumFeature.lockedDesc", { plan: requiredPlan })}
              </p>
              <Button className="mt-6" disabled>
                {t("premiumFeature.upgradeBtn")}{" "}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <p className="mt-3 text-xs text-muted-foreground">
                {t("premiumFeature.upgradeHint")}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
