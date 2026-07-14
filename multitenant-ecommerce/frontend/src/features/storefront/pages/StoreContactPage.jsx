import { useSelector } from "react-redux";
import { Instagram, MessageCircle } from "lucide-react";
import StorefrontPageLayout, {
  StorefrontSection,
  StorefrontCustomContent,
  StorefrontDefaultNotice,
} from "../components/StorefrontPageLayout";

/**
 * Contact page.
 *
 * Always renders the store's REAL contact channels (the WhatsApp / Instagram it
 * configured in admin → Mi tienda) as actual links — that's data we have, not a
 * guess. The prose above them is editable (admin → Páginas); the default never
 * invents business hours or response times, since those differ per store.
 */
export default function StoreContactPage() {
  const tenant = useSelector((s) => s.tenant.info);
  const store = tenant?.name || "la tienda";
  const custom = tenant?.pages?.contact;

  const social = tenant?.social || {};
  const instagramUrl = social.instagram
    ? social.instagram.startsWith("http")
      ? social.instagram
      : `https://instagram.com/${social.instagram.replace(/^@/, "")}`
    : null;
  const whatsappUrl = social.whatsapp
    ? `https://wa.me/${social.whatsapp.replace(/[^0-9]/g, "")}`
    : null;

  const hasChannels = Boolean(instagramUrl || whatsappUrl);

  return (
    <StorefrontPageLayout title="Contacto">
      <StorefrontCustomContent content={custom}>
        <StorefrontDefaultNotice />

        <p>
          ¿Tenés alguna consulta sobre los productos o tu pedido? Escribinos por
          los canales disponibles y {store} te va a responder.
        </p>

        <StorefrontSection heading="Sobre tus pedidos">
          <p>
            Si ya hiciste una compra, podés ver el estado de tu pedido desde tu
            cuenta, en la sección "Mis pedidos".
          </p>
        </StorefrontSection>
      </StorefrontCustomContent>

      {/* Real channels — always shown, custom copy or not. */}
      <StorefrontSection heading="Canales de atención">
        {hasChannels ? (
          <div className="flex flex-wrap gap-3">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            )}
            {instagramUrl && (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                <Instagram className="h-4 w-4" />
                Instagram
              </a>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground">
            {store} todavía no publicó sus canales de atención.
          </p>
        )}
      </StorefrontSection>
    </StorefrontPageLayout>
  );
}
