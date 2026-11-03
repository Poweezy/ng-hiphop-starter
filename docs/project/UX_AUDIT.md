# User experience audit

**Assessment date:** 2026-11-02  
**Method:** Source-level review of public flows, shared components, responsive styles, and accessibility affordances. Rendered browser behavior was not tested.

## Summary

The product has a distinctive music-led visual identity and good responsive/accessibility foundations: skip link and main landmark, visible focus styling, reduced-motion support, semantic form labels, responsive navigation, and persistent audio controls. The largest usability issue is not visual polish: the intended entrant journey appears to send ordinary artists into an admin-only login flow.

## What exists today

- **Listeners:** homepage release/quote/graffiti/competition features and a searchable library (`app/page.tsx`, `app/library/page.tsx`, `components/MusicLibrary.tsx`).
- **Artists/entrants:** competition details, rules, prizes, recent submissions, winners, and a lyrics form (`app/game/best-lyrics/page.tsx`, `components/BestLyricsPortalClient.tsx`).
- **Subscribers:** competition email sign-up, admin subscriber tools, campaigns, and unsubscribe.
- **Moderators/admins:** content editing, submission moderation, and winner administration.
- **Responsive/accessibility foundation:** skip link and main landmark (`components/LayoutWrapper.tsx:20-24`); focus/reduced-motion styling (`app/globals.css:139-160,927-935`); mobile navigation state and Escape handling (`components/Navigation.tsx:51-56,71,104-109`); responsive layout breakpoints (`app/globals.css:1313-1340,1654-1659,2977-2992`).

## Ranked findings

| Priority | Finding and evidence | User/business impact | Recommendation |
|---|---|---|---|
| High | Entry form requires a session and links to `/admin/login` (`components/BestLyricsPortalClient.tsx:64-66,397-402`); login page is admin-branded (`app/admin/login/LoginClient.tsx:162`) and README says there is no public registration (`README.md:94`). | Ordinary artists may believe the core competition is unavailable or that they need administrator access. | Decide whether entry is anonymous, account-based, or invitation-based; make its sign-in/registration path explicit and match UI to API policy. |
| High | Library database errors are rendered like a genuinely empty catalog (`app/library/page.tsx:35-42`; `components/MusicLibrary.tsx:44-52`). Homepage data failures also fall back silently (`app/page.tsx:97-109`). | A service outage can look like “no music,” damaging trust and discovery. | Distinguish empty, unavailable, and loading states; provide retry and retain page context. |
| High | The competition copy says “Let the community decide” but the inspected schema/routes show admin winner selection rather than voting (`components/BestLyricsPortalClient.tsx:268`; `components/admin/WinnersPanel.tsx:127-145`). Configured eligibility/age rules are not all displayed, and schedule checks are incomplete. | Entrants may misunderstand judging, eligibility, or whether entries are open. | Publish complete rules, judging method, deadlines, and status; ensure server enforcement matches them. |
| Medium | Winner display can expose pending announcements and the admin panel lacks a distinct publish/announce transition (`prisma/schema.prisma:235`; `app/game/best-lyrics/page.tsx:121-153`; `components/admin/WinnersPanel.tsx:218-320`). | Contest results may appear before review, while subscribers may not receive the promised notification. | Add an explicit approval/publish step and visible delivery state. |
| Medium | Search has no “no results” branch (`components/MusicLibrary.tsx:98-114`). | Users see a blank result area without a recovery cue. | Provide a no-match state, clear-search action, and accessible result announcement. |
| Medium | Subscriber handler never enters loading state, so repeated submissions are possible and no progress is shown (`components/BestLyricsPortalClient.tsx:159-193,661-695`). | Users may retry, submit duplicates, or assume the form is broken. | Set pending state before request; prevent duplicate submission; announce status. |
| Medium | Shared loading spinner has no text/status semantics (`app/loading.tsx:1-22`). | Screen-reader users may not know navigation or work is in progress. | Add a concise accessible loading status; keep the spinner decorative. |
| Medium | Home signup lacks the consent control shown in the competition signup; resubscribe behavior is unclear (`components/CompetitionBanner.tsx:31-38`; `components/BestLyricsPortalClient.tsx:680-689`). | Signup expectations and consent capture differ across surfaces. | Standardize consent wording and define repeat-subscription/withdrawal behavior. |
| Low | MiniPlayer has play/pause/close but no progress/seek or track navigation; controls are 36×36px (`components/MiniPlayer.tsx:51-72`; `app/globals.css:2850-2855`). | Continued listening is less controllable, especially on mobile. | If the mini-player is intended as a full player, add accessible progress/seek and appropriately sized touch targets; otherwise keep controls intentionally minimal. |
| Medium | “Play All” and “Shuffle” start a single track rather than a queue; player errors are silently caught (`components/MusicLibrary.tsx:25-42,90-95`; `lib/audioContext.tsx:124-138`). | Labels overpromise and playback failures lack recovery. | Implement queue behavior or relabel controls; show loading, error, and retry states. |

## Mobile and desktop assessment

Source contains mobile breakpoints, collapsible desktop/mobile navigation, bottom navigation, grid collapse, and touch-oriented sizing. This is evidence of responsive intent, not proof of rendered correctness. There was no live browser/shared page available; viewport overflow, real device playback, keyboard/screen-reader behavior, contrast, and actual touch-target compliance remain unverified. Schedule browser checks at narrow phone, tablet, and desktop widths before release.

## Recommended UX acceptance checks

- New entrant can understand eligibility, authentication, deadlines, judging, and how to track an entry without encountering admin-only terminology.
- Error, empty, loading, success, and no-results states are distinct and announced accessibly.
- Public winner visibility follows an explicit publish action; subscriber messaging reports actual delivery state.
- Keyboard navigation, focus visibility, reduced motion, labels, and status announcements work across core flows.
- Mobile checks confirm responsive navigation, no horizontal overflow, usable bottom-nav/player coexistence, and adequate touch targets.

## Authorized follow-up status

The consent control is now present on the homepage competition signup, and the competition portal exposes a pending state while its confirmation request is processed. The signup success message instructs users to confirm by email. This does not replace the required rendered mobile/desktop browser review.
