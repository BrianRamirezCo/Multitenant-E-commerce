import {
  TrendingUp,
  ShoppingBag,
  Users,
  Percent,
  ArrowUpRight,
} from "lucide-react";

/**
 * Fake product dashboard drawn entirely with divs (no real screenshot).
 * Dark glass card with metrics, a mini bar chart and floating accent cards.
 * Used inside the premium hero to convey a polished, real product.
 */
export default function DashboardMockup() {
  // Static demo data for the bar chart (heights in %).
  const bars = [42, 58, 35, 70, 52, 84, 64, 92, 76];

  const metrics = [
    { icon: TrendingUp, label: "Ventas", value: "$48.2k", delta: "+12.4%" },
    { icon: ShoppingBag, label: "Pedidos", value: "1.284", delta: "+8.1%" },
    { icon: Users, label: "Clientes", value: "3.902", delta: "+5.7%" },
    { icon: Percent, label: "Conversión", value: "3.8%", delta: "+0.6%" },
  ];

  return (
    <div className="relative">
      {/* Glow behind the card */}
      <div
        className="absolute -inset-8 animate-glow-pulse rounded-[2rem] opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 40%, rgba(124,58,237,0.45), rgba(37,99,235,0.25), transparent 70%)",
        }}
      />

      {/* Main dashboard card */}
      <div className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-2xl backdrop-blur-xl">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="h-3 w-3 rounded-full bg-red-400/80" />
              <span className="h-3 w-3 rounded-full bg-yellow-400/80" />
              <span className="h-3 w-3 rounded-full bg-green-400/80" />
            </div>
            <span className="ml-3 text-xs font-medium text-white/50">
              Panel · CommerceOS
            </span>
          </div>
          <span className="rounded-md bg-white/5 px-2 py-1 text-[10px] font-medium text-white/60">
            Últimos 30 días
          </span>
        </div>

        {/* Metrics grid */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="rounded-xl border border-white/10 bg-white/[0.02] p-3"
            >
              <div className="flex items-center justify-between">
                <m.icon className="h-4 w-4 text-violet-300" />
                <span className="flex items-center gap-0.5 text-[10px] font-semibold text-emerald-400">
                  <ArrowUpRight className="h-3 w-3" />
                  {m.delta}
                </span>
              </div>
              <p className="mt-2 text-lg font-bold text-white">{m.value}</p>
              <p className="text-[11px] text-white/40">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Mini bar chart */}
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/60">
              Ingresos por semana
            </span>
            <span className="text-xs font-semibold text-violet-300">+24%</span>
          </div>
          <div className="mt-4 flex h-24 items-end gap-1.5">
            {bars.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-gradient-to-t from-violet-600/40 to-violet-400"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Floating accent card: top-right */}
      <div className="absolute -right-6 -top-6 hidden animate-float rounded-xl border border-white/10 bg-[#12121a]/90 p-3 shadow-xl backdrop-blur-xl sm:block">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">Nueva venta</p>
            <p className="text-[10px] text-white/40">+$2.340</p>
          </div>
        </div>
      </div>

      {/* Floating accent card: bottom-left */}
      <div
        className="absolute -bottom-6 -left-6 hidden animate-float rounded-xl border border-white/10 bg-[#12121a]/90 p-3 shadow-xl backdrop-blur-xl sm:block"
        style={{ animationDelay: "1.5s" }}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/20 text-violet-300">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">12 clientes online</p>
            <p className="text-[10px] text-white/40">en este momento</p>
          </div>
        </div>
      </div>
    </div>
  );
}
