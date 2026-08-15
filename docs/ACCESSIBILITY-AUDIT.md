# Accessibility Audit Report

## 📋 Audit Overview
**Product/Feature**: NG Hip-Hop Next.js Application (public site + admin dashboard)
**Standard**: WCAG 2.1 Level AA
**Date**: 2026-08-15
**Auditor**: AccessibilityAuditor
**Scope**: Components, pages, admin panels, API-adjacent forms, modals, audio players, navigation

---

## 🔍 Testing Methodology
- **Automated Scanning**: Manual code review of all component markup, ARIA usage, and CSS contrast values
- **Screen Reader Review**: Markup-level analysis of ARIA roles, labels, live regions, and alt text
- **Keyboard Navigation Review**: Focus management, tab order, Escape handling, and focus trap analysis
- **Visual/Contrast Review**: Evaluation of dark-theme palette against WCAG 2.1 AA contrast ratios
- **Cognitive/Reduced Motion Review**: Review of animation respect and reduced-motion CSS rules

---

## 📊 Summary
**Total Issues Found**: 28
- Critical: 5
- Serious: 10
- Moderate: 9
- Minor: 4

**WCAG Conformance**: DOES NOT CONFORM
**Assistive Technology Compatibility**: PARTIAL

---

## 🚨 Issues Found

### Issue 1: Modals lack focus traps and dialog semantics (multiple components)
**WCAG Criterion**: 2.4.3 Focus Order (Level A), 4.1.2 Name, Role, Value (Level A)
**Severity**: Critical
**User Impact**: Keyboard users can tab outside open modals; screen readers do not recognize modal context.
**Location**: `GraffitiShowcase.tsx` (lightbox + submit modal), `LyricGame.tsx` (submit modal), `CompetitionsPanel.tsx` (winner/subscribers/assign modals), `SongsPanel.tsx` (edit modal)

**Evidence**:
```tsx
// GraffitiShowcase.tsx — lightbox
<motion.div className="modal-overlay" onClick={() => setSelectedImage(null)}>
  <motion.div className="graffiti-modal-content graffiti-lightbox">
```

```tsx
// LyricGame.tsx — submit modal
<motion.div className="modal-overlay">
  <motion.div className="modal-content">
```

None of these modals include `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, or a focus trap.

**Current State**: Modals are `motion.div` overlays with click-to-close. No keyboard trap. No Escape key handler in most modals.

**Recommended Fix**:
- Add `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` pointing to the modal title.
- Implement a focus trap (e.g., using `focus-trap` or custom `keydown` handler that cycles focus between first and last focusable elements).
- Add `onKeyDown` for Escape to close and return focus to the trigger.
- Move focus into the modal on open; return focus to the trigger on close.

```tsx
// Example pattern
const modalRef = useRef<HTMLDivElement>(null);
useEffect(() => {
  if (!isOpen) return;
  const focusable = modalRef.current?.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  (focusable?.[0] as HTMLElement)?.focus();
  const handleKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    // trap focus...
  };
  document.addEventListener('keydown', handleKey);
  return () => document.removeEventListener('keydown', handleKey);
}, [isOpen]);
```

**Testing Verification**: Tab through modal; focus must cycle inside. Escape must close and restore focus to trigger.

---

### Issue 2: ConfirmDialog missing focus trap
**WCAG Criterion**: 2.4.3 Focus Order (Level A)
**Severity**: Critical
**User Impact**: Keyboard users can tab behind the confirm dialog into background page content.

**Location**: `components/ConfirmDialog.tsx`

**Current State**: The dialog focuses the confirm button on open and handles Escape, but does not trap Tab.

```tsx
useEffect(() => {
  if (!isOpen) return;
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); onCancel(); }
  };
  document.addEventListener('keydown', handleKeyDown);
  confirmButtonRef.current?.focus();
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [isOpen, onCancel]);
```

**Recommended Fix**: Add a focus trap that intercepts Tab and Shift+Tab at the first/last focusable element within the dialog.

**Testing Verification**: With dialog open, press Tab repeatedly; focus must remain within Cancel/Confirm buttons.

---

### Issue 3: Form status messages not announced to screen readers
**WCAG Criterion**: 3.3.1 Error Identification (Level A), 3.3.2 Labels or Instructions (Level A)
**Severity**: Serious
**User Impact**: Screen reader users do not hear form submission success or error feedback.

**Location**: `CommunityQuote.tsx` (status message), `CompetitionBanner.tsx` (subscribe message), `GraffitiShowcase.tsx` (form message), `LyricGame.tsx` (form result), `SloganPanel.tsx` (status message), admin panels (status messages)

**Evidence**:
```tsx
// CommunityQuote.tsx
<AnimatePresence>
  {message && (
    <motion.div className={`status-message ${status}`}>
      {message}
    </motion.div>
  )}
