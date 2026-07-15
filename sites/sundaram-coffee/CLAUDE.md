# CLAUDE.md — Sundaram Coffee Works

## Business

- **Name:** Sundaram Coffee Works
- **Domain:** sundaram-coffee.nathamuni.com
- **Category:** Coffee shop / beverage retail
- **Cloudflare Pages project:** sundaram-coffee
- **Platform:** Nathamuni Digital Presence Platform

## Site Commands

Run from this directory (`sites/sundaram-coffee/`):

```bash
npm run dev      # localhost:3000
npm run build    # production build
npm run lint
npm run type-check
```

## Content & Assets

- **Raw assets source:** `/home/nathamuni/ Projects/Sundaram-coffee-works/`
- **Processed photos:** `public/images/` (committed to repo)
- **Business copy / menu text:** `content/` (to be set up)

## Business-Specific Rules

- Do not hard-code prices — they belong in `content/menu.json` or a CMS
- WhatsApp integration is a required feature for this business
- Contact details go in `memory/business.md`, not in component source files
- Mobile-first design is mandatory — most customers use phones

## Deployment

- Cloudflare Pages build root: `sites/sundaram-coffee/`
- Build command: `npm run build`
- Output directory: `.next` (or `out` for static export)
- Subdomain DNS: managed in Cloudflare dashboard under `nathamuni.com`
