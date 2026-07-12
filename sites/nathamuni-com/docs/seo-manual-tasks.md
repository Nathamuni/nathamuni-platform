# SEO — Your Manual Tasks (crisp)

Everything code-side is done. These need **you** (accounts/logins). ~25 min total, in order:

## Do once (this week)

- [ ] **1. Google Search Console** (5 min) — https://search.google.com/search-console
      Add **Domain property** `nathamuni.com` → verify via **DNS TXT** (Cloudflare → DNS → paste the TXT record Google shows).
- [ ] **2. Submit sitemap** (1 min) — GSC → Sitemaps → add `https://nathamuni.com/sitemap.xml`
- [ ] **3. Request indexing** (2 min) — GSC → URL Inspection → `https://nathamuni.com/` → **Request indexing**. Repeat for `/about`.
- [ ] **4. Bing Webmaster Tools** (3 min) — https://www.bing.com/webmasters → **Import from Google Search Console**. (Covers DuckDuckGo + AI search too.)
- [ ] **5. Instagram bio link** (2 min) — put `https://nathamuni.com` in the @nathamuni_ bio. Google matches this against the site's Person schema.
- [ ] **6. YouTube channel link** (2 min) — @LogicAndLaunch → Customization → Links → add `https://nathamuni.com`.
- [ ] **7. Rich Results Test** (3 min) — https://search.google.com/test/rich-results → test `https://nathamuni.com/` after the PR deploys; confirm WebSite + Person detected.

## Do whenever you touch those profiles (compounding)

- [ ] GitHub profile → website field → `https://nathamuni.com`
- [ ] LinkedIn / dev.to / any book listing → link the site
- [ ] Every new backlink from a real site strengthens "Nathamuni = nathamuni.com"

## Check monthly

- [ ] GSC → **Performance** → query "nathamuni": watch impressions + average position.
      Expect movement 1–4 weeks after step 1–3.

## Reality check

The 10th-century acharya's Wikipedia page also ranks for "Nathamuni". You'll own the
site-name display and navigational results fast; outranking Wikipedia on the bare query
needs the backlink steps above plus time. No code change can shortcut that.
