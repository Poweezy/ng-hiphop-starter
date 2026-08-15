# SEO & Discoverability Review: NG Hip-Hop Platform

**Date:** 2026-08-15  
**Foundation Score: 3/15 (20%)**  
**Target (30-day): 12/15 (80%)**

---

## Critical Gaps — P0 (Fix Immediately)

### 1.1 No robots.txt
**File**: `public/robots.txt` — **MISSING**  
**Severity**: Critical

No robots.txt exists. Search engines/AI crawlers get 404.

**Fix**: Add `public/robots.txt`:
```text
User-agent: *
Allow: /
Disallow: /admin/
Disrupt: /api/

Sitemap: https://ng-hiphop.com/sitemap.xml

User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /
```

### 1.2 No sitemap.xml
**File**: `app/sitemap.ts` — **MISSING**  
**Severity**: Critical

Next.js 15 supports `app/sitemap.ts` but it doesn't exist. Library page and legal pages may never be indexed.

**Fix**: Create `app/sitemap.ts` with static + dynamic URLs.

### 1.3 No Structured Data / Schema.org
**Files**: All pages — **NO JSON-LD**  
**Severity**: Critical

Rich content (music, quotes, graffiti) not declared to search engines. No Organization, MusicRecording, or WebSite schema.

**Fix**: Add JSON-LD to `app/layout.tsx` for Organization + WebSite; page-level schema in library/legal pages.

### 1.4 SplashScreen Blocks LCP by 2200ms
**File**: `components/SplashScreen.tsx`  
**Severity**: Critical (Core Web Vitals)

2200ms delay (300ms with reduced motion), sets `body.overflow = hidden`. Destroys LCP + FID.

**Fix**: Reduce to ≤600ms; use `requestIdleCallback` or `load` event; don't block scroll; make dismissible.

---

## High Gaps — P1 (Fix This Week)

### 2.1 No llms.txt (AEO Discovery)
**File**: `/llms.txt` — **MISSING**  
**Severity**: High (AEO prerequisite)

AI citation engines look for `/llms.txt`. Site is invisible to AI discovery.

**Fix**: Create `public/llms.txt` with site structure + key pages.

### 2.2 Homepage Lacks Explicit Metadata Export
**File**: `app/page.tsx`  
**Severity**: High

Homepage inherits generic layout metadata; no page-specific OG description.

**Fix**: Add explicit `metadata` export to `app/page.tsx`.

### 2.3 Missing OG/Twitter Image Assets
**Files**: `public/og-image.jpg`, `public/twitter-image.jpg` — **Referenced but unverified**  
**Severity**: High

`app/layout.tsx` references `/og-image.jpg` and `/twitter-image.jpg`. Broken social previews if missing.

**Fix**: Verify files exist in `public/`; if missing, generate 1280x630 (OG) and 1200x600 (Twitter).

### 2.4 Admin Login Page Has No Metadata / Noindex
**File**: `app/admin/login/page.tsx`  
**Severity**: High

Admin login page has no metadata. Should set `robots: { index: false, follow: false }`.

**Fix**: Add `noindex` to admin route metadata.

### 2.5 Content is JS-Rendered, Not Crawlable HTML
**Files**: MusicLibrary, CommunityQuote, GraffitiShowcase, LyricGame  
**Severity**: High

Content rendered client-side via `"use client"` components fetching from `/api/*` after hydration. Non-JS crawlers see empty containers.

**Fix**: Ensure SSR data flow is consistent. Add dynamic routes (`/songs/[id]`, `/quotes/[id]`) with server-rendered metadata.

### 2.6 No Canonical URLs
**Files**: All pages  
**Severity**: Medium-High

No `<link rel="canonical">` — duplicate content dilution risk.

**Fix**: Add `alternates.canonical` to root layout metadata.

---

## Medium Gaps — P2 (Fix This Month)

### 3.1 No hreflang
**Severity**: Medium

