import { useTranslation } from "react-i18next";
import { Truck, ShieldCheck, CreditCard, RotateCcw } from "lucide-react";

/**
 * Trust/benefits bar (NOVA style): a row of 4 cards, each containing an icon,
 * title and description. Static content (generic for any store), translated.
 * Themed via CSS vars.
 */
export default function TrustBar() {
  const { t } = useTranslation();

  const items = [
    {
      icon: Truck,
      title: t("trust.shippingTitle"),
      desc: t("trust.shippingDesc"),
    },
    {
      icon: ShieldCheck,
      title: t("trust.secureTitle"),
      desc: t("trust.secureDesc"),
    },
    {
      icon: CreditCard,
      title: t("trust.paymentTitle"),
      desc: t("trust.paymentDesc"),
    },
    {
      icon: RotateCcw,
      title: t("trust.returnsTitle"),
      desc: t("trust.returnsDesc"),
    },
  ];

  return (
    <section className="container py-12 md:py-16">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {items.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="flex flex-col items-center rounded-2xl border border-border bg-card p-6 text-center shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/60 text-foreground">
              <Icon className="h-6 w-6" strokeWidth={1.5} />
            </div>
            <h3 className="mt-4 font-body text-sm font-semibold text-foreground">
              {title}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
