"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';

interface NavLinkItem {
  href: string;
  label: string;
  route?: string;
  prefix?: string;
  admin?: boolean;
}

const NAV_LINKS: NavLinkItem[] = [
  { href: '/#latest-release',   label: 'Music' },
  { href: '/library',           label: 'Library',    route: '/library' },
  { href: '/#community-quotes', label: 'Community' },
  { href: '/#graffiti',         label: 'Gallery' },
  { href: '/game/best-lyrics',  label: 'Competitions', prefix: '/game/best-lyrics' },
  { href: '/admin/login',       label: 'Admin',        prefix: '/admin', admin: true },
];

export default function Navigation() {
  const pathname = usePathname();
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

  // Close the mobile menu whenever the route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [mobileMenuOpen]);

  const logoSize = scrolled ? 48 : 68;

  // Only route-based links can be "current"; hash links never claim aria-current.
  const isActive = (link: NavLinkItem) => {
    if (link.route) return pathname === link.route;
    if (link.prefix) return pathname?.startsWith(link.prefix) ?? false;
    return false;
  };

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
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`nav-link${link.admin ? ' nav-link-admin' : ''}${isActive(link) ? ' nav-link--active' : ''}`}
              aria-current={isActive(link) ? 'page' : undefined}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Hamburger (mobile) */}
        <button
          className="nav-mobile-btn"
          onClick={() => setMobileMenuOpen((v) => !v)}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-menu"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            key="mobile-menu"
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto', transition: { staggerChildren: 0.05, delayChildren: 0.1 } }}
            exit={{ opacity: 0, height: 0, transition: { staggerChildren: 0.03, staggerDirection: -1 } }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="nav-mobile-menu"
          >
            <nav className="nav-mobile-links" aria-label="Mobile navigation">
              {NAV_LINKS.map((link) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <Link
                    href={link.href}
                    className={`nav-mobile-link${isActive(link) ? ' nav-mobile-link--active' : ''}${link.admin ? ' nav-mobile-link--admin' : ''}`}
                    aria-current={isActive(link) ? 'page' : undefined}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
