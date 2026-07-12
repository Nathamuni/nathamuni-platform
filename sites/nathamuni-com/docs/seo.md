# SEO Runbook — nathamuni.com

Goal: when someone searches **"Nathamuni"**, nathamuni.com appears at the top.

## What the site already does (code, automatic)

- Titles/descriptions on every page, canonical URLs, Open Graph + Twitter cards
- `robots.txt` + full `sitemap.xml` (all static pages, blog posts, videos)
- Structured data: `WebSite` (site name "Nathamuni") + `Person` schema in the root
  layout, `ProfilePage` on /about, `Article` on blog posts, video schema on video pages
- H1 "Nathamuni" on the homepage; static export = fast, crawlable HTML

## Owner actions (one-time, ~20 minutes)

1. **Google Search Console** — https://search.google.com/search-console
   - Add a **Domain property** for `nathamuni.com`; verify via **DNS TXT record**
     (Cloudflare dashboard → DNS → add the TXT Google gives you). DNS verification
     covers all subdomains (sundaram-coffee etc.) in one shot.
   - Alternative: URL-prefix property + meta tag — set
     `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=<token>` in the Workers Build env and redeploy.
2. **Submit the sitemap** — GSC → Sitemaps → `https://nathamuni.com/sitemap.xml`
3. **Request indexing** — GSC → URL Inspection → `https://nathamuni.com/` → Request indexing.
4. **Bing Webmaster Tools** — https://www.bing.com/webmasters → "Import from GSC"
   (also powers DuckDuckGo/ChatGPT search). Or set `NEXT_PUBLIC_BING_SITE_VERIFICATION`.
5. **Reciprocal links (important for entity trust)** — put `https://nathamuni.com` in:
   - Instagram bio (@nathamuni_)
   - YouTube channel "Links" section (@LogicAndLaunch)
   These match the `sameAs` in the Person schema; Google uses the two-way link to
   connect the profiles to the site.

## Ongoing

- GSC → Performance: watch impressions/position for the query "nathamuni"; expect
  movement in 1–4 weeks after verification.
- Any new backlink helps: GitHub profile website field, dev.to/LinkedIn bios,
  book listing pages, guest posts.

## Honest expectations

"Nathamuni" is also the 10th-century Sri Vaishnava acharya (strong Wikipedia page).
The site should quickly own the **navigational** result (people looking for you /
nathamuni.com) and the branded site-name display. Outranking Wikipedia for the bare
ambiguous query takes sustained backlinks and search demand for *you*; the steps
above are the full white-hat playbook for getting there.
