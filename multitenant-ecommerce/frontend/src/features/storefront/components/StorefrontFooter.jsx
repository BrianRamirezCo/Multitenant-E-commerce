import { useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Instagram, CreditCard } from "lucide-react";

/**
 * Premium storefront footer. Always a dark surface, but the shade depends on the
 * plan: Starter gets a sober dark-grey footer, Growth/Premium get near-black
 * (the NOVA look). Brand block + link columns + payment-methods block + social
 * icons (Instagram + WhatsApp) + copyright.
 *
 * Socials read from tenant.social (instagram, whatsapp). Each icon only renders
 * if its value is set, so an empty store shows none.
 */

// Simple WhatsApp glyph (lucide doesn't ship a WhatsApp icon).
function WhatsAppIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

export default function StorefrontFooter() {
  const { t } = useTranslation();
  const tenant = useSelector((s) => s.tenant.info);
  const year = new Date().getFullYear();
  const [logoOk, setLogoOk] = useState(true);

  const plan = tenant?.plan || "starter";
  // Starter -> dark grey; Growth/Premium -> near-black (NOVA).
  const isStarter = plan === "starter";
  const surface = isStarter ? "bg-neutral-800" : "bg-neutral-950";

  // Social links from the tenant.
  const social = tenant?.social || {};
  const instagramUrl = social.instagram
    ? social.instagram.startsWith("http")
      ? social.instagram
      : `https://instagram.com/${social.instagram.replace(/^@/, "")}`
    : null;
  const whatsappUrl = social.whatsapp
    ? `https://wa.me/${social.whatsapp.replace(/[^0-9]/g, "")}`
    : null;

  const columns = [
    {
      title: t("footer.shop"),
      links: [
        { label: t("nav.store"), to: "/store" },
        { label: t("nav.categories"), to: "/store/categories" },
        { label: t("nav.deals"), to: "/store/deals" },
        { label: t("nav.new"), to: "/store/new" },
      ],
    },
    {
      title: t("footer.help"),
      links: [
        { label: t("footer.shipping"), to: "/store/shipping-info" },
        { label: t("footer.returns"), to: "/store/returns-info" },
        { label: t("footer.contact"), to: "/store/contact" },
      ],
    },
    {
      title: t("footer.company"),
      links: [
        { label: t("footer.about"), to: "/store/about" },
        { label: t("footer.terms"), to: "/store/terms" },
        { label: t("footer.privacy"), to: "/store/privacy" },
        { label: t("footer.cookies"), to: "/store/cookies" },
      ],
    },
  ];

  return (
    <footer className={`mt-16 ${surface} text-white`}>
      {/* Brand + link columns + payment */}
      <div className="container grid grid-cols-2 gap-8 py-14 md:grid-cols-6">
        {/* Brand block */}
        <div className="col-span-2">
          <span className="font-display text-xl font-bold tracking-tight text-white">
            {tenant?.name || t("nav.store")}
          </span>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/50">
            {t("footer.tagline")}
          </p>

          {/* Social icons (only those configured) */}
          {(instagramUrl || whatsappUrl) && (
            <div className="mt-6 flex items-center gap-3">
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <Instagram className="h-4 w-4" />
                </a>
              )}
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Link columns */}
        {columns.map((col) => (
          <div key={col.title}>
            <p className="mb-4 text-sm font-semibold text-white">{col.title}</p>
            <ul className="space-y-3">
              {col.links.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-white/50 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Payment methods */}
        <div>
          <p className="mb-4 text-sm font-semibold text-white">
            {t("footer.paymentTitle")}
          </p>
          <div className="inline-flex items-center">
            {logoOk ? (
              <img
                src="/mercadopago.png"
                alt="MercadoPago"
                className="h-8 w-auto"
                onError={() => setLogoOk(false)}
              />
            ) : (
              <span className="inline-flex items-center gap-2 text-sm font-medium text-white/70">
                <CreditCard className="h-4 w-4" />
                {t("footer.paymentMethods")}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container py-6 text-center text-xs text-white/40">
          © {year} {tenant?.name || t("nav.store")}. {t("footer.rights")}
        </div>
      </div>
    </footer>
  );
}
