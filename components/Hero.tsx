'use client';

import { useEffect, useRef, useState } from 'react';

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
      // Generate particles only on the client
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
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      id="hero"
      style={{
        minHeight: '100vh',
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
      {/* Graffiti Texture Overlay */}
      <div className="graffiti-overlay" aria-hidden="true" />

      {/* Radial glow behind logo */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -60%)',
          width: '600px',
          height: '600px',
          background:
            'radial-gradient(ellipse, rgba(106,13,173,0.35) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Living particles */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {particles}
      </div>

      {/* NG LOGO */}
      <div
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(-30px)',
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          marginBottom: '8px',
        }}
      >
        <h1
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            gap: '4px',
            lineHeight: 1,
          }}
        >
          {/* "NG" in cursive Dancing Script with gradient */}
          <span
            style={{
              fontFamily: 'var(--font-cursive)',
              fontSize: 'clamp(5rem, 14vw, 11rem)',
              background: 'linear-gradient(135deg, #a855f7 0%, #6A0DAD 40%, #3b82f6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: 0.9,
              position: 'relative',
              display: 'inline-block',
              filter: 'drop-shadow(0 0 30px rgba(106,13,173,0.6))',
            }}
          >
            NG
            {/* Paint drip effect under G */}
            <DripsEffect />
          </span>
        </h1>

        {/* NATION subtitle */}
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.2rem, 3.5vw, 2.2rem)',
            letterSpacing: '0.5em',
            color: 'rgba(255,255,255,0.55)',
            marginTop: '-10px',
            textTransform: 'uppercase',
          }}
        >
          Nation
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
          color: 'rgba(255,255,255,0.85)',
          maxWidth: '600px',
          marginTop: '28px',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s',
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
        }}
      >
        <a href="#latest-release" className="btn btn-primary">
          <span>🎵</span> Listen Now
        </a>
        <a href="#latest-release" className="btn btn-secondary">
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

function DripsEffect() {
  return (
    <svg
      aria-hidden="true"
      style={{
        position: 'absolute',
        bottom: '-14px',
        right: '8px',
        width: '40px',
        height: '20px',
        overflow: 'visible',
      }}
      viewBox="0 0 40 20"
      fill="none"
    >
      {/* Paint drips */}
      <path d="M8 0 Q8 8 6 14 Q5 18 7 19 Q9 20 10 17 Q11 12 10 0" fill="#6A0DAD" opacity="0.9" />
      <path d="M20 0 Q19 10 18 16 Q17 20 19 20 Q21 20 21 16 Q21 10 20 0" fill="#3b82f6" opacity="0.8" />
      <path d="M32 0 Q33 6 35 12 Q36 17 34 18 Q32 19 31 15 Q30 10 31 0" fill="#a855f7" opacity="0.7" />
    </svg>
  );
}
