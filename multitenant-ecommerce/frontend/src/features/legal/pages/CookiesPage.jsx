import LegalLayout, { LegalSection } from "../components/LegalLayout";

/**
 * Platform Cookies Policy. Orientative text in Spanish — NOT legal advice.
 */
export default function CookiesPage() {
  return (
    <LegalLayout title="Política de Cookies" updated="Junio 2026">
      <p>
        CommerceOS utiliza cookies y tecnologías similares para mejorar tu
        experiencia, analizar el uso del servicio y, en su caso, mostrar
        publicidad.
      </p>

      <LegalSection heading="1. Qué son las cookies">
        <p>
          Las cookies son pequeños archivos que se almacenan en tu dispositivo
          cuando visitás un sitio web, y permiten recordar tus preferencias y
          actividad.
        </p>
      </LegalSection>

      <LegalSection heading="2. Tipos de cookies que usamos">
        <ul className="ml-5 list-disc space-y-1">
          <li>
            <strong>Cookies de sesión:</strong> necesarias para el
            funcionamiento del servicio (por ejemplo, mantener tu sesión
            iniciada).
          </li>
          <li>
            <strong>Cookies analíticas:</strong> nos ayudan a entender cómo se
            usa la Plataforma (por ejemplo, herramientas de analítica web).
          </li>
          <li>
            <strong>Cookies de marketing:</strong> en caso de utilizarse,
            permiten mostrar publicidad relevante.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="3. Cómo gestionar las cookies">
        <p>
          Podés configurar tu navegador para bloquear o eliminar cookies. Tené
          en cuenta que deshabilitar ciertas cookies puede afectar el
          funcionamiento del servicio.
        </p>
      </LegalSection>

      <LegalSection heading="4. Contacto">
        <p>Ante cualquier duda sobre esta política, escribinos a [TU EMAIL].</p>
      </LegalSection>
    </LegalLayout>
  );
}
