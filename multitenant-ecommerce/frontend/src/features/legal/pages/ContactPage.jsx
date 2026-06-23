import { Mail, MessageCircle, Clock } from "lucide-react";
import LegalLayout from "../components/LegalLayout";

/**
 * Platform contact page (CommerceOS). Reuses the legal layout for consistency.
 * Replace the [TU EMAIL] / [TU WHATSAPP] placeholders with real data.
 */
export default function ContactPage() {
  return (
    <LegalLayout title="Contacto">
      <p>
        ¿Tenés preguntas sobre CommerceOS o necesitás ayuda con tu tienda?
        Estamos para ayudarte. Escribinos por cualquiera de estos medios y te
        respondemos a la brevedad.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-5">
          <Mail className="h-6 w-6 text-primary" />
          <h2 className="mt-3 font-semibold">Email</h2>
          <p className="mt-1 text-sm text-muted-foreground">Escribinos a:</p>
          <a
            href="mailto:[TU EMAIL]"
            className="mt-1 inline-block text-sm font-medium text-primary hover:underline"
          >
            [TU EMAIL]
          </a>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <MessageCircle className="h-6 w-6 text-primary" />
          <h2 className="mt-3 font-semibold">WhatsApp</h2>
          <p className="mt-1 text-sm text-muted-foreground">Escribinos al:</p>
          <span className="mt-1 inline-block text-sm font-medium text-primary">
            [TU WHATSAPP]
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-lg border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
        <Clock className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Horario de atención: lunes a viernes de 9 a 18 hs (hora de Argentina).
          Respondemos los mensajes dentro de las 24-48 horas hábiles.
        </span>
      </div>
    </LegalLayout>
  );
}
