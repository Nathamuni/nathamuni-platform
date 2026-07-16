import type { SectionProps } from "@/lib/business";
import { whyUsGlyphs } from "@/components/art/Glyphs";

export default function WhyUs({ business }: SectionProps) {
  const points = business.whyUs ?? [];
  if (points.length === 0) return null;

  return (
    <section className="section why-us" aria-labelledby="why-us-title">
      <div className="container">
        <p className="eyebrow">Our promise</p>
        <h2 id="why-us-title">Why choose us</h2>
        <ul className="why-grid">
          {points.map((point, i) => {
            const Glyph = whyUsGlyphs[i % whyUsGlyphs.length];
            return (
              <li className="why-card" key={point.title}>
                <span className="why-glyph">
                  <Glyph />
                </span>
                <h3>{point.title}</h3>
                {point.detail && <p>{point.detail}</p>}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
