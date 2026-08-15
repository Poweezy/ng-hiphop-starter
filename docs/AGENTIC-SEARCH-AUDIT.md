# Agentic Search Optimization & Task Completion Audit

**Date:** 2026-08-15  
**Overall Task Completion Rate:** 3/5 flows (60%) — below 80% target

---

## WebMCP Readiness Scorecard

| Task Flow | Discoverable | Initiatable | Completable | Drop Point | Priority |
|---|---|---|---|---|---|
| Browse music library | ✅ Yes | ✅ Yes | ✅ Yes | — | Done |
| Submit a quote | ⚠️ Partial | ⚠️ Partial | ✅ Yes | Form not in nav; no WebMCP markup | P2 |
| Sign up for competition | ⚠️ Partial | ⚠️ Partial | ✅ Yes | Only visible when competition active; no WebMCP | P2 |
| Submit graffiti | ❌ No | ❌ No | ❌ No | File upload; no WebMCP; action hidden in modal | P1 |
| Submit a lyric challenge | ❌ No | ❌ No | ❌ No | POST requires admin auth; UI is public | P1 |

**WebMCP Coverage: 0%** — no `data-mcp-action`, no `/mcp-actions.json`, no `navigator.mcpActions.register()`, no `llms.txt`

---

## Critical Blockers — P1 (Fix Immediately)

### 1. LyricGame Submission Endpoint Requires Admin Auth; UI Is Public

**What breaks**: The `LyricGame` component renders a "Submit a Lyric" modal open to all visitors. POSTs to `/api/lyrics`, which calls `requireAdmin()`. Any non-admin agent receives 401. The `handleFormSubmit` has no error-state UI — on failure the modal stays open with no feedback.

**Impact**: The entire public lyric-submission feature is non-functional. An agent navigating to the game, clicking "Submit a Lyric," filling the form, and submitting fails silently at the last step.

**Fix**: Make `/api/lyrics` POST public (mirror `/api/quotes` pattern) — `is_active: false`, rate-limited. The `lyricCreateSchema` already exists and accepts the right fields.

### 2. No WebMCP Declarative Markup on Any Form

**What breaks**: Zero forms carry `data-mcp-action`, `data-mcp-description`, or `data-mcp-param` attributes. AI browsing agents cannot discover that actions exist.

**Fix**: Add WebMCP attributes to all four public forms:
```html
<form data-mcp-action="submit-quote" 
      data-mcp-description="Submit a hip-hop quote for admin review" 
      data-mcp-params='{"required": ["name", "quote"]}'>
```

### 3. No Agent Discovery Endpoint or Documentation

**What breaks**: No `/mcp-actions.json`, no `/llms.txt`, no `<link rel="mcp-actions">`, no `AGENTS.md` in public root.

**Fix**: Add `<link rel="mcp-actions" href="/mcp-actions.json" />` to `app/layout.tsx`; create `app/mcp-actions.json/route.ts`; create `public/llms.txt`.**

---

## Moderate Friction — P2 (Fix Within 14 Days)

### 4. SplashScreen Blocks All Navigation for 2.2 Seconds

**What breaks**: 2200ms delay on every hard navigation. `document.body.style.overflow = 'hidden'` blocks scroll + interaction. For agents executing multi-step tasks, this compounds to ~5s of dead time.

**Fix**: Reduce to 800ms. Better: remove for SSR-first visits, only show on client transitions.

### 5. Middleware Same-Origin Guard Blocks Agent API Calls

**What breaks**: `middleware.ts` rejects mutating requests where `Origin !== Host`. Agents making API calls from different origins get 403 with plain-text response — no JSON body matching `errorResponse` convention.

**Fix**: Return structured JSON: `{ error: { code: "CROSS_ORIGIN_REJECTED", message: "..." } }`.

### 6. Graffiti Submission Requires File Upload — Agent-Hostile

**What breaks**: `<input type="file">` — AI agents cannot browse filesystems. Hard stop for agent graffiti submission.

**Fix**: Document admin-only JSON path (pre-obtained URL + artistName) in `llms.txt`. For public agents, note file selection requirement.

### 7. Navigation Omits Key Public Actions

**What breaks**: Navigation links to Music, Library, Community, Gallery, Game, Admin. No link to quote submission, graffiti submission, or competition section.

**Fix**: Add "Participate" nav link; create `/participate` page with stable URLs.

---

## Minor / Missing Infrastructure — P3

### 8. No Self-Documenting API
No `/api/docs`, no OpenAPI spec, no `OPTIONS` handlers. **Fix**: Add minimal OpenAPI 3.0 spec for public endpoints.

### 9. Admin Panel Client-Side Tab Routing
No stable URLs (e.g., `/admin/songs`). Deep links impossible. **Fix**: Add route segments.

### 10. Developer-Oriented Documentation
README/DEPLOYMENT thorough for humans; no agent-facing `AGENTS.md`. **Fix**: Add `AGENTS.md` documenting public vs admin endpoints, payloads.

---

## Working Flows (No Changes Needed)

| Flow | Status | Notes |
|---|---|---|
| Browse music library | ✅ | SSR at `/library`; `/api/songs` GET public; clean pagination |
| Submit a quote | ✅ | `/api/quotes` POST public, rate-limited, idempotent, Zod-validated |
| Subscribe to competition | ✅ | `/api/competitions/subscribe` POST public, rate-limited, email-validated |
| Admin login | ✅ | NextAuth with rate-limit; proper session management |
| Admin CRUD | ✅ | All admin endpoints use `requireAdmin()`, Zod, pagination, observability |

---

## Recommended Action Sequence

**Day 1 (P1)**:
1. Make `/api/lyrics` POST public (mirror quotes pattern) — unblocks broken flow
2. Add error-state UI to `LyricGame`'s `handleFormSubmit`

**Day 3-7 (P2)**:
3. Add declarative WebMCP attributes to all four public forms
4. Publish `/mcp-actions.json` route + add `<link rel="mcp-actions">` to layout
5. Reduce SplashScreen delay from 2200ms to 800ms

**Day 7-14 (P3)**:
6. Add `public/llms.txt` + `/api/docs` OpenAPI spec
7. Return structured JSON from middleware error responses
8. Add "Participate" nav entry + `/participate` page

**Baseline metrics to track post-fix:**
- Task completion rate: 4/5 (80%) within 30 days
- WebMCP declarative coverage: 4/4 public forms within 14 days
- Splash screen delay: under 1s within 7 days