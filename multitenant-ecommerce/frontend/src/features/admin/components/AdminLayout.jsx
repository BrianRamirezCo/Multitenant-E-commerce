import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Bell, Search } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import LanguageToggle from '../../../components/LanguageToggle';

/**
 * Admin panel layout: fixed sidebar + top bar + routed content.
 * The admin panel always uses the 'minimal' theme tokens for a neutral,
 * professional look regardless of the tenant's storefront theme.
 */
export default function AdminLayout() {
  const tenant = useSelector((s) => s.tenant.info);

  return (
    <div data-theme="minimal" className="flex h-screen overflow-hidden bg-secondary/30">
      {/* Sidebar */}
      <div className="hidden md:block shrink-0">
        <AdminSidebar />
      </div>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border bg-background px-6">
          <div className="relative hidden w-full max-w-md sm:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar pedidos, productos, clientes..." className="pl-9" />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <LanguageToggle />
            <Button variant="ghost" size="icon" aria-label="Notificaciones">
              <Bell className="h-5 w-5" />
            </Button>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight">{tenant?.name || 'Mi Tienda'}</p>
              <p className="text-xs text-muted-foreground capitalize">{tenant?.plan || 'starter'}</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