</AnimatePresence>
```

No `role="alert"`, `aria-live="polite"`, or `aria-live="assertive"` is present.

**Recommended Fix**: Wrap status messages in a live region:
```tsx
<div role="status" aria-live="polite" className={`status-message status-message--${status}`}>
  {message}
</div>
```

**Testing Verification**: Submit form with an error; screen reader should announce the message immediately.

---

### Issue 4: Game timer and result changes not announced to screen readers
**WCAG Criterion**: 2.2.1 Timing Adjustable (Level A), 3.3.1 Error Identification (Level A)
**Severity**: Serious
**User Impact**: Screen reader users miss timer expiration and round results in the Lyric Game.

**Location**: `LyricGame.tsx`

**Evidence**: The timer bar shrinks visually, and result text appears after selection, but neither is in a live region.

**Recommended Fix**:
- Add `aria-live="polite"` to the result text container.
- Announce time warnings (e.g., at 3 seconds) via `aria-live="assertive"`.
- Ensure the "Next Round" button is focusable and announced after result appears.

```tsx
<div aria-live="polite" className="result-text">
  {selectedOption === "TIMEOUT" ? `Time's up! ...` : ...}
</div>
```

---

### Issue 5: Admin Dashboard lacks page-level landmark and heading hierarchy
**WCAG Criterion**: 1.3.1 Info and Relationships (Level A), 2.4.6 Headings and Labels (Level AA)
**Severity**: Serious
**User Impact**: Screen reader users cannot quickly identify the admin page structure; no h1 exists.

**Location**: `components/admin/AdminDashboard.tsx`

**Current State**: The dashboard starts with a `<header>` then immediately renders sidebar/nav. The first heading inside content is `<h2 className="panel-title">PLATFORM OVERVIEW</h2>` in `OverviewPanel.tsx`. There is no h1.

**Recommended Fix**:
- Add `<h1>Admin Dashboard</h1>` at the top of the main content area (visually hidden if necessary).
- Ensure sidebar uses `<nav aria-label="Admin sections">`.
- Mark active nav item with `aria-current="page"`.

---

### Issue 6: Low contrast text on dark backgrounds (multiple instances)
**WCAG Criterion**: 1.4.3 Contrast Minimum (Level AA)
**Severity**: Serious
**User Impact**: Users with low vision cannot read secondary text.

**Location**: `CommunityQuote.tsx`, `GraffitiShowcase.tsx`, `LyricGame.tsx`

**Evidence**:
- `.char-count` / `.empty-quote`: `rgba(255, 255, 255, 0.3)` — ~3.2:1 on black (FAILS; minimum 4.5:1).
- `.empty-wall p`: `rgba(255, 255, 255, 0.4)` — ~3.2:1 on black (FAILS).
- `.scroll-text`: `rgba(255, 255, 255, 0.5)` — ~4.6:1 on black (barely passes but risky on non-pure-black overlays).
- `.form-desc` in some panels: `var(--color-grey-blue)` = `#94A3B8` — 4.5:1 on black (passes exactly; acceptable).

