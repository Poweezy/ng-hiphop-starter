'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Modal from './Modal';

interface LyricEntry {
    id: string;
    lyric_text: string;
    correct_artist: string;
    competitionId?: string | null;
}

interface LyricGameProps {
    lyrics: LyricEntry[];
}

type GamePhase = 'intro' | 'playing' | 'interstitial' | 'gameover';

const INTERSTITIAL_DURATION = 2000;

function getTimerForRound(roundIndex: number): number {
    if (roundIndex < 5) return 12;
    if (roundIndex < 10) return 10;
    return 8;
}

function getDifficultyLabel(roundIndex: number): 'Beginner' | 'Intermediate' | 'Expert' {
    if (roundIndex < 5) return 'Beginner';
    if (roundIndex < 10) return 'Intermediate';
    return 'Expert';
}

const DIFFICULTY_DEFAULTS = [
    'Burna Boy', 'Wizkid', 'Davido', 'Tems', 'Sarkodie', 'Nasty C',
    'Cassper Nyovest', 'Sho Madjozi', 'Black Sherif', 'Falz', 'M.I Abaga',
    'Amaarae', 'Soolking', 'Ayra Starr', 'Fireboy DML', 'JAE5',
    'NSG', 'Little Simz', 'Dave', 'J Hus', 'Koffee', 'Sean Paul',
    'Chronixx', 'Protoje', 'Busy Signal', 'Alkaline', 'Gigi Lamayne',
    'Costa Titch', 'Blxst',
];

function getResultText(selectedOption: string | null, isCorrect: boolean | null, correctArtist: string): string {
    if (selectedOption === 'TIMEOUT') return `Time's up! The artist was ${correctArtist}.`;
    if (isCorrect) return 'Perfect! You know the culture.';
    if (!selectedOption) return '';
    return `Not quite. The right answer was ${correctArtist}.`;
}

