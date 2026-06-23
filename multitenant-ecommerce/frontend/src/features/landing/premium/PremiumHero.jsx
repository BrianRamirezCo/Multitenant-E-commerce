import { Link } from "react-router-dom";
import { ArrowRight, Play, Check } from "lucide-react";
import DashboardMockup from "./DashboardMockup";

/**
 * Premium hero: 2 columns. Left = copy + CTAs + benefits. Right = dashboard
 * mockup. Dark, with a luminous grid background and gradient glow.
 */
export default function PremiumHero() {
  const benefits = [
    "Sin comisiones por venta",
    "Listo en minutos",
    "Soporte 24/7",
    "Pagos con MercadoPago",
  ];

  return (
    <section className="relative overflow-hidden pt-28 pb-20 md:pt-36">
      {/* Luminous grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent 75%)",
        }}
      />
      {/* Gradient glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 opacity-40"
        style={{
          background:
            "radial-gradient(50% 50% at 50% 0%, rgba(124,58,237,0.5), transparent 70%)",
        }}
      />

      <div className="container relative grid items-center gap-12 lg:grid-cols-2">
        {/* Left: copy */}
        <div className="animate-fade-up text-center lg:text-left">
          <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/70 backdrop-blur">
            Plataforma SaaS Multitenant
          </span>

          <h1 className="mt-6 font-display text-4xl font-bold leading-[1.1] tracking-tight text-white md:text-6xl">
            La infraestructura que{" "}
            <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
              impulsa
            </span>{" "}
            miles de negocios digitales
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg text-white/60 lg:mx-0">
            Creá tiendas online profesionales en minutos. Administrá productos,
            pedidos, clientes y pagos desde un único lugar.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/30 transition-all hover:shadow-violet-600/50"
            >
              Crear mi tienda <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="/store"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/10"
            >
              <Play className="h-4 w-4" /> Ver demo
            </a>
          </div>

          {/* Benefits */}
          <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 lg:justify-start">
            {benefits.map((b) => (
              <span
                key={b}
                className="flex items-center gap-1.5 text-sm text-white/50"
              >
                <Check className="h-4 w-4 text-violet-400" /> {b}
              </span>
            ))}
          </div>
        </div>

        {/* Right: dashboard */}
        <div className="animate-fade-in [animation-delay:200ms]">
          <DashboardMockup />
        </div>
      </div>
    </section>
  );
}