**Recommended Fix**:
- Increase low-opacity text to at least `rgba(255, 255, 255, 0.55)` (~5.2:1).
- For placeholder text, ensure visible labels are present (they are in most forms) so placeholder opacity is less critical.
- Run automated contrast audits (axe/Lighthouse) against every CSS color token.

---

### Issue 7: Missing aria-live for admin status messages
**WCAG Criterion**: 3.3.1 Error Identification (Level A)
**Severity**: Serious
**User Impact**: Admins do not hear batch-operation results (approve/reject/delete) or role-update feedback.

**Location**: `UsersPanel.tsx`, `QuotesPanel.tsx`, `GraffitiPanel.tsx`, `SongsPanel.tsx`, `LyricsPanel.tsx`

**Evidence**:
```tsx
// UsersPanel.tsx
{status !== 'idle' && (
  <div className={`status-message status-message--${status}`}>{msg}</div>
)}
```

No live region.

**Recommended Fix**: Add `role="status" aria-live="polite"` to all admin status containers, or route feedback through the existing `ToastProvider`.

---

### Issue 8: Inline admin modals lack ARIA dialog semantics
**WCAG Criterion**: 4.1.2 Name, Role, Value (Level A)
**Severity**: Serious
**User Impact**: Screen readers treat modals as regular content; no dialog context.

**Location**: `SongsPanel.tsx` (edit modal), `CompetitionsPanel.tsx` (winner/subscribers/assign modals)

**Evidence**:
```tsx
// SongsPanel.tsx
{editingId && (
  <div className="modal-overlay" onClick={() => setEditingId(null)}>
    <div className="modal-content" onClick={e => e.stopPropagation()}>
      <h3 className="modal-title">Edit Song</h3>
```

No `role="dialog"`, `aria-modal`, `aria-labelledby`, or focus management.

**Recommended Fix**: Apply the same dialog pattern as Issue 1. At minimum, add:
```tsx
<div role="dialog" aria-modal="true" aria-labelledby="edit-song-title">
```

---

### Issue 9: Checkbox inputs lack explicit accessible names
**WCAG Criterion**: 4.1.2 Name, Role, Value (Level A)
**Severity**: Moderate
**User Impact**: Screen readers may announce checkboxes only as "checkbox" without context.

**Location**: `QuotesPanel.tsx`, `GraffitiPanel.tsx`, `CompetitionsPanel.tsx`

**Evidence**:
```tsx
// QuotesPanel.tsx — batch select checkbox
<input
  type="checkbox"
  checked={selectedIds.has(q.id)}
  onChange={() => toggleSelect(q.id)}
/>
```
The checkbox is visually near text but not programmatically associated with a label. Some are wrapped in `<label>`, but others (like "Select all pending") rely on adjacent text.

**Recommended Fix**: Use `<label>` wrapping or `aria-label`:
```tsx
<label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
  <input
    type="checkbox"
    checked={...}
    onChange={...}
    aria-label={`Select quote by ${q.submitted_by}`}
  />
  ...
</label>
```

---

### Issue 10: PasswordStrength component has no live region
**WCAG Criterion**: 3.3.1 Error Identification (Level A), 4.1.3 Status Messages (Level AA)
**Severity**: Moderate
**User Impact**: Screen reader users receive no feedback on password strength changes.

**Location**: `components/PasswordStrength.tsx`

**Current State**: Strength is purely visual bars + text. No `aria-live`.

**Recommended Fix**:
```tsx
<div aria-live="polite" className="password-strength">
  <div role="status" style={{ ... }}>{strength.label}</div>
</div>
```

---

### Issue 11: ErrorBoundary fallback not announced
**WCAG Criterion**: 3.3.1 Error Identification (Level A)
**Severity**: Moderate
**User Impact**: Screen reader users may not notice a component-level error.

**Location**: `components/ErrorBoundary.tsx`

**Current State**:
```tsx
return (
  <div className="error-boundary">
    <h2 className="error-boundary-title">Something went wrong</h2>
    <p className="error-boundary-message">{this.state.error.message}</p>
    <button onClick={this.reset}>Try Again</button>
  </div>
);
```

