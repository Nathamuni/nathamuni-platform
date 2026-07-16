import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { getBusiness, getSiteUrl } from "@/lib/business";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const business = getBusiness();
const siteUrl = getSiteUrl(business);
const title = business.tagline
  ? `${business.name} — ${business.tagline}`
  : business.name;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description: business.description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title,
    description: business.description,
    url: siteUrl,
    siteName: business.name,
    type: "website",
    locale: "en_IN",
  },
};

/**
 * The whole palette derives from a single themeHue in business.json —
 * change the hue and the site re-skins with zero component edits.
 */
function themeCss(hue: number): string {
  return `:root{
  --hue:${hue};
  --ink:hsl(${hue} 42% 14%);
  --ink-soft:hsl(${hue} 22% 32%);
  --brand:hsl(${hue} 58% 33%);
  --brand-deep:hsl(${hue} 50% 19%);
  --brand-soft:hsl(${hue} 55% 90%);
  --accent:hsl(${hue} 70% 45%);
  --surface:hsl(${hue + 8} 56% 96%);
  --surface-raised:hsl(${hue + 8} 64% 99%);
  --surface-warm:hsl(${hue} 52% 92%);
  --line:hsl(${hue} 30% 84%);
  --cream:hsl(${hue + 10} 60% 97%);
}`;
}

function jsonLd() {
  const { name, description, contact } = business;
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name,
    ...(description && { description }),
    url: siteUrl,
    ...(contact?.phone && { telephone: contact.phone }),
    ...(contact?.email && { email: contact.email }),
    ...(contact?.address && { address: contact.address }),
  });
}

export const viewport: Viewport = {
  themeColor: `hsl(${(business.themeHue ?? 28) + 8} 56% 96%)`,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body>
        <style dangerouslySetInnerHTML={{ __html: themeCss(business.themeHue ?? 28) }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd() }}
        />
        {children}
      </body>
    </html>
  );
}
