"use client";

import Image from 'next/image';
import { motion } from 'framer-motion';

interface HeroProps {
  slogan: string;
}

export default function Hero({ slogan }: HeroProps) {
  return (
    <section id="hero" className="hero-section">
      {/* Full-bleed hero art background */}
      <div className="hero-bg" aria-hidden="true">
        <Image
          src="/images/hero-art.webp"
          alt=""
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          quality={85}
          className="hero-bg-img"
          style={{ objectFit: 'cover', objectPosition: 'center top' }}
        />
        <div className="hero-bg-overlay" />
      </div>

      {/* Content */}
      <div className="hero-content">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="hero-brand"
        >
          NERD GAUGE
        </motion.div>

        <motion.h1
          className="hero-slogan"
          aria-label={slogan}
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.08, delayChildren: 0.2 },
            },
          }}
        >
          {slogan.split(' ').map((word, index) => (
            <motion.span
              key={index}
              variants={{
                hidden: { opacity: 0, y: 50 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] } },
              }}
              style={{ display: 'inline-block', marginRight: '0.18em' }}
            >
              {word}
            </motion.span>
          ))}
        </motion.h1>

        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '80px' }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="accent-line"
          aria-hidden="true"
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="cta-container"
        >
          <a href="#latest-release" className="hero-btn-primary">
            <span aria-hidden="true">🎵</span> Listen Now
          </a>
          <a href="/game/best-lyrics" className="hero-btn-ghost">
            <span aria-hidden="true">🏆</span> Join The Competition
          </a>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="hero-value-prop"
        >
          Stream the latest Eswatini hip-hop, join the community, and test your knowledge.
        </motion.p>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="scroll-indicator"
        aria-hidden="true"
      >
        <span className="scroll-text">Scroll</span>
        <div className="scroll-line" />
      </motion.div>

      <style jsx>{`
        .hero-section {
          min-height: 100vh;
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          text-align: center;
          padding: 80px clamp(16px, 4vw, 48px) 120px;
        }

        /* ── Background ── */
        .hero-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
        }


        .hero-bg-overlay {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 50% 40%, rgba(10,5,30,0.2) 0%, transparent 70%),
            linear-gradient(180deg,
              rgba(3,3,5,0.25) 0%,
              rgba(3,3,5,0.10) 40%,
              rgba(3,3,5,0.30) 75%,
              rgba(3,3,5,0.80) 100%
            );
        }

        /* ── Content ── */
        .hero-content {
          position: relative;
          z-index: 10;
          max-width: 1000px;
        }

        .hero-brand {
          font-family: var(--font-condensed);
          font-size: clamp(0.9rem, 2vw, 1.2rem);
          font-weight: 900;
          letter-spacing: 0.4em;
          text-transform: uppercase;
          color: var(--color-green-light);
          margin-bottom: 20px;
          text-shadow: 0 0 24px rgba(16, 185, 129, 0.5);
        }

        .hero-slogan {
          font-family: var(--font-display);
          font-size: clamp(3.2rem, 9vw, 7rem);
          font-weight: 900;
          letter-spacing: -0.02em;
          text-transform: uppercase;
          line-height: 1.0;
          margin-bottom: 28px;
          background: linear-gradient(135deg, #ffffff 0%, #c4b5fd 45%, #f0abfc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-wrap: balance;
          filter: drop-shadow(0 4px 24px rgba(139,92,246,0.35));
        }

        .accent-line {
          height: 3px;
          background: linear-gradient(90deg, var(--color-purple), var(--color-green));
          margin: 0 auto 36px;
          border-radius: 2px;
          box-shadow: 0 0 16px rgba(139,92,246,0.5);
        }

        .cta-container {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
          align-items: center;
        }

        .hero-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 15px 36px;
          border-radius: 50px;
          font-family: var(--font-condensed);
          font-size: 1rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-decoration: none;
          color: white;
          background: linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #6366f1 100%);
          box-shadow: 0 4px 24px rgba(139,92,246,0.5), 0 0 0 1px rgba(168,85,247,0.3);
          transition: all 0.3s ease;
          touch-action: manipulation;
          position: relative;
          overflow: hidden;
        }

        .hero-btn-primary::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, transparent, rgba(255,255,255,0.15), transparent);
          transform: translateX(-100%) skewX(-20deg);
          transition: transform 0.5s ease;
        }

        .hero-btn-primary:hover::before { transform: translateX(150%) skewX(-20deg); }
        .hero-btn-primary:hover {
          transform: translateY(-3px) scale(1.04);
          box-shadow: 0 8px 32px rgba(139,92,246,0.7), 0 0 0 1px rgba(168,85,247,0.5);
        }

        .hero-btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 34px;
          border-radius: 50px;
          font-family: var(--font-condensed);
          font-size: 1rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-decoration: none;
          color: white;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.2);
          backdrop-filter: blur(12px);
          transition: all 0.3s ease;
          touch-action: manipulation;
        }

        .hero-btn-ghost:hover {
          background: rgba(255,255,255,0.12);
          border-color: rgba(255,255,255,0.4);
          transform: translateY(-3px) scale(1.04);
        }

        .hero-value-prop {
          margin-top: 28px;
          font-size: clamp(0.9rem, 2vw, 1.05rem);
          color: rgba(255, 255, 255, 0.55);
          max-width: 520px;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.6;
        }

        .hero-btn-primary:focus-visible,
        .hero-btn-ghost:focus-visible {
          outline: 2px solid var(--color-purple);
          outline-offset: 3px;
        }

        /* ── Scroll indicator ── */
        .scroll-indicator {
          position: absolute;
          bottom: 40px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          z-index: 10;
        }

        .scroll-text {
          font-family: var(--font-condensed);
          font-size: 0.7rem;
          letter-spacing: 0.35em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.45);
        }

        .scroll-line {
          width: 1px;
          height: 44px;
          background: linear-gradient(to bottom, rgba(139,92,246,0.8), transparent);
          animation: dvrScroll 2s ease-in-out infinite;
        }

        @keyframes dvrScroll {
          0%   { transform: scaleY(0); transform-origin: top; }
          50%  { transform: scaleY(1); transform-origin: top; }
          51%  { transform: scaleY(1); transform-origin: bottom; }
          100% { transform: scaleY(0); transform-origin: bottom; }
        }

        @media (max-width: 640px) {
          .hero-slogan { font-size: clamp(2.8rem, 12vw, 4rem); }
          .cta-container { flex-direction: column; align-items: stretch; }
          .hero-btn-primary, .hero-btn-ghost { justify-content: center; }
        }
      `}</style>
    </section>
  );
}