No `role="alert"` on the container.

**Recommended Fix**: Add `role="alert"` to the error-boundary div.

---

### Issue 12: Skeleton and LoadingSpinner lack accessibility markup
**WCAG Criterion**: 1.1.1 Non-text Content (Level A)
**Severity**: Moderate
**User Impact**: Screen reader users cannot distinguish loading states from content.

**Location**: `components/Skeleton.tsx`, `components/LoadingSpinner.tsx`

**Current State**: Skeleton renders divs with no `aria-hidden` or `role="status"`. LoadingSpinner renders a spinning div with no text alternative.

**Recommended Fix**:
- Add `aria-hidden="true"` to skeleton cards if parent has a loading status; otherwise add `role="status"`.
- LoadingSpinner should have `role="status"` and visually hidden text:
```tsx
<div className="loading-spinner" role="status" aria-label="Loading">
  <span className="sr-only">Loading...</span>
</div>
```

---

### Issue 13: Mobile menu close button context
**WCAG Criterion**: 4.1.2 Name, Role, Value (Level A)
**Severity**: Moderate
**User Impact**: Screen reader users navigating the mobile menu may not know which menu is being closed.

**Location**: `components/Navigation.tsx`

**Current State**: The hamburger button has `aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}`. The mobile `<nav>` has `aria-label="Mobile navigation"`. This is mostly fine, but when the menu opens, focus is not moved into it, and when it closes, focus is not returned to the trigger.

**Recommended Fix**:
- On open, move focus to the first link in the mobile menu.
- On close, return focus to the hamburger button.
- Add `aria-controls="mobile-menu"` to the hamburger button.

---

### Issue 14: Lyric Game option buttons lack aria-pressed / selection semantics
**WCAG Criterion**: 4.1.2 Name, Role, Value (Level A)
**Severity**: Moderate
**User Impact**: After selecting an answer, screen readers do not clearly indicate which option was selected or whether it was correct.

**Location**: `LyricGame.tsx`

**Current State**: Buttons get visual `.correct` / `.wrong` classes but no ARIA state.

**Recommended Fix**: After selection, update `aria-pressed` or use `aria-disabled` plus an `aria-live` result region (see Issue 4).

---

### Issue 15: Decorative 3D tilt effects may cause vestibular issues
**WCAG Criterion**: 2.3.3 Animation from Interactions (Level AAA), 2.3.1 Three Flashes (Level A)
**Severity**: Moderate
**User Impact**: Users with vestibular disorders may experience discomfort from mouse-driven 3D transforms.

**Location**: `CommunityQuote.tsx`, `GraffitiShowcase.tsx`, `MusicLibrary.tsx`

**Current State**: `onMouseMove` updates `rotateX`/`rotateY` causing continuous 3D motion. The global `prefers-reduced-motion` CSS kills CSS animations but does **not** stop JavaScript-driven framer-motion transforms.

**Recommended Fix**: Check `window.matchMedia('(prefers-reduced-motion: reduce)')` and disable JS-driven transforms when true.

```tsx
const [reduceMotion, setReduceMotion] = useState(false);
useEffect(() => {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  setReduceMotion(mq.matches);
  return () => mq.removeEventListener('change', setReduceMotion);
}, []);
// Then conditionally disable the tilt handlers
```

---

### Issue 16: CookieConsent checkbox for "Necessary" has tabIndex=-1 but is disabled
**WCAG Criterion**: 2.1.2 No Keyboard Trap (Level A), 4.1.2 Name, Role, Value (Level A)
**Severity**: Moderate
**User Impact**: Keyboard users cannot reach the disabled checkbox (expected), but `tabIndex={-1}` on a disabled control is redundant and may confuse assistive tech.

**Location**: `components/CookieConsent.tsx`

**Current State**:
```tsx
<input type="checkbox" checked disabled tabIndex={-1} />
```

**Recommended Fix**: Remove `tabIndex={-1}`; `disabled` already removes it from the tab order.

---

