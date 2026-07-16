import type { SectionProps } from "@/lib/business";
import { telHref } from "@/lib/business";
import CoffeeCup from "@/components/art/CoffeeCup";
import BeansPattern from "@/components/art/BeansPattern";

export default function Hero({ business }: SectionProps) {
  const { name, tagline, contact } = business;
  if (!name) return null;

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="container hero-inner">
        <div className="hero-copy">
          <h1 id="hero-title">{name}</h1>
          {tagline && <p className="hero-tagline">{tagline}</p>}
          <div className="hero-actions">
            <a className="btn btn-primary" href="#catalogue">
              Browse products
            </a>
            {contact?.phone && (
              <a className="btn btn-outline" href={telHref(contact.phone)}>
                Call us
              </a>
            )}
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <CoffeeCup className="hero-cup" />
        </div>
      </div>
      <BeansPattern className="hero-beans" />
    </section>
  );
}
