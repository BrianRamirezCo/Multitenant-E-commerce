import { Outlet } from "react-router-dom";
import StorefrontHeader from "./StorefrontHeader";
import StorefrontFooter from "./StorefrontFooter";
import CartSync from "../../cart/CartSync";
import AnnouncementBar from "./AnnouncementBar";

/**
 * Storefront layout shell: announcement bar + themed header + routed page
 * content + footer. Used as the parent route for all storefront pages.
 */
export default function StorefrontLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <CartSync />
      <AnnouncementBar />
      <StorefrontHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <StorefrontFooter />
    </div>
  );
}
