'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from './Modal';

interface LyricGameProps {
    lyrics: any[];
}

export default function LyricGame({ lyrics }: LyricGameProps) {
    const [gameLyrics, setGameLyrics] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [timeLeft, setTimeLeft] = useState(10);
    const [isPlaying, setIsPlaying] = useState(false);
    
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [options, setOptions] = useState<string[]>([]);
    
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Submission form state
    const [newLyric, setNewLyric] = useState('');
    const [newSong, setNewSong] = useState('');
    const [newOptions, setNewOptions] = useState(['', '', '']);
    
    // Timer interval ref
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const correctArtistRef = useRef<string>('');

    // Initialize game
    useEffect(() => {
        if (lyrics && lyrics.length > 0) {
            const shuffled = [...lyrics].sort(() => Math.random() - 0.5);
            setGameLyrics(shuffled);
            setupRound(shuffled, 0);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [lyrics]);

    const setupRound = (allLyrics: any[], index: number) => {
        if (index >= allLyrics.length) {
            setIsPlaying(false);
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }
        
        const current = allLyrics[index];
        const correctArtist = current.correct_artist;
        correctArtistRef.current = correctArtist;
        
        // Pick 3 random distractors from ALL other artists
        const rawArtists = allLyrics.map(l => l.correct_artist).filter(a => a !== correctArtist);
        const otherArtists = rawArtists.filter((artist, idx) => rawArtists.indexOf(artist) === idx);
        
        // If not enough distinct artists, pad with some defaults
        const defaults = ["Burna Boy", "Wizkid", "Davido", "Tems", "Sarkodie", "Nasty C", "Cassper Nyovest", "Sho Madjozi", "Black Sherif", "Falz", "M.I Abaga", "Amaarae"];
        while (otherArtists.length < 3) {
            const r = defaults[Math.floor(Math.random() * defaults.length)];
            if (!otherArtists.includes(r) && r !== correctArtist) otherArtists.push(r);
        }
        
        // Shuffle distractors and pick 3
        const distractors = otherArtists.sort(() => Math.random() - 0.5).slice(0, 3);
        const roundOptions = [correctArtist, ...distractors].sort(() => Math.random() - 0.5);
        
        setOptions(roundOptions);
        setSelectedOption(null);
        setIsCorrect(null);
        setTimeLeft(10);
        setIsPlaying(true);
        
        // Start timer
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current!);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    // Trigger the timeout handler once the countdown reaches zero.
    // Kept outside the state updater to avoid updating another component
    // during render.
    useEffect(() => {
        if (timeLeft === 0 && isPlaying) {
            handleTimeout(correctArtistRef.current);
        }
    }, [timeLeft, isPlaying]);

    const handleTimeout = (correctArtist: string) => {
        setSelectedOption("TIMEOUT");
        setIsCorrect(false);
        setStreak(0);
    };

    const handleOptionSelect = (option: string) => {
        if (selectedOption || !isPlaying) return;
        if (timerRef.current) clearInterval(timerRef.current);
        
        const current = gameLyrics[currentIndex];
        const correct = option === current.correct_artist;
        
        setSelectedOption(option);
        setIsCorrect(correct);
        
        if (correct) {
            setScore(prev => prev + 10 + timeLeft); // bonus for speed
            setStreak(prev => prev + 1);
        } else {
            setStreak(0);
        }
    };

    const handleNext = () => {
        const nextIdx = currentIndex + 1;
        setCurrentIndex(nextIdx);
        setupRound(gameLyrics, nextIdx);
    };
    
    const handleRestart = () => {
        const shuffled = [...lyrics].sort(() => Math.random() - 0.5);
        setGameLyrics(shuffled);
        setCurrentIndex(0);
        setScore(0);
        setStreak(0);
        setupRound(shuffled, 0);
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch('/api/lyrics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lyric_text: newLyric,
                    correct_artist: newSong,
                    is_active: false
                }),
            });
            if (res.ok) {
                setShowSubmitModal(false);
                setNewLyric('');
                setNewSong('');
                setNewOptions(['', '', '']);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const currentLyric = (isPlaying && currentIndex < gameLyrics.length) ? gameLyrics[currentIndex] : null;

    return (
        <section id="lyric-game" className="section game-section">
            <div className="container">
                <div className="game-layout">
                    <div className="section-header">
                        <div className="section-badge">Interactive</div>
                        <h2 className="section-title">Lyric Master</h2>
                        <p className="section-subtitle">Test your NG knowledge. Beat the clock.</p>
                    </div>

                    <div className="game-card-wrapper">
                        {gameLyrics.length > 0 ? (
                            <motion.div 
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="game-card"
                            >
                                
                                {/* Game HUD */}
                                <div className="game-hud">
                                    <div className="hud-stat">
                                        <span className="hud-label">Score</span>
                                        <span className="hud-value">{score}</span>
                                    </div>
                                    <div className="hud-stat">
                                        <span className="hud-label">Streak</span>
                                        <span className="hud-value streak-value">🔥 {streak}</span>
                                    </div>
                                </div>

                                {/* Timer Bar */}
                                {isPlaying && !selectedOption && (
                                    <div className="timer-container" aria-live="polite" aria-atomic="true">
                                        <motion.div 
                                            className="timer-bar"
                                            animate={{ width: `${(timeLeft / 10) * 100}%`, backgroundColor: timeLeft <= 3 ? '#ef4444' : '#10b981' }}
                                            transition={{ duration: 1, ease: "linear" }}
                                        />
                                    </div>
                                )}

                                {currentLyric ? (
                                    <>
                                        <div className="lyric-box">
                                            <span className="box-label">Round {currentIndex + 1}</span>
                                            <p className="lyric-text">“{currentLyric.lyric_text}”</p>
                                        </div>

                                        <div className="options-grid">
                                            {options.map((option, idx) => {
                                                const isThisSelected = selectedOption === option;
                                                const correctArtist = currentLyric.correct_artist;
                                                const isThisCorrect = option === correctArtist;
                                                
                                                let btnClass = '';
                                                if (selectedOption) {
                                                    if (isThisSelected) {
                                                        btnClass = isCorrect ? 'correct' : 'wrong';
                                                    } else if (isThisCorrect) {
                                                        btnClass = 'reveal-correct';
                                                    }
                                                }

                                                return (
                                                    <motion.button
                                                        key={idx}
                                                        whileHover={!selectedOption ? { scale: 1.02, backgroundColor: "rgba(255,255,255,0.05)" } : {}}
                                                        whileTap={!selectedOption ? { scale: 0.98 } : {}}
                                                        onClick={() => handleOptionSelect(option)}
                                                        className={`option-btn ${btnClass}`}
                                                        disabled={!!selectedOption}
                                                    >
                                                        <span className="option-letter">{String.fromCharCode(65 + idx)}</span>
                                                        <span className="option-label">{option}</span>
                                                        {selectedOption && (isThisSelected || isThisCorrect) && (
                                                            <span className="feedback-icon">{isThisCorrect ? '✓' : '✕'}</span>
                                                        )}
                                                    </motion.button>
                                                );
                                            })}
                                        </div>

                                        <AnimatePresence mode="wait">
                                            {selectedOption && (
                                                <motion.div 
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="game-footer"
                                                >
                                                    <div className="result-text" aria-live="polite" aria-atomic="true">
                                                        {selectedOption === "TIMEOUT" 
                                                            ? `Time's up! The artist was ${currentLyric.correct_artist}.`
                                                            : isCorrect 
                                                                ? 'Perfect! You know the culture.' 
                                                                : `Not quite. The right answer was ${currentLyric.correct_artist}.`}
                                                    </div>
                                                    <div className="footer-actions">
                                                        <button onClick={handleNext} className="btn btn-primary">
                                                            Next Round →
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </>
                                ) : (
                                    <div className="game-over">
                                        <h3>Game Over</h3>
                                        <p>Final Score: <strong>{score}</strong></p>
                                        <p>Max Streak: <strong>🔥 {streak}</strong></p>
                                        <div className="footer-actions" style={{ marginTop: '24px' }}>
                                            <button onClick={handleRestart} className="btn btn-primary">Play Again</button>
                                            <button onClick={() => setShowSubmitModal(true)} className="btn btn-secondary">Submit a Lyric</button>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <div className="game-loading">
                                <p>Loading the challenge...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Submission Modal */}
            <Modal isOpen={showSubmitModal} onClose={() => setShowSubmitModal(false)} titleId="lyric-submit-title">
                <div className="modal-header">
                    <span className="modal-icon">🎤</span>
                    <h3 className="modal-title" id="lyric-submit-title">Challenge the Community</h3>
                    <p className="modal-subtitle">Think you know the culture better than anyone else? Drop a bar and test the streets.</p>
                </div>
                <form onSubmit={handleFormSubmit} className="submit-form">
                    <div className="input-group">
                        <label htmlFor="new-lyric">The Bar (Lyric Snippet)</label>
                        <textarea
                            id="new-lyric"
                            value={newLyric}
                            onChange={(e) => setNewLyric(e.target.value)}
                            placeholder="“Real Gs move in silence...”"
                            required
                            rows={3}
                            className="premium-input"
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="new-song-artist">The Artist (Correct Answer)</label>
                        <input
                            id="new-song-artist"
                            type="text"
                            value={newSong}
                            onChange={(e) => setNewSong(e.target.value)}
                            placeholder="e.g. Burna Boy"
                            required
                            className="premium-input"
                        />
                    </div>
                    <div className="form-actions">
                        <button type="button" onClick={() => setShowSubmitModal(false)} className="btn-text">Cancel</button>
                        <button type="submit" disabled={submitting} className="btn-premium">
                            {submitting ? 'Dropping logic...' : 'Submit Challenge'}
                        </button>
                    </div>
                </form>
            </Modal>

            <style jsx>{`
                .game-section {
                    background: var(--color-black);
                    position: relative;
                }

                .game-layout {
                    max-width: 800px;
                    margin: 0 auto;
                }

                .game-card {
                    background: rgba(255, 255, 255, 0.02);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 40px;
                    padding: 60px;
                    box-shadow: 0 40px 100px rgba(0, 0, 0, 0.4);
                }
                }
                .game-hud {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 24px;
                    padding-bottom: 24px;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                }

                .hud-stat {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .hud-label {
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    color: var(--color-grey-blue);
                    font-family: var(--font-condensed);
                }

                .hud-value {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: white;
                }

                .streak-value {
                    color: #F59E0B;
                }

                .timer-container {
                    height: 4px;
                    background: rgba(255,255,255,0.1);
                    border-radius: 4px;
                    margin-bottom: 32px;
                    overflow: hidden;
                }

                .timer-bar {
                    height: 100%;
                }

                .lyric-box {
                    background: rgba(139, 92, 246, 0.05);
                    border-left: 4px solid var(--color-purple);
                    padding: 32px;
                    border-radius: 0 24px 24px 0;
                    margin-bottom: 48px;
                    position: relative;
                }
                }
                .box-label {
                    position: absolute;
                    top: -12px;
                    left: 32px;
                    background: var(--color-purple);
                    color: white;
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    padding: 4px 12px;
                    border-radius: 6px;
                    letter-spacing: 0.1em;
                }

                .lyric-text {
                    font-size: 1.8rem;
                    font-weight: 500;
                    color: white;
                    line-height: 1.4;
                    font-style: italic;
                }
                }
                .options-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                }

                @media (max-width: 640px) {
                    .options-grid {
                        grid-template-columns: 1fr;
                    }
                .game-card {
                    background: rgba(255, 255, 255, 0.02);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 40px;
                    padding: 60px;
                    box-shadow: 0 40px 100px rgba(0, 0, 0, 0.4);
                }
                }
                .option-btn {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 16px;
                    padding: 20px 24px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    color: white;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    text-align: left;
                    position: relative;
                }

                .option-btn:disabled {
                    cursor: default;
                }

                .option-letter {
                    width: 32px;
                    height: 32px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-family: var(--font-condensed);
                    color: var(--color-grey-blue);
                }

                .option-label {
                    font-size: 1.1rem;
                }

                .option-btn.correct {
                    background: rgba(16, 185, 129, 0.15);
                    border-color: #10b981;
                }

                .option-btn.wrong {
                    background: rgba(239, 68, 68, 0.15);
                    border-color: #ef4444;
                }

                .option-btn.reveal-correct {
                    border-color: #10b981;
                }

                .feedback-icon {
                    margin-left: auto;
                    font-weight: 700;
                }

                .game-footer {
                    margin-top: 40px;
                    padding-top: 40px;
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                    text-align: center;
                }

                .result-text {
                    font-size: 1.2rem;
                    color: rgba(255, 255, 255, 0.8);
                    margin-bottom: 24px;
                }

                .footer-actions {
                    display: flex;
                    justify-content: center;
                    gap: 20px;
                }

                .game-over {
                    text-align: center;
                    padding: 40px 0;
                }

                .game-over h3 {
                    font-family: var(--font-display);
                    font-size: 2.5rem;
                    margin-bottom: 20px;
                    color: white;
                }

                .game-over p {
                    font-size: 1.2rem;
                    color: var(--color-grey-blue);
                    margin-bottom: 8px;
                }

                .game-over strong {
                    color: white;
                }

                .game-loading {
                    text-align: center;
                    padding: 60px 0;
                    color: var(--color-grey-blue);
                }

                /* Modal Refinements */
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.85);
                    backdrop-filter: blur(12px);
                    z-index: 2000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 24px;
                }

                .modal-content {
                    background: radial-gradient(circle at top, rgba(139, 92, 246, 0.15), transparent 70%), #050508;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 32px;
                    padding: 48px 40px;
                    width: 100%;
                    max-width: 480px;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.02);
                }

                .modal-header {
                    text-align: center;
                    margin-bottom: 32px;
                }

                .modal-icon {
                    font-size: 2.5rem;
                    display: inline-block;
                    margin-bottom: 16px;
                    background: rgba(255, 255, 255, 0.03);
                    padding: 16px;
                    border-radius: 50%;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }

                .modal-title {
                    font-family: var(--font-display);
                    font-size: 1.8rem;
                    margin-bottom: 8px;
                    color: white;
                    background: linear-gradient(135deg, #fff 0%, #a855f7 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .modal-subtitle {
                    font-size: 0.95rem;
                    color: var(--color-grey-blue);
                    line-height: 1.5;
                }

                .submit-form {
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
                    color: var(--color-purple-light);
                    margin-bottom: 10px;
                }

                .premium-input {
                    width: 100%;
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    padding: 14px 16px;
                    color: white;
                    outline: none;
                    font-size: 1rem;
                    transition: all 0.3s ease;
                    font-family: inherit;
                }

                .premium-input:focus {
                    border-color: var(--color-purple);
                    background: rgba(139, 92, 246, 0.05);
                    box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1);
                }

                .premium-input::placeholder {
                    color: rgba(255, 255, 255, 0.2);
                    font-style: italic;
                }

                .form-actions {
                    display: flex;
                    justify-content: flex-end;
                    align-items: center;
                    gap: 16px;
                    margin-top: 16px;
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                    padding-top: 24px;
                }

                .btn-premium {
                    background: linear-gradient(135deg, var(--color-purple), #6366f1);
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 12px;
                    font-family: var(--font-condensed);
                    font-weight: 700;
                    letter-spacing: 0.05em;
                    text-transform: uppercase;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 14px rgba(139, 92, 246, 0.3);
                }

                .btn-premium:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(139, 92, 246, 0.5);
                }

                .btn-premium:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .btn-text {
                    background: none;
                    border: none;
                    color: var(--color-grey-blue);
                    font-family: var(--font-condensed);
                    font-weight: 600;
                    letter-spacing: 0.05em;
                    text-transform: uppercase;
                    cursor: pointer;
                    padding: 10px 16px;
                    transition: color 0.2s ease;
                }

                .btn-text:hover {
                    color: white;
                }
            `}</style>
        </section>
    );
}
