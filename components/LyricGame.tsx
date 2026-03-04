'use client';

import { useState, useEffect, useCallback } from 'react';

interface LyricEntry {
    id: string;
    lyric_text: string;
    correct_artist: string;
}

interface LyricGameProps {
    lyrics: LyricEntry[];
}

export default function LyricGame({ lyrics }: LyricGameProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [guess, setGuess] = useState('');
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
    const [score, setScore] = useState(0);
    const [tries, setTries] = useState(0);
    const [revealed, setRevealed] = useState(false);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setVisible(true); },
            { threshold: 0.2 }
        );
        const el = document.getElementById('lyric-game');
        if (el) observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const current = lyrics[currentIndex] ?? null;

    const nextLyric = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % lyrics.length);
        setGuess('');
        setFeedback(null);
        setRevealed(false);
    }, [lyrics.length]);

    const handleGuess = (e: React.FormEvent) => {
        e.preventDefault();
        if (!guess.trim() || !current) return;
        setTries((t) => t + 1);
        const correct = guess.trim().toLowerCase() === current.correct_artist.toLowerCase();
        setFeedback(correct ? 'correct' : 'wrong');
        if (correct) setScore((s) => s + 1);
    };

    const handleSkip = () => {
        setRevealed(true);
    };

    if (!lyrics.length) {
        return (
            <section
                id="lyric-game"
                className="section"
                style={{ background: 'linear-gradient(180deg, #0a0a14 0%, #050510 100%)', textAlign: 'center' }}
            >
                <div className="container">
                    <div className="section-badge">Lyric Game</div>
                    <p style={{ color: 'var(--color-grey-blue)', marginTop: '16px' }}>Game coming soon. Check back later.</p>
                </div>
            </section>
        );
    }

    const accuracy = tries > 0 ? Math.round((score / tries) * 100) : 0;

    return (
        <section
            id="lyric-game"
            className="section"
            style={{
                background: 'linear-gradient(180deg, #050510 0%, #0a0a1a 100%)',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Green accent borders */}
            <div aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, var(--color-green), transparent)' }} />
            <div aria-hidden="true" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, var(--color-green), transparent)' }} />

            <div className="container">
                <div style={{ textAlign: 'center', marginBottom: 'clamp(32px, 5vw, 56px)', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.6s ease' }}>
                    <div className="section-badge">Guess the Artist</div>
                    <h2 className="section-title">Who Said That?</h2>
                    <p className="section-subtitle" style={{ margin: '0 auto' }}>
                        Can you name the artist? No accounts needed.
                    </p>
                </div>

                <div
                    style={{
                        maxWidth: '680px',
                        margin: '0 auto',
                        opacity: visible ? 1 : 0,
                        transform: visible ? 'translateY(0)' : 'translateY(30px)',
                        transition: 'all 0.7s cubic-bezier(0.4,0,0.2,1) 0.15s',
                    }}
                >
                    {/* Score display */}
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '28px',
                            padding: '12px 20px',
                            background: 'rgba(4,120,87,0.08)',
                            border: '1px solid rgba(4,120,87,0.2)',
                            borderRadius: '6px',
                        }}
                    >
                        <div style={{ display: 'flex', gap: '24px' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--color-green-light)', lineHeight: 1 }}>{score}</div>
                                <div style={{ fontFamily: 'var(--font-condensed)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-grey-blue)' }}>Correct</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1 }}>{tries}</div>
                                <div style={{ fontFamily: 'var(--font-condensed)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-grey-blue)' }}>Attempts</div>
                            </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: accuracy >= 70 ? 'var(--color-yellow)' : 'var(--color-grey-blue)', lineHeight: 1 }}>{accuracy}%</div>
                            <div style={{ fontFamily: 'var(--font-condensed)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-grey-blue)' }}>Accuracy</div>
                        </div>
                    </div>

                    {/* Lyric Card */}
                    <div
                        style={{
                            background: 'rgba(30,58,138,0.15)',
                            border: '2px solid rgba(30,58,138,0.4)',
                            borderRadius: '12px',
                            padding: 'clamp(28px, 5vw, 48px)',
                            textAlign: 'center',
                            marginBottom: '24px',
                            position: 'relative',
                        }}
                    >
                        {/* Quote marks */}
                        <span aria-hidden="true" style={{ fontFamily: 'Georgia,serif', fontSize: '5rem', color: 'rgba(30,58,138,0.5)', position: 'absolute', top: '8px', left: '20px', lineHeight: 1 }}>&ldquo;</span>
                        <p
                            style={{
                                fontFamily: 'var(--font-body)',
                                fontStyle: 'italic',
                                fontSize: 'clamp(1.1rem, 2vw, 1.4rem)',
                                color: 'rgba(255,255,255,0.9)',
                                lineHeight: 1.7,
                                position: 'relative',
                                zIndex: 1,
                            }}
                        >
                            {current?.lyric_text}
                        </p>

                        {/* Revealed answer */}
                        {revealed && (
                            <div
                                style={{
                                    marginTop: '20px',
                                    padding: '12px',
                                    background: 'rgba(250,204,21,0.1)',
                                    border: '1px solid rgba(250,204,21,0.3)',
                                    borderRadius: '6px',
                                }}
                            >
                                <span style={{ color: 'var(--color-yellow)', fontFamily: 'var(--font-condensed)', fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                    Artist: {current?.correct_artist}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Feedback */}
                    {feedback && (
                        <div
                            role="alert"
                            style={{
                                textAlign: 'center',
                                padding: '16px',
                                borderRadius: '8px',
                                marginBottom: '20px',
                                background: feedback === 'correct' ? 'rgba(4,120,87,0.2)' : 'rgba(220,38,38,0.2)',
                                border: `2px solid ${feedback === 'correct' ? 'var(--color-green)' : '#DC2626'}`,
                                fontFamily: 'var(--font-display)',
                                fontSize: '1.6rem',
                                letterSpacing: '0.05em',
                                color: feedback === 'correct' ? 'var(--color-green-light)' : '#F87171',
                                animation: 'fadeInUp 0.3s ease',
                            }}
                        >
                            {feedback === 'correct' ? '✅ CORRECT! That\'s it!' : `❌ Wrong — try again or skip`}
                        </div>
                    )}

                    {/* Guess Form */}
                    {!feedback && !revealed && (
                        <form onSubmit={handleGuess} style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Type the artist name..."
                                value={guess}
                                onChange={(e) => setGuess(e.target.value)}
                                maxLength={80}
                                required
                                autoComplete="off"
                                style={{ flex: 1 }}
                            />
                            <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
                                Guess 🎯
                            </button>
                        </form>
                    )}

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {feedback === 'correct' || feedback === 'wrong' || revealed ? (
                            <button onClick={nextLyric} className="btn btn-primary">
                                Next Lyric →
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSkip}
                                style={{
                                    background: 'transparent',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    color: 'rgba(255,255,255,0.5)',
                                    borderRadius: '4px',
                                    padding: '10px 20px',
                                    cursor: 'pointer',
                                    fontFamily: 'var(--font-condensed)',
                                    fontSize: '0.85rem',
                                    letterSpacing: '0.06em',
                                    textTransform: 'uppercase',
                                    transition: 'all 0.2s ease',
                                }}
                                onMouseOver={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)')}
                                onMouseOut={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)')}
                            >
                                Reveal Answer
                            </button>
                        )}
                        <span
                            style={{
                                fontFamily: 'var(--font-condensed)',
                                fontSize: '0.8rem',
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase',
                                color: 'var(--color-grey-blue)',
                                alignSelf: 'center',
                            }}
                        >
                            {currentIndex + 1} / {lyrics.length}
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}