export default function LyricGame({ lyrics }: LyricGameProps) {
    const reduced = useReducedMotion();
    const [gameLyrics, setGameLyrics] = useState<LyricEntry[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [totalRounds, setTotalRounds] = useState(0);
    const [correctAnswers, setCorrectAnswers] = useState(0);

    const [timeLeft, setTimeLeft] = useState(12);
    const [maxTime, setMaxTime] = useState(12);
    const [isPlaying, setIsPlaying] = useState(false);
    const [gamePhase, setGamePhase] = useState<GamePhase>('intro');

    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [options, setOptions] = useState<string[]>([]);

    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [lyricError, setLyricError] = useState('');
    const [artistError, setArtistError] = useState('');

    const [newLyric, setNewLyric] = useState('');
    const [newSong, setNewSong] = useState('');

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const correctArtistRef = useRef<string>('');
    const interstitialTimerRef = useRef<NodeJS.Timeout | null>(null);
    const [interstitialSecondsLeft, setInterstitialSecondsLeft] = useState(0);

    useEffect(() => {
        const saved = localStorage.getItem('ng-lyric-game-best-streak');
        if (saved) setBestStreak(parseInt(saved, 10));
    }, []);

    useEffect(() => {
        if (streak > bestStreak) {
            setBestStreak(streak);
            localStorage.setItem('ng-lyric-game-best-streak', String(streak));
        }
    }, [streak, bestStreak]);

    useEffect(() => {
        if (lyrics && lyrics.length > 0) {
            const shuffled = [...lyrics].sort(() => Math.random() - 0.5);
            setGameLyrics(shuffled);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (interstitialTimerRef.current) clearTimeout(interstitialTimerRef.current);
        };
    }, [lyrics]);

    useEffect(() => {
        if (gameLyrics.length === 0) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (gamePhase === 'playing' && isPlaying && !selectedOption) {
                const key = e.key.toLowerCase();
                let idx = -1;
                if (key >= '1' && key <= '4') idx = parseInt(key) - 1;

                if (idx >= 0 && idx < options.length) {
                    e.preventDefault();
                    const option = options[idx];
                    const current = gameLyrics[currentIndex];
                    const correct = option === current.correct_artist;
                    processAnswer(correct, option, false);
                }
            }

            if (gamePhase === 'interstitial') {
                if (interstitialSecondsLeft > 0 && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    advanceRound();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [gamePhase, isPlaying, selectedOption, options, gameLyrics, currentIndex, interstitialSecondsLeft]);

    useEffect(() => {
        if (gamePhase === 'interstitial') {
            setInterstitialSecondsLeft(Math.floor(INTERSTITIAL_DURATION / 1000));
            interstitialTimerRef.current = setTimeout(advanceRound, INTERSTITIAL_DURATION);
            return () => {
                if (interstitialTimerRef.current) clearTimeout(interstitialTimerRef.current);
            };
        }
    }, [gamePhase]);

    useEffect(() => {
        if (timeLeft === 0 && isPlaying && gamePhase === 'playing') {
            processAnswer(false, 'TIMEOUT', true);
        }
    }, [timeLeft, isPlaying, gamePhase]);

    const startGame = () => {
        const shuffled = [...lyrics].sort(() => Math.random() - 0.5);
        setGameLyrics(shuffled);
        setCurrentIndex(0);
        setScore(0);
        setStreak(0);
        setTotalRounds(0);
        setCorrectAnswers(0);
        setGamePhase('playing');
        setupRound(shuffled, 0);
    };

    const setupRound = (allLyrics: LyricEntry[], index: number) => {
        if (index >= allLyrics.length) {
            endGame();
            return;
        }

        const current = allLyrics[index];
        const correctArtist = current.correct_artist;
        correctArtistRef.current = correctArtist;

        setTotalRounds(prev => prev + 1);
        const timer = getTimerForRound(index);
        setMaxTime(timer);
        setTimeLeft(timer);
        setIsPlaying(true);

        const rawArtists = allLyrics.map(l => l.correct_artist).filter(a => a !== correctArtist);
        const otherArtists = Array.from(new Set(rawArtists));

        while (otherArtists.length < 3) {
            const r = DIFFICULTY_DEFAULTS[Math.floor(Math.random() * DIFFICULTY_DEFAULTS.length)];
            if (!otherArtists.includes(r) && r !== correctArtist) otherArtists.push(r);
        }

        const distractors = otherArtists.sort(() => Math.random() - 0.5).slice(0, 3);
        const roundOptions = [correctArtist, ...distractors].sort(() => Math.random() - 0.5);

        setOptions(roundOptions);
        setSelectedOption(null);
        setIsCorrect(null);

        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const processAnswer = (correct: boolean, option: string | null, timedOut: boolean) => {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsPlaying(false);
        setGamePhase('interstitial');

        if (timedOut) {
            setSelectedOption('TIMEOUT');
            setIsCorrect(false);
            setStreak(0);
        } else {
            setSelectedOption(option);
            setIsCorrect(correct);
            if (correct) {
                setScore(prev => prev + 10 + timeLeft);
                setStreak(prev => prev + 1);
                setCorrectAnswers(prev => prev + 1);
            } else {
                setStreak(0);
            }
        }
    };

    const handleOptionSelect = (option: string) => {
        if (!isPlaying || selectedOption || gamePhase !== 'playing') return;
        const current = gameLyrics[currentIndex];
        const correct = option === current.correct_artist;
        processAnswer(correct, option, false);
    };

    const advanceRound = () => {
        if (interstitialTimerRef.current) clearTimeout(interstitialTimerRef.current);
        const nextIdx = currentIndex + 1;
        setCurrentIndex(nextIdx);
        setGamePhase('playing');
        setupRound(gameLyrics, nextIdx);
    };

    const endGame = () => {
        setGamePhase('gameover');
        setIsPlaying(false);
        setSelectedOption(null);
        setIsCorrect(null);
    };

    const handleRestart = () => {
        setGamePhase('intro');
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedLyric = newLyric.trim();
        const trimmedArtist = newSong.trim();

        let hasError = false;
        if (!trimmedLyric) {
            setLyricError('Enter a lyric snippet.');
            hasError = true;
        } else if (trimmedLyric.length > 500) {
            setLyricError('Lyric must be 500 characters or fewer.');
            hasError = true;
        } else {
            setLyricError('');
        }

        if (!trimmedArtist) {
            setArtistError('Enter the artist name.');
            hasError = true;
        } else if (trimmedArtist.length > 100) {
            setArtistError('Artist name must be 100 characters or fewer.');
            hasError = true;
        } else {
            setArtistError('');
        }

        if (hasError) return;

        setSubmitting(true);
        setSubmitError(null);
        try {
            const res = await fetch('/api/lyrics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lyric_text: trimmedLyric,
                    correct_artist: trimmedArtist,
                    is_active: false,
                }),
            });
            if (res.ok) {
                setShowSubmitModal(false);
                setNewLyric('');
                setNewSong('');
                setLyricError('');
                setArtistError('');
            } else {
                const data = await res.json().catch(() => null);
                const msg = data?.error?.message || data?.data?.message || res.statusText || 'Failed to submit. Please try again.';
                setSubmitError(msg);
            }
        } catch {
            setSubmitError('Network error — please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const [shareState, setShareState] = useState<'idle' | 'shared'>('idle');

    const shareScore = async () => {
        const text = `I scored ${score} points on NG Hip Hop's Lyric Master! 🔥 My max streak: ${bestStreak}. Can you beat it?`;
        try {
            if (navigator.share) {
                await navigator.share({ text });
            } else if (navigator.clipboard) {
                await navigator.clipboard.writeText(text);
            } else {
                return;
            }
            setShareState('shared');
            setTimeout(() => setShareState('idle'), 2500);
        } catch {
            // User dismissed the share sheet — nothing to do.
        }
    };

    const currentLyric = (gamePhase === 'playing' || gamePhase === 'interstitial') &&
                         currentIndex < gameLyrics.length ? gameLyrics[currentIndex] : null;

    const accuracy = totalRounds > 0 ? Math.round((correctAnswers / totalRounds) * 100) : 0;
    const timerColor = timeLeft <= 3 ? '#ef4444' : timeLeft <= maxTime / 2 ? '#f59e0b' : '#10b981';
    const difficultyClass = `difficulty-${getDifficultyLabel(currentIndex).toLowerCase()}`;
    const secondsLeft = gamePhase === 'interstitial' ? interstitialSecondsLeft : 0;

    let gameContent: React.ReactNode = null;

    if (gameLyrics.length === 0) {
        gameContent = (
            <motion.div key="loading" className="game-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p>Loading the challenge…</p>
            </motion.div>
        );
    } else if (gamePhase === 'intro') {
        gameContent = (
            <motion.div key="intro" className="game-intro" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}>
                <div className="intro-visual" aria-hidden="true">
                    <div className="intro-visual-ring intro-visual-ring--1" />
                    <div className="intro-visual-ring intro-visual-ring--2" />
                    <div className="intro-visual-ring intro-visual-ring--3" />
                    <div className="intro-visual-icon">🎤</div>
                </div>

                <div className="intro-content">
                    <div className="intro-eyebrow">
                        <span className="intro-eyebrow-dot" aria-hidden="true" />
                        Lyric Challenge
                    </div>

                    <h3 className="intro-title">THE VAULT<br />IS LOCKED</h3>

                    <p className="intro-subtitle">Only those who know the bars can enter.</p>

                    <div className="intro-stats">
                        <div className="intro-stat-card">
                            <span className="intro-stat-value">{gameLyrics.length || '—'}</span>
                            <span className="intro-stat-label">Challenges</span>
                            <span className="intro-stat-bar" style={{ width: '85%' }} />
                        </div>
                        <div className="intro-stat-card">
                            <span className="intro-stat-value">3</span>
                            <span className="intro-stat-label">Tiers</span>
                            <span className="intro-stat-bar" style={{ width: '60%' }} />
                        </div>
                        <div className="intro-stat-card">
                            <span className="intro-stat-value">🏆 {bestStreak}</span>
                            <span className="intro-stat-label">Best Streak</span>
                            <span className="intro-stat-bar" style={{ width: Math.min(100, bestStreak * 10) + '%' }} />
                        </div>
                    </div>

                    <div className="intro-instructions">
                        <h4>How to Play</h4>
                        <div className="intro-instruction">
                            <span className="step-num">01</span>
                            <span>A lyric snippet appears — pick the correct artist from 4 options.</span>
                        </div>
                        <div className="intro-instruction">
                            <span className="step-num">02</span>
                            <span>Answer fast for bonus points. Rounds get harder as you go.</span>
                        </div>
                        <div className="intro-instruction">
                            <span className="step-num">03</span>
                            <span>Use <kbd>1–4</kbd> on your keyboard to answer.</span>
                        </div>
                    </div>

                    <button onClick={startGame} className="btn-start">
                        <span className="btn-start-icon" aria-hidden="true">▶</span>
                        <span className="btn-start-text">Start Challenge</span>
                        <span className="btn-start-glow" aria-hidden="true" />
                    </button>

                    <p className="intro-hint">
                        <span className="intro-hint-dot" aria-hidden="true" />
                        {gameLyrics.length} challenges loaded
                    </p>
                </div>
            </motion.div>
        );
    } else if (gamePhase === 'playing' && currentLyric) {
        gameContent = (
            <motion.div key={`round-${currentIndex}`} className="game-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                <div className="game-hud">
                    <div className="hud-stat">
                        <span className="hud-label">Score</span>
                        <span className="hud-value">{score}</span>
                    </div>
                    <div className="hud-center">
                        <span className={`difficulty-pill ${difficultyClass}`}>{getDifficultyLabel(currentIndex)}</span>
                        <span className="round-indicator">Round {currentIndex + 1} / {gameLyrics.length}</span>
                    </div>
                    <div className="hud-stat hud-stat--right">
                        <span className="hud-label">Streak</span>
                        <span className="hud-value streak-value">🔥 {streak}</span>
                    </div>
                </div>
                <div className="progress-row" role="progressbar" aria-valuemin={0} aria-valuemax={gameLyrics.length} aria-valuenow={currentIndex + 1} aria-label={`Question ${currentIndex + 1} of ${gameLyrics.length}`}>
                    <motion.div className="progress-fill" initial={false} animate={{ width: `${((currentIndex + 1) / gameLyrics.length) * 100}%` }} transition={{ duration: 0.4, ease: 'easeOut' }} />
                </div>
                <div className="timer-row" aria-live="polite" aria-atomic="true">
                    <div className="timer-track">
                        <motion.div className="timer-bar" animate={{ width: `${(timeLeft / maxTime) * 100}%`, backgroundColor: timerColor }} transition={{ duration: 1, ease: 'linear' }} />
                    </div>
                    <div className="timer-badge" style={{ borderColor: `${timerColor}40`, background: `${timerColor}12` }}>
                        <span className="timer-label" style={{ color: timerColor }}>{timeLeft}s</span>
                        {(timeLeft <= maxTime / 2) && <span className="timer-urgency" style={{ color: timerColor }}>{timeLeft <= 3 ? '⚡QUICK' : 'FAST'}</span>}
                    </div>
                </div>
                <div className="lyric-box">
                    <div className="lyric-box-header">
                        <span className="lyric-box-label">Guess the Artist</span>
                        <div className="lyric-box-divider" />
                    </div>
                    <p className="lyric-text"><span className="lyric-quote-mark" aria-hidden="true">&ldquo;</span>{currentLyric.lyric_text}<span className="lyric-quote-mark" aria-hidden="true">&rdquo;</span></p>
                </div>
                <div className="options-list" role="group" aria-label="Answer options">
                    {options.map((option, idx) => {
                        const isThisSelected = selectedOption === option;
                        const isThisCorrect = option === currentLyric.correct_artist;
                        let btnClass = 'option-btn';
                        if (selectedOption) {
                            if (isThisSelected && isCorrect) btnClass += ' correct';
                            else if (isThisSelected && !isCorrect) btnClass += ' wrong';
                            else if (isThisCorrect) btnClass += ' reveal-correct';
                        }
                        return (
                            <motion.button key={option} whileHover={!reduced && !selectedOption ? { scale: 1.01 } : undefined} whileTap={!reduced && !selectedOption ? { scale: 0.98 } : undefined} onClick={() => handleOptionSelect(option)} className={btnClass} disabled={!!selectedOption} aria-label={`Option ${idx + 1}: ${option}${isThisSelected ? ' (selected)' : ''}${isThisCorrect && selectedOption ? ' (correct answer)' : ''}`}>
                                <span className="option-number">{idx + 1}</span>
                                <span className="option-label">{option}</span>
                                {selectedOption && (isThisSelected || isThisCorrect) && <span className="feedback-icon" aria-hidden="true">{isThisCorrect ? '✓' : '✕'}</span>}
                            </motion.button>
                        );
                    })}
                </div>
                <div className="keyboard-hint" aria-hidden="true"><kbd>1–4</kbd> to select</div>
            </motion.div>
        );
    } else if (gamePhase === 'interstitial' && currentLyric) {
        gameContent = (
            <motion.div key={`interstitial-${currentIndex}`} className="game-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                <div className="game-hud">
                    <div className="hud-stat">
                        <span className="hud-label">Score</span>
                        <span className="hud-value">{score}</span>
                    </div>
                    <div className="hud-center">
                        <span className={`difficulty-pill ${difficultyClass}`}>{getDifficultyLabel(currentIndex)}</span>
                        <span className="round-indicator">Round {currentIndex + 1} / {gameLyrics.length}</span>
                    </div>
                    <div className="hud-stat hud-stat--right">
                        <span className="hud-label">Streak</span>
                        <span className="hud-value streak-value">🔥 {streak}</span>
                    </div>
                </div>
                <div className="lyric-box">
                    <div className="lyric-box-header">
                        <span className="lyric-box-label">Guess the Artist</span>
                        <div className="lyric-box-divider" />
                    </div>
                    <p className="lyric-text"><span className="lyric-quote-mark" aria-hidden="true">&ldquo;</span>{currentLyric.lyric_text}<span className="lyric-quote-mark" aria-hidden="true">&rdquo;</span></p>
                </div>
                <div className={`result-banner ${isCorrect ? 'result-correct-bg' : 'result-wrong-bg'}`} role="status" aria-live="polite">
                    <div className={`result-banner-text ${isCorrect ? 'result-correct' : 'result-wrong'}`}>{getResultText(selectedOption, isCorrect, currentLyric.correct_artist)}</div>
                    <div className="result-banner-meta">
                        {isCorrect && timeLeft > 0 && <span className="interstitial-points">+{10 + timeLeft} pts</span>}
                        <span className="interstitial-countdown">Next in {secondsLeft}s</span>
                        <button onClick={advanceRound} className="btn-skip">Skip →</button>
                    </div>
                </div>
                <div className="options-list" role="group" aria-label="Answer options">
                    {options.map((option, idx) => {
                        const isThisSelected = selectedOption === option;
                        const isThisCorrect = option === currentLyric.correct_artist;
                        let btnClass = 'option-btn';
                        if (isThisSelected && isCorrect) btnClass += ' correct';
                        else if (isThisSelected && !isCorrect) btnClass += ' wrong';
                        else if (isThisCorrect) btnClass += ' reveal-correct';
                        return (
                            <motion.button key={option} className={btnClass} disabled aria-label={`Option ${idx + 1}: ${option}${isThisCorrect ? ' (correct answer)' : ''}`}>
                                <span className="option-number">{idx + 1}</span>
                                <span className="option-label">{option}</span>
                                {selectedOption && (isThisSelected || isThisCorrect) && <span className="feedback-icon" aria-hidden="true">{isThisCorrect ? '✓' : '✕'}</span>}
                            </motion.button>
                        );
                    })}
                </div>
            </motion.div>
        );
    } else if (gamePhase === 'gameover') {
        gameContent = (
            <motion.div key="gameover" className="game-over" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                <h3>Game Over</h3>
                <div className={`accuracy-badge ${accuracy >= 70 ? 'accuracy-high' : accuracy >= 40 ? 'accuracy-medium' : 'accuracy-low'}`} role="status">
                    {accuracy}% Accuracy
                </div>
                <p className="result-message" role="status">{accuracy >= 90 ? 'Certified lyricologist. The culture salutes you. 🏆' : accuracy >= 70 ? 'Heavy rotation knowledge — the streets respect it.' : accuracy >= 40 ? 'Solid foundation — keep digging in the crates.' : 'Time to study up — the vault stays locked for now.'}</p>
                <div className="accuracy-grid">
                    <div className="stat-item">
                        <div className="stat-value">{score}</div>
                        <div className="stat-label">Final Score</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-value">{totalRounds}</div>
                        <div className="stat-label">Rounds</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-value">🔥 {streak}</div>
                        <div className="stat-label">Max Streak</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-value">🏆 {bestStreak}</div>
                        <div className="stat-label">Best Ever</div>
                    </div>
                </div>
                <div className="footer-actions">
                    <button onClick={handleRestart} className="btn btn-primary">Play Again</button>
                    <button onClick={() => setShowSubmitModal(true)} className="btn btn-secondary">Submit a Lyric</button>
                    <button onClick={shareScore} className="btn-share">{shareState === 'shared' ? 'Copied!' : 'Share Score'}</button>
                </div>
            </motion.div>
        );
    }

    return (
        <section id="lyric-game" className="section game-section">
            <div className="interactive-bg-blur" aria-hidden="true" />
            <div className="interactive-bg-overlay" aria-hidden="true" />
            <div className="container" style={{ position: 'relative', zIndex: 10 }}>
                <div className="game-layout">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: '-60px' }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="section-intro"
                    >
                        <div className="section-badge interactive-badge">Interactive</div>
                        <h2 className="section-title lyric-title">Lyric<br />Master</h2>
                        <p className="section-subtitle lyric-subtitle">Test your NG knowledge. Beat the clock. Prove you know the culture.</p>
                        <div className="intro-stats">
                            <div className="intro-stat">
                                <span className="intro-stat-value">{gameLyrics.length || '—'}</span>
                                <span className="intro-stat-label">Challenges</span>
                            </div>
                            <div className="intro-stat">
                                <span className="intro-stat-value">3</span>
                                <span className="intro-stat-label">Difficulty Tiers</span>
                            </div>
                            <div className="intro-stat">
                                <span className="intro-stat-value">🏆 {bestStreak}</span>
                                <span className="intro-stat-label">Best Streak</span>
                            </div>
                        </div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: '-60px' }}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                        className="game-card-wrapper"
                    >
                        <AnimatePresence>
                            {gameContent}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </div>
            <Modal isOpen={showSubmitModal} onClose={() => setShowSubmitModal(false)} titleId="lyric-submit-title">
                <div className="modal-header">
                    <span className="modal-icon" aria-hidden="true">🎤</span>
                    <h3 className="modal-title" id="lyric-submit-title">Challenge the Community</h3>
                    <p className="modal-subtitle">Think you know the culture better than anyone else? Drop a bar and test the streets.</p>
                </div>
                 <form onSubmit={handleFormSubmit} className="submit-form">
                     <div className="input-group">
                         <label htmlFor="new-lyric">The Bar (Lyric Snippet)</label>
                         <textarea id="new-lyric" name="lyric_text" value={newLyric} onChange={(e) => { setNewLyric(e.target.value); if (lyricError) setLyricError(''); }} onFocus={() => setSubmitError(null)} placeholder="“Real Gs move in silence…”" autoComplete="off" required rows={3} className="premium-input" aria-invalid={!!lyricError} aria-describedby={lyricError ? 'new-lyric-error' : 'new-lyric-help'} />
                         <p id="new-lyric-help" className="input-help">Drop a bar from a song (max 500 characters).</p>
                         {lyricError && <p id="new-lyric-error" className="input-error" role="alert">{lyricError}</p>}
                     </div>
                     <div className="input-group">
                         <label htmlFor="new-song-artist">The Artist (Correct Answer)</label>
                         <input id="new-song-artist" name="correct_artist" type="text" value={newSong} onChange={(e) => { setNewSong(e.target.value); if (artistError) setArtistError(''); }} onFocus={() => setSubmitError(null)} placeholder="e.g. Burna Boy" autoComplete="off" required className="premium-input" aria-invalid={!!artistError} aria-describedby={artistError ? 'new-song-artist-error' : 'new-song-artist-help'} />
                         <p id="new-song-artist-help" className="input-help">Who made this bar? (max 100 characters).</p>
                         {artistError && <p id="new-song-artist-error" className="input-error" role="alert">{artistError}</p>}
                     </div>
                     {submitError && <div className="submit-error" role="alert" aria-live="polite">{submitError}</div>}
                     <div className="form-actions">
                         <button type="button" onClick={() => setShowSubmitModal(false)} className="btn-text">Cancel</button>
                         <button type="submit" disabled={submitting} className="btn-premium">                            {submitting ? 'Dropping logic…' : 'Submit Challenge'}</button>
                     </div>
                 </form>
            </Modal>
            <style jsx>{`
                .game-section { position: relative; }
                .interactive-bg-blur { position: absolute; inset: -60px; background-image: url('/images/lyric-master-bg.jpg'); background-size: cover; background-position: center; filter: blur(3px) saturate(1.2) brightness(0.6); opacity: 1; pointer-events: none; z-index: 1; transition: filter 0.5s ease; }
                .interactive-bg-overlay { position: absolute; inset: 0; background: radial-gradient(circle at center, transparent 10%, rgba(3,3,5,0.92) 100%), linear-gradient(180deg, rgba(3,3,5,0.4) 0%, rgba(3,3,5,0.9) 100%); z-index: 2; pointer-events: none; }
                .game-layout { display: grid; grid-template-columns: 1fr 1.2fr; gap: 80px; align-items: center; }
                @media (max-width: 1024px) { .game-layout { grid-template-columns: 1fr; gap: 60px; } }
                .section-intro { padding: 40px 0; }
                .interactive-badge { display: inline-flex; align-items: center; gap: 8px; font-family: var(--font-condensed); font-size: 0.7rem; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: var(--color-green-light); border: 1px solid rgba(16, 185, 129, 0.4); padding: 6px 18px; border-radius: 50px; margin-bottom: 24px; background: rgba(16, 185, 129, 0.1); box-shadow: 0 0 20px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); }
                .lyric-title { font-size: clamp(4rem, 10vw, 7.5rem); line-height: 0.85; margin-bottom: 24px; text-transform: uppercase; background: linear-gradient(135deg, #ffffff 0%, #34D399 50%, #3B82F6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; filter: drop-shadow(0 4px 30px rgba(16, 185, 129, 0.3)); }
                .lyric-subtitle { font-size: 1.15rem; color: rgba(255,255,255,0.7); max-width: 400px; line-height: 1.6; text-shadow: 0 2px 10px rgba(0,0,0,0.5); }
                .section-intro .intro-stats { display: flex; gap: 40px; margin-top: 48px; padding-top: 32px; border-top: 1px solid rgba(255,255,255,0.1); }
                .section-intro .intro-stat { display: flex; flex-direction: column; gap: 8px; }
                .section-intro .intro-stat-value { font-family: var(--font-display); font-size: 2.5rem; color: white; line-height: 1; text-shadow: 0 0 20px rgba(255,255,255,0.3); }
                .section-intro .intro-stat-label { font-family: var(--font-condensed); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.15em; color: rgba(255,255,255,0.5); }
                .game-card-wrapper { position: relative; z-index: 20; background: rgba(10, 10, 18, 0.6); border-radius: 28px; padding: 4px; box-shadow: 0 0 0 1px rgba(139, 92, 246, 0.25), 0 0 40px rgba(139, 92, 246, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }

                /* Intro Card */
                .game-intro {
                    background: linear-gradient(160deg, rgba(20, 20, 35, 0.95) 0%, rgba(10, 10, 20, 0.98) 100%);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 24px;
                    padding: 52px 44px;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05);
                    position: relative;
                    overflow: hidden;
                }

                .game-intro::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 1px;
                    background: linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.5), transparent);
                }

                .game-intro::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(circle at 50% 0%, rgba(139, 92, 246, 0.12) 0%, transparent 50%);
                    pointer-events: none;
                }

                .intro-visual {
                    position: relative;
                    width: 100px;
                    height: 100px;
                    margin: 0 auto 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .intro-visual-ring {
                    position: absolute;
                    inset: 0;
                    border-radius: 50%;
                    border: 1px solid rgba(139, 92, 246, 0.4);
                    animation: introPulseRing 3s ease-out infinite;
                }

                .intro-visual-ring--1 { animation-delay: 0s; }
                .intro-visual-ring--2 { animation-delay: 1s; }
                .intro-visual-ring--3 { animation-delay: 2s; }

                .intro-visual-icon {
                    font-size: 3rem;
                    position: relative;
                    z-index: 1;
                    filter: drop-shadow(0 0 30px rgba(139, 92, 246, 0.6));
                }

                @keyframes introPulseRing {
                    0% { transform: scale(0.8); opacity: 0.8; }
                    100% { transform: scale(1.8); opacity: 0; }
                }

                .intro-content { position: relative; z-index: 1; }

                .intro-eyebrow {
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    font-family: var(--font-condensed);
                    font-size: 0.75rem;
                    font-weight: 700;
                    letter-spacing: 0.25em;
                    text-transform: uppercase;
                    color: var(--color-green-light);
                    border: 1px solid rgba(16, 185, 129, 0.4);
                    padding: 8px 20px;
                    border-radius: 24px;
                    margin-bottom: 28px;
                    background: rgba(16, 185, 129, 0.1);
                    box-shadow: 0 0 20px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(4px);
                    -webkit-backdrop-filter: blur(4px);
                }

                .intro-eyebrow-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: var(--color-green);
                    box-shadow: 0 0 12px var(--color-green);
                    animation: pulse-dot 2s ease-in-out infinite;
                }

                .intro-title {
                    font-family: var(--font-display);
                    font-size: clamp(3rem, 6vw, 4.5rem);
                    line-height: 0.9;
                    letter-spacing: 0.02em;
                    margin-bottom: 20px;
                    background: linear-gradient(135deg, #ffffff 0%, #c4b5fd 50%, #a78bfa 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    filter: drop-shadow(0 4px 30px rgba(139, 92, 246, 0.3));
                }

                .intro-subtitle {
                    font-size: 1.1rem;
                    color: var(--color-text-secondary);
                    margin-bottom: 40px;
                    line-height: 1.7;
                    max-width: 480px;
                    margin-left: auto;
                    margin-right: auto;
                    text-align: center;
                }

                .game-intro .intro-stats {
                    display: flex;
                    justify-content: center;
                    gap: 20px;
                    margin-bottom: 40px;
                }

                .game-intro .intro-stat-card {
                    flex: 1;
                    max-width: 160px;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 20px;
                    padding: 20px 16px;
                    text-align: center;
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                }

                .game-intro .intro-stat-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 1px;
                    background: linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.4), transparent);
                }

                .game-intro .intro-stat-card:hover {
                    border-color: rgba(139, 92, 246, 0.4);
                    background: rgba(139, 92, 246, 0.1);
                    transform: translateY(-4px);
                    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(139, 92, 246, 0.1);
                }

                .game-intro .intro-stat-value {
                    font-family: var(--font-display);
                    font-size: 2.2rem;
                    color: white;
                    line-height: 1;
                    display: block;
                    margin-bottom: 8px;
                    text-shadow: 0 0 20px rgba(255, 255, 255, 0.2);
                }

                .game-intro .intro-stat-label {
                    font-family: var(--font-condensed);
                    font-size: 0.65rem;
                    text-transform: uppercase;
                    letter-spacing: 0.15em;
                    color: var(--color-text-muted);
                    display: block;
                    margin-bottom: 12px;
                }

                .game-intro .intro-stat-bar {
                    display: block;
                    height: 3px;
                    background: linear-gradient(90deg, var(--color-green), var(--color-purple));
                    border-radius: 2px;
                    margin: 0 auto;
                    opacity: 0.6;
                    transition: width 0.6s ease;
                }

                .intro-instructions {
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 20px;
                    padding: 24px 28px;
                    margin-bottom: 36px;
                    backdrop-filter: blur(4px);
                    -webkit-backdrop-filter: blur(4px);
                }

                .intro-instructions h4 {
                    font-family: var(--font-condensed);
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.2em;
                    color: rgba(255, 255, 255, 0.6);
                    margin-bottom: 20px;
                    text-align: center;
                }

                .intro-instruction {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 12px 0;
                    color: rgba(255, 255, 255, 0.8);
                    font-size: 0.9rem;
                    line-height: 1.5;
                }

                .intro-instruction:not(:last-child) {
                    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
                }

                .step-num {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 32px;
                    height: 32px;
                    flex-shrink: 0;
                    background: linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(139, 92, 246, 0.25));
                    border: 1px solid rgba(16, 185, 129, 0.4);
                    border-radius: 10px;
                    font-family: var(--font-condensed);
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: var(--color-green-light);
                    letter-spacing: 0.02em;
                }

                .intro-instruction kbd {
                    display: inline-block;
                    padding: 3px 10px;
                    background: rgba(255, 255, 255, 0.06);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 6px;
                    font-family: var(--font-condensed);
                    font-size: 0.75rem;
                    color: rgba(255, 255, 255, 0.7);
                    line-height: 1.6;
                }

                .btn-start {
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 14px;
                    width: 100%;
                    background: linear-gradient(135deg, #10B981 0%, #059669 100%);
                    color: white;
                    border: none;
                    padding: 20px 36px;
                    border-radius: 16px;
                    font-family: var(--font-condensed);
                    font-size: 1.1rem;
                    font-weight: 700;
                    letter-spacing: 0.14em;
                    text-transform: uppercase;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 6px 30px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.25);
                    touch-action: manipulation;
                    overflow: hidden;
                }

                .btn-start::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(135deg, rgba(255, 255, 255, 0.25), transparent 60%);
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }

                .btn-start:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 12px 44px rgba(16, 185, 129, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3);
                }

                .btn-start:hover::before {
                    opacity: 1;
                }

                .btn-start:active {
                    transform: translateY(0) scale(0.97);
                }

                .btn-start:focus-visible {
                    outline: 2px solid var(--color-green);
                    outline-offset: 3px;
                }

                .btn-start-icon {
                    font-size: 0.85rem;
                    opacity: 0.9;
                    position: relative;
                    z-index: 1;
                }

                .btn-start-text {
                    position: relative;
                    z-index: 1;
                }

                .intro-hint {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    margin-top: 20px;
                    font-size: 0.8rem;
                    color: var(--color-text-muted);
                    font-family: var(--font-condensed);
                    letter-spacing: 0.1em;
                }

                .intro-hint-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: var(--color-green);
                    box-shadow: 0 0 10px var(--color-green);
                    animation: pulse-dot 2s ease-in-out infinite;
                    flex-shrink: 0;
                }

                @keyframes pulse-dot {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                }

                /* Game Card — deep dark glassmorphism with neon rim */
                .game-card {
                    position: relative;
                    background: linear-gradient(170deg, rgba(18, 18, 30, 0.92) 0%, rgba(8, 8, 16, 0.96) 100%);
                    -webkit-backdrop-filter: blur(20px);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 24px;
                    padding: 32px;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 0 0 1px rgba(139, 92, 246, 0.1);
                    overflow: hidden;
                    transition: box-shadow 0.4s ease, border-color 0.4s ease;
                }

                .game-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 1px;
                    background: linear-gradient(90deg, transparent 0%, rgba(139, 92, 246, 0.5) 50%, transparent 100%);
                }

                .game-card::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(ellipse at 50% 0%, rgba(139, 92, 246, 0.1) 0%, transparent 60%);
                    pointer-events: none;
                    border-radius: 24px;
                }

                .game-card:hover {
                    border-color: rgba(139, 92, 246, 0.3);
                    box-shadow: 0 24px 70px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 0 30px rgba(139, 92, 246, 0.12);
                }

                @media (max-width: 640px) {
                    .game-card {
                        padding: 24px 18px 28px;
                        border-radius: 20px;
                    }
                    .game-intro {
                        padding: 40px 24px;
                    }
                    .intro-title {
                        font-size: 1.8rem;
                    }
                    .lyric-text {
                        font-size: 1.25rem !important;
                    }
                    .lyric-box {
                        padding: 18px 16px 18px 20px;
                    }
                }

                /* HUD — glassmorphism header bar */
                .game-hud {
                    display: grid;
                    grid-template-columns: 1fr auto 1fr;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 20px;
                    padding: 14px 18px;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 16px;
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                }

                .hud-stat {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .hud-stat--right {
                    align-items: flex-end;
                }

                .hud-center {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                }

                .hud-label {
                    font-family: var(--font-condensed);
                    font-size: 0.6rem;
                    text-transform: uppercase;
                    letter-spacing: 0.14em;
                    color: var(--color-grey-blue);
                }

                .hud-value {
                    font-size: 0.95rem;
                    font-weight: 700;
                    color: rgba(255, 255, 255, 0.9);
                    font-variant-numeric: tabular-nums;
                    line-height: 1;
                }

                .streak-value {
                    color: #F59E0B;
                    display: inline-flex;
                    align-items: center;
                    gap: 3px;
                    animation: pulse-glow 2s infinite;
                }

                @keyframes pulse-glow {
                    0%, 100% { text-shadow: 0 0 8px rgba(245,158,11,0.3); }
                    50% { text-shadow: 0 0 16px rgba(245,158,11,0.6); }
                }

                .difficulty-pill {
                    padding: 4px 14px;
                    border-radius: 20px;
                    font-size: 0.68rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    box-shadow: 0 0 12px rgba(0, 0, 0, 0.2);
                }

                .difficulty-beginner { background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.3); box-shadow: 0 0 12px rgba(16,185,129,0.15); }
                .difficulty-intermediate { background: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); box-shadow: 0 0 12px rgba(245,158,11,0.15); }
                .difficulty-expert { background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); box-shadow: 0 0 12px rgba(239,68,68,0.15); }

                .round-indicator { font-size: 0.72rem; color: var(--color-grey-blue); font-family: var(--font-condensed); letter-spacing: 0.08em; }

                /* Question progress */
                .progress-row {
                    height: 4px;
                    background: rgba(255,255,255,0.06);
                    border-radius: 4px;
                    overflow: hidden;
                    margin-bottom: 14px;
                }

                .progress-fill {
                    height: 100%;
                    border-radius: 4px;
                    background: linear-gradient(90deg, var(--color-green), var(--color-purple));
                    box-shadow: 0 0 10px rgba(139,92,246,0.4);
                }

                /* Timer — sleek pill with shine sweep */
                .timer-row {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 24px;
                }

                .timer-badge {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    border-radius: 8px;
                    padding: 5px 12px;
                    flex-shrink: 0;
                    border: 1px solid;
                    transition: border-color 0.5s ease, background 0.5s ease, box-shadow 0.5s ease;
                }

                .timer-urgency {
                    font-family: var(--font-condensed);
                    font-size: 0.58rem;
                    font-weight: 700;
                    letter-spacing: 0.16em;
                    text-transform: uppercase;
                    transition: color 0.5s ease;
                    animation: urgencyPulse 1s ease-in-out infinite;
                }

                @keyframes urgencyPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.08); }
                }

                .timer-track {
                    flex: 1;
                    height: 8px;
                    background: rgba(255,255,255,0.08);
                    border-radius: 8px;
                    overflow: hidden;
                    position: relative;
                }

                .timer-bar {
                    height: 100%;
                    border-radius: 8px;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 0 12px currentColor;
                }

                .timer-bar::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent);
                    animation: timerShine 2s ease-in-out infinite;
                }

                @keyframes timerShine {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }

                .timer-label {
                    font-family: var(--font-condensed);
                    font-size: 1rem;
                    font-weight: 700;
                    letter-spacing: 0.04em;
                    transition: color 0.5s ease;
                }

                /* Lyric Box — dark clue panel */
                .lyric-box {
                    position: relative;
                    background: rgba(10, 10, 18, 0.7);
                    border-left: 3px solid var(--color-purple);
                    padding: 22px 22px 22px 26px;
                    border-radius: 0 20px 20px 0;
                    margin-bottom: 20px;
                    box-shadow: inset 0 0 40px rgba(139, 92, 246, 0.05), 0 0 20px rgba(139, 92, 246, 0.04);
                    backdrop-filter: blur(4px);
                    -webkit-backdrop-filter: blur(4px);
                }

                .lyric-box-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 12px;
                }

                .lyric-box-label {
                    font-family: var(--font-condensed);
                    font-size: 0.6rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.18em;
                    color: var(--color-purple-light);
                    opacity: 0.6;
                }

                .lyric-box-divider {
                    flex: 1;
                    height: 1px;
                    background: rgba(139,92,246,0.15);
                }

                .lyric-quote-mark {
                    display: inline;
                    font-family: Georgia, serif;
                    font-size: 2rem;
                    line-height: 1;
                    color: rgba(139, 92, 246, 0.6);
                    user-select: none;
                    vertical-align: -0.12em;
                    text-shadow: 0 0 10px rgba(139, 92, 246, 0.3);
                }

                .lyric-text {
                    font-size: clamp(1.3rem, 2.5vw, 1.7rem);
                    font-weight: 600;
                    color: white;
                    line-height: 1.5;
                    font-style: italic;
                    overflow-wrap: break-word;
                    text-wrap: balance;
                    letter-spacing: -0.01em;
                    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
                }

                /* Options — game selection cards */
                .options-list {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .option-btn {
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 16px;
                    padding: 0;
                    display: flex;
                    align-items: stretch;
                    color: white;
                    cursor: pointer;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    touch-action: manipulation;
                    min-height: 56px;
                    overflow: hidden;
                }

                .option-btn::before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 0;
                    bottom: 0;
                    width: 4px;
                    background: transparent;
                    transition: background 0.25s ease, box-shadow 0.25s ease;
                }

                .option-btn:focus-visible {
                    outline: 2px solid var(--color-purple);
                    outline-offset: 2px;
                }

                .option-btn:hover:not(:disabled) {
                    background: rgba(139,92,246,0.12);
                    border-color: rgba(139,92,246,0.4);
                    transform: translateX(6px);
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3), 0 0 15px rgba(139, 92, 246, 0.1);
                }

                .option-btn:hover:not(:disabled)::before {
                    background: var(--color-purple);
                    box-shadow: 0 0 12px var(--color-purple);
                }

                .option-btn:active:not(:disabled) {
                    transform: translateX(6px) scale(0.99);
                }

                .option-btn:disabled {
                    cursor: default;
                    opacity: 0.85;
                }

                .option-number {
                    width: 52px;
                    flex-shrink: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.9rem;
                    font-weight: 700;
                    font-family: var(--font-condensed);
                    color: var(--color-purple-light);
                    background: rgba(139,92,246,0.1);
                    border-right: 1px solid rgba(139,92,246,0.15);
                    letter-spacing: 0.04em;
                    transition: all 0.25s ease;
                }

                .option-btn:hover:not(:disabled) .option-number {
                    background: rgba(139,92,246,0.2);
                    color: #c4b5fd;
                }

                .option-label {
                    flex: 1;
                    font-size: 0.95rem;
                    font-weight: 600;
                    line-height: 1.4;
                    text-align: left;
                    padding: 0 18px;
                    display: flex;
                    align-items: center;
                    font-family: var(--font-body);
                    letter-spacing: 0.01em;
                }

                .option-btn.correct {
                    background: rgba(16,185,129,0.12);
                    border-color: rgba(16,185,129,0.5);
                    box-shadow: 0 0 0 1px rgba(16,185,129,0.3), 0 4px 20px rgba(16,185,129,0.15), 0 0 24px rgba(16,185,129,0.12);
                    animation: correctPulse 2s ease-in-out infinite;
                }

                @keyframes correctPulse {
                    0%, 100% { box-shadow: 0 0 0 1px rgba(16,185,129,0.3), 0 4px 20px rgba(16,185,129,0.15), 0 0 24px rgba(16,185,129,0.12); }
                    50% { box-shadow: 0 0 0 1px rgba(16,185,129,0.4), 0 4px 28px rgba(16,185,129,0.25), 0 0 36px rgba(16,185,129,0.2); }
                }

                .option-btn.correct::before {
                    background: #10b981;
                    box-shadow: 0 0 14px rgba(16,185,129,0.6);
                }

                .option-btn.correct .option-number {
                    background: rgba(16,185,129,0.25);
                    border-right-color: rgba(16,185,129,0.5);
                    color: #10b981;
                }

                .option-btn.wrong {
                    background: rgba(239,68,68,0.12);
                    border-color: rgba(239,68,68,0.5);
                    box-shadow: 0 0 0 1px rgba(239,68,68,0.3);
                    animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
                }

                @keyframes shake {
                    10%, 90% { transform: translateX(-2px); }
                    20%, 80% { transform: translateX(3px); }
                    30%, 50%, 70% { transform: translateX(-5px); }
                    40%, 60% { transform: translateX(5px); }
                }

                .option-btn.wrong::before {
                    background: #ef4444;
                    box-shadow: 0 0 14px rgba(239,68,68,0.6);
                }

                .option-btn.wrong .option-number {
                    background: rgba(239,68,68,0.25);
                    border-right-color: rgba(239,68,68,0.5);
                    color: #ef4444;
                }

                .option-btn.reveal-correct {
                    border-color: rgba(16,185,129,0.5);
                    background: rgba(16,185,129,0.06);
                    box-shadow: 0 0 0 1px rgba(16,185,129,0.2);
                }

                .option-btn.reveal-correct::before {
                    background: rgba(16,185,129,0.5);
                }

                .option-btn.reveal-correct .option-number {
                    background: rgba(16,185,129,0.2);
                    border-right-color: rgba(16,185,129,0.4);
                    color: #10b981;
                }

                .feedback-icon {
                    padding-right: 16px;
                    font-size: 1rem;
                    font-weight: 700;
                    flex-shrink: 0;
                    display: flex;
                    align-items: center;
                }

                .keyboard-hint {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    margin-top: 14px;
                    font-size: 0.72rem;
                    color: rgba(255,255,255,0.55);
                    font-family: var(--font-condensed);
                    letter-spacing: 0.06em;
                }

                @media (hover: none) { .keyboard-hint { display: none; } }

                kbd {
                    display: inline-block;
                    padding: 2px 7px;
                    background: rgba(255,255,255,0.06);
                    border: 1px solid rgba(255,255,255,0.12);
                    border-radius: 5px;
                    font-family: var(--font-condensed);
                    font-size: 0.72rem;
                    color: rgba(255,255,255,0.5);
                    line-height: 1.6;
                }

                /* Result Banner */
                .result-banner {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    border-radius: 16px;
                    padding: 18px 22px;
                    margin-bottom: 16px;
                    position: relative;
                    overflow: hidden;
                }

                .result-banner.result-correct-bg {
                    background: linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0.04) 100%);
                    border: 1px solid rgba(16,185,129,0.35);
                    box-shadow: 0 0 24px rgba(16,185,129,0.12);
                }

                .result-banner.result-wrong-bg {
                    background: linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(239,68,68,0.04) 100%);
                    border: 1px solid rgba(239,68,68,0.3);
                    box-shadow: 0 0 24px rgba(239,68,68,0.1);
                }

                .result-banner-text {
                    font-size: 1.25rem;
                    font-weight: 700;
                    line-height: 1.35;
                    position: relative;
                    z-index: 1;
                }

                .result-correct { color: #34d399; }
                .result-wrong { color: #f87171; }

                .result-banner-meta {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    position: relative;
                    z-index: 1;
                }

                .interstitial-countdown {
                    font-size: 0.78rem;
                    color: var(--color-grey-blue);
                    font-family: var(--font-condensed);
                }

                .btn-skip {
                    background: transparent;
                    border: 1px solid rgba(255,255,255,0.2);
                    color: var(--color-grey-blue);
                    padding: 8px 20px;
                    border-radius: 10px;
                    font-family: var(--font-condensed);
                    font-size: 0.85rem;
                    cursor: pointer;
                    transition: color 0.2s ease, border-color 0.2s ease;
                    touch-action: manipulation;
                }

                .btn-skip:hover {
                    color: white;
                    border-color: rgba(255,255,255,0.4);
                }

                .btn-skip:focus-visible {
                    outline: 2px solid rgba(255,255,255,0.4);
                    outline-offset: 2px;
                }

                .interstitial-points {
                    font-size: 1.1rem;
                    color: #a855f7;
                    font-family: var(--font-condensed);
                    font-weight: 700;
                    animation: pointsPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }

                @keyframes pointsPop {
                    0% { transform: scale(0.5); opacity: 0; }
                    60% { transform: scale(1.2); }
                    100% { transform: scale(1); opacity: 1; }
                }

                .footer-actions {
                    display: flex;
                    justify-content: center;
                    flex-wrap: wrap;
                    gap: 20px;
                }

                /* Game Over — dark stats grid */
                .game-over {
                    text-align: center;
                    padding: 60px 0;
                    position: relative;
                }

                .game-over h3 {
                    font-family: var(--font-display);
                    font-size: 2.5rem;
                    margin-bottom: 20px;
                    background: linear-gradient(135deg, #FFFFFF 0%, #8B5CF6 50%, #EC4899 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    letter-spacing: 0.02em;
                    filter: drop-shadow(0 4px 20px rgba(139, 92, 246, 0.3));
                }

                .accuracy-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
                    gap: 16px;
                    margin-bottom: 32px;
                }

                .stat-item {
                    text-align: center;
                    padding: 24px 20px;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 16px;
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                }

                .stat-item:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3), 0 0 20px rgba(139, 92, 246, 0.08);
                }

                .stat-value {
                    font-size: 2rem;
                    font-weight: 700;
                    color: white;
                    margin-bottom: 4px;
                    font-variant-numeric: tabular-nums;
                }

                .stat-label {
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    color: var(--color-grey-blue);
                    font-family: var(--font-condensed);
                }

                .accuracy-badge {
                    display: inline-block;
                    padding: 8px 22px;
                    border-radius: var(--radius-pill);
                    font-family: var(--font-condensed);
                    font-size: 0.9rem;
                    font-weight: 700;
                    letter-spacing: 0.1em;
                    text-transform: uppercase;
                    margin-bottom: 16px;
                }

                .result-message {
                    font-size: 1rem;
                    color: var(--color-grey-blue);
                    max-width: 420px;
                    margin: 0 auto 28px;
                    line-height: 1.6;
                }

                .accuracy-high { background: rgba(16,185,129,0.15); color: #10b981; box-shadow: 0 0 20px rgba(16,185,129,0.2); }
                .accuracy-medium { background: rgba(245,158,11,0.15); color: #f59e0b; box-shadow: 0 0 20px rgba(245,158,11,0.2); }
                .accuracy-low { background: rgba(239,68,68,0.15); color: #ef4444; box-shadow: 0 0 20px rgba(239,68,68,0.2); }

                .game-over p {
                    font-size: 1.2rem;
                    color: var(--color-grey-blue);
                    margin-bottom: 8px;
                }

                .game-over strong {
                    color: white;
                }

                .btn-share {
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.08);
                    color: var(--color-grey-blue);
                    padding: 12px 28px;
                    border-radius: 8px;
                    font-family: var(--font-condensed);
                    font-weight: 600;
                    letter-spacing: 0.05em;
                    text-transform: uppercase;
                    cursor: pointer;
                    transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
                    touch-action: manipulation;
                }

                .btn-share:hover {
                    background: rgba(255,255,255,0.08);
                    color: white;
                    border-color: rgba(255,255,255,0.2);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                }

                .btn-share:focus-visible {
                    outline: 2px solid var(--color-green);
                    outline-offset: 2px;
                }

                .game-loading {
                    text-align: center;
                    padding: 60px 0;
                    color: var(--color-grey-blue);
                }

                /* Modal */
                .modal-header {
                    text-align: center;
                    margin-bottom: 32px;
                }

                .modal-icon {
                    font-size: 2.5rem;
                    display: inline-block;
                    margin-bottom: 16px;
                    background: rgba(255,255,255,0.03);
                    padding: 16px;
                    border-radius: 50%;
                    border: 1px solid rgba(255,255,255,0.05);
                }

                .modal-title {
                    font-family: var(--font-display);
                    font-size: 1.8rem;
                    margin-bottom: 8px;
                    color: white;
                    background: linear-gradient(135deg, #fff 0%, #a855f7 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
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
                    background: rgba(0,0,0,0.3);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 12px;
                    padding: 14px 16px;
                    color: white;
                    outline: none;
                    font-size: 1rem;
                    transition: border-color 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease;
                    font-family: inherit;
                }

                .premium-input:focus-visible {
                    border-color: var(--color-purple);
                    background: rgba(139,92,246,0.05);
                    box-shadow: 0 0 0 4px rgba(139,92,246,0.1);
                }

                .premium-input::placeholder {
                    color: rgba(255,255,255,0.2);
                    font-style: italic;
                }

                .input-help {
                    font-size: 0.75rem;
                    color: rgba(255,255,255,0.6);
                    margin-top: 4px;
                }

                .input-error {
                    font-size: 0.75rem;
                    color: #F87171;
                    margin-top: 4px;
                }

                .submit-error {
                    background: rgba(239,68,68,0.15);
                    border: 1px solid #ef4444;
                    border-radius: 12px;
                    padding: 12px 16px;
                    font-size: 0.9rem;
                    color: #fca5a5;
                }

                .form-actions {
                    display: flex;
                    justify-content: flex-end;
                    align-items: center;
                    gap: 16px;
                    margin-top: 16px;
                    border-top: 1px solid rgba(255,255,255,0.05);
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
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                    box-shadow: 0 4px 14px rgba(139,92,246,0.3);
                    touch-action: manipulation;
                }

                .btn-premium:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(139,92,246,0.45);
                }

                .btn-premium:focus-visible {
                    outline: 2px solid var(--color-purple);
                    outline-offset: 2px;
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

                .btn-text:focus-visible {
                    outline: 2px solid var(--color-purple);
                    outline-offset: 2px;
                }

                @media (prefers-reduced-motion: reduce) {
                    *, *::before, *::after {
                        animation-duration: 0.01ms !important;
                        animation-iteration-count: 1 !important;
                        transition-duration: 0.01ms !important;
                    }
                }
            `}</style>

        </section>
    );
}
