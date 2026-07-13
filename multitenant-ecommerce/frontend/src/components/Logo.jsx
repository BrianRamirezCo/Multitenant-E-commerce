/**
 * Logo de la plataforma (CONST). Única fuente de verdad para la marca en el
 * landing, las páginas de auth y el footer.
 *
 * Lee la URL desde VITE_PLATFORM_LOGO_URL (frontend/.env). Si no está seteada,
 * cae al wordmark de texto viejo, así nunca se rompe nada.
 *
 * Todos los usos están sobre fondo oscuro, así que el PNG tiene que ser
 * claro/blanco sobre fondo transparente.
 */
const LOGO_URL = import.meta.env.VITE_PLATFORM_LOGO_URL;

export default function Logo({ className = "h-8 w-auto" }) {
  if (LOGO_URL) {
    return <img src={LOGO_URL} alt="CONST" className={className} />;
  }

  // Fallback de texto (solo si VITE_PLATFORM_LOGO_URL está vacío).
  return (
    <span className="font-display text-xl font-bold text-white">
      Commerce
      <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
        OS
      </span>
    </span>
  );
}
