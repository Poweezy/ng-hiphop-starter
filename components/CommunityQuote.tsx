'use client';

import { useState, useEffect, useRef } from 'react';

interface Quote {
    id: string;
    quote_text: string;
    submitted_by: string;
}

interface CommunityQuoteProps {
    featuredQuote: Quote | null;
}

export default function CommunityQuote({ featuredQuote }: CommunityQuoteProps) {
    const [name, setName] = useState('');
    const [quote, setQuote] = useState('');
    const [honeypot, setHoneypot] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [visible, setVisible] = useState(false);
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setVisible(true); },
            { threshold: 0.2 }
        );
        if (sectionRef.current) observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (honeypot) return; // Honeypot CAPTCHA
        if (!name.trim() || !quote.trim()) return;

        setStatus('loading');
        try {
            const res = await fetch('/api/quotes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim(), quote: quote.trim() }),
            });
            const data = await res.json();
            if (res.ok) {
                setStatus('success');
                setMessage("Quote submitted! It's pending admin approval. 🎤");
                setName(''); setQuote('');
            } else {
                setStatus('error');
                setMessage(data.message || 'Something went wrong. Try again.');
            }
        } catch {
            setStatus('error');
            setMessage('Network error. Please try again.');
        }
        setTimeout(() => setStatus('idle'), 5000);
    };

    return (
        <section
            id="community-quotes"
            ref={sectionRef}
            className="section"
            style={{ background: 'linear-gradient(180deg, #0f0f1e 0%, #0a0a14 100%)', overflow: 'hidden' }}
        >
            <div className="container">
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 'clamp(32px, 5vw, 80px)',
                        alignItems: 'center',
                    }}
                >
                    {/* Featured Quote – Vinyl Card */}
                    <div
                        style={{
                            opacity: visible ? 1 : 0,
                            transform: visible ? 'translateX(0)' : 'translateX(-40px)',
                            transition: 'all 0.7s cubic-bezier(0.4,0,0.2,1)',
                        }}
                    >
                        <div className="section-badge">Community Voice</div>
                        <h2 className="section-title" style={{ marginBottom: '32px' }}>
                            The Culture<br />Speaks
                        </h2>

                        {featuredQuote ? (
                            <div
                                className="vinyl-card"
                                style={{
                                    padding: 'clamp(24px, 4vw, 40px)',
                                    position: 'relative',
                                    overflow: 'hidden',
                                }}
                            >
                                {/* Vinyl ring decoration */}
                                <div
                                    aria-hidden="true"
                                    style={{
                                        position: 'absolute',
                                        right: '-60px',
                                        top: '-60px',
                                        width: '200px',
                                        height: '200px',
                                        borderRadius: '50%',
                                        border: '30px solid rgba(255,255,255,0.04)',
                                        boxShadow: 'inset 0 0 0 20px rgba(255,255,255,0.02)',
                                    }}
                                />
                                <div
                                    aria-hidden="true"
                                    style={{
                                        position: 'absolute',
                                        right: '-20px',
                                        top: '-20px',
                                        width: '100px',
                                        height: '100px',
                                        borderRadius: '50%',
                                        border: '15px solid rgba(255,255,255,0.06)',
                                    }}
                                />

                                <span
                                    aria-hidden="true"
                                    style={{
                                        fontFamily: 'Georgia, serif',
                                        fontSize: '4rem',
                                        color: 'var(--color-purple-light)',
                                        lineHeight: 1,
                                        opacity: 0.6,
                                        display: 'block',
                                        marginBottom: '-8px',
                                    }}
                                >
                                    &ldquo;
                                </span>
                                <blockquote
                                    style={{
                                        fontFamily: 'var(--font-body)',
                                        fontSize: 'clamp(1rem, 1.5vw, 1.2rem)',
                                        lineHeight: 1.7,
                                        color: 'rgba(255,255,255,0.9)',
                                        fontStyle: 'italic',
                                        marginBottom: '20px',
                                    }}
                                >
                                    {featuredQuote.quote_text}
                                </blockquote>
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                    }}
                                >
                                    <div
                                        style={{
                                            width: '32px',
                                            height: '2px',
                                            background: 'var(--color-green)',
                                        }}
                                    />
                                    <span
                                        style={{
                                            fontFamily: 'var(--font-condensed)',
                                            fontWeight: 700,
                                            fontSize: '0.85rem',
                                            letterSpacing: '0.1em',
                                            textTransform: 'uppercase',
                                            color: 'var(--color-green-light)',
                                        }}
                                    >
                                        {featuredQuote.submitted_by}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div
                                style={{
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px dashed rgba(255,255,255,0.15)',
                                    borderRadius: '12px',
                                    padding: '40px',
                                    textAlign: 'center',
                                    color: 'var(--color-grey-blue)',
                                }}
                            >
                                <p style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🎤</p>
                                <p>Be the first to drop a quote.</p>
                            </div>
                        )}
                    </div>

                    {/* Submission Form */}
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
                                padding: 'clamp(24px, 4vw, 40px)',
                            }}
                        >
                            <h3
                                style={{
                                    fontFamily: 'var(--font-display)',
                                    fontSize: '1.6rem',
                                    marginBottom: '8px',
                                    letterSpacing: '0.05em',
                                }}
                            >
                                DROP YOUR QUOTE
                            </h3>
                            <p style={{ color: 'var(--color-grey-blue)', fontSize: '0.9rem', marginBottom: '28px' }}>
                                Submit a hip-hop quote for the community. Admin picks the best one.
                            </p>

                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                                {/* Honeypot – hidden from real users */}
                                <input
                                    type="text"
                                    name="website"
                                    value={honeypot}
                                    onChange={(e) => setHoneypot(e.target.value)}
                                    style={{ display: 'none' }}
                                    tabIndex={-1}
                                    autoComplete="off"
                                    aria-hidden="true"
                                />

                                <div className="form-group">
                                    <label htmlFor="quote-name" className="form-label">Your Name</label>
                                    <input
                                        id="quote-name"
                                        type="text"
                                        className="form-input"
                                        placeholder="Street name or alias"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        maxLength={50}
                                        required
                                        disabled={status === 'loading'}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="quote-text" className="form-label">Your Quote</label>
                                    <textarea
                                        id="quote-text"
                                        className="form-textarea"
                                        placeholder="Drop a hip-hop truth..."
                                        value={quote}
                                        onChange={(e) => setQuote(e.target.value)}
                                        maxLength={280}
                                        required
                                        disabled={status === 'loading'}
                                        rows={4}
                                    />
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-grey-blue)', textAlign: 'right' }}>
                                        {quote.length}/280
                                    </span>
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={status === 'loading'}
                                    style={{ width: '100%', justifyContent: 'center' }}
                                >
                                    {status === 'loading' ? '⏳ Submitting...' : '🎤 Submit Quote'}
                                </button>

                                {(status === 'success' || status === 'error') && (
                                    <div
                                        role="alert"
                                        style={{
                                            padding: '12px 16px',
                                            borderRadius: '6px',
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
          #community-quotes .container > div {
            grid-template-columns: 1fr !important;
          }
        }
      `}} />
        </section>
    );
}
