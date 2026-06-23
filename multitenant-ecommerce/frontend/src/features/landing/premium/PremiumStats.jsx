/**
 * Stat block — honest claims (no inflated volume numbers). These are true
 * regardless of how many customers exist yet.
 */
export default function PremiumStats() {
  const stats = [
    ["99.9%", "Disponibilidad"],
    ["0%", "Comisión por venta"],
    ["< 10 min", "Para lanzar tu tienda"],
    ["24/7", "Acceso a tu panel"],
  ];

  return (
    <section className="relative border-y border-white/5 py-20">
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          background:
            "radial-gradient(60% 100% at 50% 50%, rgba(124,58,237,0.5), transparent 70%)",
        }}
      />
      <div className="container relative">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map(([num, label]) => (
            <div key={label} className="text-center">
              <p className="font-display text-4xl font-bold tracking-tight text-white md:text-5xl">
                <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
                  {num}
                </span>
              </p>
              <p className="mt-2 text-sm text-white/50">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
