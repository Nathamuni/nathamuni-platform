import type { SectionProps } from "@/lib/business";
import { telHref } from "@/lib/business";

export default function ContactCta({ business }: SectionProps) {
  const contact = business.contact;
  if (!contact?.phone && !contact?.email) return null;

  return (
    <section className="section contact-cta" aria-labelledby="contact-title">
      <div className="container contact-inner">
        <h2 id="contact-title">No online payments. Tell us what you need.</h2>
        <p className="contact-sub">
          Pick what you need, then reach us — we will pack your order and take
          it from there.
        </p>
        <div className="contact-actions">
          {contact.phone && (
            <a
              className="btn btn-cream"
              href={telHref(contact.phone)}
              aria-label={`Call ${business.name} at ${contact.phone}`}
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M5 4h4l2 5-2.5 1.5a12 12 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
              </svg>
              {contact.phone}
            </a>
          )}
          {contact.email && (
            <a
              className="btn btn-cream"
              href={`mailto:${contact.email}`}
              aria-label={`Email ${business.name} at ${contact.email}`}
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
              </svg>
              {contact.email}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
