import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";

/**
 * Newsletter section (minimal, premium). Horizontal layout inside a soft grey
 * card (no border). Title + subtitle on the left, email field + button on the
 * right. Captures an email with validation and shows a thank-you state. NOT
 * wired to the backend yet — the full newsletter feature is premium, built later.
 */
export default function NewsletterSection() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid) return;
    // Placeholder: not persisted yet (premium feature, wired later).
    setDone(true);
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
                disabled={!isValid}
                className="rounded-full bg-neutral-900 px-7 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t("newsletter.button")}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
