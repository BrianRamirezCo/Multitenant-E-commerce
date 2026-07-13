import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Mail, ArrowLeft, Check } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { useForgotPasswordMutation } from "../authApi";

/**
 * "Forgot password" page. The user enters their email; we POST it with the
 * context ('store' or 'admin') so the reset link points to the right page.
 * Always shows a success message (the backend doesn't reveal if the email
 * exists). Used for both storefront customers and store admins.
 *
 * Pass `context="admin"` when rendering this under the admin login.
 */
export default function ForgotPasswordPage({ context = "store" }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const isAdmin = context === "admin";
  const loginPath = isAdmin ? "/admin/login" : "/store/login";

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    try {
      await forgotPassword({ email, context }).unwrap();
    } catch {
      /* we still show success regardless */
    }
    setSent(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <h1 className="mt-4 font-display text-2xl font-bold tracking-tight">
                {t("forgotPassword.sentTitle")}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("forgotPassword.sentBody", { email })}
              </p>
              <Link
                to={loginPath}
                className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-foreground hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />{" "}
                {t("forgotPassword.backToLogin")}
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <Mail className="h-6 w-6" />
                </div>
                <h1 className="mt-4 font-display text-2xl font-bold tracking-tight">
                  {t("forgotPassword.title")}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("forgotPassword.subtitle")}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t("forgotPassword.email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    autoFocus
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!isValid || isLoading}
                >
                  {isLoading
                    ? t("forgotPassword.sending")
                    : t("forgotPassword.submit")}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to={loginPath}
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />{" "}
                  {t("forgotPassword.backToLogin")}
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
