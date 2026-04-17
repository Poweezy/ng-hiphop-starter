"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
      className={`nav-main ${scrolled ? 'scrolled' : ''}`}
    >
      <div className="nav-container">
        {/* Logo */}
        <a href="/" className="nav-logo">
          <span className="logo-text">NG</span>
        </a>

        {/* Desktop Menu */}
        <div className="desktop-menu">
          <a href="/#latest-release" className="nav-link">Music</a>
          <a href="/library" className="nav-link">Library</a>
          <a href="/#community-quotes" className="nav-link">Community</a>
          <a href="/#graffiti" className="nav-link">Gallery</a>
          <a href="/#lyric-game" className="nav-link">Game</a>
          <a href="/admin/login" className="nav-link nav-link-admin">Admin</a>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="mobile-menu-btn"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mobile-menu"
          >
            <div className="mobile-menu-links">
              <a href="/#latest-release" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Music</a>
              <a href="/library" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Library</a>
              <a href="/#community-quotes" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Community</a>
              <a href="/#graffiti" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Gallery</a>
              <a href="/#lyric-game" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Game</a>
              <a href="/admin/login" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Admin</a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .nav-main {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          padding: 24px 0;
          background: transparent;
        }

        .nav-main.scrolled {
          padding: 12px 0;
          background: rgba(3, 3, 5, 0.6);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8);
        }

        .nav-container {
          max-width: var(--container-max);
          margin: 0 auto;
          padding: 0 clamp(16px, 4vw, 48px);
          display: flex;
          alignItems: center;
          justify-content: space-between;
        }

        .nav-logo {
          text-decoration: none;
        }

        .logo-text {
          font-family: var(--font-cursive);
          font-size: 2.2rem;
          background: linear-gradient(135deg, var(--color-purple-light), var(--color-accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-weight: 700;
          filter: drop-shadow(0 0 10px rgba(139, 92, 246, 0.3));
        }

        .desktop-menu {
          display: flex;
          gap: 32px;
          align-items: center;
        }

        .nav-link {
          font-family: var(--font-condensed);
          font-size: 0.95rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          transition: all 0.2s ease;
          position: relative;
        }

        .nav-link:hover {
          color: var(--color-white);
        }

        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 0;
          height: 2px;
          background: var(--color-purple);
          transition: width 0.3s ease;
        }

        .nav-link:hover::after {
          width: 100%;
        }

        .nav-link-admin {
          background: rgba(139, 92, 246, 0.1);
          padding: 8px 24px;
          border-radius: 99px;
          border: 1px solid rgba(139, 92, 246, 0.4);
          color: var(--color-purple-light);
        }

        .nav-link-admin:hover {
          background: var(--color-purple);
          color: var(--color-white);
          border-color: var(--color-purple);
          box-shadow: var(--shadow-glow-purple);
        }

        .mobile-menu-btn {
          display: none;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          width: 44px;
          height: 44px;
          color: white;
          cursor: pointer;
          font-size: 1.2rem;
          transition: all 0.2s ease;
        }

        .mobile-menu-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .mobile-menu {
          background: rgba(10, 10, 15, 0.98);
          backdrop-filter: blur(24px);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          overflow: hidden;
        }

        .mobile-menu-links {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 24px;
        }

        .mobile-nav-link {
          font-family: var(--font-condensed);
          font-size: 1.1rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--color-white);
          padding: 16px 20px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .mobile-nav-link:active {
          background: var(--color-purple);
          transform: scale(0.98);
        }

        @media (max-width: 768px) {
          .desktop-menu {
            display: none;
          }
          .mobile-menu-btn {
            display: block;
          }
        }
      `}</style>
    </nav>
  );
}
