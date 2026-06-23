import { useSelector } from "react-redux";
import StorefrontPageLayout, {
  StorefrontSection,
} from "../components/StorefrontPageLayout";

export default function StoreTermsPage() {
  const tenant = useSelector((s) => s.tenant.info);
  const store = tenant?.name || "la tienda";

  return (
    <StorefrontPageLayout title="Términos y condiciones">
      <p>
        Estos términos regulan las compras realizadas en {store}. Al realizar un
        pedido, aceptás las siguientes condiciones.
      </p>

      <StorefrontSection heading="Productos y precios">
        <p>
          Los precios y la disponibilidad de los productos pueden variar sin
          previo aviso. Hacemos nuestro mejor esfuerzo para que la información
          publicada sea precisa.
        </p>
      </StorefrontSection>

      <StorefrontSection heading="Pedidos y pagos">
        <p>
          Los pedidos se confirman una vez acreditado el pago. Nos reservamos el
          derecho de cancelar pedidos ante errores de precio, falta de stock o
          sospecha de fraude.
        </p>
      </StorefrontSection>

      <StorefrontSection heading="Envíos y devoluciones">
        <p>
          Las condiciones de envío y devolución se detallan en las páginas
          correspondientes de este sitio.
        </p>
      </StorefrontSection>

      <StorefrontSection heading="Contacto">
        <p>
          Ante cualquier duda sobre estos términos, podés contactarnos a través
          de los medios disponibles en la página de contacto.
        </p>
      </StorefrontSection>
    </StorefrontPageLayout>
  );
}
