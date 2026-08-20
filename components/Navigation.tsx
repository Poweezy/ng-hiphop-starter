"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  useEffect(() => {
    // Initialise on mount so SSR and first CSR frame match (both false)
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // sync after hydration in case page is already scrolled
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const logoSize = scrolled ? 48 : 68;

  return (
    <nav className={`nav-main${scrolled ? ' nav-scrolled' : ''}`} role="navigation" aria-label="Main navigation">
      {/* Scroll-progress indicator */}
      <motion.div className="nav-scroll-progress" style={{ scaleX }} aria-hidden="true" />

      <div className="nav-container">
        {/* Brand logo */}
        <Link href="/" className="nav-logo-link" aria-label="Nerd Gauge — go to homepage">
          <Image
            src="/images/logo.png"
            alt="Nerd Gauge"
            width={80}
            height={80}
            className="nav-logo-img"
            style={{ width: logoSize, height: logoSize }}
            priority
          />
        </Link>

        {/* Desktop navigation */}
        <div className="nav-desktop-menu">
          <Link href="/#latest-release" className="nav-link">Music</Link>
          <Link href="/library"          className="nav-link">Library</Link>
          <Link href="/#community-quotes" className="nav-link">Community</Link>
          <Link href="/#graffiti"        className="nav-link">Gallery</Link>
          <Link href="/#lyric-game"      className="nav-link">Game</Link>
          <Link href="/game/best-lyrics" className="nav-link">Best Lyrics</Link>
          <Link href="/admin/login"      className="nav-link nav-link-admin">Admin</Link>
        </div>

        {/* Hamburger (mobile) */}
        <button
          className="nav-mobile-btn"
          onClick={() => setMobileMenuOpen((v) => !v)}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="nav-mobile-menu"
          >
             <nav className="nav-mobile-links" aria-label="Mobile navigation">
                {[
                  { href: '/#latest-release',   label: 'Music' },
                  { href: '/library',           label: 'Library' },
                  { href: '/#community-quotes', label: 'Community' },
                  { href: '/#graffiti',         label: 'Gallery' },
                  { href: '/#lyric-game',       label: 'Game' },
                  { href: '/game/best-lyrics',  label: 'Best Lyrics' },
                  { href: '/admin/login',       label: 'Admin' },
                ].map(({ href, label }) => (
                 <Link
                   key={href}
                   href={href}
                   className="nav-mobile-link"
                   onClick={() => setMobileMenuOpen(false)}
                 >
                   {label}
                 </Link>
               ))}
             </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
