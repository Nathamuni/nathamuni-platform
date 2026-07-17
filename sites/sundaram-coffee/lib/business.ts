import data from "@/content/business.json";

/**
 * TypeScript mirror of the content/business.json schema described in
 * docs/SITE-TEMPLATE-ARCHITECTURE.md §2. Every field except `name` is
 * optional — sections render only when their data slice exists.
 */

export interface Variant {
  label: string;
  price: string;
}

export interface Product {
  name: string;
  description?: string;
  variants?: Variant[];
}

export interface Category {
  name: string;
  intro?: string;
  products?: Product[];
}

export interface AboutContent {
  heading?: string;
  body?: string;
}

export interface Contact {
  phone?: string;
  phoneNote?: string;
  email?: string;
  emailNote?: string;
  whatsapp?: string;
  address?: string;
  mapUrl?: string;
  hours?: string;
}

export interface WhyUsPoint {
  title: string;
  detail?: string;
}

export interface GalleryItem {
  src: string;
  alt: string;
}

export interface Testimonial {
  quote: string;
  author?: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface Social {
  instagram?: string;
  youtube?: string;
  facebook?: string;
  [network: string]: string | undefined;
}

export interface Business {
  name: string;
  tagline?: string;
  description?: string;
  domain?: string;
  themeHue?: number;
  features?: string[];
  about?: AboutContent;
  contact?: Contact;
  whyUs?: WhyUsPoint[];
  categories?: Category[];
  gallery?: GalleryItem[];
  testimonials?: Testimonial[];
  faq?: FaqItem[];
  social?: Social;
  notes?: string[];
}

/** Props contract shared by every section component. */
export interface SectionProps {
  business: Business;
}

/** Typed accessor for the single source of truth. */
export function getBusiness(): Business {
  return data as Business;
}

/** Site origin used for canonical URLs, OpenGraph and JSON-LD. */
export function getSiteUrl(business: Business): string {
  return `https://${business.domain ?? "example.nathamuni.com"}`;
}

/** "+91 00000 00000" -> "+910000000000" for tel: links. */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^+\d]/g, "")}`;
}
