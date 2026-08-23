"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Full-screen brand splash shown on every hard navigation.
 * CSS lives in globals.css (splash-container / splash-logo-wrap / splash-progress-bar)
 * to avoid styled-jsx hydration mismatches.
 */
export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    document.body.style.overflow = 'hidden';

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const delay = reduceMotion ? 250 : 450;

    const timer = setTimeout(() => {
      setIsVisible(false);
      document.body.style.overflow = '';
    }, delay);

    const handleLoad = () => {
      setIsVisible(false);
      document.body.style.overflow = '';
    };
    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener('load', handleLoad);
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <>
      <span className="sr-only" role="status" aria-live="polite">
        Loading NG Hip Hop
      </span>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            key="splash"
            className="splash-container"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: 'easeInOut' }}
            aria-hidden="true"
          >
          {/* Logo */}
          <motion.div
            className="splash-logo-wrap"
            initial={{ scale: 0.75, opacity: 0, filter: 'blur(24px)' }}
            animate={{ scale: 1,    opacity: 1, filter: 'blur(0px)' }}
            exit={{   scale: 1.15,  opacity: 0, filter: 'blur(16px)' }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <Image
              src="/images/logo.png"
              alt="Nerd Gauge"
              width={200}
              height={200}
              priority
              style={{ objectFit: 'contain' }}
            />
          </motion.div>

          {/* Loading bar */}
          <motion.div
            className="splash-progress-bar"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />
        </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
