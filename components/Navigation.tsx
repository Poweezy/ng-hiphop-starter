'use client';

import { useState, useEffect } from 'react';

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: scrolled ? 'rgba(17, 24, 39, 0.8)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
        transition: 'all 0.3s ease',
        padding: scrolled ? '12px 0' : '20px 0',
      }}
    >
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 clamp(16px, 4vw, 48px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <a href="/" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                fontFamily: 'var(--font-cursive)',
                fontSize: '2rem',
                background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontWeight: 700,
              }}
            >
              NG
            </span>
          </div>
        </a>

        {/* Desktop Menu */}
        <div
          style={{
            display: 'flex',
            gap: '32px',
            alignItems: 'center',
          }}
          className="desktop-menu"
        >
          <a href="#latest-release" style={{ ...navLinkStyle }}>Music</a>
          <a href="#community-quotes" style={{ ...navLinkStyle }}>Community</a>
          <a href="#graffiti" style={{ ...navLinkStyle }}>Gallery</a>
          <a href="#lyric-game" style={{ ...navLinkStyle }}>Game</a>
          <a
            href="/admin/login"
            style={{
              ...navLinkStyle,
              background: 'rgba(139, 92, 246, 0.15)',
              padding: '8px 20px',
              borderRadius: '8px',
              border: '1px solid rgba(139, 92, 246, 0.3)',
            }}
          >
            Admin
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            display: 'none',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            padding: '8px 12px',
            color: 'white',
            cursor: 'pointer',
          }}
          className="mobile-menu-btn"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          style={{
            background: 'rgba(17, 24, 39, 0.95)',
            backdropFilter: 'blur(16px)',
            padding: '20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          }}
          className="mobile-menu"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <a href="#latest-release" style={{ ...mobileNavLinkStyle }} onClick={() => setMobileMenuOpen(false)}>Music</a>
            <a href="#community-quotes" style={{ ...mobileNavLinkStyle }} onClick={() => setMobileMenuOpen(false)}>Community</a>
            <a href="#graffiti" style={{ ...mobileNavLinkStyle }} onClick={() => setMobileMenuOpen(false)}>Gallery</a>
            <a href="#lyric-game" style={{ ...mobileNavLinkStyle }} onClick={() => setMobileMenuOpen(false)}>Game</a>
            <a href="/admin/login" style={{ ...mobileNavLinkStyle }} onClick={() => setMobileMenuOpen(false)}>Admin</a>
          </div>
        </div>
      )}

      <style jsx>{`
        @media (max-width: 768px) {
          .desktop-menu {
            display: none !important;
          }
          .mobile-menu-btn {
            display: block !important;
          }
        }
      `}</style>
    </nav>
  );
}

const navLinkStyle = {
  fontFamily: 'var(--font-condensed)',
  fontSize: '0.95rem',
  fontWeight: 600,
  letterSpacing: '0.05em',
  textTransform: 'uppercase' as const,
  color: 'rgba(255, 255, 255, 0.8)',
  textDecoration: 'none',
  transition: 'all 0.2s ease',
  cursor: 'pointer',
};

const mobileNavLinkStyle = {
  ...navLinkStyle,
  display: 'block',
  padding: '12px 16px',
  background: 'rgba(255, 255, 255, 0.05)',
  borderRadius: '8px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
};
