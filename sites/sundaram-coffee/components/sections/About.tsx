import type { SectionProps } from "@/lib/business";

export default function About({ business }: SectionProps) {
  const about = business.about;
  if (!about?.heading && !about?.body) return null;

  return (
    <section className="section about" aria-labelledby="about-title">
      <div className="container about-inner">
        <div className="about-copy">
          <p className="eyebrow">Our story</p>
          {about.heading && <h2 id="about-title">{about.heading}</h2>}
          {about.body && <p className="about-body">{about.body}</p>}
        </div>
      </div>
    </section>
  );
}
