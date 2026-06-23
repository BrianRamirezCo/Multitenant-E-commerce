import LegalLayout, { LegalSection } from "../components/LegalLayout";

/**
 * Platform Privacy Policy. Orientative text in Spanish — NOT legal advice.
 */
export default function PrivacyPage() {
  return (
    <LegalLayout title="Política de Privacidad" updated="Junio 2026">
      <p>
        En CommerceOS, operada por [NOMBRE DE TU EMPRESA], valoramos tu
        privacidad. Esta política explica qué datos recolectamos, para qué los
        usamos y cómo los protegemos.
      </p>

      <LegalSection heading="1. Datos que recolectamos">
        <p>Podemos recolectar los siguientes datos:</p>
        <ul className="ml-5 list-disc space-y-1">
          <li>Nombre y apellido.</li>
          <li>Dirección de correo electrónico.</li>
          <li>Teléfono.</li>
          <li>Dirección.</li>
          <li>Dirección IP y datos de navegación.</li>
          <li>Historial de actividad y de compras dentro de la Plataforma.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="2. Para qué usamos tus datos">
        <p>
          Utilizamos los datos para proveer y mejorar el servicio, procesar
          pagos y suscripciones, brindar soporte, enviar comunicaciones
          relacionadas con tu cuenta y cumplir con obligaciones legales.
        </p>
      </LegalSection>

      <LegalSection heading="3. Cómo almacenamos y protegemos tus datos">
        <p>
          Tus datos se almacenan en servidores seguros y aplicamos medidas
          técnicas y organizativas razonables para protegerlos contra accesos no
          autorizados, pérdida o alteración. Ningún sistema es 100% infalible,
          pero trabajamos para minimizar los riesgos.
        </p>
      </LegalSection>

      <LegalSection heading="4. Con quién compartimos tus datos">
        <p>
          No vendemos tus datos. Podemos compartirlos con proveedores que nos
          ayudan a operar el servicio (por ejemplo, procesadores de pago y
          servicios de infraestructura), siempre bajo obligaciones de
          confidencialidad, o cuando la ley así lo requiera.
        </p>
      </LegalSection>

      <LegalSection heading="5. Tus derechos">
        <p>
          Podés solicitar el acceso, la rectificación o la eliminación de tus
          datos personales escribiéndonos a [TU EMAIL]. Atenderemos tu solicitud
          conforme a la normativa de protección de datos aplicable.
        </p>
      </LegalSection>

      <LegalSection heading="6. Datos de los clientes de las tiendas">
        <p>
          Cada comercio que utiliza la Plataforma es responsable del tratamiento
          de los datos de sus propios clientes. CommerceOS actúa como proveedor
          de la infraestructura tecnológica para dicho tratamiento.
        </p>
      </LegalSection>

      <LegalSection heading="7. Contacto">
        <p>Por consultas sobre privacidad, escribinos a [TU EMAIL].</p>
      </LegalSection>
    </LegalLayout>
  );
}
