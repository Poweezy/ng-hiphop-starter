'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';

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
    
    const containerRef = useRef(null);
    const isInView = useInView(containerRef, { once: true, amount: 0.2 });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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
        setTimeout(() => {
            setStatus('idle');
            setMessage('');
        }, 5000);
    };

    return (
        <section id="community-quotes" className="section quotes-section" ref={containerRef}>
            <div className="container">
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
                        <p className="section-subtitle">Real talk from the NG Hip Hop community.</p>

                        <div className="vinyl-quote-card">
                            <div className="vinyl-decoration">
                                <div className="ring ring-1"></div>
                                <div className="ring ring-2"></div>
                                <div className="ring ring-3"></div>
                            </div>
                            
                            {featuredQuote ? (
                                <div className="quote-content">
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
                                <div className="empty-quote">
                                    <span className="mic-icon">🎤</span>
                                    <p>The stage is yours. Drop the first piece of wisdom.</p>
                                </div>
                            )}
                        </div>
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
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        disabled={status === 'loading'}
                                    />
                                </div>

                                <div className="input-group">
                                    <div className="label-row">
                                        <label htmlFor="quote-text">The Quote</label>
                                        <span className="char-count">{quote.length}/280</span>
                                    </div>
                                    <textarea
                                        id="quote-text"
                                        placeholder="What's the word on the street?"
                                        value={quote}
                                        onChange={(e) => setQuote(e.target.value)}
                                        maxLength={280}
                                        required
                                        disabled={status === 'loading'}
                                        rows={4}
                                    />
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
                    background: #050508;
                    position: relative;
                    padding: 120px 0;
                    overflow: hidden;
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
                    background: linear-gradient(135deg, #12121e 0%, #0a0a14 100%);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 40px;
                    padding: 60px;
                    margin-top: 40px;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 40px 100px rgba(0, 0, 0, 0.4);
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
                    font-size: 6rem;
                    color: var(--color-purple);
                    opacity: 0.3;
                    line-height: 1;
                    margin-bottom: -20px;
                }

                .main-quote {
                    font-size: 1.8rem;
                    line-height: 1.5;
                    color: white;
                    font-weight: 500;
                    margin-bottom: 32px;
                    position: relative;
                    z-index: 1;
                    font-style: italic;
                }

                .quote-footer {
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
                    color: rgba(255, 255, 255, 0.4);
                }

                .mic-icon {
                    font-size: 3rem;
                    display: block;
                    margin-bottom: 20px;
                }

                /* Form Card Styles */
                .glass-form-card {
                    background: rgba(255, 255, 255, 0.02);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 32px;
                    padding: 40px;
                    box-shadow: 0 30px 60px rgba(0, 0, 0, 0.2);
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
                    color: rgba(255, 255, 255, 0.3);
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

                .submit-btn {
                    width: 100%;
                    padding: 16px;
                    justify-content: center;
                    font-size: 1rem;
                    margin-top: 8px;
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
