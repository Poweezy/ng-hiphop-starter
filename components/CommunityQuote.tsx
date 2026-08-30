'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useInView, useMotionValue, useTransform } from 'framer-motion';

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
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [reduceMotion, setReduceMotion] = useState(false);
    const [nameError, setNameError] = useState('');
    const [quoteError, setQuoteError] = useState('');
    
    const containerRef = useRef(null);
    const isInView = useInView(containerRef, { once: true, amount: 0.2 });

    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useTransform(y, [-200, 200], [10, -10]);
    const rotateY = useTransform(x, [-200, 200], [-10, 10]);

    useEffect(() => {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReduceMotion(mq.matches);
      const handler = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }, []);

    function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
        if (reduceMotion) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        x.set(e.clientX - centerX);
        y.set(e.clientY - centerY);
    }

    function handleMouseLeave() {
        if (reduceMotion) return;
        x.set(0);
        y.set(0);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const nameTrimmed = name.trim();
        const quoteTrimmed = quote.trim();

        let hasError = false;
        if (!nameTrimmed) {
            setNameError('Please enter your alias.');
            hasError = true;
        } else if (nameTrimmed.length > 50) {
            setNameError('Alias must be 50 characters or fewer.');
            hasError = true;
        } else {
            setNameError('');
        }

        if (!quoteTrimmed) {
            setQuoteError('Please enter a quote.');
            hasError = true;
        } else if (quoteTrimmed.length > 280) {
            setQuoteError('Quote must be 280 characters or fewer.');
            hasError = true;
        } else {
            setQuoteError('');
        }

        if (hasError) return;

        setStatus('loading');
        try {
            const res = await fetch('/api/quotes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: nameTrimmed, quote: quoteTrimmed }),
            });
            const data = await res.json();
            if (res.ok) {
                setStatus('success');
                setMessage("Quote submitted! It's pending admin approval. 🎤");
                setName(''); setQuote('');
                setNameError(''); setQuoteError('');
            } else {
                setStatus('error');
                setMessage(data.error?.message || 'Something went wrong. Try again.');
            }
        } catch {
            setStatus('error');
            setMessage('Network error. Please try again.');
        }
        setTimeout(() => {
            setStatus('idle');
            setMessage('');
        }, 5000);
    };

    return (
        <section id="community-quotes" className="section quotes-section" ref={containerRef}>
            <div className="quotes-bg-blur" aria-hidden="true" />
            <div className="quotes-bg-overlay" aria-hidden="true" />
            <div className="container" style={{ position: 'relative', zIndex: 10 }}>
                <div className="quotes-layout">
                    {/* Featured Quote Section */}
                    <motion.div 
                        initial={{ opacity: 0, x: -50 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="featured-section"
                    >
                        <div className="section-badge">Community Voice</div>
                        <h2 className="section-title">The Culture <br /><span>Speaks</span></h2>
                        <p className="section-subtitle">Real talk from the Nerd Gauge community.</p>

                        <motion.div 
                            className="vinyl-quote-card"
                            style={{ rotateX, rotateY, transformStyle: "preserve-3d", perspective: 1000 }}
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                        >
                            <div className="vinyl-decoration" style={{ transform: "translateZ(20px)" }}>
                                <div className="ring ring-1"></div>
                                <div className="ring ring-2"></div>
                                <div className="ring ring-3"></div>
                            </div>
                            
                            {featuredQuote ? (
                                <div className="quote-content" style={{ transform: "translateZ(50px)" }}>
                                    <span className="quote-mark">“</span>
                                    <blockquote className="main-quote">
                                        {featuredQuote.quote_text}
                                    </blockquote>
                                    <div className="quote-author">
                                        <div className="author-line"></div>
                                        <span className="author-name">{featuredQuote.submitted_by}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="empty-quote" style={{ transform: "translateZ(50px)" }}>
                                    <span className="mic-icon">🎤</span>
                                    <p>The stage is yours. Drop the first piece of wisdom.</p>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>

                    {/* Submission Form Section */}
                    <motion.div 
                        initial={{ opacity: 0, x: 50 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                        className="form-section"
                    >
                        <div className="glass-form-card">
                            <div className="form-header">
                                <h3 className="form-title">Drop Your Truth</h3>
                                <p className="form-desc">Submit your favorite lyrics or original thoughts.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="quote-submission-form">
                                <div className="input-group">
                                    <label htmlFor="quote-name">Your Alias</label>
                                    <input
                                        id="quote-name"
                                        type="text"
                                        placeholder="STREET_NAME"
                                        value={name}
                                        onChange={(e) => { setName(e.target.value); if (nameError) setNameError(''); }}
                                        required
                                        disabled={status === 'loading'}
                                        aria-invalid={!!nameError}
                                        aria-describedby={nameError ? 'quote-name-error' : 'quote-name-help'}
                                    />
                                    {nameError && <p id="quote-name-error" className="input-error" role="alert">{nameError}</p>}
                                    <p id="quote-name-help" className="input-help">Enter your alias or stage name.</p>
                                </div>

                                <div className="input-group">
                                    <div className="label-row">
                                        <label htmlFor="quote-text">The Quote</label>
                                        <span id="quote-char-count" className={`char-count ${quote.length > 250 ? 'char-count--warn' : ''}`}>{quote.length}/280</span>
                                    </div>
                                    <textarea
                                        id="quote-text"
                                        placeholder="What's the word on the street?"
                                        value={quote}
                                        onChange={(e) => { setQuote(e.target.value); if (quoteError) setQuoteError(''); }}
                                        maxLength={280}
                                        required
                                        disabled={status === 'loading'}
                                        rows={4}
                                        aria-invalid={!!quoteError}
                                        aria-describedby={quoteError ? 'quote-text-error' : 'quote-text-help'}
                                    />
                                    {quoteError && <p id="quote-text-error" className="input-error" role="alert">{quoteError}</p>}
                                    <p id="quote-text-help" className="input-help">Share your favorite lyrics or original thoughts. Max 280 characters.</p>
                                </div>

                                <button 
                                    type="submit" 
                                    className={`btn btn-primary submit-btn ${status === 'loading' ? 'loading' : ''}`}
                                    disabled={status === 'loading'}
                                >
                                    {status === 'loading' ? 'SUBMITTING...' : 'Post to the Wall'}
                                </button>

                                <AnimatePresence>
                                    {message && (
                                        <motion.div 
                                            role="status"
                                            aria-live="polite"
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className={`status-message ${status}`}
                                        >
                                            {message}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </form>
                        </div>
                    </motion.div>
                </div>
            </div>

            <style jsx>{`
                .quotes-section {
                    position: relative;
                    padding: 120px 0;
                    overflow: hidden;
                }

                .quotes-bg-blur {
                    position: absolute;
                    inset: -60px;
                    background-image: url('/images/community voice section.webp');
                    background-size: cover;
                    background-position: center;
                    filter: blur(4px) saturate(1.2) brightness(0.9);
                    opacity: 1;
                    pointer-events: none;
                    z-index: 1;
                }

                .quotes-bg-overlay {
                    position: absolute;
                    inset: 0;
                    background:
                        linear-gradient(180deg,
                            rgba(3,3,5,0.35) 0%,
                            rgba(3,3,5,0.15) 30%,
                            rgba(3,3,5,0.15) 70%,
                            rgba(3,3,5,0.45) 100%
                        );
                    z-index: 2;
                    pointer-events: none;
                }

                .quotes-layout {
                    display: grid;
                    grid-template-columns: 1.2fr 0.8fr;
                    gap: 80px;
                    align-items: center;
                }

                @media (max-width: 1024px) {
                    .quotes-layout {
                        grid-template-columns: 1fr;
                        gap: 60px;
                    }
                }

                .section-title span {
                    color: var(--color-purple);
                    text-shadow: 0 0 30px rgba(139,92,246,0.3);
                }

                /* Vinyl Card Styles */
                .vinyl-quote-card {
                    background: linear-gradient(145deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%);
                    backdrop-filter: blur(24px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 40px;
                    padding: 80px 60px 60px;
                    margin-top: 40px;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 40px 100px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(139, 92, 246, 0.1);
                    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .vinyl-quote-card:hover {
                    box-shadow: 0 40px 120px rgba(0, 0, 0, 0.6), inset 0 0 0 2px rgba(139, 92, 246, 0.5);
                    transform: translateY(-8px);
                }

                .vinyl-decoration {
                    position: absolute;
                    top: -100px;
                    right: -100px;
                    width: 300px;
                    height: 300px;
                    opacity: 0.1;
                    pointer-events: none;
                }

                .ring {
                    position: absolute;
                    border: 1px solid white;
                    border-radius: 50%;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                }

                .ring-1 { width: 100%; height: 100%; }
                .ring-2 { width: 80%; height: 80%; }
                .ring-3 { width: 60%; height: 60%; }

                .quote-mark {
                    display: block;
                    font-family: Georgia, serif;
                    font-size: 8rem;
                    color: var(--color-purple);
                    opacity: 0.15;
                    line-height: 1;
                    margin-bottom: -50px;
                    transition: transform 0.5s ease;
                }

                .vinyl-quote-card:hover .quote-mark {
                    transform: scale(1.1) rotate(-5deg);
                    opacity: 0.25;
                }

                .main-quote {
                    font-size: 2rem;
                    line-height: 1.4;
                    color: white;
                    font-weight: 500;
                    margin-bottom: 40px;
                    position: relative;
                    z-index: 1;
                    font-style: italic;
                    letter-spacing: -0.01em;
                }

                .quote-footer,
                .quote-author {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .author-line {
                    width: 40px;
                    height: 2px;
                    background: var(--color-purple-light);
                }

                .author-name {
                    font-family: var(--font-condensed);
                    font-size: 1rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.2em;
                    color: var(--color-purple-light);
                }

                .empty-quote {
                    text-align: center;
                    padding: 40px 0;
                    color: rgba(255, 255, 255, 0.55);
                }

                .mic-icon {
                    font-size: 3rem;
                    display: block;
                    margin-bottom: 20px;
                }

                /* Form Card Styles */
                .glass-form-card {
                    background: linear-gradient(145deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%);
                    backdrop-filter: blur(24px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 32px;
                    padding: 50px 40px;
                    box-shadow: 0 30px 60px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.05);
                    transition: transform 0.4s ease;
                }
                
                .glass-form-card:hover {
                    transform: translateY(-6px);
                    box-shadow: 0 40px 80px rgba(0, 0, 0, 0.4), 0 0 50px rgba(139, 92, 246, 0.15);
                }

                .form-title {
                    font-family: var(--font-display);
                    font-size: 1.5rem;
                    color: white;
                    margin-bottom: 8px;
                    letter-spacing: 0.05em;
                }

                .form-desc {
                    color: var(--color-grey-blue);
                    font-size: 0.9rem;
                    margin-bottom: 32px;
                }

                .quote-submission-form {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }

                .input-group label {
                    display: block;
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    color: rgba(255, 255, 255, 0.5);
                    margin-bottom: 8px;
                }

                .label-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .char-count {
                    font-size: 0.7rem;
                    color: rgba(255, 255, 255, 0.55);
                }

                .char-count--warn {
                    color: #FBBF24;
                }

                .input-help {
                    font-size: 0.75rem;
                    color: rgba(255, 255, 255, 0.4);
                    margin-top: 4px;
                }

                .input-error {
                    font-size: 0.75rem;
                    color: #F87171;
                    margin-top: 4px;
                }

                input, textarea {
                    width: 100%;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 14px;
                    padding: 14px 20px;
                    color: white;
                    font-size: 1rem;
                    outline: none;
                    transition: all 0.2s ease;
                }

                input:focus, textarea:focus {
                    background: rgba(255, 255, 255, 0.08);
                    border-color: var(--color-purple);
                    box-shadow: 0 0 20px rgba(139, 92, 246, 0.15);
                }

                input:focus-visible,
                textarea:focus-visible {
                    outline: 2px solid var(--color-purple);
                    outline-offset: 2px;
                    box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.2);
                }

                .submit-btn {
                    width: 100%;
                    padding: 16px;
                    justify-content: center;
                    font-size: 1rem;
                    margin-top: 8px;
                    transition: all 0.3s ease;
                }

                .submit-btn:focus-visible {
                    outline: 2px solid var(--color-purple);
                    outline-offset: 2px;
                    box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.2);
                }

                .status-message {
                    text-align: center;
                    font-size: 0.85rem;
                    padding: 12px;
                    border-radius: 12px;
                    margin-top: 16px;
                }

                .status-message.success {
                    color: #10b981;
                    background: rgba(16, 185, 129, 0.05);
                }

                .status-message.error {
                    color: #ef4444;
                    background: rgba(239, 68, 68, 0.05);
                }

                @media (max-width: 640px) {
                    .vinyl-quote-card {
                        padding: 40px 24px;
                    }
                    .main-quote {
                        font-size: 1.4rem;
                    }
                    .glass-form-card {
                        padding: 30px 20px;
                    }
                }
            `}</style>
        </section>
    );
}
