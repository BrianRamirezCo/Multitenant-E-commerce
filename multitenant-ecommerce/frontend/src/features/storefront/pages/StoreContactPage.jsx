import { useSelector } from "react-redux";
import StorefrontPageLayout, {
  StorefrontSection,
} from "../components/StorefrontPageLayout";

export default function StoreContactPage() {
  const tenant = useSelector((s) => s.tenant.info);
  const store = tenant?.name || "la tienda";

  return (
    <StorefrontPageLayout title="Contacto">
      <p>
        ¿Tenés alguna consulta sobre nuestros productos o tu pedido? En {store}{" "}
        estamos para ayudarte.
      </p>

      <StorefrontSection heading="Cómo contactarnos">
        <p>
          Podés escribirnos a través de nuestras redes sociales o por los
          canales de atención que tengamos disponibles. Te responderemos a la
          brevedad.
        </p>
      </StorefrontSection>

      <StorefrontSection heading="Horario de atención">
        <p>
          Atendemos consultas de lunes a viernes en horario comercial. Los
          mensajes recibidos fuera de ese horario se responden el siguiente día
          hábil.
        </p>
      </StorefrontSection>
    </StorefrontPageLayout>
  );
}
