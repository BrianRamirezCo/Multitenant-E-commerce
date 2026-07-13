import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Lock } from "lucide-react";
import LanguageToggle from "../../../components/LanguageToggle";
import Logo from "../../../components/Logo";
import { useLoginMutation } from "../authApi";

/**
 * Login page for the store admin. Runs inside the tenant context, so it
 * authenticates against the current store. On success the access token is
 * stored in memory and the user is sent to the admin panel.
 *
 * Premium dark styling to match the CommerceOS platform landing. Self-contained
 * dark theme (#0A0A0A), not theme-dependent. Logic unchanged.
 */
export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [login, { isLoading }] = useLoginMutation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    setError(null);
    try {
      await login({ email, password }).unwrap();
      navigate("/admin");
    } catch (err) {
      setError(err?.data?.message || t("auth.invalidCredentials"));
    }
  };

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
            "radial-gradient(ellipse 70% 60% at 50% 0%, black, transparent 75%)",
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

      {/* Login card */}
      <div className="relative flex justify-center px-4 py-20">
        <div className="w-full max-w-sm">
          {/* Glow behind card */}
          <div className="relative">
            <div
              className="pointer-events-none absolute -inset-4 rounded-3xl opacity-50 blur-2xl"
              style={{
                background:
                  "radial-gradient(50% 50% at 50% 40%, rgba(124,58,237,0.3), transparent 70%)",
              }}
            />

            <div className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl backdrop-blur-xl">
              {/* Icon */}
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-violet-500/20 to-blue-500/10 text-violet-300">
                <Lock className="h-6 w-6" />
              </div>

              <h1 className="mt-5 font-display text-2xl font-bold text-white">
                {t("auth.loginTitle")}
              </h1>
              <p className="mt-1 text-sm text-white/50">
                {t("auth.loginSubtitle")}
              </p>

              <div className="mt-6 space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-white/70"
                  >
                    {t("auth.email")}
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    placeholder="tu@email.com"
                    className="w-full rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-violet-500/50 focus:bg-white/[0.04]"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-white/70"
                  >
                    {t("auth.password")}
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-violet-500/50 focus:bg-white/[0.04]"
                  />
                  <div className="text-right">
                    <Link
                      to="/admin/forgot-password"
                      className="text-xs text-white/50 transition-colors hover:text-white"
                    >
                      {t("auth.forgotPassword")}
                    </Link>
                  </div>
                </div>

                {error && <p className="text-sm text-red-400">{error}</p>}

                <button
                  onClick={handleSubmit}
                  disabled={isLoading || !email || !password}
                  className="w-full rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition-all hover:shadow-violet-600/40 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? t("auth.loggingIn") : t("auth.loginBtn")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
