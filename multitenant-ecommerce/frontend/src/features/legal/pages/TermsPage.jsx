import LegalLayout, { LegalSection } from "../components/LegalLayout";

/**
 * Platform Terms & Conditions. Text in Spanish (primary market). Placeholders
 * like [NOMBRE DE TU EMPRESA] / [TU EMAIL] must be replaced with real data.
 * NOTE: orientative text, NOT legal advice — have a lawyer review before launch.
 */
export default function TermsPage() {
  return (
    <LegalLayout title="Términos y Condiciones" updated="Junio 2026">
      <p>
        Bienvenido a CommerceOS. Estos Términos y Condiciones regulan el uso de
        la plataforma operada por [NOMBRE DE TU EMPRESA] ("la Plataforma",
        "nosotros"). Al registrarte y utilizar el servicio, aceptás estos
        términos en su totalidad.
      </p>

      <LegalSection heading="1. Descripción del servicio">
        <p>
          CommerceOS proporciona una plataforma tecnológica para la creación y
          administración de tiendas online. La Plataforma actúa únicamente como
          proveedor del software; no vende productos ni realiza envíos.
        </p>
      </LegalSection>

      <LegalSection heading="2. Quién puede usar el servicio">
        <p>
          Para usar la Plataforma debés ser mayor de edad y tener capacidad
          legal para contratar. Al registrarte, declarás que la información
          provista es veraz y que sos responsable de mantener la
          confidencialidad de tu cuenta.
        </p>
      </LegalSection>

      <LegalSection heading="3. Responsabilidad del comercio">
        <p>
          La Plataforma actúa únicamente como intermediario tecnológico. Cada
          comercio (usuario de la Plataforma) es el único responsable de sus
          publicaciones, precios, stock, descripciones, facturación, envíos,
          atención al cliente y del cumplimiento de todas las normativas
          legales, fiscales y de protección al consumidor que correspondan a su
          actividad.
        </p>
        <p>
          [NOMBRE DE TU EMPRESA] no garantiza ni se responsabiliza por la
          calidad, legalidad, seguridad o veracidad de los productos publicados
          por los comercios, ni por las transacciones entre los comercios y sus
          clientes.
        </p>
      </LegalSection>

      <LegalSection heading="4. Productos y actividades prohibidas">
        <p>
          Está estrictamente prohibido utilizar la Plataforma para vender o
          publicar:
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li>Drogas, estupefacientes o sustancias ilegales.</li>
          <li>Armas, municiones o explosivos.</li>
          <li>Medicamentos sin autorización correspondiente.</li>
          <li>
            Productos falsificados o que infrinjan derechos de propiedad
            intelectual.
          </li>
          <li>Productos robados o de procedencia ilícita.</li>
          <li>
            Material ilegal o contenido para adultos prohibido por la ley.
          </li>
          <li>
            Cualquier bien o servicio cuya comercialización esté prohibida por
            la legislación aplicable.
          </li>
        </ul>
        <p>
          El incumplimiento de esta cláusula habilita a la Plataforma a
          suspender o cancelar la cuenta de forma inmediata, sin derecho a
          reembolso.
        </p>
      </LegalSection>

      <LegalSection heading="5. Planes, pagos y suscripciones">
        <p>
          El uso de la Plataforma requiere la contratación de un plan de
          suscripción de pago, cuyo precio se informa al momento de la
          contratación. La suscripción se cobra de forma recurrente (mensual) a
          través del medio de pago autorizado por el usuario.
        </p>
        <p>
          La falta de pago habilita a la Plataforma a suspender el acceso al
          servicio. Salvo disposición legal en contrario, los pagos realizados
          no son reembolsables. El usuario puede cancelar su suscripción en
          cualquier momento, dejando de tener acceso al finalizar el período ya
          abonado.
        </p>
      </LegalSection>

      <LegalSection heading="6. Suspensión y cancelación de cuentas">
        <p>
          La Plataforma se reserva el derecho de suspender o cancelar cuentas
          que incumplan estos términos, vendan productos prohibidos, realicen
          actividades fraudulentas o perjudiquen el funcionamiento del servicio
          o a terceros.
        </p>
      </LegalSection>

      <LegalSection heading="7. Propiedad intelectual">
        <p>
          El software, el código, el diseño, la marca y el logo de CommerceOS
          son propiedad de [NOMBRE DE TU EMPRESA] y están protegidos por las
          leyes de propiedad intelectual. Los usuarios no pueden copiar,
          reproducir, modificar ni distribuir ningún elemento de la Plataforma
          sin autorización.
        </p>
      </LegalSection>

      <LegalSection heading="8. Limitación de responsabilidad">
        <p>
          La Plataforma no será responsable por pérdidas económicas, lucro
          cesante, interrupciones del negocio, daños indirectos o cualquier
          perjuicio derivado del uso o de la imposibilidad de uso del servicio.
        </p>
      </LegalSection>

      <LegalSection heading="9. Disponibilidad del servicio">
        <p>
          No se garantiza la disponibilidad continua e ininterrumpida del
          servicio. Pueden existir tareas de mantenimiento, actualizaciones o
          fallos ajenos al control de la Plataforma que afecten temporalmente su
          funcionamiento.
        </p>
      </LegalSection>

      <LegalSection heading="10. Modificaciones">
        <p>
          La Plataforma puede modificar estos términos y/o las características
          del servicio en cualquier momento. Los cambios serán comunicados y el
          uso continuado del servicio implica la aceptación de los términos
          actualizados.
        </p>
      </LegalSection>

      <LegalSection heading="11. Jurisdicción y ley aplicable">
        <p>
          Estos términos se rigen por las leyes de la República Argentina. Toda
          controversia será sometida a los tribunales ordinarios competentes de
          [TU JURISDICCIÓN, ej: la Ciudad Autónoma de Buenos Aires], renunciando
          a cualquier otro fuero.
        </p>
      </LegalSection>

      <LegalSection heading="12. Contacto">
        <p>
          Ante cualquier consulta sobre estos términos, podés escribirnos a [TU
          EMAIL].
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
