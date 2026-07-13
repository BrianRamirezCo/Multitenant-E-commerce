import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { useLoginMutation, useRegisterMutation } from "../../auth/authApi";

/**
 * Customer auth page for the storefront (login + register in one screen).
 *
 * Uses the SAME auth endpoints/slice as the admin — the backend logs in any
 * user by email/password. The difference is the redirect: on success we send
 * the customer to /store/account (their orders), not the admin panel.
 *
 * Register creates a 'customer' (backend default role for /auth/register).
 */
export default function AccountAuthPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const accessToken = useSelector((s) => s.auth.accessToken);

  const [mode, setMode] = useState("login"); // 'login' | 'register'
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState(null);

  const [login, { isLoading: loggingIn }] = useLoginMutation();
  const [register, { isLoading: registering }] = useRegisterMutation();

  // If already logged in, go straight to the account page.
  if (accessToken) {
    navigate("/store/account", { replace: true });
  }

  const update = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async () => {
    setError(null);
    try {
      if (mode === "login") {
        await login({ email: form.email, password: form.password }).unwrap();
      } else {
        await register({
          name: form.name,
          email: form.email,
          password: form.password,
        }).unwrap();
      }
      navigate("/store/account");
    } catch (err) {
      setError(
        err?.data?.message ||
          (mode === "login"
            ? t("account.invalidCredentials")
            : t("account.registerError")),
      );
    }
  };

  const isLogin = mode === "login";
  const busy = loggingIn || registering;

  return (
    <div className="container flex justify-center py-16">
      <Card className="w-full max-w-sm">
        <CardContent className="p-8">
          <h1 className="font-display text-2xl font-bold">
            {isLogin ? t("account.loginTitle") : t("account.registerTitle")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLogin
              ? t("account.loginSubtitle")
              : t("account.registerSubtitle")}
          </p>

          <div className="mt-6 space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">{t("account.name")}</Label>
                <Input id="name" value={form.name} onChange={update("name")} />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">{t("account.email")}</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={update("email")}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("account.password")}</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={update("password")}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
              {isLogin && (
                <div className="text-right">
                  <Link
                    to="/store/forgot-password"
                    className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t("account.forgotPassword")}
                  </Link>
                </div>
              )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button className="w-full" onClick={handleSubmit} disabled={busy}>
              {busy
                ? isLogin
                  ? t("account.loggingIn")
                  : t("account.registering")
                : isLogin
                  ? t("account.loginBtn")
                  : t("account.registerBtn")}
            </Button>
          </div>

          {/* Toggle between login and register */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isLogin ? t("account.noAccount") : t("account.haveAccount")}{" "}
            <button
              type="button"
              className="font-medium text-primary hover:underline"
              onClick={() => {
                setMode(isLogin ? "register" : "login");
                setError(null);
              }}
            >
              {isLogin ? t("account.goRegister") : t("account.goLogin")}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
