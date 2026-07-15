'use client';

import { useEffect, useState } from 'react';

type Consent = {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
};

const CONSENT_KEY = 'ng_hiphop_cookie_consent';

function getConsent(): Consent | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setConsent(consent: Consent) {
  localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
  window.dispatchEvent(new CustomEvent('consent-updated', { detail: consent }));
}

export function useCookieConsent() {
  const [consent, setConsentState] = useState<Consent | null>(getConsent());

  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<Consent>;
      setConsentState(custom.detail);
    };
    window.addEventListener('consent-updated', handler);
    return () => window.removeEventListener('consent-updated', handler);
  }, []);

  const updateConsent = (partial: Partial<Consent>) => {
    const next = { ...consent, ...partial, timestamp: new Date().toISOString() } as Consent;
    setConsent(next);
    setConsentState(next);
  };

  const acceptAll = () => updateConsent({ necessary: true, analytics: true, marketing: true });
  const rejectAll = () => updateConsent({ necessary: true, analytics: false, marketing: false });
  const savePreferences = (prefs: { analytics: boolean; marketing: boolean }) =>
    updateConsent({ necessary: true, ...prefs });

  return { consent, acceptAll, rejectAll, savePreferences };
}

export { CONSENT_KEY };
