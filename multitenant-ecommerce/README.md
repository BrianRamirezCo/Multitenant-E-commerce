# Multitenant E-commerce SaaS (MERN)

Plataforma SaaS donde **vos vendés tiendas**: cada cliente paga un plan y obtiene
su propio e-commerce (tenant) totalmente aislado, con su catálogo, pedidos,
clientes y tema visual.

Stack: **React + Vite + Tailwind + shadcn/ui + Redux Toolkit (RTK Query) + i18n**
en el frontend; **Node + Express + MongoDB (Mongoose) + Pino** en el backend;
**MercadoPago** para pagos. Bilingüe (ES/EN).

---

## Los dos niveles del producto

1. **Plataforma (vos):** landing de marketing, registro de clientes, cobro de
   suscripciones, alta de tiendas. Vive FUERA del contexto de tenant.
2. **Tenant (cada tienda):** storefront del cliente final + panel de admin del
   dueño. Vive DENTRO del contexto de tenant.

El dueño de una tienda es **admin de su tenant** y a la vez **suscriptor** de tu
plataforma.

## Multitenancy: shared DB con `tenantId`

Una sola base de datos; cada documento lleva `tenantId`. Tres pilares:

1. **Modelo `Tenant`** — la única colección sin `tenantId`.
2. **`tenantResolver`** (middleware) — resuelve la tienda por subdominio y abre
   el contexto async del tenant.
3. **`tenantPlugin`** (plugin de Mongoose) — inyecta `tenantId` en TODAS las
   queries automáticamente. Imposible filtrar mal entre tiendas.
   - Excepción: las **agregaciones** de analytics (`aggregate()`) no pasan por el
     plugin, así que el `tenantId` se agrega a mano en cada `$match` (con cuidado).

## Planes y gating

`backend/src/config/plans.js` es la **fuente de verdad** de los planes (Starter /
Growth / Premium): precios, límites y features. Se usa en:

- Backend: `middlewares/planGating.js` (`requireFeature`, `enforceLimit`) y
  validaciones de apariencia/onboarding.
- Frontend: `lib/planClient.js` (espejo) para mostrar/ocultar/bloquear features.

El "multi tienda" (un panel → varias tiendas) quedó FUERA del MVP, como add-on futuro.

## Estructura

```
backend/src/
  config/        db, logger (Pino), plans
  middlewares/   tenantResolver, planGating, errorHandler, requestLogger
  models/        Tenant, User, Product, Order
  modules/
    tenants/     info + apariencia (theme/color/logo) del tenant
    auth/         (a portar desde Lumina)
    products/    CRUD (real)
    orders/      pedidos (real)
    customers/   clientes + stats agregadas (real)
    analytics/   dashboard, summary, sales, low-stock (agregaciones reales)
    payments/    MercadoPago por tenant (checkout de productos)
    onboarding/  signup, check-slug, provisioning, webhook (suscripción SaaS)
  plugins/       tenantPlugin (aislamiento)
  __tests__/     test de aislamiento

frontend/src/
  app/           store + api base (RTK Query con header de tenant)
  components/    ui/ (shadcn), Seo, LanguageToggle
  features/
    landing/     LandingPage + SignupPage + PricingTable (plataforma)
    storefront/  layout, home, ProductCard (tienda del cliente)
    admin/       layout, sidebar, Dashboard, Products, Orders, Customers, Appearance
    products/ orders/ customers/ analytics/ tenant/ onboarding/   (API slices)
    auth/ cart/   slices (access token en memoria, carrito)
  hooks/         useTenantTheme
  i18n/          react-i18next (es/en)
  themes/        metadata de los 3 temas
  lib/           tenant (cliente), planClient, format, utils
```

## Rutas del frontend

- `/` → **landing del SaaS** (plataforma)
- `/signup` → **alta de tienda** (plataforma)
- `/store` → **storefront** del tenant (tienda del cliente)
- `/admin` → **panel de admin** del tenant
  - `/admin/orders`, `/admin/products`, `/admin/customers`, `/admin/appearance`

> En producción: el apex (`yourapp.com`) sirve la landing; cada subdominio
> (`tienda.yourapp.com`) sirve el storefront/admin de ese tenant. En dev no hay
> subdominios: el tenant se resuelve con el header `x-tenant-slug` (ver abajo).

## Cómo arrancar

### Backend

```bash
cd backend
cp .env.example .env      # completá MONGO_URI
npm install
npm run seed              # crea store-a y store-b con productos demo
npm run dev
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

### Probar el aislamiento (dev, sin subdominios)

```bash
curl http://localhost:5000/api/products -H "x-tenant-slug: store-a"
curl http://localhost:5000/api/products -H "x-tenant-slug: store-b"
```

Y el test: `cd backend && npm test` (necesita un Mongo de test).

## Flujo de onboarding (SaaS)

1. Cliente entra a `/` → elige plan en la tabla de precios.
2. `/signup?plan=...` → completa datos, se valida el slug en vivo.
3. `POST /onboarding/signup`:
   - Plan **gratis**: se provisiona la tienda al instante (tenant + admin).
   - Plan **pago**: se crea la suscripción de MercadoPago y se difiere el alta al
     webhook (la integración real de MP está marcada como stub en el código).
4. `POST /onboarding/webhook` ← MercadoPago confirma el pago → provisioning.

## MercadoPago

Dos integraciones implementadas:

1. **Pago de pedidos (Checkout Pro)** — `modules/payments`. Al confirmar el
   checkout, se crea una preferencia y se redirige al comprador a MercadoPago.
   El webhook (`POST /api/payments/webhook`, público) confirma el pago y pasa el
   pedido a `paid`. El token se resuelve por tienda con fallback al token de
   prueba global (`MP_TEST_ACCESS_TOKEN`).

2. **Suscripciones (Preapproval)** — `modules/onboarding`. Al elegir un plan
   pago, se crea una suscripción recurrente y se guarda un `PendingSignup`. El
   webhook (`POST /api/onboarding/webhook`) provisiona la tienda cuando la
   suscripción queda `authorized`. Usa `MP_PLATFORM_TOKEN`.

### Probar en sandbox

1. Creá una app en MercadoPago Developers y copiá el **Access Token de prueba**
   (`TEST-...`).
2. Ponelo en el `.env` del backend en `MP_TEST_ACCESS_TOKEN` y `MP_PLATFORM_TOKEN`.
3. Usá las **tarjetas de prueba** de MercadoPago para simular pagos.
4. Para que el webhook llegue a tu localhost, exponé el backend con una
   herramienta de túnel (ej. un servicio que dé una URL pública) y poné esa URL
   en `API_URL`.

## i18n

`react-i18next` con ES (default) / EN y toggle persistente. Migradas: storefront,
dashboard, productos, pedidos, clientes, apariencia, landing, signup. El contenido
de cada tienda (nombres de productos) lo escribe el dueño; i18n es solo para la UI.

## Pendientes anotados

- Portar el auth real de Lumina (httpOnly refresh + access token en memoria) y
  reemplazar el hash placeholder del onboarding por bcrypt.
- Code-splitting para separar el bundle del admin del storefront (warning de
  tamaño por Recharts).
- Secciones restantes del panel: categorías, inventario, cupones, devoluciones,
  valoraciones, marketing, envíos, usuarios.
- Página de producto individual + carrito + checkout del storefront.
