import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Loader2 } from "lucide-react";
import { useSubscribeMutation } from "../../subscribers/subscribersApi";

/**
 * Newsletter section (minimal, premium). Horizontal layout inside a soft grey
 * card. Title + subtitle on the left, email field + button on the right.
 * Captures an email with validation, POSTs it to the backend, and shows a
 * thank-you state. Subscribers are stored per-tenant and visible in the admin.
 */
export default function NewsletterSection() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [subscribe, { isLoading }] = useSubscribeMutation();

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    try {
      await subscribe(email).unwrap();
      setDone(true);
    } catch {
      // Even on error we thank the user (e.g. already subscribed = still fine).
      setDone(true);
    }
  };

  return (
    <section className="container py-12 md:py-16">
      <div className="rounded-3xl bg-secondary/50 p-8 md:p-10">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          {/* Left: text */}
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              {t("newsletter.title")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground md:text-base">
              {t("newsletter.subtitle")}
            </p>
          </div>

          {/* Right: form or thank-you */}
          {done ? (
            <div className="flex shrink-0 items-center gap-2 rounded-full bg-background px-6 py-3.5 text-sm font-medium text-foreground">
              <Check className="h-4 w-4" />
              {t("newsletter.thanks")}
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex w-full shrink-0 flex-col gap-3 sm:flex-row md:w-auto"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("newsletter.placeholder")}
                className="w-full rounded-full bg-background px-5 py-3.5 text-sm text-foreground placeholder-muted-foreground outline-none ring-1 ring-border transition-shadow focus:ring-foreground/30 sm:w-64"
              />
              <button
                type="submit"
                disabled={!isValid || isLoading}
                className="flex items-center justify-center gap-2 rounded-full bg-neutral-900 px-7 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {t("newsletter.button")}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
