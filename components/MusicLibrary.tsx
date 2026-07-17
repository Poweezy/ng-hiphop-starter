"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
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

interface MusicLibraryProps {
    songs: Song[];
}

export default function MusicLibrary({ songs }: MusicLibraryProps) {
    const [playingId, setPlayingId] = useState<string | null>(null);
    const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});

    // Keep visualizers animating while playing
    const [bars, setBars] = useState([0.3, 0.5, 0.7, 0.4, 0.6]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (playingId) {
            interval = setInterval(() => {
                setBars(prev => prev.map(() => Math.random() * 0.8 + 0.2));
            }, 100);
        }
        return () => clearInterval(interval);
    }, [playingId]);

    const handlePlay = (id: string) => {
        // Pause all others
        Object.keys(audioRefs.current).forEach(key => {
            if (key !== id && audioRefs.current[key]) {
                audioRefs.current[key]?.pause();
            }
        });
        setPlayingId(id);
    };

    const handlePause = (id: string) => {
        if (playingId === id) {
            setPlayingId(null);
        }
    };

    if (!songs || songs.length === 0) {
        return (
            <section className="section library-section" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
                <div className="container">
                    <EmptyState
                        icon="🎧"
                        title="Library Empty"
                        description="No music has been uploaded to the platform yet."
                    />
                </div>
            </section>
        );
    }

    return (
        <section className="section library-section pt-32 pb-24">
            {/* Background elements */}
            <div className="bg-glow" aria-hidden="true" />
            
            <div className="container relative z-10">
                <div className="library-header text-center mb-16">
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="section-badge badge-center"
                    >
                        The Vault
                    </motion.div>
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="library-title"
                    >
                        Music Library
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="library-subtitle"
                    >
                        Stream all our releases, from the classics to the latest drops.
                    </motion.p>
                </div>

                <div className="library-grid">
                    {songs.map((song, idx) => {
                        let links: { spotify?: string; apple?: string; distro?: string; publisher?: string } = {};
                        if (typeof song.distribution_links === 'string' && song.distribution_links) {
                            try { links = JSON.parse(song.distribution_links); } catch { }
                        }
                        const isPlaying = playingId === song.id;

                        return (
                            <motion.div
                                key={song.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05, duration: 0.5 }}
                                className={`track-card ${isPlaying ? 'playing' : ''}`}
                            >
                                <div className="card-inner">
                                    <div className="cover-wrapper group">
                                        <div className="image-sizer">
                                            <Image
                                                src={song.cover_url}
                                                alt={song.title}
                                                fill
                                                sizes="(max-width: 768px) 100vw, 33vw"
                                                className={`object-cover transition-transform ${isPlaying ? 'scale-110' : 'group-hover-scale'}`}
                                            />
                                        </div>
                                        <div className="cover-overlay" />
                                        
                                        {/* Play State Indicator */}
                                        <AnimatePresence>
                                            {isPlaying && (
                                                <motion.div 
                                                    initial={{ opacity: 0 }} 
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="now-playing-indicator"
                                                >
                                                    <div className="bars">
                                                        {bars.map((h, i) => (
                                                            <motion.div
                                                                key={i}
                                                                animate={{ height: `${h * 16}px` }}
                                                                className="bar"
                                                            />
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                    
                                    <div className="track-info">
                                        <h3 className="track-title">{song.title}</h3>
                                        {song.description && (
                                            <p className="track-desc line-clamp-2">{song.description}</p>
                                        )}
                                        
                                        <div className="player-wrapper">
                                            <audio
                                                ref={el => { audioRefs.current[song.id] = el; }}
                                                controls
                                                src={song.file_url}
                                                preload="none"
                                                onPlay={() => handlePlay(song.id)}
                                                onPause={() => handlePause(song.id)}
                                                className="custom-audio"
                                            />
                                        </div>

                                        {/* Show links if any exist */}
                                        {(links.spotify || links.apple || links.distro || song.publisher_link) && (
                                            <div className="streaming-links">
                                                {links.spotify && (
                                                    <a href={links.spotify} target="_blank" rel="noopener noreferrer" className="stream-btn" aria-label="Spotify">
                                                        <SpotifyIcon />
                                                    </a>
                                                )}
                                                {links.apple && (
                                                    <a href={links.apple} target="_blank" rel="noopener noreferrer" className="stream-btn" aria-label="Apple Music">
                                                        <AppleIcon />
                                                    </a>
                                                )}
                                                {links.distro && (
                                                    <a href={links.distro} target="_blank" rel="noopener noreferrer" className="stream-btn text-xs font-bold uppercase tracking-widest px-3">
                                                        Distro
                                                    </a>
                                                )}
                                                {song.publisher_link && (
                                                    <a href={song.publisher_link} target="_blank" rel="noopener noreferrer" className="stream-btn text-xs font-bold uppercase tracking-widest px-3">
                                                        Pub
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            <style jsx>{`
                .library-section {
                    position: relative;
                    min-height: 100vh;
                    background: #050508;
                    overflow: hidden;
                }
                .pt-32 { padding-top: 120px; }
                .pb-24 { padding-bottom: 96px; }

                .bg-glow {
                    position: absolute;
                    top: -20vh;
                    right: -10vw;
                    width: 70vw;
                    height: 70vw;
                    background: radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 60%);
                    pointer-events: none;
                }

                .library-header { text-align: center; margin-bottom: 4rem; }
                .badge-center { display: inline-block; margin: 0 auto 1.5rem auto; }
                
                .library-title {
                    font-family: var(--font-condensed);
                    font-size: clamp(3rem, 8vw, 4.5rem);
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: -0.02em;
                    color: white;
                    margin-bottom: 1rem;
                    line-height: 1;
                }

                .library-subtitle {
                    font-size: 1.1rem;
                    color: rgba(255, 255, 255, 0.6);
                    max-width: 600px;
                    margin: 0 auto;
                }

                .library-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 32px;
                }

                .track-card {
                    perspective: 1000px;
                }
                
                .card-inner {
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 24px;
                    overflow: hidden;
                    transition: all 0.4s ease;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                }

                .card-inner:hover {
                    border-color: rgba(139, 92, 246, 0.3);
                    background: rgba(255, 255, 255, 0.04);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.4), 0 0 20px rgba(139, 92, 246, 0.1);
                    transform: translateY(-5px);
                }

                .track-card.playing .card-inner {
                    border-color: var(--color-green-light);
                    background: rgba(16, 185, 129, 0.05);
                    box-shadow: 0 0 30px rgba(16, 185, 129, 0.1);
                }

                .cover-wrapper {
                    position: relative;
                    width: 100%;
                    overflow: hidden;
                }
                
                .image-sizer {
                    position: relative;
                    aspect-ratio: 1/1;
                    width: 100%;
                }

                .object-cover { object-fit: cover; }
                .transition-transform { transition: transform 0.7s ease; }
                .scale-110 { transform: scale(1.1); }
                
                /* We use group-hover-scale target on hover */
                .track-card:hover .group-hover-scale {
                    transform: scale(1.05);
                }

                .cover-overlay {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%);
                    pointer-events: none;
                }

                .now-playing-indicator {
                    position: absolute;
                    bottom: 16px;
                    right: 16px;
                    background: rgba(0,0,0,0.7);
                    backdrop-filter: blur(8px);
                    padding: 8px 12px;
                    border-radius: 12px;
                    border: 1px solid rgba(16, 185, 129, 0.3);
                }

                .bars {
                    display: flex;
                    align-items: flex-end;
                    gap: 3px;
                    height: 16px;
                }

                .bar {
                    width: 4px;
                    background: var(--color-green-light);
                    border-radius: 2px;
                }

                .track-info {
                    padding: 24px;
                    display: flex;
                    flex-direction: column;
                    flex-grow: 1;
                }

                .track-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: white;
                    margin-bottom: 8px;
                    line-height: 1.2;
                }

                .track-desc {
                    color: rgba(255,255,255,0.5);
                    font-size: 0.95rem;
                    line-height: 1.5;
                    margin-bottom: 24px;
                }

                .line-clamp-2 {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                .player-wrapper {
                    margin-top: auto;
                    margin-bottom: 16px;
                    background: rgba(0,0,0,0.3);
                    border-radius: 99px;
                    padding: 4px;
                }

                .custom-audio {
                    width: 100%;
                    height: 40px;
                    filter: invert(1) hue-rotate(180deg) brightness(1.2) contrast(1.2);
                    outline: none;
                }

                .streaming-links {
                    display: flex;
                    gap: 8px;
                    padding-top: 16px;
                    border-top: 1px solid rgba(255,255,255,0.05);
                }

                .stream-btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 40px;
                    height: 40px;
                    border-radius: 20px;
                    background: rgba(255,255,255,0.05);
                    color: rgba(255,255,255,0.7);
                    transition: all 0.2s ease;
                    text-decoration: none;
                }
                
                .text-xs { font-size: 0.75rem; }
                .font-bold { font-weight: 700; }
                .uppercase { text-transform: uppercase; }
                .tracking-widest { letter-spacing: 0.1em; }
                .px-3 { padding-left: 12px; padding-right: 12px; }

                .stream-btn:hover {
                    background: var(--color-purple);
                    color: white;
                    transform: translateY(-2px);
                }
            `}</style>
        </section>
    );
}

function SpotifyIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
        </svg>
    );
}

function AppleIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
        </svg>
    );
}
