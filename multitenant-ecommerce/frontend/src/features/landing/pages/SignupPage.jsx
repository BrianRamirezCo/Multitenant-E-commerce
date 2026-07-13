import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Check, X, Loader2, ArrowRight, PartyPopper } from "lucide-react";
import LanguageToggle from "../../../components/LanguageToggle";
import Logo from "../../../components/Logo";
import {
  useLazyCheckSlugQuery,
  useSignupMutation,
} from "../../onboarding/onboardingApi";

/**
 * Store signup form (platform level). Collects store + owner details, checks
 * the slug availability live, requires accepting the terms, and calls
 * POST /onboarding/signup.
 *
 * Every plan is paid: the backend returns pending_payment with an initPoint,
 * and we redirect the user to MercadoPago to complete the subscription.
 *
 * Premium dark styling to match the CommerceOS landing. Logic unchanged.
 */
function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// Shared input classes for the dark theme.
const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-violet-500/50 focus:bg-white/[0.04]";

export default function SignupPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const plan = params.get("plan") || "starter";

  const [form, setForm] = useState({
    storeName: "",
    slug: "",
    ownerName: "",
    email: "",
    password: "",
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [checkSlug, { data: slugData, isFetching: checkingSlug }] =
    useLazyCheckSlugQuery();
  const [signup, { isLoading: submitting }] = useSignupMutation();

  // Debounced slug availability check.
  useEffect(() => {
    const slug = form.slug.trim();
    if (slug.length < 3) return;
    const id = setTimeout(() => checkSlug(slug), 400);
    return () => clearTimeout(id);
  }, [form.slug, checkSlug]);

  const update = (field) => (e) => {
    const value = e.target.value;
    setForm((f) => {
      const next = { ...f, [field]: value };
      if (field === "storeName" && !slugEdited) next.slug = slugify(value);
      return next;
    });
  };

  const onSlugChange = (e) => {
    setSlugEdited(true);
    setForm((f) => ({ ...f, slug: slugify(e.target.value) }));
  };

  const slugAvailable = slugData?.available;
  const canSubmit =
    form.storeName &&
    form.slug.length >= 3 &&
    form.ownerName &&
    form.email &&
    form.password &&
    acceptedTerms &&
    slugAvailable !== false &&
    !submitting;

  const handleSubmit = async () => {
    setError(null);
    try {
      const res = await signup({
        storeName: form.storeName,
        slug: form.slug,
        plan,
        ownerName: form.ownerName,
        ownerEmail: form.email,
        password: form.password,
        acceptedTerms,
      }).unwrap();

      if (res.status === "success" && res.store) {
        setSuccess(res.store);
      } else if (res.status === "pending_payment") {
        // Redirect to MercadoPago to complete the subscription.
        if (res.initPoint) {
          window.location.href = res.initPoint;
          return;
        }
        setError(t("signup.paidNotice"));
      }
    } catch (err) {
      setError(err?.data?.message || t("signup.error"));
    }
  };

  // Success screen
  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] p-4 font-body text-white antialiased">
        <div className="relative w-full max-w-md">
          <div
            className="pointer-events-none absolute -inset-4 rounded-3xl opacity-50 blur-2xl"
            style={{
              background:
                "radial-gradient(50% 50% at 50% 40%, rgba(124,58,237,0.3), transparent 70%)",
            }}
          />
          <div className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center shadow-2xl backdrop-blur-xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <PartyPopper className="h-7 w-7" />
            </div>
            <h1 className="mt-4 font-display text-2xl font-bold text-white">
              {t("signup.successTitle")}
            </h1>
            <p className="mt-2 text-white/50">{t("signup.successSub")}</p>
            <p className="mt-4 rounded-md border border-white/10 bg-white/[0.02] px-3 py-2 font-mono text-sm text-white/70">
              {success.url}
            </p>
            <button
              onClick={() => navigate("/admin")}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition-all hover:shadow-violet-600/40"
            >
              {t("signup.goToStore")} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0A0A0A] font-body text-white antialiased">
      {/* Luminous grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse 70% 50% at 50% 0%, black, transparent 75%)",
        }}
      />
      {/* Gradient glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 opacity-40"
        style={{
          background:
            "radial-gradient(50% 50% at 50% 0%, rgba(124,58,237,0.45), transparent 70%)",
        }}
      />

      {/* Top bar */}
      <header className="relative border-b border-white/10">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center">
            <Logo className="h-20 w-auto" />
          </Link>
          <LanguageToggle />
        </div>
      </header>

      <div className="relative flex justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="relative">
            {/* Glow behind card */}
            <div
              className="pointer-events-none absolute -inset-4 rounded-3xl opacity-40 blur-2xl"
              style={{
                background:
                  "radial-gradient(50% 40% at 50% 30%, rgba(124,58,237,0.3), transparent 70%)",
              }}
            />

            <div className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl backdrop-blur-xl">
              <h1 className="font-display text-2xl font-bold text-white">
                {t("signup.title")}
              </h1>
              <p className="mt-1 text-sm text-white/50">
                {t("signup.subtitle")}
              </p>

              {/* Selected plan */}
              <div className="mt-4 flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
                <span className="text-sm text-white/50">
                  {t("signup.plan")}
                </span>
                <span className="rounded-full bg-gradient-to-r from-violet-600 to-blue-600 px-3 py-1 text-xs font-semibold capitalize text-white">
                  {plan}
                </span>
              </div>

              <div className="mt-6 space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="storeName"
                    className="text-sm font-medium text-white/70"
                  >
                    {t("signup.storeName")}
                  </label>
                  <input
                    id="storeName"
                    value={form.storeName}
                    onChange={update("storeName")}
                    placeholder="Mi Tienda"
                    className={inputClass}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="slug"
                    className="text-sm font-medium text-white/70"
                  >
                    {t("signup.slug")}
                  </label>
                  <div className="relative">
                    <input
                      id="slug"
                      value={form.slug}
                      onChange={onSlugChange}
                      placeholder="mi-tienda"
                      className={`${inputClass} pr-28`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs">
                      {checkingSlug ? (
                        <Loader2 className="h-4 w-4 animate-spin text-white/40" />
                      ) : form.slug.length >= 3 && slugAvailable === true ? (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <Check className="h-3.5 w-3.5" />
                          {t("signup.slugAvailable")}
                        </span>
                      ) : form.slug.length >= 3 && slugAvailable === false ? (
                        <span className="flex items-center gap-1 text-red-400">
                          <X className="h-3.5 w-3.5" />
                          {t("signup.slugTaken")}
                        </span>
                      ) : null}
                    </span>
                  </div>
                  <p className="text-xs text-white/40">
                    {t("signup.slugHint")}:{" "}
                    <span className="font-mono text-white/60">
                      {form.slug || "mi-tienda"}.yourapp.com
                    </span>
                  </p>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="ownerName"
                    className="text-sm font-medium text-white/70"
                  >
                    {t("signup.ownerName")}
                  </label>
                  <input
                    id="ownerName"
                    value={form.ownerName}
                    onChange={update("ownerName")}
                    placeholder="Juan Pérez"
                    className={inputClass}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-white/70"
                  >
                    {t("signup.email")}
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={update("email")}
                    placeholder="juan@mail.com"
                    className={inputClass}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-white/70"
                  >
                    {t("signup.password")}
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={update("password")}
                    placeholder="••••••••"
                    className={inputClass}
                  />
                </div>

                {/* Terms acceptance (required) */}
                <label className="flex items-start gap-2 text-sm text-white/50">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-white/5"
                  />
                  <span>
                    {t("signup.termsPre")}{" "}
                    <Link
                      to="/terms"
                      target="_blank"
                      className="text-violet-400 hover:underline"
                    >
                      {t("signup.termsLink")}
                    </Link>{" "}
                    {t("signup.termsAnd")}{" "}
                    <Link
                      to="/privacy"
                      target="_blank"
                      className="text-violet-400 hover:underline"
                    >
                      {t("signup.privacyLink")}
                    </Link>
                    .
                  </span>
                </label>

                {error && <p className="text-sm text-red-400">{error}</p>}

                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="w-full rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition-all hover:shadow-violet-600/40 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? t("signup.submitting") : t("signup.submit")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
