import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Logo from "../../../components/Logo";

/**
 * Sticky premium navbar (dark, blur on scroll). Links are anchors to sections.
 * CTA goes to /signup. Self-contained dark styling (not theme-dependent).
 */
export default function PremiumNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: "Plataforma", to: "#features" },
    { label: "Soluciones", to: "#showcase" },
    { label: "Precios", to: "#pricing" },
    { label: "Clientes", to: "#testimonials" },
  ];

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "border-b border-white/10 bg-[#0A0A0A]/80 backdrop-blur-xl"
          : "border-b border-transparent"
      }`}
    >
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center">
          <Logo className="h-20 w-auto" />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.to}
              href={l.to}
              className="text-sm font-medium text-white/60 transition-colors hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/admin"
            className="text-sm font-medium text-white/70 transition-colors hover:text-white"
          >
            Iniciar sesión
          </Link>
          <Link
            to="/signup"
            className="rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition-all hover:shadow-violet-600/40"
          >
            Crear mi tienda
          </Link>
        </div>

        <button
          className="text-white md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-white/10 bg-[#0A0A0A]/95 backdrop-blur-xl md:hidden">
          <nav className="container flex flex-col py-4">
            {links.map((l) => (
              <a
                key={l.to}
                href={l.to}
                onClick={() => setOpen(false)}
                className="py-3 text-sm font-medium text-white/70"
              >
                {l.label}
              </a>
            ))}
            <Link
              to="/signup"
              className="mt-2 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white"
            >
              Crear mi tienda
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
