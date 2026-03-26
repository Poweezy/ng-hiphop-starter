'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LyricGameProps {
    gameData: {
        id: string;
        lyric_snippet: string;
        correct_song: string;
        options: string[];
    } | null;
}

export default function LyricGame({ gameData }: LyricGameProps) {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Submission form state
    const [newLyric, setNewLyric] = useState('');
    const [newSong, setNewSong] = useState('');
    const [newOptions, setNewOptions] = useState(['', '', '']);

    const handleOptionSelect = (option: string) => {
        if (selectedOption) return;
        setSelectedOption(option);
        setIsCorrect(option === gameData?.correct_song);
    };

    const handleNewGameRequest = () => {
        window.location.reload(); // Simple approach for now
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch('/api/lyric-game', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lyric_snippet: newLyric,
                    correct_song: newSong,
                    options: [...newOptions, newSong].sort(() => Math.random() - 0.5)
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

    return (
        <section id="lyric-game" className="section game-section">
            <div className="container">
                <div className="game-layout">
                    <div className="section-header">
                        <div className="section-badge">Interactive</div>
                        <h2 className="section-title">Lyric Master</h2>
                        <p className="section-subtitle">Guess the song from the snippet. Test your NG knowledge.</p>
                    </div>

                    <div className="game-card-wrapper">
                        {gameData ? (
                            <motion.div 
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="game-card"
                            >
                                <div className="lyric-box">
                                    <span className="box-label">The Lyric</span>
                                    <p className="lyric-text">“{gameData.lyric_snippet}”</p>
                                </div>

                                <div className="options-grid">
                                    {gameData.options.map((option, idx) => (
                                        <motion.button
                                            key={idx}
                                            whileHover={!selectedOption ? { scale: 1.02, backgroundColor: "rgba(255,255,255,0.05)" } : {}}
                                            whileTap={!selectedOption ? { scale: 0.98 } : {}}
                                            onClick={() => handleOptionSelect(option)}
                                            className={`option-btn ${selectedOption === option ? (isCorrect ? 'correct' : 'wrong') : ''} ${selectedOption && option === gameData.correct_song ? 'reveal-correct' : ''}`}
                                            disabled={!!selectedOption}
                                        >
                                            <span className="option-letter">{String.fromCharCode(65 + idx)}</span>
                                            <span className="option-label">{option}</span>
                                            {selectedOption === option && (
                                                <span className="feedback-icon">{isCorrect ? '✓' : '✕'}</span>
                                            )}
                                        </motion.button>
                                    ))}
                                </div>

                                <AnimatePresence mode="wait">
                                    {selectedOption && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="game-footer"
                                        >
                                            <div className="result-text">
                                                {isCorrect ? 'Perfect! You know the culture.' : `Not quite. The right answer was "${gameData.correct_song}".`}
                                            </div>
                                            <div className="footer-actions">
                                                <button onClick={handleNewGameRequest} className="btn btn-primary">Try Another</button>
                                                <button onClick={() => setShowSubmitModal(true)} className="btn btn-secondary">Submit a Lyric</button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ) : (
                            <div className="game-loading">
                                <p>Preparing the next challenge...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Submission Modal */}
            <AnimatePresence>
                {showSubmitModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="modal-overlay"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="modal-content"
                        >
                            <h3 className="modal-title">Challenge the Community</h3>
                            <form onSubmit={handleFormSubmit} className="submit-form">
                                <div className="input-group">
                                    <label>Lyric Snippet</label>
                                    <textarea
                                        value={newLyric}
                                        onChange={(e) => setNewLyric(e.target.value)}
                                        placeholder="Enter the lyric lines..."
                                        required
                                        rows={3}
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Correct Song Title</label>
                                    <input
                                        type="text"
                                        value={newSong}
                                        onChange={(e) => setNewSong(e.target.value)}
                                        placeholder="The actual title"
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Distractor Options (Wrong Answers)</label>
                                    {newOptions.map((opt, i) => (
                                        <input
                                            key={i}
                                            type="text"
                                            value={opt}
                                            onChange={(e) => {
                                                const up = [...newOptions];
                                                up[i] = e.target.value;
                                                setNewOptions(up);
                                            }}
                                            placeholder={`Wrong answer #${i+1}`}
                                            required
                                            style={{ marginBottom: '8px' }}
                                        />
                                    ))}
                                </div>
                                <div className="form-actions">
                                    <button type="button" onClick={() => setShowSubmitModal(false)} className="btn-text">Cancel</button>
                                    <button type="submit" disabled={submitting} className="btn btn-primary">
                                        {submitting ? 'Sharing...' : 'Submit Challenge'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx>{`
                .game-section {
                    background: #08080c;
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

                .lyric-box {
                    background: rgba(139, 92, 246, 0.05);
                    border-left: 4px solid var(--color-purple);
                    padding: 32px;
                    border-radius: 0 24px 24px 0;
                    margin-bottom: 48px;
                    position: relative;
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

                .options-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                }

                @media (max-width: 640px) {
                    .options-grid {
                        grid-template-columns: 1fr;
                    }
                    .game-card { padding: 40px 24px; }
                    .lyric-text { font-size: 1.4rem; }
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

                /* Modal */
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.9);
                    backdrop-filter: blur(10px);
                    z-index: 2000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 24px;
                }

                .modal-content {
                    background: #11111a;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 32px;
                    padding: 40px;
                    width: 100%;
                    max-width: 520px;
                }

                .modal-title {
                    font-family: var(--font-display);
                    font-size: 1.8rem;
                    margin-bottom: 32px;
                    text-align: center;
                }

                .submit-form {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .input-group label {
                    display: block;
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    color: var(--color-grey-blue);
                    margin-bottom: 8px;
                }

                .submit-form input, .submit-form textarea {
                    width: 100%;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    padding: 12px 16px;
                    color: white;
                    outline: none;
                }

                .form-actions {
                    display: flex;
                    justify-content: flex-end;
                    align-items: center;
                    gap: 20px;
                    margin-top: 10px;
                }

                .btn-text {
                    background: none;
                    border: none;
                    color: rgba(255, 255, 255, 0.5);
                    cursor: pointer;
                }
            `}</style>
        </section>
    );
}