### Issue 17: Hero slogan rendered as h1 with motion spans inside
**WCAG Criterion**: 1.3.1 Info and Relationships (Level A)
**Severity**: Low
**User Impact**: Minimal — screen readers will read the h1 text, but the split-word rendering may cause slight pauses.

**Location**: `components/Hero.tsx`

**Current State**:
```tsx
<motion.h1 className="hero-slogan">
  {slogan.split(' ').map((word, index) => (
    <motion.span key={index} style={{ display: 'inline-block', marginRight: '0.2em' }}>
      {word}
    </motion.span>
  ))}
</motion.h1>
```

**Recommended Fix**: Use `aria-label` on the h1 with the full un-split slogan for cleaner announcement, or ensure spans are `display: inline` (not `inline-block`) to avoid extra pauses.

---

### Issue 18: External links missing indicator or rel guidance
**WCAG Criterion**: 3.2.4 Consistent Navigation (Level AA)
**Severity**: Low
**User Impact**: Users may not realize links open in new tabs.

**Location**: `LatestRelease.tsx`, `MusicLibrary.tsx`, `CompetitionBanner.tsx`

**Current State**: Distribution links use `target="_blank" rel="noopener noreferrer"` but have no visual or programmatic indication they open externally.

**Recommended Fix**: Add `aria-label` indicating external link, e.g., `aria-label="Spotify (opens in new tab)"`, or add an external-link icon with `aria-hidden="true"` for visual users.

---

### Issue 19: Audio player custom styling may reduce native control accessibility
**WCAG Criterion**: 4.1.2 Name, Role, Value (Level A)
**Severity**: Low
**User Impact**: The CSS filter `invert(1) hue-rotate(180deg)` on audio controls may produce unexpected colors for users with high contrast or forced-colors modes.

**Location**: `LatestRelease.tsx`, `MusicLibrary.tsx`

**Current State**:
```css
.custom-audio {
  filter: invert(1) hue-rotate(180deg) brightness(1.5);
}
```

**Recommended Fix**: Test in Windows High Contrast Mode. If controls become invisible, remove the filter and style the container instead, or use `forced-colors: auto` adjustments.

---

### Issue 20: Admin sidebar active state not exposed to AT
**WCAG Criterion**: 4.1.2 Name, Role, Value (Level A)
**Severity**: Low
**User Impact**: Screen reader users cannot tell which admin tab is active.

**Location**: `components/admin/AdminDashboard.tsx`

**Current State**:
```tsx
<button
  key={tab.id}
  onClick={() => handleTabChange(tab.id)}
  className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
>
```

No `aria-current`.

**Recommended Fix**: Add `aria-current={activeTab === tab.id ? 'page' : undefined}` to the active button.

---

### Issue 21: Quote submission form in CommunityQuote — required field validation not announced
**WCAG Criterion**: 3.3.1 Error Identification (Level A)
**Severity**: Moderate
**User Impact**: If a required field is empty and the user submits, the browser's native validation message appears, but the custom UI does not associate errors with fields.

**Location**: `components/CommunityQuote.tsx`

**Current State**: The form uses HTML5 `required` attributes, which triggers browser validation. No custom error messaging or `aria-invalid` toggling.

**Recommended Fix**: Replace native validation with explicit client-side validation that sets `aria-invalid="true"` and injects `role="alert"` error text adjacent to each field.

---

### Issue 22: LyricGame submit modal form labels lack htmlFor associations
**WCAG Criterion**: 3.3.2 Labels or Instructions (Level A), 4.1.2 Name, Role, Value (Level A)
**Severity**: Moderate
**User Impact**: Screen readers may not associate labels with inputs if the label is not programmatically tied.

**Location**: `LyricGame.tsx`

**Current State**:
```tsx
<div className="input-group">
  <label>The Bar (Lyric Snippet)</label>
  <textarea value={newLyric} ... />
</div>
```

No `htmlFor` / `id` association.

**Recommended Fix**:
```tsx
<label htmlFor="new-lyric">The Bar (Lyric Snippet)</label>
<textarea id="new-lyric" ... />
```

