'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

interface HeroProps {
  slogan: string;
}

export default function Hero({ slogan }: HeroProps) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const [particles, setParticles] = useState<React.ReactNode[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!visible) return;
    // Generate particles only once when visible
    const newParticles = [...Array(12)].map((_, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            width: `${Math.random() * 3 + 1}px`,
            height: `${Math.random() * 3 + 1}px`,
            borderRadius: '50%',
            background: i % 3 === 0 ? 'var(--color-yellow)' : i % 3 === 1 ? 'var(--color-purple-light)' : 'var(--color-green-light)',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: 0.4 + Math.random() * 0.4,
            animation: `glowPulse ${2 + Math.random() * 3}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 2}s`,
          }}
        />
      ));
      setParticles(newParticles);
  }, [visible]);

  return (
    <section
      id="hero"
      style={{
        minHeight: '100vh',
        minHeight: '100dvh', // Dynamic viewport height for mobile
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--gradient-hero)',
        position: 'relative',
        overflow: 'hidden',
        textAlign: 'center',
        padding: '80px clamp(16px, 4vw, 48px) 120px',
      }}
      ref={ref}
    >
      {/* Living particles */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {particles}
      </div>

      {/* NG LOGO - Background */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: visible ? 0.5 : 0,
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          width: '100vw',
          height: '100%',
          zIndex: 1,
        }}
      >
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <Image
            src="/images/graffiti.png"
            alt="Nerd Gauge Graffiti Logo"
            fill
            sizes="100vw"
            style={{ objectFit: 'cover', filter: 'drop-shadow(0 0 30px rgba(106,13,173,0.6))' }}
            priority
          />
        </div>
      </div>

      {/* Slogan */}
      <p
        style={{
          fontFamily: 'var(--font-condensed)',
          fontSize: 'clamp(1.1rem, 2.5vw, 1.6rem)',
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.95)',
          maxWidth: '600px',
          marginTop: '28px',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s',
          position: 'relative',
          zIndex: 10,
          textShadow: '0 2px 8px rgba(0,0,0,0.8), 0 4px 16px rgba(0,0,0,0.6)',
        }}
      >
        {slogan}
      </p>

      {/* Accent line */}
      <div
        style={{
          width: visible ? '80px' : '0px',
          height: '2px',
          background: 'var(--color-green)',
          margin: '20px auto',
          transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.4s',
          boxShadow: '0 0 10px var(--color-green)',
          position: 'relative',
          zIndex: 10,
        }}
        aria-hidden="true"
      />

      {/* CTA Buttons */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          justifyContent: 'center',
          marginTop: '16px',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.5s',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <a 
          href="#latest-release" 
          className="btn btn-primary"
          style={{
            background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
            boxShadow: '0 8px 30px rgba(16, 185, 129, 0.4)',
          }}
        >
          <span>🎵</span> Listen Now
        </a>
        <a 
          href="#latest-release" 
          className="btn btn-secondary"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <span>🔥</span> Latest Drop
        </a>
      </div>

      {/* Scroll indicator */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: '60px',
          left: '50%',
          transform: 'translateX(-50%)',
          opacity: visible ? 0.5 : 0,
          transition: 'opacity 1s ease 1s',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-condensed)',
            fontSize: '0.7rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.5)',
          }}
        >
          Scroll
        </span>
        <div
          style={{
            width: '1px',
            height: '30px',
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.5), transparent)',
            animation: 'fadeInDown 1.5s ease infinite',
          }}
        />
      </div>
    </section>
  );
}

