import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Lock, Check, AlertCircle } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { useResetPasswordMutation } from "../authApi";

/**
 * "Reset password" page. Reads ?token= from the URL (sent in the email link),
 * lets the user set a new password, and submits it. On success, redirects to
 * the login page. Used for both storefront customers and store admins.
 *
 * Pass `context="admin"` when rendering this under the admin area.
 */
export default function ResetPasswordPage({ context = "store" }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") || "";

  const isAdmin = context === "admin";
  const loginPath = isAdmin ? "/admin/login" : "/store/login";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const tooShort = password.length > 0 && password.length < 8;
  const mismatch = confirm.length > 0 && password !== confirm;
  const canSubmit = password.length >= 8 && password === confirm && token;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!canSubmit) return;
    try {
      await resetPassword({ token, password }).unwrap();
      setDone(true);
      // Redirect to login after a moment.
      setTimeout(() => navigate(loginPath), 2500);
    } catch (err) {
      setError(err?.data?.message || t("resetPassword.error"));
    }
  };

  // No token in the URL -> invalid link.
  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold tracking-tight">
            {t("resetPassword.invalidTitle")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("resetPassword.invalidBody")}
          </p>
          <Link
            to={`${isAdmin ? "/admin" : "/store"}/forgot-password`}
            className="mt-6 inline-block text-sm font-medium text-foreground hover:underline"
          >
            {t("resetPassword.requestNew")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          {done ? (
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <h1 className="mt-4 font-display text-2xl font-bold tracking-tight">
                {t("resetPassword.doneTitle")}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("resetPassword.doneBody")}
              </p>
            </div>
          ) : (
            <>
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <Lock className="h-6 w-6" />
                </div>
                <h1 className="mt-4 font-display text-2xl font-bold tracking-tight">
                  {t("resetPassword.title")}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("resetPassword.subtitle")}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">
                    {t("resetPassword.newPassword")}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoFocus
                  />
                  {tooShort && (
                    <p className="text-xs text-destructive">
                      {t("resetPassword.tooShort")}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">
                    {t("resetPassword.confirmPassword")}
                  </Label>
                  <Input
                    id="confirm"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                  />
                  {mismatch && (
                    <p className="text-xs text-destructive">
                      {t("resetPassword.mismatch")}
                    </p>
                  )}
                </div>

                {error && (
                  <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={!canSubmit || isLoading}
                >
                  {isLoading
                    ? t("resetPassword.saving")
                    : t("resetPassword.submit")}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
