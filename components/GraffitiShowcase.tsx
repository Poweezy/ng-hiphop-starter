'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';

interface GraffitiItem {
    id: string;
    image_url: string;
    artist_name: string;
}

interface GraffitiShowcaseProps {
    items: GraffitiItem[];
}

const MAX_FILE_SIZE_MB = 5;

export default function GraffitiShowcase({ items }: GraffitiShowcaseProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [artistName, setArtistName] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [honeypot, setHoneypot] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [visible, setVisible] = useState(false);
    const sectionRef = useRef<HTMLElement>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setVisible(true); },
            { threshold: 0.15 }
        );
        if (sectionRef.current) observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, []);

    const startCarousel = useCallback(() => {
        if (items.length <= 1) return;
        intervalRef.current = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % items.length);
        }, 4000);
    }, [items.length]);

    useEffect(() => {
        startCarousel();
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [startCarousel]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            setStatus('error');
            setMessage(`Image must be under ${MAX_FILE_SIZE_MB}MB`);
            return;
        }
        if (!f.type.startsWith('image/')) {
            setStatus('error');
            setMessage('Only image files are accepted (JPG, PNG, WEBP)');
            return;
        }
        setFile(f);
        setPreview(URL.createObjectURL(f));
        setStatus('idle');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (honeypot || !file || !artistName.trim()) return;

        setStatus('loading');
        const formData = new FormData();
        formData.append('image', file);
        formData.append('artistName', artistName.trim());

        try {
            const res = await fetch('/api/graffiti', { method: 'POST', body: formData });
            const data = await res.json();
            if (res.ok) {
                setStatus('success');
                setMessage("🎨 Graffiti submitted! Pending admin approval.");
                setArtistName(''); setFile(null); setPreview(null);
            } else {
                setStatus('error');
                setMessage(data.message || 'Upload failed. Try again.');
            }
        } catch {
            setStatus('error');
            setMessage('Network error. Please try again.');
        }
        setTimeout(() => setStatus('idle'), 5000);
    };

    return (
        <section
            id="graffiti"
            ref={sectionRef}
            className="section"
            style={{
                background: 'linear-gradient(135deg, #0a0a14 50%, #1a0a2e 100%)',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Purple/Black split bg accent */}
            <div
                aria-hidden="true"
                style={{
                    position: 'absolute',
                    top: 0, right: 0,
                    width: '40%', height: '100%',
                    background: 'linear-gradient(135deg, transparent 0%, rgba(106,13,173,0.08) 100%)',
                    pointerEvents: 'none',
                }}
            />

            <div className="container">
                <div style={{ textAlign: 'center', marginBottom: 'clamp(40px, 6vw, 64px)' }}>
                    <div className="section-badge">Graffiti Wall</div>
                    <h2 className="section-title">The Community<br />Canvas</h2>
                    <p className="section-subtitle" style={{ margin: '0 auto' }}>
                        Fan-submitted street art, approved and showcased here.
                    </p>
                </div>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 'clamp(32px, 5vw, 64px)',
                        alignItems: 'start',
                    }}
                >
                    {/* Carousel */}
                    <div
                        style={{
                            opacity: visible ? 1 : 0,
                            transform: visible ? 'translateY(0)' : 'translateY(30px)',
                            transition: 'all 0.7s cubic-bezier(0.4,0,0.2,1)',
                        }}
                    >
                        {items.length > 0 ? (
                            <div style={{ position: 'relative' }}>
                                <div
                                    className="spray-frame"
                                    style={{ aspectRatio: '4/3', position: 'relative', overflow: 'hidden', borderRadius: '6px' }}
                                >
                                    <Image
                                        src={items[currentIndex].image_url}
                                        alt={`Graffiti by ${items[currentIndex].artist_name}`}
                                        fill
                                        style={{ objectFit: 'cover', transition: 'opacity 0.5s ease' }}
                                        sizes="(max-width: 768px) 100vw, 50vw"
                                        loading="lazy"
                                    />
                                    {/* Tag label */}
                                    <div
                                        style={{
                                            position: 'absolute',
                                            bottom: 0, left: 0, right: 0,
                                            background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
                                            padding: '32px 20px 16px',
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontFamily: 'var(--font-cursive)',
                                                fontSize: '1.4rem',
                                                color: 'var(--color-yellow)',
                                                textShadow: '0 0 10px rgba(250,204,21,0.5)',
                                            }}
                                        >
                                            {items[currentIndex].artist_name}
                                        </span>
                                    </div>
                                </div>

                                {/* Carousel dots */}
                                {items.length > 1 && (
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '16px' }}>
                                        {items.map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => {
                                                    setCurrentIndex(i);
                                                    if (intervalRef.current) clearInterval(intervalRef.current);
                                                    startCarousel();
                                                }}
                                                aria-label={`Show graffiti ${i + 1}`}
                                                style={{
                                                    width: i === currentIndex ? '24px' : '8px',
                                                    height: '8px',
                                                    borderRadius: '4px',
                                                    background: i === currentIndex ? 'var(--color-purple)' : 'rgba(255,255,255,0.2)',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.3s ease',
                                                    padding: 0,
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div
                                className="spray-frame"
                                style={{
                                    aspectRatio: '4/3',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexDirection: 'column',
                                    gap: '16px',
                                    background: 'rgba(106,13,173,0.1)',
                                    color: 'var(--color-grey-blue)',
                                }}
                            >
                                <span style={{ fontSize: '3rem' }}>🎨</span>
                                <p>No artwork yet. Be the first to submit!</p>
                            </div>
                        )}
                    </div>

                    {/* Upload Form */}
                    <div
                        style={{
                            opacity: visible ? 1 : 0,
                            transform: visible ? 'translateX(0)' : 'translateX(40px)',
                            transition: 'all 0.7s cubic-bezier(0.4,0,0.2,1) 0.15s',
                        }}
                    >
                        <div
                            style={{
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '12px',
                                padding: 'clamp(24px, 4vw, 36px)',
                            }}
                        >
                            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', marginBottom: '8px', letterSpacing: '0.05em' }}>
                                SUBMIT YOUR ART
                            </h3>
                            <p style={{ color: 'var(--color-grey-blue)', fontSize: '0.9rem', marginBottom: '28px' }}>
                                Upload your graffiti artwork. Max 5MB · JPG, PNG, or WEBP.
                            </p>

                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                                <input type="text" name="website" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} style={{ display: 'none' }} tabIndex={-1} autoComplete="off" aria-hidden="true" />

                                <div className="form-group">
                                    <label htmlFor="graffiti-artist" className="form-label">Artist Name / Tag</label>
                                    <input
                                        id="graffiti-artist"
                                        type="text"
                                        className="form-input"
                                        placeholder="Your street tag"
                                        value={artistName}
                                        onChange={(e) => setArtistName(e.target.value)}
                                        maxLength={60}
                                        required
                                        disabled={status === 'loading'}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="graffiti-file" className="form-label">Artwork File</label>
                                    <label
                                        htmlFor="graffiti-file"
                                        style={{
                                            display: 'block',
                                            border: '2px dashed rgba(106,13,173,0.5)',
                                            borderRadius: '8px',
                                            padding: '24px',
                                            textAlign: 'center',
                                            cursor: 'pointer',
                                            background: 'rgba(106,13,173,0.06)',
                                            transition: 'all 0.2s ease',
                                        }}
                                        onDragOver={(e) => e.preventDefault()}
                                    >
                                        {preview ? (
                                            <img src={preview} alt="Preview" style={{ maxHeight: '120px', borderRadius: '4px', objectFit: 'cover' }} />
                                        ) : (
                                            <>
                                                <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>🖼️</span>
                                                <span style={{ color: 'var(--color-grey-blue)', fontSize: '0.9rem' }}>
                                                    Click to upload or drag & drop
                                                </span>
                                            </>
                                        )}
                                        <input
                                            id="graffiti-file"
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            onChange={handleFileChange}
                                            style={{ display: 'none' }}
                                            disabled={status === 'loading'}
                                        />
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={status === 'loading' || !file}
                                    style={{ width: '100%', justifyContent: 'center' }}
                                >
                                    {status === 'loading' ? '⏳ Uploading...' : '🎨 Submit Artwork'}
                                </button>

                                {(status === 'success' || status === 'error') && (
                                    <div
                                        role="alert"
                                        style={{
                                            padding: '12px 16px', borderRadius: '6px',
                                            background: status === 'success' ? 'rgba(4,120,87,0.15)' : 'rgba(220,38,38,0.15)',
                                            border: `1px solid ${status === 'success' ? 'rgba(4,120,87,0.4)' : 'rgba(220,38,38,0.4)'}`,
                                            color: status === 'success' ? 'var(--color-green-light)' : '#F87171',
                                            fontSize: '0.9rem',
                                        }}
                                    >
                                        {message}
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        @media (max-width: 768px) {
          #graffiti .container > div:last-child {
            grid-template-columns: 1fr !important;
          }
        }
      `}} />
        </section>
    );
}
