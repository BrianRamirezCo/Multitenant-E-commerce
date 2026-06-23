import { useSelector } from "react-redux";
import StorefrontPageLayout, {
  StorefrontSection,
} from "../components/StorefrontPageLayout";

export default function StorePrivacyPage() {
  const tenant = useSelector((s) => s.tenant.info);
  const store = tenant?.name || "la tienda";

  return (
    <StorefrontPageLayout title="Política de privacidad">
      <p>
        En {store} respetamos tu privacidad. Esta política explica cómo tratamos
        tus datos cuando comprás en nuestro sitio.
      </p>

      <StorefrontSection heading="Datos que recolectamos">
        <p>
          Recolectamos los datos necesarios para procesar tu pedido: nombre,
          datos de contacto, dirección de envío e información de pago (procesada
          de forma segura por nuestro proveedor de pagos).
        </p>
      </StorefrontSection>

      <StorefrontSection heading="Uso de tus datos">
        <p>
          Utilizamos tus datos únicamente para gestionar tu pedido, brindarte
          soporte y, si lo autorizás, enviarte novedades. No vendemos tu
          información a terceros.
        </p>
      </StorefrontSection>

      <StorefrontSection heading="Tus derechos">
        <p>
          Podés solicitar el acceso, la corrección o la eliminación de tus datos
          contactándonos a través de los medios disponibles en la página de
          contacto.
        </p>
      </StorefrontSection>
    </StorefrontPageLayout>
  );
}
