"use client";

import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import EmptyState from './EmptyState';

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
    const audioRef = useRef<HTMLAudioElement>(null);
    const [bars, setBars] = useState([0.3, 0.5, 0.7, 0.4, 0.6]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPlaying) {
            interval = setInterval(() => {
                setBars(prev => prev.map(() => Math.random() * 0.8 + 0.2));
            }, 100);
        }
        return () => clearInterval(interval);
    }, [isPlaying]);

    if (!song) {
        return (
            <section id="latest-release" className="section release-section">
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
        <section id="latest-release" className="section release-section">
            {/* Background accent */}
            <div className="release-bg-accent" aria-hidden="true" />

            <div className="container">
                <div className="section-badge">Latest Drop</div>

                <div className="release-grid">
                    {/* Cover Art Container */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="cover-container"
                    >
                        <div className={`cover-wrapper ${isPlaying ? 'is-playing' : ''}`}>
                            <Image
                                src={song.cover_url}
                                alt={`${song.title} cover art`}
                                fill
                                style={{ objectFit: 'cover' }}
                                sizes="(max-width: 768px) 100vw, 35vw"
                                priority
                            />
                            {/* Overlay shimmer */}
                            <div className="cover-shimmer" aria-hidden="true" />
                            
                            {/* Visualizer bars overlay */}
                            <AnimatePresence>
                                {isPlaying && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="visualizer-overlay"
                                    >
                                        {bars.map((h, i) => (
                                            <motion.div
                                                key={i}
                                                animate={{ height: `${h * 100}%` }}
                                                className="visualizer-bar"
                                            />
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>

                    {/* Song Info */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="info-container"
                    >
                        <p className="release-status">Now Available</p>
                        <h2 className="section-title release-title">{song.title}</h2>

                        {song.description && (
                            <p className="release-description">{song.description}</p>
                        )}

                        {/* Audio Player */}
                        <div className="player-container">
                            <p className="player-label">{isPlaying ? '▶ Now Playing' : '⏸ Stream Preview'}</p>
                            <div className="audio-wrapper">
                                <audio
                                    ref={audioRef}
                                    controls
                                    src={song.file_url}
                                    preload="metadata"
                                    onPlay={() => setIsPlaying(true)}
                                    onPause={() => setIsPlaying(false)}
                                    className="custom-audio"
                                    aria-label={`Preview of ${song.title}`}
                                />
                            </div>
                        </div>

                        {/* Distribution Links */}
                        <div className="links-container">
                            <p className="links-label">Stream & Download</p>
                            <div className="links-grid">
                                {links.spotify && (
                                    <a href={links.spotify} target="_blank" rel="noopener noreferrer" className="btn-badge link-btn">
                                        <SpotifyIcon /> Spotify
                                    </a>
                                )}
                                {links.apple && (
                                    <a href={links.apple} target="_blank" rel="noopener noreferrer" className="btn-badge link-btn">
                                        <AppleIcon /> Apple Music
                                    </a>
                                )}
                                {links.distro && (
                                    <a href={links.distro} target="_blank" rel="noopener noreferrer" className="btn-badge link-btn">
                                        🌐 Distribution
                                    </a>
                                )}
                                {(links.publisher || song.publisher_link) && (
                                    <a href={links.publisher || song.publisher_link || '#'} target="_blank" rel="noopener noreferrer" className="btn-badge link-btn">
                                        📜 Publisher
                                    </a>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            <style jsx>{`
                .release-section {
                    background: linear-gradient(180deg, #0a0a14 0%, #0f0f1e 100%);
                    position: relative;
                    overflow: hidden;
                }

                .release-bg-accent {
                    position: absolute;
                    right: -200px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 600px;
                    height: 600px;
                    background: radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%);
                    pointer-events: none;
                }

                .release-grid {
                    display: grid;
                    grid-template-columns: clamp(280px, 40%, 420px) 1fr;
                    gap: clamp(40px, 8vw, 80px);
                    align-items: center;
                }

                @media (max-width: 900px) {
                    .release-grid {
                        grid-template-columns: 1fr;
                    }
                }

                .cover-container {
                    perspective: 1000px;
                }

                .cover-wrapper {
                    position: relative;
                    aspect-ratio: 1/1;
                    border-radius: 24px;
                    overflow: hidden;
                    box-shadow: 0 30px 60px rgba(0, 0, 0, 0.8), 0 0 20px rgba(139, 92, 246, 0.2);
                    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .cover-wrapper.is-playing {
                    transform: scale(1.02) rotateY(5deg);
                    box-shadow: 0 40px 100px rgba(0, 0, 0, 0.9), 0 0 50px rgba(139, 92, 246, 0.4);
                    border: 1px solid rgba(139, 92, 246, 0.3);
                }

                .cover-shimmer {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%, rgba(255, 255, 255, 0.05) 100%);
                    mix-blend-mode: overlay;
                    pointer-events: none;
                }

                .visualizer-overlay {
                    position: absolute;
                    bottom: 24px;
                    right: 24px;
                    display: flex;
                    gap: 6px;
                    align-items: flex-end;
                    height: 48px;
                    padding: 8px;
                    background: rgba(0, 0, 0, 0.4);
                    backdrop-filter: blur(8px);
                    border-radius: 12px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .visualizer-bar {
                    width: 5px;
                    background: linear-gradient(to top, var(--color-purple), var(--color-green-light));
                    border-radius: 3px;
                }

                .info-container {
                    padding: 20px 0;
                }

                .release-status {
                    font-family: var(--font-condensed);
                    font-size: 0.85rem;
                    font-weight: 700;
                    letter-spacing: 0.2em;
                    text-transform: uppercase;
                    color: var(--color-green-light);
                    margin-bottom: 12px;
                }

                .release-title {
                    font-size: clamp(2.5rem, 6vw, 4.5rem);
                    margin-bottom: 24px;
                    line-height: 0.95;
                }

                .release-description {
                    color: rgba(255, 255, 255, 0.6);
                    font-size: 1.1rem;
                    line-height: 1.7;
                    max-width: 540px;
                    margin-bottom: 40px;
                }

                .player-container {
                    margin-bottom: 40px;
                    max-width: 500px;
                }

                .player-label {
                    font-family: var(--font-condensed);
                    font-size: 0.75rem;
                    letter-spacing: 0.15em;
                    text-transform: uppercase;
                    color: var(--color-grey-blue);
                    margin-bottom: 16px;
                }

                .audio-wrapper {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                    padding: 8px;
                    backdrop-filter: blur(20px);
                }

                .custom-audio {
                    width: 100%;
                    height: 40px;
                    filter: invert(1) hue-rotate(180deg) brightness(1.5);
                }

                .links-container {
                    max-width: 600px;
                }

                .links-label {
                    font-family: var(--font-condensed);
                    font-size: 0.75rem;
                    letter-spacing: 0.15em;
                    text-transform: uppercase;
                    color: var(--color-grey-blue);
                    margin-bottom: 16px;
                }

                .links-grid {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                }

                .link-btn {
                    padding: 12px 24px;
                    font-size: 0.9rem;
                    background: rgba(255, 255, 255, 0.05);
                    border-color: rgba(255, 255, 255, 0.1);
                }

                .link-btn:hover {
                    background: var(--color-purple);
                    border-color: var(--color-purple);
                    transform: translateY(-4px) scale(1.05);
                }
            `}</style>
        </section>
    );
}

function SpotifyIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ marginRight: '8px' }}>
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
        </svg>
    );
}

function AppleIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ marginRight: '8px' }}>
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
        </svg>
    );
}
