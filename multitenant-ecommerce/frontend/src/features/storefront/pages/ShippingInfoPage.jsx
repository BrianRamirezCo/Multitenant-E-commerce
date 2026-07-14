import { useSelector } from "react-redux";
import StorefrontPageLayout, {
  StorefrontSection,
  StorefrontCustomContent,
  StorefrontDefaultNotice,
} from "../components/StorefrontPageLayout";

/**
 * Shipping info.
 *
 * When the store hasn't written its own copy (admin → Páginas), we show a
 * default that only states what is actually true for every store — never an
 * invented policy (delivery times, coverage areas, free-shipping thresholds all
 * depend on the specific business). The notice makes it explicit that the store
 * hasn't published its own conditions yet.
 */
export default function ShippingInfoPage() {
  const tenant = useSelector((s) => s.tenant.info);
  const store = tenant?.name || "la tienda";
  const custom = tenant?.pages?.shipping;

  return (
    <StorefrontPageLayout title="Información de envíos">
      <StorefrontCustomContent content={custom}>
        <StorefrontDefaultNotice />

        <StorefrontSection heading="Costos de envío">
          <p>
            El costo de envío se calcula y se muestra antes de que confirmes tu
            compra. Nunca vas a pagar un monto distinto al que viste al
            finalizar el pedido.
          </p>
        </StorefrontSection>

        <StorefrontSection heading="Zonas y plazos de entrega">
          <p>
            Las zonas de cobertura y los plazos de entrega de {store} todavía no
            fueron publicados. Antes de comprar, consultá con la tienda si
            realizan envíos a tu localidad y cuánto demora la entrega.
          </p>
        </StorefrontSection>

        <StorefrontSection heading="Seguimiento de tu pedido">
          <p>
            Vas a recibir un correo electrónico con la confirmación de tu
            compra. La tienda te informará el estado del envío por los medios de
            contacto que registraste.
          </p>
        </StorefrontSection>
      </StorefrontCustomContent>
    </StorefrontPageLayout>
  );
}
