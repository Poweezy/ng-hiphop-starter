"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';

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
           <Link href="/#latest-release" className="nav-link" aria-current={pathname === '/' ? 'page' : undefined}>Music</Link>
           <Link href="/library"          className="nav-link" aria-current={pathname === '/library' ? 'page' : undefined}>Library</Link>
           <Link href="/#community-quotes" className="nav-link" aria-current={pathname === '/' ? 'page' : undefined}>Community</Link>
           <Link href="/#graffiti"        className="nav-link" aria-current={pathname === '/' ? 'page' : undefined}>Gallery</Link>
           <Link href="/#lyric-game"      className="nav-link" aria-current={pathname === '/' ? 'page' : undefined}>Game</Link>
           <Link href="/game/best-lyrics" className="nav-link" aria-current={pathname?.startsWith('/game/best-lyrics') ? 'page' : undefined}>Competitions</Link>
           <Link href="/admin/login"      className="nav-link nav-link-admin" aria-current={pathname?.startsWith('/admin') ? 'page' : undefined}>Admin</Link>
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
            animate={{ opacity: 1, height: 'auto', transition: { staggerChildren: 0.05, delayChildren: 0.1 } }}
            exit={{ opacity: 0, height: 0, transition: { staggerChildren: 0.03, staggerDirection: -1 } }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="nav-mobile-menu"
          >
             <nav className="nav-mobile-links" aria-label="Mobile navigation">
                  {[
                    { href: '/#latest-release',   label: 'Music', current: pathname === '/' },
                    { href: '/library',           label: 'Library', current: pathname === '/library' },
                    { href: '/#community-quotes', label: 'Community', current: pathname === '/' },
                    { href: '/#graffiti',         label: 'Gallery', current: pathname === '/' },
                    { href: '/#lyric-game',       label: 'Game', current: pathname === '/' },
                    { href: '/game/best-lyrics',  label: 'Competitions', current: pathname?.startsWith('/game/best-lyrics') },
                    { href: '/admin/login',       label: 'Admin', current: pathname?.startsWith('/admin') },
                  ].map(({ href, label, current }) => (
                  <motion.div
                    key={href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <Link
                      href={href}
                      className="nav-mobile-link"
                      aria-current={current ? 'page' : undefined}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {label}
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