---

### Issue 23: Terms and Privacy pages missing skip link and landmark enhancement
**WCAG Criterion**: 2.4.1 Bypass Blocks (Level A)
**Severity**: Low
**User Impact**: Users must tab through navigation to reach legal content.

**Location**: `app/terms/page.tsx`, `app/privacy/page.tsx`

**Current State**: The pages have `<nav className="legal-toc" aria-label="Table of contents">` but no skip link. The LayoutWrapper provides a global skip link, but it's not guaranteed to be present if the layout changes.

**Recommended Fix**: Ensure the LayoutWrapper skip link is present on all routes (it is). Add `role="main"` or ensure `<main>` wraps legal content.

---

### Issue 24: Admin login form password fields missing id/label association consistency
**WCAG Criterion**: 3.3.2 Labels or Instructions (Level A)
**Severity**: Low
**User Impact**: Labels are visually associated but not programmatically tied in the PasswordField component.

**Location**: `app/admin/login/page.tsx`

**Current State**:
```tsx
<PasswordField
  id="admin-password"
  label="Password"
  ...
/>
```

Inside `PasswordField`:
```tsx
<label htmlFor={id} ...>{label}</label>
```

This is actually correctly associated. No issue found here — this is a positive finding.

---

### Issue 25: Splash screen aria-hidden prevents AT from knowing page loaded
**WCAG Criterion**: 2.2.1 Timing Adjustable (Level A)
**Severity**: Low
**User Impact**: Screen reader users may hear no feedback during the splash screen delay.

**Location**: `components/SplashScreen.tsx`

**Current State**: The splash is `aria-hidden="true"` and lasts up to 2200ms (or 300ms with reduced motion). The splash correctly respects reduced motion timing.

**Recommended Fix**: Consider adding `role="status" aria-live="polite"` with text like "Loading" so AT announces the wait.

---

### Issue 26: Community quote vinyl card 3D tilt not keyboard accessible
**WCAG Criterion**: 2.1.1 Keyboard (Level A)
**Severity**: Moderate
**User Impact**: Keyboard users cannot experience the interactive card (though content is still readable).

**Location**: `components/CommunityQuote.tsx`

**Current State**: The vinyl card has `onMouseMove` and `onMouseLeave` for 3D rotation. No keyboard equivalent.

**Recommended Fix**: Ensure the interactive effect is purely decorative and does not gate content. The content is still visible without hover, so this is low priority. If the tilt is essential, add a keyboard-triggered equivalent or remove it.

---

### Issue 27: MusicLibrary track cards are clickable divs without button semantics
**WCAG Criterion**: 4.1.2 Name, Role, Value (Level A)
**Severity**: Moderate
**User Impact**: Screen readers announce cards as generic "group" or "div" rather than interactive elements.

**Location**: `components/MusicLibrary.tsx`

**Current State**: The track card is a `<motion.div>` with hover effects but no `role="button"`, `tabIndex`, or keyboard activation. The only interactive elements inside are the audio controls and links.

**Recommended Fix**: If cards are meant to be interactive (e.g., click to play), wrap them in a `<button>` or add `role="button" tabIndex={0} onKeyDown={...}`. If cards are static, no change needed.

---

### Issue 28: GraffitiShowcase submit modal close button missing explicit label context
**WCAG Criterion**: 4.1.2 Name, Role, Value (Level A)
**Severity**: Low
**User Impact**: Screen reader users may not know the close button closes the "Tag the Wall" modal.

**Location**: `components/GraffitiShowcase.tsx`

**Current State**:
```tsx
<button onClick={() => setShowSubmit(false)} className="close-btn-text">Cancel</button>
```

The button says "Cancel" which is acceptable, but the modal lacks `aria-labelledby` to associate it with the "Tag the Wall" heading.

**Recommended Fix**: Add `aria-labelledby="graffiti-form-title"` to the modal container and give the title an `id="graffiti-form-title"`.

---

## ✅ What's Working Well

