/**
 * Resolves the current tenant slug on the client side.
 *
 * In production this comes from the subdomain (store-a.yourapp.com -> "store-a").
 * In local development there are no subdomains, so we fall back to a value in
 * localStorage or an env default, and send it to the API via the x-tenant-slug
 * header (see ./apiClient).
 */
const ROOT_DOMAIN = import.meta.env.VITE_ROOT_DOMAIN || 'yourapp.com';

export function resolveTenantSlug() {
  const host = window.location.hostname;

  // Production: extract subdomain.
  if (host.endsWith(ROOT_DOMAIN) && host !== ROOT_DOMAIN) {
    const sub = host.slice(0, host.length - ROOT_DOMAIN.length).replace(/\.$/, '');
    if (sub && sub !== 'www') return sub.split('.')[0];
  }

  // Development fallback.
  return (
    localStorage.getItem('dev_tenant_slug') ||
    import.meta.env.VITE_DEV_TENANT_SLUG ||
    'store-a'
  );
}
