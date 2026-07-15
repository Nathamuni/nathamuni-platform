# Project Soul

**Project:** Nathamuni Digital Presence Platform
**Repo:** https://github.com/Nathamuni/nathamuni-platform.git
**Stack:** Next.js / React (TypeScript), Cloudflare Pages, Cloudflare DNS
**Owner:** nathamuni@cness.co

## Vision

A multi-tenant digital presence platform that generates and hosts professional business websites for small businesses, local shops, freelancers, and service providers — under the `nathamuni.com` domain umbrella.

Each business gets a subdomain: `<business-name>.nathamuni.com`

## North Star

Enable any small business to have a professional online presence with minimal cost and zero technical complexity on their side. The platform handles infrastructure; the business provides content.

## Platform Model

- This repo is a **monorepo**. All business sites live under `sites/`.
- Each site is a Next.js app deployed independently on Cloudflare Pages.
- Shared UI components and utilities live in `packages/`.
- Business information drives content — no hard-coded data in components.

## Current Phase

**Platform Foundation**

Goals for this phase:
- Establish monorepo structure with `sites/` convention
- Build first demonstration site: Sundaram Coffee Works (`sites/sundaram-coffee/`)
- Validate Cloudflare Pages subdomain deployment
- Establish design system and reusable component patterns
- Prepare template for rapid new-business onboarding

## Business Sites

| Site | Domain | Status |
|---|---|---|
| sundaram-coffee | sundaram-coffee.nathamuni.com | In progress |

## Long-Term Direction

- Multi-tenant admin dashboard at `admin.nathamuni.com`
- Business self-service: update products, photos, contact info
- Site generation from structured business data (JSON / CMS)
- Potential SaaS offering for other platform operators
