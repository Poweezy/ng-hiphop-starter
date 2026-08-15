'use client';

import { useEffect, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { useCookieConsent } from '@/lib/consent';

export default function ConsentAwareAnalytics() {
  const { consent } = useCookieConsent();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !consent?.analytics) {
    // TODO(AEO/Analytics): Consider a server-side page-view logging fallback for
    // consent-rejected users so we retain aggregate traffic signals without
    // client-side tracking cookies.
    return null;
  }

  return <Analytics />;
}