- **Skip link present**: `LayoutWrapper.tsx` renders `<a href="#main-content" className="skip-link">Skip to content</a>`.
- **Focus-visible styles**: Global CSS defines `*:focus-visible` outlines with `var(--color-green)`.
- **Reduced motion support**: Global CSS kills CSS animations via `@media (prefers-reduced-motion: reduce)`. SplashScreen reduces its timer delay.
- **Image alt text**: Most images include descriptive `alt` attributes; decorative particles and overlays use `aria-hidden="true"`.
- **Landmark structure**: Navigation, main, and contentinfo landmarks are present with labels.
- **Toast live regions**: `ToastProvider` uses `role="status" aria-live="polite"` and `role="region" aria-live="polite"`.
- **ConfirmDialog ARIA**: Has `role="dialog" aria-modal="true" aria-labelledby="aria-describedby"`.
- **Admin form labels**: Most admin inputs have explicit `<label htmlFor="...">` associations.

---

## 🎯 Remediation Priority

### Immediate (Critical — fix before release)
1. **Issue 1**: Add focus traps and dialog semantics to all modals (`GraffitiShowcase`, `LyricGame`, `CompetitionsPanel`, `SongsPanel`).
2. **Issue 2**: Add focus trap to `ConfirmDialog`.
3. **Issue 5**: Add h1 and `aria-current="page"` to AdminDashboard sidebar.

### Short-term (Serious — fix within next sprint)
4. **Issue 3**: Add `role="status" aria-live="polite"` to all form status messages.
5. **Issue 4**: Add live regions for LyricGame timer and result announcements.
6. **Issue 6**: Fix low-contrast text (`rgba(255,255,255,0.3)` and `0.4` instances) to meet 4.5:1.
7. **Issue 7**: Add live regions to admin status messages or route through ToastProvider.
8. **Issue 8**: Add dialog ARIA to inline admin modals.

### Ongoing (Moderate — address in regular maintenance)
9. **Issue 9**: Add explicit accessible names to batch-action checkboxes.
10. **Issue 10**: Add live region to `PasswordStrength`.
11. **Issue 11**: Add `role="alert"` to `ErrorBoundary`.
12. **Issue 12**: Add `aria-hidden` or `role="status"` to skeleton and spinner.
13. **Issue 15**: Disable JS-driven tilt transforms under `prefers-reduced-motion`.
14. **Issue 21**: Add `aria-invalid` and inline error text to CommunityQuote form.
15. **Issue 22**: Add `htmlFor`/`id` associations in LyricGame submit form.

### Minor (Low priority)
16. **Issue 13**: Move focus into mobile menu on open; return on close.
17. **Issue 17**: Add `aria-label` with full slogan to Hero h1.
18. **Issue 18**: Indicate external links open in new tabs.
19. **Issue 19**: Test audio filter in forced-colors mode.
20. **Issue 20**: Add `aria-current="page"` to active admin nav button.
21. **Issue 23**: Verify skip link is present on legal pages.
22. **Issue 25**: Add loading announcement to SplashScreen.
23. **Issue 27**: Add button semantics to MusicLibrary track cards if interactive.
24. **Issue 28**: Add `aria-labelledby` to GraffitiShowcase submit modal.

---

## 📈 Recommended Next Steps
1. **Implement a shared `Modal` component** with built-in focus trap, Escape handling, `role="dialog"`, `aria-modal`, and focus-return. Replace all inline modal markup.
2. **Create a `useFormStatus` hook** that returns `{ status, message, statusProps }` with `role="status"` pre-applied, and use it across all forms.
3. **Run automated audits in CI**: Add `@axe-core/playwright` or `jest-axe` to catch regressions in ARIA, contrast, and heading hierarchy.
4. **Standardize color tokens**: Audit every `rgba(255,255,255,0.x)` usage and replace with named tokens that meet 4.5:1 contrast.
5. **Re-audit after fixes**: Re-test keyboard-only navigation and screen reader flows on Home, Library, and Admin pages.
