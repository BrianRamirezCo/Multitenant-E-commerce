import { useSelector } from "react-redux";
import StorefrontPageLayout, {
  StorefrontSection,
  StorefrontCustomContent,
  StorefrontDefaultNotice,
} from "../components/StorefrontPageLayout";

/**
 * Returns & exchanges.
 *
 * When the store hasn't written its own policy, we show a default that ONLY
 * states what is true by law for everyone (the 10-day right of withdrawal in
 * Argentina, Ley 24.240 art. 34) — never an invented store policy like a
 * specific exchange window, who pays the return shipping, etc. Those depend on
 * each store and must be filled in from admin → Páginas.
 */
export default function ReturnsInfoPage() {
  const tenant = useSelector((s) => s.tenant.info);
  const store = tenant?.name || "la tienda";
  const custom = tenant?.pages?.returns;

  return (
    <StorefrontPageLayout title="Cambios y devoluciones">
      <StorefrontCustomContent content={custom}>
        <StorefrontDefaultNotice />

        <StorefrontSection heading="Derecho de arrepentimiento">
          <p>
            Si compraste a distancia (por internet), tenés derecho a
            arrepentirte de tu compra dentro de los 10 días corridos desde que
            recibiste el producto, sin necesidad de justificar el motivo y sin
            costo alguno. Este derecho está garantizado por la Ley 24.240 de
            Defensa del Consumidor.
          </p>
        </StorefrontSection>

        <StorefrontSection heading="Productos con fallas">
          <p>
            Si el producto presenta un defecto de fábrica, tenés derecho a su
            reparación, cambio o a la devolución del importe abonado, conforme a
            la garantía legal.
          </p>
        </StorefrontSection>

        <StorefrontSection heading="Cómo iniciar el trámite">
          <p>
            Ingresá a tu cuenta, buscá el pedido en "Mis pedidos" y solicitá la
            devolución indicando el motivo. {store} va a revisar tu solicitud y
            responderte.
          </p>
        </StorefrontSection>

        <StorefrontSection heading="Condiciones particulares">
          <p>
            Las condiciones propias de esta tienda (plazos para cambios por otro
            producto, estado en que debe estar el artículo, costos de envío de
            la devolución) todavía no fueron publicadas. Consultalas
            directamente con la tienda antes de iniciar el trámite.
          </p>
        </StorefrontSection>
      </StorefrontCustomContent>
    </StorefrontPageLayout>
  );
}
