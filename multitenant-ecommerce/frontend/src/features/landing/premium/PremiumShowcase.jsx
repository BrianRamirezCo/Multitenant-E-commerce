import { LayoutDashboard, Smartphone, ShoppingCart } from "lucide-react";

/**
 * Showcase section (Apple-keynote vibe): a big browser-framed dashboard mockup
 * with floating device cards around it. All drawn with divs (no screenshots).
 */
export default function PremiumShowcase() {
  return (
    <section id="showcase" className="relative overflow-hidden py-24">
      {/* Background glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2 opacity-25"
        style={{
          background:
            "radial-gradient(50% 50% at 50% 50%, rgba(124,58,237,0.4), transparent 70%)",
        }}
      />

      <div className="container relative">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/70">
            Tu negocio, en un solo lugar
          </span>
          <h2 className="mt-5 font-display text-3xl font-bold tracking-tight text-white md:text-5xl">
            Un panel hecho para crecer
          </h2>
          <p className="mt-4 text-white/50">
            Administrá productos, pedidos y clientes con una interfaz pensada
            para que no pierdas tiempo.
          </p>
        </div>

        {/* Browser-framed dashboard */}
        <div className="relative mx-auto mt-14 max-w-4xl">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d14] shadow-2xl">
            {/* Browser top bar */}
            <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.02] px-4 py-3">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-red-400/70" />
                <span className="h-3 w-3 rounded-full bg-yellow-400/70" />
                <span className="h-3 w-3 rounded-full bg-green-400/70" />
              </div>
              <div className="ml-4 flex-1">
                <div className="mx-auto w-64 rounded-md bg-white/5 py-1 text-center text-[10px] text-white/40">
                  panel.commerceos.com
                </div>
              </div>
            </div>

            {/* Dashboard body: sidebar + content */}
            <div className="flex">
              {/* Sidebar */}
              <div className="hidden w-44 shrink-0 border-r border-white/10 p-4 sm:block">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-md bg-gradient-to-br from-violet-500 to-blue-500" />
                  <span className="text-xs font-bold text-white">
                    CommerceOS
                  </span>
                </div>
                <div className="mt-6 space-y-1">
                  {[
                    "Inicio",
                    "Pedidos",
                    "Productos",
                    "Clientes",
                    "Cupones",
                    "Reportes",
                  ].map((item, i) => (
                    <div
                      key={item}
                      className={`rounded-md px-2 py-1.5 text-[11px] ${
                        i === 0
                          ? "bg-violet-500/20 text-violet-200"
                          : "text-white/40"
                      }`}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-white">
                      Resumen general
                    </p>
                    <p className="text-[10px] text-white/40">
                      Hoy, 16 de junio
                    </p>
                  </div>
                  <div className="rounded-md bg-gradient-to-r from-violet-600 to-blue-600 px-3 py-1 text-[10px] font-semibold text-white">
                    + Nuevo producto
                  </div>
                </div>

                {/* Stat cards */}
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    ["Ventas hoy", "$12.480"],
                    ["Pedidos", "64"],
                    ["Visitas", "1.205"],
                  ].map(([label, val]) => (
                    <div
                      key={label}
                      className="rounded-lg border border-white/10 bg-white/[0.02] p-3"
                    >
                      <p className="text-[9px] text-white/40">{label}</p>
                      <p className="mt-1 text-sm font-bold text-white">{val}</p>
                    </div>
                  ))}
                </div>

                {/* Fake table */}
                <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.02] p-3">
                  <p className="text-[10px] font-semibold text-white/60">
                    Últimos pedidos
                  </p>
                  <div className="mt-3 space-y-2">
                    {[
                      ["#1042", "María G.", "$3.200", "Pagado"],
                      ["#1041", "Juan P.", "$1.850", "Enviado"],
                      ["#1040", "Lucía R.", "$5.600", "Pagado"],
                    ].map(([id, name, amount, status]) => (
                      <div
                        key={id}
                        className="flex items-center justify-between text-[10px]"
                      >
                        <span className="text-white/50">{id}</span>
                        <span className="text-white/70">{name}</span>
                        <span className="font-semibold text-white">
                          {amount}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 ${status === "Pagado" ? "bg-emerald-500/15 text-emerald-300" : "bg-blue-500/15 text-blue-300"}`}
                        >
                          {status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating mobile mockup */}
          <div className="absolute -bottom-8 -right-4 hidden w-36 animate-float rounded-2xl border border-white/10 bg-[#0d0d14] p-2 shadow-2xl md:block">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <div className="flex items-center gap-1.5">
                <Smartphone className="h-3 w-3 text-violet-300" />
                <span className="text-[9px] font-bold text-white">
                  Tu tienda
                </span>
              </div>
              <div className="mt-3 space-y-2">
                <div className="h-12 rounded-md bg-gradient-to-br from-violet-500/30 to-blue-500/20" />
                <div className="h-2 w-3/4 rounded bg-white/10" />
                <div className="h-2 w-1/2 rounded bg-white/10" />
                <div className="mt-2 h-5 rounded-md bg-gradient-to-r from-violet-600 to-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Three feature pills below */}
        <div className="mx-auto mt-16 grid max-w-3xl gap-4 sm:grid-cols-3">
          {[
            [
              LayoutDashboard,
              "Panel completo",
              "Todo tu negocio de un vistazo",
            ],
            [Smartphone, "Mobile first", "Tu tienda perfecta en el celular"],
            [ShoppingCart, "Checkout veloz", "Menos pasos, más ventas"],
          ].map(([Icon, title, desc]) => (
            <div
              key={title}
              className="rounded-xl border border-white/10 bg-white/[0.02] p-5 text-center"
            >
              <Icon className="mx-auto h-6 w-6 text-violet-300" />
              <p className="mt-3 text-sm font-bold text-white">{title}</p>
              <p className="mt-1 text-xs text-white/50">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
