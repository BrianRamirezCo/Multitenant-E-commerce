import { Link } from "react-router-dom";
import { Instagram, Linkedin, Globe } from "lucide-react";
import Logo from "../../../components/Logo";

/**
 * Premium dark footer with link columns + legal + social icons.
 * Links point to the existing legal/contact pages.
 */
export default function PremiumFooter() {
  const year = new Date().getFullYear();

  const columns = [
    {
      title: "Producto",
      links: [
        { label: "Funcionalidades", to: "#features" },
        { label: "Precios", to: "#pricing" },
      ],
    },
    {
      title: "Empresa",
      links: [{ label: "Contacto", to: "/contact" }],
    },
    {
      title: "Legal",
      links: [
        { label: "Términos", to: "/terms" },
        { label: "Privacidad", to: "/privacy" },
        { label: "Cookies", to: "/cookies" },
      ],
    },
  ];

  return (
    <footer className="border-t border-white/10 bg-[#0A0A0A]">
      <div className="container grid grid-cols-2 gap-8 py-14 md:grid-cols-5">
        {/* Brand */}
        <div className="col-span-2">
          <Logo className="h-20 w-auto" />
          <p className="mt-3 max-w-xs text-sm text-white/40">
            La plataforma para crear y hacer crecer tu tienda online.
          </p>
          <div className="mt-5 flex gap-3">
            {[Instagram, Linkedin, Globe].map((Icon, i) => (
              <span
                key={i}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/50 transition-colors hover:border-violet-500/30 hover:text-white"
              >
                <Icon className="h-4 w-4" />
              </span>
            ))}
          </div>
        </div>

        {/* Link columns */}
        {columns.map((col) => (
          <div key={col.title}>
            <p className="mb-3 text-sm font-semibold text-white">{col.title}</p>
            <ul className="space-y-2">
              {col.links.map((link) => (
                <li key={link.to + link.label}>
                  {link.to.startsWith("#") ? (
                    <a
                      href={link.to}
                      className="text-sm text-white/50 transition-colors hover:text-white"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      to={link.to}
                      className="text-sm text-white/50 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="container py-6 text-center text-xs text-white/30">
          © {year} CONST. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
