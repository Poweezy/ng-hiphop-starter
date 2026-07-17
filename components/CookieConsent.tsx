'use client';

import { useState, useEffect } from 'react';
import { useCookieConsent, CONSENT_KEY } from '@/lib/consent';

export default function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState({ analytics: false, marketing: false });
  const [mounted, setMounted] = useState(false);
  const { consent, acceptAll, rejectAll, savePreferences } = useCookieConsent();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  if (consent) {
    return null;
  }

  return (
    <div className="cookie-consent" role="dialog" aria-label="Cookie consent" aria-describedby="cookie-consent-desc">
      <div className="cookie-consent-card">
        <h2 className="cookie-consent-title">Cookie Preferences</h2>
        <p id="cookie-consent-desc" className="cookie-consent-desc">
          We use cookies to improve your experience, analyze site traffic, and serve relevant content.
          You can accept all cookies or customize your preferences.
        </p>

        {open && (
          <div className="cookie-consent-options">
            <label className="cookie-consent-option">
              <input type="checkbox" checked disabled />
              <span>Necessary (always required)</span>
            </label>
            <label className="cookie-consent-option">
              <input
                type="checkbox"
                checked={prefs.analytics}
                onChange={(e) => setPrefs({ ...prefs, analytics: e.target.checked })}
              />
              <span>Analytics</span>
            </label>
            <label className="cookie-consent-option">
              <input
                type="checkbox"
                checked={prefs.marketing}
                onChange={(e) => setPrefs({ ...prefs, marketing: e.target.checked })}
              />
              <span>Marketing</span>
            </label>
          </div>
        )}

        <div className="cookie-consent-actions">
          {!open ? (
            <>
              <button className="cookie-btn cookie-btn-primary" onClick={() => setOpen(true)}>
                Customize
              </button>
              <button className="cookie-btn cookie-btn-secondary" onClick={rejectAll}>
                Reject All
              </button>
              <button className="cookie-btn cookie-btn-accent" onClick={acceptAll}>
                Accept All
              </button>
            </>
          ) : (
            <>
              <button className="cookie-btn cookie-btn-secondary" onClick={rejectAll}>
                Reject All
              </button>
              <button className="cookie-btn cookie-btn-accent" onClick={() => savePreferences(prefs)}>
                Save Preferences
              </button>
            </>
          )}
        </div>

        <p className="cookie-consent-links">
          <a href="/privacy" className="cookie-link">Privacy Policy</a>
          <span className="cookie-separator">|</span>
          <a href="/terms" className="cookie-link">Terms of Service</a>
        </p>
      </div>
    </div>
  );
}
