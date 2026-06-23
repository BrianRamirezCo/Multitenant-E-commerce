import StorefrontPageLayout, {
  StorefrontSection,
} from "../components/StorefrontPageLayout";

export default function StoreCookiesPage() {
  return (
    <StorefrontPageLayout title="Política de cookies">
      <p>
        Este sitio utiliza cookies para mejorar tu experiencia de navegación y
        compra.
      </p>

      <StorefrontSection heading="Qué son las cookies">
        <p>
          Las cookies son pequeños archivos que se almacenan en tu dispositivo y
          nos permiten recordar tus preferencias y el contenido de tu carrito.
        </p>
      </StorefrontSection>

      <StorefrontSection heading="Cómo las usamos">
        <p>
          Usamos cookies para mantener tu sesión, recordar tu carrito y entender
          cómo se usa el sitio para mejorarlo.
        </p>
      </StorefrontSection>

      <StorefrontSection heading="Gestión de cookies">
        <p>
          Podés configurar tu navegador para bloquear o eliminar las cookies,
          aunque esto puede afectar el funcionamiento del sitio.
        </p>
      </StorefrontSection>
    </StorefrontPageLayout>
  );
}
