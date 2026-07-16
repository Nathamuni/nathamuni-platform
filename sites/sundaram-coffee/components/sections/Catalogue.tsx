import type { Category, Product, SectionProps } from "@/lib/business";
import CoffeeCup from "@/components/art/CoffeeCup";
import PickleJar from "@/components/art/PickleJar";
import AppalamStack from "@/components/art/AppalamStack";

/**
 * Data-driven layout choice (no business-specific code):
 * - a category whose products carry descriptions or multiple variants gets
 *   rich feature cards with a variant/price list;
 * - otherwise it gets a compact, scannable price grid where the variant
 *   label is rendered as pack-size chips.
 */
function isFeatureCategory(category: Category): boolean {
  return (category.products ?? []).some(
    (p) => Boolean(p.description) || (p.variants?.length ?? 0) > 1
  );
}

const categoryArt = [CoffeeCup, PickleJar, AppalamStack];

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function FeatureCard({ product }: { product: Product }) {
  return (
    <article className="feature-card">
      <h4>{product.name}</h4>
      {product.description && <p className="feature-desc">{product.description}</p>}
      {product.variants && product.variants.length > 0 && (
        <ul className="variant-list">
          {product.variants.map((v) => (
            <li key={v.label} className="variant-row">
              <span className="variant-label">{v.label}</span>
              <span className="variant-dots" aria-hidden="true" />
              <span className="variant-price">{v.price}</span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

function CompactCard({ product }: { product: Product }) {
  const variant = product.variants?.[0];
  return (
    <article className="compact-card">
      <h4>{product.name}</h4>
      {variant && (
        <>
          <ul className="chip-row" aria-label="Pack sizes">
            {variant.label.split(/\s*\/\s*/).map((part) => (
              <li key={part} className="chip">
                {part}
              </li>
            ))}
          </ul>
          <p className="compact-price">{variant.price}</p>
        </>
      )}
    </article>
  );
}

export default function Catalogue({ business }: SectionProps) {
  const categories = (business.categories ?? []).filter(
    (c) => (c.products?.length ?? 0) > 0
  );
  if (categories.length === 0) return null;

  return (
    <section className="section catalogue" id="catalogue" aria-labelledby="catalogue-title">
      <div className="container">
        <p className="eyebrow">Products &amp; prices</p>
        <h2 id="catalogue-title">Everything we make</h2>

        {categories.map((category, i) => {
          const Art = categoryArt[i % categoryArt.length];
          const feature = isFeatureCategory(category);
          const headingId = `cat-${slugify(category.name)}`;
          return (
            <div className="category" key={category.name} aria-labelledby={headingId}>
              <header className="category-head">
                <div className="category-head-copy">
                  <h3 id={headingId}>{category.name}</h3>
                  {category.intro && <p className="category-intro">{category.intro}</p>}
                </div>
                <Art className="category-art" />
              </header>

              <div className={feature ? "feature-grid" : "compact-grid"}>
                {(category.products ?? []).map((product) =>
                  feature ? (
                    <FeatureCard key={product.name} product={product} />
                  ) : (
                    <CompactCard key={product.name} product={product} />
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
