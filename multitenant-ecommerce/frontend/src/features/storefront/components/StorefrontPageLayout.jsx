import { useSelector } from "react-redux";

/**
 * Simple content-page layout for storefront info pages (Shipping, Returns,
 * Contact, About, Terms, Privacy, Cookies). Renders inside the StorefrontLayout
 * (so it already has the tenant header + footer). Just a titled prose container.
 *
 * `title` shows as the page heading; `children` is the body.
 */
export default function StorefrontPageLayout({ title, children }) {
  return (
    <div className="container max-w-3xl py-12">
      <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
        {title}
      </h1>
      <div className="mt-6 space-y-5 text-sm leading-relaxed text-foreground/90">
        {children}
      </div>
    </div>
  );
}

/** A titled section inside a storefront content page. */
export function StorefrontSection({ heading, children }) {
  return (
    <section>
      {heading && (
        <h2 className="font-display text-lg font-bold text-foreground">
          {heading}
        </h2>
      )}
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  );
}
/**
 * Renders the tenant's custom copy for an info page when set, otherwise the
 * generic default passed as children. Plain text: blank lines separate
 * paragraphs, so store owners don't need to know any markup.
 */
export function StorefrontCustomContent({ content, children }) {
  if (!content || !content.trim()) return children;

  const paragraphs = content.split(/\n{2,}/);
  return (
    <>
      {paragraphs.map((para, i) => (
        <p key={i} className="whitespace-pre-line">
          {para}
        </p>
      ))}
    </>
  );
}
