import { useSelector } from "react-redux";
import StorefrontPageLayout, {
  StorefrontSection,
  StorefrontCustomContent,
  StorefrontDefaultNotice,
} from "../components/StorefrontPageLayout";

/**
 * Privacy policy.
 *
 * When the store hasn't written its own copy (admin → Páginas), we show a
 * default that only states what is true for every store on the platform (which
 * data the checkout actually collects, that card data never touches our servers,
 * and the rights granted by Ley 25.326) — never invented commitments like
 * "we don't sell your data to third parties", which is the store's promise to
 * make, not ours.
 */
export default function StorePrivacyPage() {
  const tenant = useSelector((s) => s.tenant.info);
  const store = tenant?.name || "la tienda";
  const custom = tenant?.pages?.privacy;

  return (
    <StorefrontPageLayout title="Política de privacidad">
      <StorefrontCustomContent content={custom}>
        <StorefrontDefaultNotice />

        <StorefrontSection heading="Qué datos se recopilan">
          <p>
            Al crear una cuenta o realizar una compra en {store} se recopilan tu
            nombre, correo electrónico, teléfono y domicilio de envío. Estos
            datos son necesarios para procesar y entregar tu pedido.
          </p>
        </StorefrontSection>

        <StorefrontSection heading="Datos de pago">
          <p>
            Los pagos se procesan a través de una plataforma externa de pagos.
            Los datos de tu tarjeta se ingresan directamente en esa plataforma y
            no se almacenan en este sitio.
          </p>
        </StorefrontSection>

        <StorefrontSection heading="Tus derechos">
          <p>
            De acuerdo con la Ley 25.326 de Protección de los Datos Personales,
            podés solicitar en cualquier momento el acceso, la rectificación o
            la supresión de tus datos personales, de forma gratuita. Para
            hacerlo, contactate con {store} a través de la página de contacto.
          </p>
        </StorefrontSection>

        <StorefrontSection heading="Uso de tus datos">
          <p>
            {store} todavía no publicó su política propia sobre el uso de los
            datos (por ejemplo, si los utiliza para enviar comunicaciones
            comerciales o si los comparte con terceros). Consultala directamente
            con la tienda.
          </p>
        </StorefrontSection>
      </StorefrontCustomContent>
    </StorefrontPageLayout>
  );
}
