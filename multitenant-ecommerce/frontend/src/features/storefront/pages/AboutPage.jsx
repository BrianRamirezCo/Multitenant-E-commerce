import { useSelector } from "react-redux";
import StorefrontPageLayout, {
  StorefrontSection,
} from "../components/StorefrontPageLayout";

/**
 * About page (/store/about).
 *
 * If the store owner configured custom "About us" content from the admin
 * (tenant.about.title / body), render that. Otherwise fall back to a generic
 * placeholder so the page is never empty.
 */
export default function AboutPage() {
  const tenant = useSelector((s) => s.tenant.info);
  const store = tenant?.name || "nuestra tienda";
  const about = tenant?.about || {};

  const hasCustom = Boolean(about.title || about.body);

  // Custom content from the admin.
  if (hasCustom) {
    return (
      <StorefrontPageLayout title={about.title || `Sobre ${store}`}>
        {about.body ? (
          // Preserve the owner's line breaks (paragraphs).
          about.body.split(/\n\s*\n/).map((para, i) => (
            <p key={i} style={{ whiteSpace: "pre-line" }}>
              {para}
            </p>
          ))
        ) : (
          <p>Bienvenido a {store}. Gracias por visitarnos.</p>
        )}
      </StorefrontPageLayout>
    );
  }

  // Fallback generic content (no custom about set).
  return (
    <StorefrontPageLayout title={`Sobre ${store}`}>
      <p>
        Bienvenido a {store}. Somos un comercio comprometido con ofrecerte
        productos de calidad y una experiencia de compra simple y segura.
      </p>

      <StorefrontSection heading="Nuestra propuesta">
        <p>
          Seleccionamos cuidadosamente cada producto de nuestro catálogo para
          que encuentres lo que buscás, con la confianza de una compra
          protegida.
        </p>
      </StorefrontSection>

      <StorefrontSection heading="Compromiso">
        <p>
          Trabajamos día a día para brindarte la mejor atención, envíos
          confiables y un trato cercano. Gracias por elegirnos.
        </p>
      </StorefrontSection>
    </StorefrontPageLayout>
  );
}
