'use client';

import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import EmptyState from './EmptyState';
import { useScrollReveal } from '@/hooks/useScrollReveal';

interface Song {
    id: string;
    title: string;
    description?: string | null;
    file_url: string;
    cover_url: string;
    distribution_links?: string | null;
    publisher_link?: string | null;
}

interface LatestReleaseProps {
    song: Song | null;
}

export default function LatestRelease({ song }: LatestReleaseProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const { ref, isVisible } = useScrollReveal(0.2);
    const audioRef = useRef<HTMLAudioElement>(null);
    const [bars, setBars] = useState([0.3, 0.5, 0.7, 0.4, 0.6]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPlaying) {
            interval = setInterval(() => {
                setBars([Math.random() * 0.8 + 0.2, Math.random() * 0.8 + 0.2, Math.random() * 0.8 + 0.2, Math.random() * 0.8 + 0.2, Math.random() * 0.8 + 0.2]);
            }, 150);
        }
        return () => clearInterval(interval);
    }, [isPlaying]);

    if (!song) {
        return (
            <section id="latest-release" className="section" style={{ background: 'var(--gradient-dark)' }}>
                <div className="container">
                    <div className="section-badge">Latest Drop</div>
                    <EmptyState
                        icon="🎵"
                        title="No Music Yet"
                        description="New music coming soon. Check back later for the latest releases."
                    />
                </div>
            </section>
        );
    }

    let links: { spotify?: string; apple?: string; distro?: string; publisher?: string } = {};
    if (typeof song.distribution_links === 'string' && song.distribution_links) {
        try { links = JSON.parse(song.distribution_links); } catch { }
    }

    return (
        <section
            id="latest-release"
            className="section"
            style={{
                background: 'linear-gradient(180deg, #0a0a14 0%, #0f0f1e 100%)',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Background accent */}
            <div
                aria-hidden="true"
                style={{
                    position: 'absolute',
                    right: '-200px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '500px',
                    height: '500px',
                    background: 'radial-gradient(ellipse, rgba(4,120,87,0.08) 0%, transparent 70%)',
                    pointerEvents: 'none',
                }}
            />

            <div className="container">
                <div className="section-badge">Latest Drop</div>

                <div
                    ref={ref}
                    className={`scroll-reveal ${isVisible ? 'visible' : ''}`}
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'clamp(200px, 35%, 360px) 1fr',
                        gap: 'clamp(32px, 5vw, 64px)',
                        alignItems: 'start',
                    }}
                >
                    {/* Cover Art */}
                    <div
                        style={{
                            position: 'relative',
                            aspectRatio: '1/1',
                            borderRadius: '20px',
                            overflow: 'hidden',
                            boxShadow: '0 25px 80px rgba(0,0,0,0.8), 0 0 40px rgba(139,92,246,0.3)',
                            transition: 'all 0.3s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05) rotate(2deg)';
                            e.currentTarget.style.boxShadow = '0 30px 100px rgba(0,0,0,0.9), 0 0 60px rgba(139,92,246,0.5)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                            e.currentTarget.style.boxShadow = '0 25px 80px rgba(0,0,0,0.8), 0 0 40px rgba(139,92,246,0.3)';
                        }}
                    >
                        <Image
                            src={song.cover_url}
                            alt={`${song.title} cover art`}
                            fill
                            style={{ objectFit: 'cover' }}
                            sizes="(max-width: 768px) 100vw, 35vw"
                            loading="lazy"
                        />
                        {/* Overlay shimmer */}
                        <div
                            aria-hidden="true"
                            style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'linear-gradient(135deg, rgba(139,92,246,0.2) 0%, transparent 50%, rgba(236,72,153,0.2) 100%)',
                                mixBlendMode: 'overlay',
                            }}
                        />
                        {isPlaying && (
                            <div
                                aria-hidden="true"
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    border: '3px solid rgba(16,185,129,0.6)',
                                    borderRadius: '20px',
                                    animation: 'glow 2s ease-in-out infinite',
                                }}
                            />
                        )}
                        {/* Visualizer bars */}
                        {isPlaying && (
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: '16px',
                                    right: '16px',
                                    display: 'flex',
                                    gap: '4px',
                                    alignItems: 'flex-end',
                                    height: '32px',
                                }}
                            >
                                {bars.map((h, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            width: '4px',
                                            height: `${h * 100}%`,
                                            background: 'linear-gradient(to top, #10B981, #34D399)',
                                            borderRadius: '2px',
                                            transition: 'height 0.15s ease',
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Song Info */}
                    <div style={{ paddingTop: '8px' }}>
                        <p
                            style={{
                                fontFamily: 'var(--font-condensed)',
                                fontSize: '0.8rem',
                                letterSpacing: '0.2em',
                                textTransform: 'uppercase',
                                color: 'var(--color-green-light)',
                                marginBottom: '12px',
                            }}
                        >
                            Now Available
                        </p>

                        <h2
                            className="section-title"
                            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', marginBottom: '16px' }}
                        >
                            {song.title}
                        </h2>

                        {song.description && (
                            <p
                                style={{
                                    color: 'rgba(255,255,255,0.65)',
                                    fontSize: '1rem',
                                    lineHeight: 1.7,
                                    maxWidth: '460px',
                                    marginBottom: '28px',
                                }}
                            >
                                {song.description}
                            </p>
                        )}

                        {/* Audio Player */}
                        <div style={{ marginBottom: '32px' }}>
                            <p
                                style={{
                                    fontFamily: 'var(--font-condensed)',
                                    fontSize: '0.75rem',
                                    letterSpacing: '0.15em',
                                    textTransform: 'uppercase',
                                    color: 'var(--color-grey-blue)',
                                    marginBottom: '12px',
                                }}
                            >
                                {isPlaying ? '▶ Now Playing' : '⏸ Stream Preview'}
                            </p>
                            <div
                                style={{
                                    background: 'rgba(17, 24, 39, 0.6)',
                                    border: '1px solid rgba(139, 92, 246, 0.2)',
                                    borderRadius: '16px',
                                    padding: '16px',
                                    backdropFilter: 'blur(16px)',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                                }}
                            >
                                <audio
                                    ref={audioRef}
                                    controls
                                    src={song.file_url}
                                    preload="metadata"
                                    onPlay={() => setIsPlaying(true)}
                                    onPause={() => setIsPlaying(false)}
                                    style={{ width: '100%' }}
                                    aria-label={`Preview of ${song.title}`}
                                />
                            </div>
                        </div>

                        {/* Distribution Links */}
                        <div>
                            <p
                                style={{
                                    fontFamily: 'var(--font-condensed)',
                                    fontSize: '0.75rem',
                                    letterSpacing: '0.15em',
                                    textTransform: 'uppercase',
                                    color: 'var(--color-grey-blue)',
                                    marginBottom: '14px',
                                }}
                            >
                                Stream & Download
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                                {links.spotify && (
                                    <a
                                        href={links.spotify}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-badge"
                                        aria-label="Listen on Spotify"
                                    >
                                        <SpotifyIcon /> Spotify
                                    </a>
                                )}
                                {links.apple && (
                                    <a
                                        href={links.apple}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-badge"
                                        aria-label="Listen on Apple Music"
                                    >
                                        <AppleIcon /> Apple Music
                                    </a>
                                )}
                                {links.distro && (
                                    <a
                                        href={links.distro}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-badge"
                                        aria-label="Distro Platform"
                                    >
                                        🌐 Distribution
                                    </a>
                                )}
                                {(links.publisher || song.publisher_link) && (
                                    <a
                                        href={links.publisher || song.publisher_link || '#'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-badge"
                                        aria-label="Publisher"
                                    >
                                        📜 Publisher
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Responsive override for mobile */}
            <style dangerouslySetInnerHTML={{
                __html: `
        @media (max-width: 640px) {
          #latest-release .container > div:last-child {
            grid-template-columns: 1fr !important;
          }
        }
      `}} />
        </section>
    );
}

function SpotifyIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
        </svg>
    );
}

function AppleIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
        </svg>
    );
}
