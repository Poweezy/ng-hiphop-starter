# Accessibility Audit — Admin Login

**Page:** `app/admin/login/LoginClient.tsx`
**WCAG Standard:** WCAG 2.1 Level AA
**Audit Date:** 2026-08-19

---

## ✅ PASSING

### Labels & Form Controls
- `PasswordField` component renders `<label htmlFor={id}>` for each input (`LoginClient.tsx:13, 196`)
- All inputs have explicit `id` attributes matching their label `htmlFor`
- `PasswordField` accepts `ariaInvalid` and `ariaDescribedby` props, wired to `aria-invalid` and `aria-describedby` on the input

### Input Types
- Email field uses `type="email"` (`LoginClient.tsx:199`)
- Password fields use `type="password"` / `type="text"` (visibility toggle) (`LoginClient.tsx:17, 31`)
- `autoComplete="email"` on email field, `"current-password"` on login password, `"new-password"` on reset password
- `autoComplete="off"` on reset secret field (`LoginClient.tsx:262,274`)

### Error Announcements
- All error messages in `<div role="alert">` (`LoginClient.tsx:188, 224, 281`)
- Success message uses `role="status"` (`LoginClient.tsx:283`)
- NextAuth errors read from URL query param and mapped to user-friendly messages (`LoginClient.tsx:56-64, 66-78`)

### Interactive Elements
- Password visibility toggle has `aria-label={visible ? 'Hide password' : 'Show password'}` (`LoginClient.tsx:32`)
- Submit buttons are actual `<button type="submit">` elements
- "Forgot Password?" and "← Back to Login" links are `<button type="button">` with `onClick` handlers
- Loading state indicated via text change (`⏳ Authenticating...` / `Processing...`)
- Buttons have `disabled={loading}` preventing duplicate submissions

### Visual Design
- Sufficient color contrast for labels (`var(--color-green-light)`)
- Logo image has descriptive `alt` text and `priority` flag (`LoginClient.tsx:155,159`)
- Layout is centered with `maxWidth: 420px` (responsive on mobile)

---

## ⚠️ RECOMMENDATIONS

### 1. Add `aria-live` to forms for error/success announcements
**WCAG:** 4.1.3 — Status Messages (Level AA)
**Location:** `LoginClient.tsx:194, 239`

The login and reset forms use `aria-live="polite"` on the `<form>` element, but screen readers may not reliably announce dynamic content inside form containers. Move `aria-live` to the specific error/success containers:

```tsx
{nextAuthError && (
  <div className="error-alert" role="alert" aria-live="assertive">
    {getNextAuthErrorMessage(nextAuthError)}
  </div>
)}
```

Use `aria-live="assertive"` for errors (urgent) and `aria-live="polite"` for success messages.

### 2. Add focus outline to admin buttons
**WCAG:** 2.4.7 — Focus Visible (Level AA)
**Location:** Button styles in `LoginClient.tsx:226, 230-236, 288-290, 292-298`

All buttons use inline styles that lack explicit `:focus-visible` outlines. While browsers provide default focus rings, they may be overridden by global CSS resets. Add explicit focus styles:

```tsx
style={{
  ...,
  outline: '2px solid var(--color-green)',
  outlineOffset: '2px'
}}
```

Or use the global `.btn-admin` and `.btn-admin-purple` classes which are defined in `globals.css`.

### 3. Add `aria-describedby` for password requirements
**WCAG:** 3.3.2 — Labels or Instructions (Level A)
**Location:** `LoginClient.tsx:270-278`

The reset password field has a `minimumLength` hint in the placeholder but no programmatic association:

```tsx
<PasswordField
  id="reset-password"
  label="New Password"
  ...
  ariaDescribedby="password-requirements"
/>
<PasswordStrength password={password} />
```

With a corresponding `<div id="password-requirements">`.

### 4. Use semantic heading structure
**WCAG:** 1.3.1 — Info and Relationships (Level A)
**Location:** `LoginClient.tsx:142-173`

The logo section uses `<div>` elements for visual hierarchy instead of semantic headings. Consider adding `<h1>` for the page title (currently only the "ADMIN PORTAL" text div):

```tsx
<h1 className="sr-only">Admin Login</h1>
```

This provides screen reader users with context that they're on the login page.

### 5. Ensure global `prefers-reduced-motion` support
**WCAG:** 2.3.3 — Animation from Interactions (Level AAA)
**Location:** `app/globals.css` (global)

Verify the global `@media (prefers-reduced-motion: reduce)` rule is present and covers any CSS transitions/animations used on the login page. The current LoginClient uses inline styles without animations, so this is **already satisfied** — just ensure the global rule covers all components.

---

## Summary

| Issue | Severity | Status |
|-------|----------|--------|
| Password visibility toggle aria-label | — | ✅ Pass |
| Form labels with htmlFor | — | ✅ Pass |
| Error/success live regions | — | ⚠️ Recommendation |
| Keyboard focus visible | — | ⚠️ Recommendation |
| autoComplete attributes | — | ✅ Pass |
| Input type correctness | — | ✅ Pass |
| Loading state feedback | — | ✅ Pass |
| Image alt text | — | ✅ Pass |
