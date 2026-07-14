import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Scrolls to the top on every route change.
 *
 * React Router keeps the scroll position when navigating (it's a SPA — the page
 * never actually reloads), so clicking a footer link would leave you looking at
 * the bottom of the new page. This resets it.
 *
 * Hash links (#productos) are skipped so anchor navigation still works.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // Let the browser handle in-page anchors (e.g. /store#productos).
    if (hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, hash]);

  return null;
}
