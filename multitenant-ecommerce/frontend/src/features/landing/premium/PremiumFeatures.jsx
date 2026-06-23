import {
  Store,
  Package,
  Boxes,
  ShoppingCart,
  Users,
  Megaphone,
  Ticket,
  BarChart3,
  FileText,
  Plug,
  Globe,
  CreditCard,
} from "lucide-react";

/**
 * Features grid: large dark cards with icons. Each card has a subtle glow on
 * hover. 12 features in a responsive grid.
 */
export default function PremiumFeatures() {
  const features = [
    {
      icon: Store,
      title: "Multi tienda",
      desc: "Gestioná varias tiendas desde un solo lugar.",
    },
    {
      icon: Package,
      title: "Productos",
      desc: "Catálogo completo con variantes e imágenes.",
    },
    {
      icon: Boxes,
      title: "Stock",
      desc: "Control de inventario en tiempo real.",
    },
    {
      icon: ShoppingCart,
      title: "Pedidos",
      desc: "Seguí cada pedido de principio a fin.",
    },
    {
      icon: Users,
      title: "Clientes",
      desc: "Base de clientes con historial de compras.",
    },
    {
      icon: Megaphone,
      title: "Marketing",
      desc: "Herramientas para impulsar tus ventas.",
    },
    {
      icon: Ticket,
      title: "Cupones",
      desc: "Descuentos y promociones configurables.",
    },
    {
      icon: BarChart3,
      title: "Analíticas",
      desc: "Métricas claras sobre tu negocio.",
    },
    {
      icon: FileText,
      title: "Reportes",
      desc: "Informes de ventas y rendimiento.",
    },
    {
      icon: Plug,
      title: "Integraciones",
      desc: "Conectá las herramientas que ya usás.",
    },
    {
      icon: Globe,
      title: "Dominios propios",
      desc: "Tu marca con tu propio dominio.",
    },
    {
      icon: CreditCard,
      title: "Checkout optimizado",
      desc: "Pagos rápidos con MercadoPago.",
    },
  ];

  return (
    <section id="features" className="relative py-24">
      {/* subtle glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/4 h-[400px] w-[600px] -translate-x-1/2 opacity-20"
        style={{
          background:
            "radial-gradient(50% 50% at 50% 50%, rgba(37,99,235,0.4), transparent 70%)",
        }}
      />

      <div className="container relative">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/70">
            Funcionalidades
          </span>
          <h2 className="mt-5 font-display text-3xl font-bold tracking-tight text-white md:text-5xl">
            Todo lo que necesitás para vender online
          </h2>
          <p className="mt-4 text-white/50">
            Una plataforma completa para crear, administrar y hacer crecer tu
            negocio digital.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-all duration-300 hover:border-violet-500/30 hover:bg-white/[0.04]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-violet-500/20 to-blue-500/10 text-violet-300 transition-transform duration-300 group-hover:scale-110">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-display text-lg font-bold text-white">
                {f.title}
              </h3>
              <p className="mt-2 text-sm text-white/50">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
