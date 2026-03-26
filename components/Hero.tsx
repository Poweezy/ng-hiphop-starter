"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface HeroProps {
  slogan: string;
}

export default function Hero({ slogan }: HeroProps) {
  const [particles, setParticles] = useState<{ id: number; style: any }[]>([]);

  useEffect(() => {
    // Generate particles only once on the client
    const newParticles = [...Array(20)].map((_, i) => ({
      id: i,
      style: {
        width: `${Math.random() * 3 + 1}px`,
        height: `${Math.random() * 3 + 1}px`,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        background: i % 3 === 0 ? 'var(--color-yellow)' : i % 3 === 1 ? 'var(--color-purple-light)' : 'var(--color-green-light)',
        opacity: 0.3 + Math.random() * 0.4,
      }
    }));
    setParticles(newParticles);
  }, []);

  return (
    <section id="hero" className="hero-section">
      {/* Living particles */}
      <div className="particles-container" aria-hidden="true">
        {particles.map((p) => (
          <motion.span
            key={p.id}
            style={p.style}
            animate={{
              opacity: [0.3, 0.7, 0.3],
              scale: [1, 1.5, 1],
              y: [0, -20, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="particle"
          />
        ))}
      </div>

      {/* NG LOGO - Background */}
      <motion.div
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: 0.4, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="bg-logo-container"
      >
        <Image
          src="/images/graffiti.png"
          alt="NG Graffiti Logo"
          fill
          sizes="100vw"
          className="bg-logo-image"
          priority
        />
      </motion.div>

      {/* Content */}
      <div className="hero-content">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="hero-slogan"
        >
          {slogan}
        </motion.p>

        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '80px' }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="accent-line"
          aria-hidden="true"
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="cta-container"
        >
          <a href="#latest-release" className="btn btn-primary hero-btn">
            <span>🎵</span> Listen Now
          </a>
          <a href="#latest-release" className="btn btn-secondary hero-btn">
            <span>🔥</span> Latest Drop
          </a>
        </motion.div>
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
          background: var(--gradient-hero);
          position: relative;
          overflow: hidden;
          text-align: center;
          padding: 80px clamp(16px, 4vw, 48px) 120px;
        }

        .particles-container {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 2;
        }

        .particle {
          position: absolute;
          border-radius: 50%;
        }

        .bg-logo-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
          pointer-events: none;
        }

        .bg-logo-image {
          object-fit: cover;
          filter: drop-shadow(0 0 50px rgba(139, 92, 246, 0.4)) brightness(0.7);
        }

        .hero-content {
          position: relative;
          z-index: 10;
          max-width: 800px;
        }

        .hero-slogan {
          font-family: var(--font-condensed);
          font-size: clamp(1.4rem, 4vw, 2.2rem);
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--color-white);
          line-height: 1.2;
          margin-bottom: 24px;
          text-shadow: 0 4px 20px rgba(0, 0, 0, 0.8);
        }

        .accent-line {
          height: 3px;
          background: var(--gradient-green);
          margin: 0 auto 32px;
          box-shadow: 0 0 15px var(--color-green);
          border-radius: 2px;
        }

        .cta-container {
          display: flex;
          gap: 20px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .hero-btn {
          min-width: 180px;
        }

        .scroll-indicator {
          position: absolute;
          bottom: 40px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .scroll-text {
          font-family: var(--font-condensed);
          font-size: 0.75rem;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.5);
        }

        .scroll-line {
          width: 1px;
          height: 40px;
          background: linear-gradient(to bottom, var(--color-purple), transparent);
          animation: dvrScroll 2s ease-in-out infinite;
        }

        @keyframes dvrScroll {
          0% { transform: scaleY(0); transform-origin: top; }
          50% { transform: scaleY(1); transform-origin: top; }
          51% { transform: scaleY(1); transform-origin: bottom; }
          100% { transform: scaleY(0); transform-origin: bottom; }
        }
      `}</style>
    </section>
  );
}

