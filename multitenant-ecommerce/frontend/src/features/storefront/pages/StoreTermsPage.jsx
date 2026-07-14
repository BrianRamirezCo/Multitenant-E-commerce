import { useSelector } from "react-redux";
import StorefrontPageLayout, {
  StorefrontSection,
  StorefrontCustomContent,
  StorefrontDefaultNotice,
} from "../components/StorefrontPageLayout";

/**
 * Store terms.
 *
 * When the store hasn't written its own copy (admin → Páginas), we show a
 * default that only states what is true for every store (consumer rights under
 * Ley 24.240, how the checkout works) — never invented store-specific clauses.
 * The notice makes it explicit that the store hasn't published its own terms.
 */
export default function StoreTermsPage() {
  const tenant = useSelector((s) => s.tenant.info);
  const store = tenant?.name || "la tienda";
  const custom = tenant?.pages?.terms;

  return (
    <StorefrontPageLayout title="Términos y condiciones">
      <StorefrontCustomContent content={custom}>
        <StorefrontDefaultNotice />

        <p>
          Estas condiciones generales regulan las compras realizadas en {store}.
          Al realizar un pedido, aceptás los términos aquí detallados.
        </p>

        <StorefrontSection heading="Precios y disponibilidad">
          <p>
            Los precios publicados están expresados en pesos argentinos. La
            disponibilidad de los productos está sujeta a stock y puede variar
            sin previo aviso.
          </p>
        </StorefrontSection>

        <StorefrontSection heading="Confirmación del pedido">
          <p>
            El pedido queda confirmado una vez acreditado el pago. La tienda
            puede cancelar un pedido ante errores evidentes de precio, falta de
            stock o sospecha de fraude, reintegrando el importe abonado.
          </p>
        </StorefrontSection>

        <StorefrontSection heading="Tus derechos como consumidor">
          <p>
            Tus derechos están protegidos por la Ley 24.240 de Defensa del
            Consumidor. Ninguna condición particular de esta tienda puede
            restringir los derechos que la ley te garantiza, incluido el derecho
            de arrepentimiento dentro de los 10 días corridos de recibido el
            producto.
          </p>
        </StorefrontSection>

        <StorefrontSection heading="Envíos y devoluciones">
          <p>
            Las condiciones de envío y de devolución se detallan en las páginas
            correspondientes de este sitio.
          </p>
        </StorefrontSection>

        <StorefrontSection heading="Condiciones particulares">
          <p>
            {store} todavía no publicó sus condiciones específicas de venta.
            Ante cualquier duda, contactate con la tienda antes de realizar tu
            compra.
          </p>
        </StorefrontSection>
      </StorefrontCustomContent>
    </StorefrontPageLayout>
  );
}
