import { ShieldCheck, Zap, CreditCard, Headphones } from "lucide-react";

/**
 * Trust bar (honest, no inflated client counts). Shows real value props instead
 * of fictional logos / fake customer numbers.
 */
export default function SocialProof() {
  const items = [
    { icon: CreditCard, label: "Pagos con MercadoPago" },
    { icon: Zap, label: "Tu tienda lista en minutos" },
    { icon: ShieldCheck, label: "Datos protegidos" },
    { icon: Headphones, label: "Soporte personalizado" },
  ];

  return (
    <section className="border-y border-white/5 py-10">
      <div className="container">
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {items.map((it) => (
            <span
              key={it.label}
              className="flex items-center gap-2 text-sm text-white/50"
            >
              <it.icon className="h-4 w-4 text-violet-400" /> {it.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
