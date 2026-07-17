import type { ComponentType } from "react";
import type { SectionProps } from "@/lib/business";
import { getBusiness } from "@/lib/business";
import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import Catalogue from "@/components/sections/Catalogue";
import WhyUs from "@/components/sections/WhyUs";
import Notes from "@/components/sections/Notes";
import ContactCta from "@/components/sections/ContactCta";
import Footer from "@/components/sections/Footer";

/**
 * Section registry (architecture §4): an ordered map of feature-name →
 * component. A module renders only when it is listed in business.json
 * `features` AND its data slice exists (every section is null-safe and
 * returns null on missing data). Adding a platform capability = one entry
 * here; enabling it for a business = one string in its JSON.
 */
const registry: Record<string, ComponentType<SectionProps>> = {
  hero: Hero,
  about: About,
  catalogue: Catalogue,
  "why-us": WhyUs,
  notes: Notes,
  "contact-cta": ContactCta,
};

export default function Page() {
  const business = getBusiness();
  const features = business.features ?? [];

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <main id="main">
        {features.map((feature) => {
          const Section = registry[feature];
          if (!Section) return null;
          return <Section key={feature} business={business} />;
        })}
      </main>
      {/* Footer is always on — platform branding (architecture §4). */}
      <Footer business={business} />
    </>
  );
}
