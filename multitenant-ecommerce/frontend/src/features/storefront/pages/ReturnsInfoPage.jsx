import { useSelector } from "react-redux";
import StorefrontPageLayout, {
  StorefrontSection,
} from "../components/StorefrontPageLayout";

export default function ReturnsInfoPage() {
  const tenant = useSelector((s) => s.tenant.info);
  const store = tenant?.name || "la tienda";

  return (
    <StorefrontPageLayout title="Cambios y devoluciones">
      <p>
        En {store} queremos que estés conforme con tu compra. Si algo no salió
        como esperabas, podés solicitar un cambio o devolución.
      </p>

      <StorefrontSection heading="Plazo">
        <p>
          Tenés hasta 30 días desde la recepción del pedido para solicitar un
          cambio o devolución, siempre que el producto se encuentre en su estado
          y empaque original.
        </p>
      </StorefrontSection>

      <StorefrontSection heading="Cómo solicitarlo">
        <p>
          Para iniciar un cambio o devolución, contactanos a través de los
          medios disponibles en nuestra página de contacto, indicando tu número
          de pedido y el motivo.
        </p>
      </StorefrontSection>

      <StorefrontSection heading="Reintegros">
        <p>
          Una vez recibido y revisado el producto, procesaremos el reintegro o
          el cambio correspondiente. Los reintegros se realizan por el mismo
          medio de pago utilizado en la compra.
        </p>
      </StorefrontSection>

      <StorefrontSection heading="Excepciones">
        <p>
          Algunos productos pueden no admitir cambio o devolución por motivos de
          higiene o por ser elaborados a medida. Esto se indicará en la
          descripción del producto cuando corresponda.
        </p>
      </StorefrontSection>
    </StorefrontPageLayout>
  );
}
