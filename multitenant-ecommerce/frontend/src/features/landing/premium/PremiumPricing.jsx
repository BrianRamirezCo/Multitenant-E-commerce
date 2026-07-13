import { Link } from "react-router-dom";
import { Check, Clock } from "lucide-react";
import { useGetPlansQuery } from "../../onboarding/onboardingApi";

/**
 * Premium pricing section. Three perfectly-aligned cards (flex-col +
 * justify-between so the CTA always sits at the same height). Growth is
 * highlighted with a violet glow + "Más popular" badge.
 *
 * SINGLE SOURCE OF TRUTH: prices, names, taglines and the "popular" flag come
 * from the backend (GET /onboarding/plans -> config/plans.js). This is the same
 * data the checkout charges, so the landing can never quote a price different
 * from what MercadoPago bills.
 *
 * Only the marketing bullet copy lives here (keyed by plan id), since it's
 * presentation text, not billing data.
 *
 * LAUNCH STATE: only Starter is purchasable; Growth/Premium show "Próximamente"
 * with a disabled CTA.
 */

// Which plans can actually be purchased right now.
const ACTIVE_PLANS = ["starter"];

// Marketing copy per plan (not billing data — safe to keep in the frontend).
const PLAN_FEATURES = {
  starter: [
    "50 productos",
    "1 tema",
    "Pedidos e inventario",
    "Cupones",
    "Pagos con MercadoPago",
  ],
  growth: [
    "1.000 productos",
    "3 temas premium",
    "Color personalizado",
    "Marketing y cupones",
    "Analíticas avanzadas",
  ],
  premium: [
    "Productos ilimitados",
    "Dominio propio",
    "IA y recomendaciones",
    "Soporte prioritario",
    "Todo lo de Growth",
  ],
};

// 350000 -> "350.000"  (ARS, sin decimales)
function formatArs(amount) {
  return new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export default function PremiumPricing() {
  const { data, isLoading, isError } = useGetPlansQuery();

  const plans = (data?.plans || []).map((p) => ({
    id: p.id,
    name: p.name,
    tagline: p.tagline,
    price: formatArs(p.price?.monthly),
    popular: p.popular,
    active: ACTIVE_PLANS.includes(p.id),
    features: PLAN_FEATURES[p.id] || [],
  }));

  return (
    <section id="pricing" className="relative py-24">
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 h-[400px] w-[700px] -translate-x-1/2 opacity-20"
        style={{
          background:
            "radial-gradient(50% 50% at 50% 50%, rgba(124,58,237,0.4), transparent 70%)",
        }}
      />

      <div className="container relative">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/70">
            Precios
          </span>
          <h2 className="mt-5 font-display text-3xl font-bold tracking-tight text-white md:text-5xl">
            Planes para cada etapa
          </h2>
          <p className="mt-4 text-white/50">
            Elegí el plan que mejor se adapte a tu negocio. Sin comisiones por
            venta.
          </p>
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="mx-auto mt-14 grid max-w-5xl gap-6 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-[460px] animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]"
              />
            ))}
          </div>
        )}

        {isError && (
          <p className="mt-14 text-center text-sm text-white/40">
            No pudimos cargar los planes. Recargá la página para intentar de
            nuevo.
          </p>
        )}

        {!isLoading && !isError && (
          <div className="mx-auto mt-14 grid max-w-5xl gap-6 lg:grid-cols-3">
            {plans.map((p) => (
              <div
                key={p.id}
                className={`relative flex flex-col rounded-2xl border p-8 ${
                  p.popular
                    ? "border-violet-500/50 bg-gradient-to-b from-violet-600/10 to-transparent"
                    : "border-white/10 bg-white/[0.02]"
                }`}
              >
                {/* Glow for the popular plan */}
                {p.popular && (
                  <div
                    className="pointer-events-none absolute -inset-px -z-10 rounded-2xl opacity-60 blur-xl"
                    style={{
                      background:
                        "radial-gradient(50% 50% at 50% 0%, rgba(124,58,237,0.5), transparent 70%)",
                    }}
                  />
                )}

                {/* Badge */}
                {p.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-lg">
                    Más popular
                  </span>
                )}
                {!p.active && !p.popular && (
                  <span className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/15 bg-[#12121a] px-3 py-1 text-xs font-medium text-white/60">
                    <Clock className="h-3 w-3" /> Próximamente
                  </span>
                )}

                {/* Header */}
                <div>
                  <h3 className="font-display text-xl font-bold text-white">
                    {p.name}
                  </h3>
                  <p className="mt-1 text-sm text-white/50">{p.tagline}</p>
                  <div className="mt-5 flex items-baseline gap-1">
                    <span className="font-display text-4xl font-bold text-white">
                      ${p.price}
                    </span>
                    <span className="text-sm text-white/50">/mes</span>
                  </div>
                </div>

                {/* CTA — same vertical position thanks to flex layout */}
                <div className="mt-6">
                  {p.active ? (
                    <Link
                      to={`/signup?plan=${p.id}`}
                      className="block rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 py-2.5 text-center text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition-all hover:shadow-violet-600/40"
                    >
                      Elegir plan
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="block w-full cursor-not-allowed rounded-lg border border-white/10 bg-white/5 py-2.5 text-center text-sm font-semibold text-white/40"
                    >
                      Próximamente
                    </button>
                  )}
                </div>

                {/* Features */}
                <ul className="mt-8 space-y-3">
                  {p.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2 text-sm text-white/70"
                    >
                      <Check className="h-4 w-4 shrink-0 text-violet-400" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
