import { useSelector } from "react-redux";
import StorefrontPageLayout, {
  StorefrontSection,
} from "../components/StorefrontPageLayout";

export default function ShippingInfoPage() {
  const tenant = useSelector((s) => s.tenant.info);
  const store = tenant?.name || "la tienda";

  return (
    <StorefrontPageLayout title="Información de envíos">
      <p>
        En {store} queremos que recibas tu pedido de la forma más rápida y
        segura posible.
      </p>

      <StorefrontSection heading="Zonas de envío">
        <p>
          Realizamos envíos a todo el país. Los tiempos y costos pueden variar
          según tu ubicación, y se calculan automáticamente al finalizar tu
          compra.
        </p>
      </StorefrontSection>

      <StorefrontSection heading="Tiempos de entrega">
        <p>
          Una vez confirmado el pago, preparamos tu pedido y lo despachamos en
          un plazo estimado de 24 a 72 horas hábiles. El tiempo de entrega
          depende del servicio de correo y tu localidad.
        </p>
      </StorefrontSection>

      <StorefrontSection heading="Costos de envío">
        <p>
          El costo de envío se muestra antes de confirmar tu compra. En algunos
          casos puede haber envío gratis a partir de cierto monto.
        </p>
      </StorefrontSection>

      <StorefrontSection heading="Seguimiento">
        <p>
          Cuando tu pedido sea despachado, te enviaremos la información de
          seguimiento al correo que registraste.
        </p>
      </StorefrontSection>
    </StorefrontPageLayout>
  );
}
