import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2, PartyPopper, ArrowRight, AlertCircle } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { useSignupStatusQuery } from "../../onboarding/onboardingApi";

/**
 * Post-payment landing. MercadoPago redirects here (back_url) after the user
 * authorizes the subscription. The tenant is provisioned asynchronously by the
 * webhook, so we POLL the status endpoint until it's 'completed' (or times out).
 *
 * The ?preapproval_id / external_reference params MP appends vary; we read the
 * external_reference we passed (MP echoes it back as `external_reference`).
 */
export default function SignupSuccessPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();

  // MercadoPago appends params on redirect. We primarily need our external_reference.
  const ref = params.get("external_reference") || params.get("ref") || "";

  // Poll every 2.5s while we wait for the webhook to provision the store.
  const { data, refetch } = useSignupStatusQuery(ref, {
    skip: !ref,
    pollingInterval: 2500,
  });

  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const status = data?.status;
  const store = data?.store;

  // No reference at all -> we can't track it; show a generic message.
  if (!ref) {
    return (
      <Shell>
        <PartyPopper className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-4 font-display text-2xl font-bold">
          {t("signupSuccess.thanksTitle")}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {t("signupSuccess.thanksGeneric")}
        </p>
        <Button className="mt-6 w-full" asChild>
          <Link to="/admin/login">
            {t("signupSuccess.goLogin")} <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </Shell>
    );
  }

  // Completed -> store is ready.
  if (status === "completed") {
    return (
      <Shell>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700">
          <PartyPopper className="h-7 w-7" />
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold">
          {t("signupSuccess.readyTitle")}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {t("signupSuccess.readySub")}
        </p>
        {store?.url && (
          <p className="mt-4 rounded-md bg-secondary px-3 py-2 font-mono text-sm">
            {store.url}
          </p>
        )}
        <Button className="mt-6 w-full" asChild>
          <Link to="/admin/login">
            {t("signupSuccess.goDashboard")} <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </Shell>
    );
  }

  // Failed -> provisioning errored.
  if (status === "failed") {
    return (
      <Shell>
        <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
        <h1 className="mt-4 font-display text-2xl font-bold">
          {t("signupSuccess.failedTitle")}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {t("signupSuccess.failedSub")}
        </p>
        <Button
          variant="outline"
          className="mt-6 w-full"
          onClick={() => refetch()}
        >
          {t("signupSuccess.retry")}
        </Button>
      </Shell>
    );
  }

  // Pending / unknown -> still waiting on the webhook.
  // After ~40s, show a softer "taking longer" note but keep polling.
  return (
    <Shell>
      <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
      <h1 className="mt-4 font-display text-2xl font-bold">
        {t("signupSuccess.confirmingTitle")}
      </h1>
      <p className="mt-2 text-muted-foreground">
        {elapsed < 40
          ? t("signupSuccess.confirmingSub")
          : t("signupSuccess.confirmingLong")}
      </p>
      <p className="mt-4 text-xs text-muted-foreground">
        {t("signupSuccess.confirmingNote")}
      </p>
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <div
      data-theme="minimal"
      className="flex min-h-screen items-center justify-center bg-secondary/30 p-4"
    >
      <Card className="w-full max-w-md text-center">
        <CardContent className="p-8">{children}</CardContent>
      </Card>
    </div>
  );
}
