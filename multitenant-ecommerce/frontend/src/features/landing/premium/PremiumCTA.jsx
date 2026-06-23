import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

/**
 * Final CTA: dark panel with a big headline and a strong glow. Single primary
 * action (create store). No "free" wording (all plans are paid).
 */
export default function PremiumCTA() {
  return (
    <section className="relative overflow-hidden py-28">
      {/* Strong centered glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 opacity-40"
        style={{
          background:
            "radial-gradient(50% 50% at 50% 50%, rgba(124,58,237,0.55), rgba(37,99,235,0.3), transparent 70%)",
        }}
      />
      {/* Grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse 60% 60% at 50% 50%, black, transparent 75%)",
        }}
      />

      <div className="container relative text-center">
        <h2 className="mx-auto max-w-3xl font-display text-3xl font-bold leading-tight tracking-tight text-white md:text-5xl">
          Tu próxima tienda online puede estar lista en{" "}
          <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
            menos de 10 minutos
          </span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-white/60">
          Empezá hoy y llevá tu negocio al siguiente nivel con una plataforma
          pensada para crecer.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-7 py-3.5 text-sm font-semibold text-white shadow-xl shadow-violet-600/30 transition-all hover:shadow-violet-600/50"
          >
            Crear mi tienda <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
