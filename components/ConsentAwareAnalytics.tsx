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
    return null;
  }

  return <Analytics />;
}
