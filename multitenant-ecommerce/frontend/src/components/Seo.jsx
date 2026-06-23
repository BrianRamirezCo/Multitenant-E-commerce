import { Helmet } from 'react-helmet-async';
import { useSelector } from 'react-redux';

/**
 * Per-page SEO component. This is the MVP replacement for Next.js SSR.
 *
 * It sets dynamic meta tags PER TENANT and PER PAGE:
 *  - title includes the current store name
 *  - description, Open Graph, and product JSON-LD when provided
 *
 * It is NOT as powerful as server-side rendering (crawlers that don't execute
 * JS see less), but it is enough to rank for an MVP. If a single store later
 * needs heavy SEO, that storefront can migrate to Next.js while keeping this
 * same backend API.
 */
export default function Seo({ title, description, image, product }) {
  const tenant = useSelector((s) => s.tenant.info);
  const storeName = tenant?.name || 'Store';
  const fullTitle = title ? `${title} | ${storeName}` : storeName;

  // Structured data for a product (helps rich results).
  const jsonLd = product
    ? {
        '@context': 'https://schema.org/',
        '@type': 'Product',
        name: product.name,
        description: product.description,
        image: product.images,
        offers: {
          '@type': 'Offer',
          priceCurrency: product.currency || 'ARS',
          price: (product.price / 100).toFixed(2),
          availability:
            product.stock > 0
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
        },
      }
    : null;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      {image && <meta property="og:image" content={image} />}
      <meta property="og:type" content={product ? 'product' : 'website'} />

      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  );
}