No `hreflang` declaration for future localization.

**Fix**: Add `alternates.languages` to root layout.

### 3.2 Weak Internal Linking Structure
**Severity**: Medium

Hash links (`/#latest-release`) only. No breadcrumbs, no contextual links, footer only has /terms + /privacy.

**Fix**: Add contextual links; "More Music" from hero to /library; breadcrumbs on library/legal.

### 3.3 Missing Alt Text Audit
**Severity**: Medium

No systematic alt text review. Decorative images not marked.

**Fix**: Decorative image → `alt=""`. Meaningful images → descriptive alt.

### 3.4 Font Loading Hurts CLS
**File**: `app/globals.css` (line 1) — `@import` from Google Fonts  
**Severity**: Medium

`@import` is render-blocking; `display=swap` can cause CLS.

**Fix**: Migrate to `next/font/google` with `variable` CSS.

### 3.5 Consent-Aware Analytics May Underreport
**File**: `components/ConsentAwareAnalytics.tsx`  
**Severity**: Low-Medium

Rejecting analytics loses all page views. GDPR/CCPA compliant but creates blind spot.

**Fix**: Document trade-off; consider server-side page view logging as fallback.

---

## AEO (Answer Engine Optimization) Gaps

### 4.1 No Markdown or Clean-HTML Alternatives
**Severity**: High (AEO Wave 1)

No Markdown endpoints for AI ingestion.

**Fix**: Add `llms-full.txt` with full page content in Markdown.

### 4.2 API Endpoints Return JSON, Not Indexable HTML
**Files**: `/api/songs`, `/api/quotes`, etc.  
**Severity**: Medium

JSON-only responses. No rich results eligibility, no permalinks.

**Fix**: Add dynamic routes `/songs/[id]` with schema.org markup + canonical.

### 4.3 No FAQ or HowTo Schema
**Severity**: Medium

No `FAQPage` or `HowTo` schema — high-value AI citation targets.

**Fix**: Add FAQ section with `FAQPage` schema.

---

## What's Working Well

| Area | Status | Detail |
|------|--------|--------|
| Root metadata | ✅ | Title template, OG, Twitter Cards, viewport, themeColor |
| Security headers | ✅ | CSP, HSTS, X-Frame-Options, Referrer-Policy |
| Consent-aware analytics | ✅ | GDPR/CCPA compliant gating |
| Image optimization | ✅ | `next/image` with `priority`, `fill`, responsive `sizes` |
| Server data fetching | ✅ | Homepage fetches DB data server-side before render |
| Accessibility | ✅ | Skip links, ARIA labels, focus-visible |
| Revalidation | ✅ | `revalidate: 60` balances freshness + perf |

---

## Prioritized Action List

| Priority | Action | Est. Effort |
|----------|--------|-------------|
| **P0** | Create `public/robots.txt` with AI crawler directives | 15 min |
| **P0** | Create `app/sitemap.ts` with static + dynamic URLs | 30 min |
| **P0** | Add JSON-LD schema.org markup | 2 hrs |
| **P0** | Reduce SplashScreen delay to ≤600ms; make dismissible | 1 hr |
| **P1** | Create `public/llms.txt` | 1 hr |
| **P1** | Add explicit `metadata` export to `app/page.tsx` | 15 min |
| **P1** | Verify/generate `/og-image.jpg` and `/twitter-image.jpg` | 30 min |
| **P1** | Add `noindex` to admin login | 5 min |
| **P1** | Add canonical URLs via `alternates.canonical` | 30 min |
| **P2** | Migrate font loading to `next/font` | 1 hr |
| **P2** | Add `hreflang` to root layout | 10 min |
| **P2** | Fix image alt text | 30 min |
| **P2** | Add internal contextual links + breadcrumbs | 1 hr |
| **P3** | Create dynamic song pages (`/songs/[id]`) with schema | 3 hrs |
| **P3** | Add FAQ/HowTo page with structured data | 2 hrs |