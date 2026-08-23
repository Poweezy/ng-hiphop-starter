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
const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;
const RING_RADIUS = 54;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const GAME_TIPS = [
    'Listen carefully to the rhythm and context of the song!',
    'Fast answers earn bonus points — trust your first instinct.',
    'Streaks build momentum. Don\u2019t break the chain!',
    'Rounds get faster as you climb the difficulty tiers.',
];

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

function Waveform({ flip = false }: { flip?: boolean }) {
    const bars = [6, 12, 8, 16, 10, 18, 7, 14, 9, 5];
    return (
        <svg className={`lyric-wave${flip ? ' lyric-wave--flip' : ''}`} viewBox="0 0 64 24" aria-hidden="true">
            {bars.map((h, i) => (
                <rect key={i} x={i * 6.4 + 1} y={12 - h / 2} width="3.2" height={h} rx="1.6" />
            ))}
        </svg>
    );
}

export default function LyricGame({ lyrics }: LyricGameProps) {
    const reduced = useReducedMotion();
    const [gameLyrics, setGameLyrics] = useState<LyricEntry[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [bestScore, setBestScore] = useState(0);
    const [newBestScore, setNewBestScore] = useState(false);
    const prevBestScoreRef = useRef(0);
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
        const savedStreak = localStorage.getItem('ng-lyric-game-best-streak');
        if (savedStreak) setBestStreak(parseInt(savedStreak, 10));
        const savedScore = localStorage.getItem('ng-lyric-game-best-score');
        if (savedScore) setBestScore(parseInt(savedScore, 10));
    }, []);

    useEffect(() => {
        if (streak > bestStreak) {
            setBestStreak(streak);
            localStorage.setItem('ng-lyric-game-best-streak', String(streak));
        }
    }, [streak, bestStreak]);

    useEffect(() => {
        if (score > bestScore) {
            setBestScore(score);
            localStorage.setItem('ng-lyric-game-best-score', String(score));
        }
    }, [score, bestScore]);

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

    const optionsRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (gameLyrics.length === 0) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (gamePhase === 'playing' && isPlaying && !selectedOption) {
                const key = e.key.toLowerCase();
                let idx = -1;
                if (key >= '1' && key <= '4') idx = parseInt(key) - 1;
                if (['a', 'b', 'c', 'd'].includes(key)) idx = key.charCodeAt(0) - 97;

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

    // Move focus to the options group when a new question mounts so keyboard
    // and screen-reader users don't lose their place after "Next Question".
    useEffect(() => {
        if (gamePhase === 'playing') {
            optionsRef.current?.focus();
        }
    }, [gamePhase, currentIndex]);

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
        prevBestScoreRef.current = bestScore;
        setNewBestScore(false);
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
        setNewBestScore(score > prevBestScoreRef.current && score > 0);
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
    const progressPct = gameLyrics.length > 0 ? Math.round(((currentIndex + 1) / gameLyrics.length) * 100) : 0;
    const maxPossibleScore: number = Array.from({ length: Math.max(totalRounds, 0) })
        .reduce<number>((sum, _, i) => sum + 10 + getTimerForRound(i), 0);
    const ringPct = maxPossibleScore > 0 ? Math.min(100, Math.round((score / maxPossibleScore) * 100)) : 0;
    const wrongAnswers = Math.max(0, totalRounds - correctAnswers);
    const shareText = `I scored ${score} points on NG Hip Hop's Lyric Master! 🔥 My max streak: ${bestStreak}. Can you beat it?`;
    const tip = GAME_TIPS[currentIndex % GAME_TIPS.length];

    const renderStatsBar = (showTimer: boolean) => (
        <div className="hud-grid" role="group" aria-label="Game statistics">
            <div className="stat-tile">
                <span className={`stat-tile-icon${streak >= 3 ? ' stat-tile-icon--hot' : ''}`} aria-hidden="true">🔥</span>
                <div className="stat-tile-body">
                    <span className="stat-tile-label">Current Streak</span>
                    <span className={`stat-tile-value${streak >= 3 ? ' stat-tile-value--hot' : ''}`}>{streak}</span>
                    <span className="stat-tile-sub">Best: {bestStreak}</span>
                </div>
            </div>
            <div className="stat-tile">
                <span className="stat-tile-icon stat-tile-icon--gold" aria-hidden="true">⭐</span>
                <div className="stat-tile-body">
                    <span className="stat-tile-label">Score</span>
                    <span className="stat-tile-value">{score.toLocaleString()}</span>
                    <span className="stat-tile-sub">Best: {bestScore.toLocaleString()}</span>
                </div>
            </div>
            <div className="stat-tile">
                <span className="stat-tile-icon stat-tile-icon--purple" aria-hidden="true">🎯</span>
                <div className="stat-tile-body">
                    <span className="stat-tile-label">Accuracy</span>
                    <span className="stat-tile-value">{accuracy}%</span>
                    <span className="stat-tile-sub">{correctAnswers}/{totalRounds} rounds</span>
                </div>
            </div>
            {showTimer ? (
                <div className="stat-tile stat-tile--timer">
                    <span className="stat-tile-icon stat-tile-icon--blue" aria-hidden="true">⏱️</span>
                    <div className="stat-tile-body">
                        <span className="stat-tile-label">Time Left</span>
                        <span className="stat-tile-value" aria-live="off" style={{ color: timeLeft <= 3 ? timerColor : undefined }}>{timeLeft}s</span>
                        <span className="stat-tile-timer-track" aria-hidden="true">
                            <motion.span
                                className="stat-tile-timer-fill"
                                animate={{ width: `${(timeLeft / maxTime) * 100}%`, backgroundColor: timerColor }}
                                transition={{ duration: 1, ease: 'linear' }}
                            />
                        </span>
                    </div>
                </div>
            ) : (
                <div className="stat-tile">
                    <span className="stat-tile-icon stat-tile-icon--blue" aria-hidden="true">⏱️</span>
                    <div className="stat-tile-body">
                        <span className="stat-tile-label">Time Left</span>
                        <span className="stat-tile-value">—</span>
                        <span className="stat-tile-sub">Paused</span>
                    </div>
                </div>
            )}
        </div>
    );

    const renderOptions = (interactive: boolean) => (
        <div className="options-list" role="group" aria-label="Answer options" ref={optionsRef} tabIndex={-1}>
            {options.map((option, idx) => {
                const isThisSelected = selectedOption === option;
                const isThisCorrect = option === currentLyric?.correct_artist;
                let btnClass = 'option-btn';
                if (selectedOption) {
                    if (isThisSelected && isCorrect) btnClass += ' correct';
                    else if (isThisSelected && !isCorrect) btnClass += ' wrong';
                    else if (isThisCorrect) btnClass += ' reveal-correct';
                }
                return (
                    <motion.button
                        key={option}
                        whileHover={!reduced && interactive && !selectedOption ? { scale: 1.01 } : undefined}
                        whileTap={!reduced && interactive && !selectedOption ? { scale: 0.98 } : undefined}
                        onClick={interactive ? () => handleOptionSelect(option) : undefined}
                        className={btnClass}
                        disabled={!interactive || !!selectedOption}
                        aria-label={`Option ${OPTION_LETTERS[idx]}: ${option}${isThisSelected ? ' (selected)' : ''}${isThisCorrect && selectedOption ? ' (correct answer)' : ''}`}
                    >
                        <span className="option-letter" aria-hidden="true">{OPTION_LETTERS[idx]}</span>
                        <span className="option-label">{option}</span>
                        {selectedOption && (isThisSelected || isThisCorrect) && (
                            <span className={`feedback-icon ${isThisCorrect ? 'feedback-icon--correct' : 'feedback-icon--wrong'}`} aria-hidden="true">
                                {isThisCorrect ? '✓' : '✕'}
                            </span>
                        )}
                    </motion.button>
                );
            })}
        </div>
    );

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
                            <span className="intro-stat-value">⭐ {bestScore.toLocaleString()}</span>
                            <span className="intro-stat-label">Best Score</span>
                            <span className="intro-stat-bar" style={{ width: Math.min(100, bestScore) + '%' }} />
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
                            <span>Use <kbd>1–4</kbd> or <kbd>A–D</kbd> on your keyboard to answer.</span>
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
                {renderStatsBar(true)}

                <div className="question-meta">
                    <span className={`question-pill ${difficultyClass}`}>
                        QUESTION {currentIndex + 1} OF {gameLyrics.length} · {getDifficultyLabel(currentIndex)}
                    </span>
                </div>

                <div className="progress-row" role="progressbar" aria-valuemin={0} aria-valuemax={gameLyrics.length} aria-valuenow={currentIndex + 1} aria-label={`Question ${currentIndex + 1} of ${gameLyrics.length}`}>
                    <div className="progress-track">
                        <motion.div className="progress-fill" initial={false} animate={{ width: `${progressPct}%` }} transition={{ duration: 0.4, ease: 'easeOut' }} />
                    </div>
                    <span className="progress-pct">{progressPct}%</span>
                </div>

                <h3 className="question-heading">Guess the Artist</h3>

                <div className="lyric-quote">
                    <Waveform />
                    <blockquote className="lyric-quote-text">
                        &ldquo;{currentLyric.lyric_text}&rdquo;
                    </blockquote>
                    <Waveform flip />
                </div>

                {renderOptions(true)}

                <div className="keyboard-hint" aria-hidden="true"><kbd>1–4</kbd> or <kbd>A–D</kbd> to select</div>

                <div className="tip-strip" role="note">
                    <span className="tip-icon" aria-hidden="true">💡</span>
                    <span className="tip-text"><strong>TIP:</strong> {tip}</span>
                </div>
            </motion.div>
        );
    } else if (gamePhase === 'interstitial' && currentLyric) {
        gameContent = (
            <motion.div key={`interstitial-${currentIndex}`} className="game-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                {renderStatsBar(false)}

                <div className="question-meta">
                    <span className={`question-pill ${difficultyClass}`}>
                        QUESTION {currentIndex + 1} OF {gameLyrics.length} · {getDifficultyLabel(currentIndex)}
                    </span>
                </div>

                <div className="lyric-quote">
                    <Waveform />
                    <blockquote className="lyric-quote-text">
                        &ldquo;{currentLyric.lyric_text}&rdquo;
                    </blockquote>
                    <Waveform flip />
                </div>

                {renderOptions(false)}

                <div className={`result-banner ${isCorrect ? 'result-correct-bg' : 'result-wrong-bg'}`} role="status" aria-live="polite">
                    <div className="result-banner-main">
                        <div className={`result-banner-text ${isCorrect ? 'result-correct' : 'result-wrong'}`}>{getResultText(selectedOption, isCorrect, currentLyric.correct_artist)}</div>
                        <div className="result-banner-meta">
                            {isCorrect && timeLeft > 0 && <span className="interstitial-points">+{10 + timeLeft} pts</span>}
                            <span className="interstitial-countdown">Next in {secondsLeft}s</span>
                        </div>
                    </div>
                    <button onClick={advanceRound} className="btn-next">
                        Next Question <span className="btn-next-arrow" aria-hidden="true">→</span>
                    </button>
                </div>
            </motion.div>
        );
    } else if (gamePhase === 'gameover') {
        gameContent = (
            <motion.div key="gameover" className="results-panel" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}>
                <div className="confetti-layer" aria-hidden="true">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <span key={i} className={`confetti-dot confetti-dot--${i + 1}`} />
                    ))}
                </div>

                <h3 className="results-title" role="status">{accuracy >= 70 ? 'Great Job!' : 'Game Over'}</h3>
                <p className="results-subtitle" role="status">{accuracy >= 90 ? 'Certified lyricologist. The culture salutes you. 🏆' : accuracy >= 70 ? 'Heavy rotation knowledge — the streets respect it.' : accuracy >= 40 ? 'Solid foundation — keep digging in the crates.' : 'Time to study up — the vault stays locked for now.'}</p>

                <div className="score-ring-wrap">
                    <svg viewBox="0 0 120 120" className="score-ring" role="img" aria-label={`Score ${score} out of a possible ${maxPossibleScore} — ${ringPct} percent`}>
                        <defs>
                            <linearGradient id="lyric-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#8B5CF6" />
                                <stop offset="60%" stopColor="#EC4899" />
                                <stop offset="100%" stopColor="#F59E0B" />
                            </linearGradient>
                        </defs>
                        <circle className="score-ring-bg" cx="60" cy="60" r={RING_RADIUS} />
                        <motion.circle
                            className="score-ring-fill"
                            cx="60"
                            cy="60"
                            r={RING_RADIUS}
                            stroke="url(#lyric-ring-gradient)"
                            strokeDasharray={RING_CIRCUMFERENCE}
                            initial={{ strokeDashoffset: RING_CIRCUMFERENCE }}
                            animate={{ strokeDashoffset: RING_CIRCUMFERENCE * (1 - ringPct / 100) }}
                            transition={{ duration: reduced ? 0 : 1.4, ease: 'easeOut', delay: 0.3 }}
                        />
                    </svg>
                    <div className="score-ring-center" aria-hidden="true">
                        <span className="score-ring-label">Score</span>
                        <span className="score-ring-value">{score.toLocaleString()}</span>
                        <span className="score-ring-max">of {maxPossibleScore.toLocaleString()}</span>
                    </div>
                </div>

                <div className="results-trio">
                    <div className="trio-stat trio-stat--correct">
                        <span className="trio-icon" aria-hidden="true">✓</span>
                        <span className="trio-label">Correct</span>
                        <span className="trio-value">{correctAnswers}</span>
                    </div>
                    <div className="trio-stat trio-stat--wrong">
                        <span className="trio-icon" aria-hidden="true">✕</span>
                        <span className="trio-label">Incorrect</span>
                        <span className="trio-value">{wrongAnswers}</span>
                    </div>
                    <div className="trio-stat trio-stat--accuracy">
                        <span className="trio-icon" aria-hidden="true">◎</span>
                        <span className="trio-label">Accuracy</span>
                        <span className="trio-value">{accuracy}%</span>
                    </div>
                </div>

                {newBestScore && (
                    <div className="best-banner" role="status">
                        <span className="best-banner-icon" aria-hidden="true">⭐</span>
                        <div className="best-banner-body">
                            <span className="best-banner-title">New Personal Best!</span>
                            <span className="best-banner-sub">You beat your previous score ({prevBestScoreRef.current.toLocaleString()})</span>
                        </div>
                    </div>
                )}

                <div className="share-row">
                    <span className="share-row-label">Share Your Score</span>
                    <div className="share-row-buttons">
                        <a
                            className="share-pill share-pill--wa"
                            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Share your score on WhatsApp"
                        >
                            <span aria-hidden="true">💬</span> WhatsApp
                        </a>
                        <a
                            className="share-pill share-pill--x"
                            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Share your score on X (Twitter)"
                        >
                            <span aria-hidden="true">𝕏</span> Post
                        </a>
                        <button className="share-pill share-pill--copy" onClick={shareScore}>
                            <span aria-hidden="true">{shareState === 'shared' ? '✓' : '🔗'}</span> {shareState === 'shared' ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                </div>

                <div className="results-actions">
                    <button onClick={handleRestart} className="btn-home">
                        <span aria-hidden="true">⌂</span> Home
                    </button>
                    <button onClick={startGame} className="btn-again">
                        <span aria-hidden="true">↻</span> Play Again
                    </button>
                </div>
                <button onClick={() => setShowSubmitModal(true)} className="submit-link">Submit a Lyric</button>
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
                         <button type="submit" disabled={submitting} className="btn-premium">{submitting ? 'Dropping logic…' : 'Submit Challenge'}</button>
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

                /* ===================================
                   INTRO CARD
                =================================== */
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
                    background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%);
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
                    box-shadow: 0 6px 30px rgba(139, 92, 246, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.25);
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
                    box-shadow: 0 12px 44px rgba(139, 92, 246, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.3);
                }

                .btn-start:hover::before {
                    opacity: 1;
                }

                .btn-start:active {
                    transform: translateY(0) scale(0.97);
                }

                .btn-start:focus-visible {
                    outline: 2px solid var(--color-purple);
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

                /* ===================================
                   GAME CARD — deep dark glassmorphism
                =================================== */
                .game-card {
                    position: relative;
                    background: linear-gradient(170deg, rgba(18, 18, 30, 0.92) 0%, rgba(8, 8, 16, 0.96) 100%);
                    -webkit-backdrop-filter: blur(20px);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 24px;
                    padding: 28px;
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

                @media (max-width: 640px) {
                    .game-card {
                        padding: 20px 16px 22px;
                        border-radius: 20px;
                    }
                    .game-intro {
                        padding: 40px 24px;
                    }
                    .intro-title {
                        font-size: 1.8rem;
                    }
                    .lyric-quote-text {
                        font-size: 1.25rem !important;
                    }
                }

                /* ===================================
                   STATS BAR — 4 tiles
                =================================== */
                .hud-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 10px;
                    margin-bottom: 24px;
                }

                .stat-tile {
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    padding: 12px 14px;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 14px;
                    min-width: 0;
                }

                .stat-tile-icon {
                    font-size: 1.1rem;
                    line-height: 1.4;
                    flex-shrink: 0;
                }

                .stat-tile-icon--gold { filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.5)); }
                .stat-tile-icon--purple { filter: drop-shadow(0 0 8px rgba(139, 92, 246, 0.5)); }
                .stat-tile-icon--blue { filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.5)); }
                .stat-tile-icon--hot { animation: hotFlicker 1s ease-in-out infinite; }
                .stat-tile-value--hot {
                    color: #fbbf24;
                    text-shadow: 0 0 14px rgba(245, 158, 11, 0.55);
                }
                @keyframes hotFlicker {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.12); }
                }

                .stat-tile-body {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    min-width: 0;
                }

                .stat-tile-label {
                    font-family: var(--font-condensed);
                    font-size: 0.6rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.12em;
                    color: rgba(255, 255, 255, 0.45);
                    white-space: nowrap;
                }

                .stat-tile-value {
                    font-size: 1.35rem;
                    font-weight: 800;
                    color: white;
                    line-height: 1.1;
                    font-variant-numeric: tabular-nums;
                }

                .stat-tile-sub {
                    font-size: 0.65rem;
                    color: rgba(255, 255, 255, 0.35);
                    white-space: nowrap;
                }

                .stat-tile-timer-track {
                    display: block;
                    height: 4px;
                    margin-top: 4px;
                    border-radius: 2px;
                    background: rgba(255, 255, 255, 0.08);
                    overflow: hidden;
                }

                .stat-tile-timer-fill {
                    display: block;
                    height: 100%;
                    border-radius: 2px;
                    background: #10b981;
                }

                @media (max-width: 900px) {
                    .hud-grid { grid-template-columns: repeat(2, 1fr); }
                }

                /* ===================================
                   QUESTION META + PROGRESS
                =================================== */
                .question-meta {
                    display: flex;
                    justify-content: center;
                    margin-bottom: 16px;
                }

                .question-pill {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    font-family: var(--font-condensed);
                    font-size: 0.68rem;
                    font-weight: 700;
                    letter-spacing: 0.18em;
                    text-transform: uppercase;
                    padding: 7px 18px;
                    border-radius: var(--radius-pill);
                    color: #c4b5fd;
                    background: rgba(139, 92, 246, 0.12);
                    border: 1px solid rgba(139, 92, 246, 0.35);
                }

                .question-pill.difficulty-intermediate {
                    color: #fcd34d;
                    background: rgba(245, 158, 11, 0.1);
                    border-color: rgba(245, 158, 11, 0.35);
                }

                .question-pill.difficulty-expert {
                    color: #fca5a5;
                    background: rgba(239, 68, 68, 0.1);
                    border-color: rgba(239, 68, 68, 0.35);
                }

                .progress-row {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 24px;
                }

                .progress-track {
                    flex: 1;
                    height: 8px;
                    border-radius: 4px;
                    background: rgba(255, 255, 255, 0.07);
                    overflow: hidden;
                }

                .progress-fill {
                    height: 100%;
                    border-radius: 4px;
                    background: linear-gradient(90deg, #8B5CF6, #A78BFA);
                    box-shadow: 0 0 12px rgba(139, 92, 246, 0.5);
                }

                .progress-pct {
                    font-family: var(--font-condensed);
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: rgba(255, 255, 255, 0.55);
                    min-width: 36px;
                    text-align: right;
                    font-variant-numeric: tabular-nums;
                }

                /* ===================================
                   LYRIC QUOTE
                =================================== */
                .question-heading {
                    text-align: center;
                    font-family: var(--font-body);
                    font-size: 1.15rem;
                    font-weight: 700;
                    color: white;
                    margin-bottom: 18px;
                }

                .lyric-quote {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 18px;
                    margin-bottom: 28px;
                }

                .lyric-wave {
                    width: 64px;
                    height: 24px;
                    flex-shrink: 0;
                    opacity: 0.55;
                }

                .lyric-wave rect { fill: var(--color-purple-light); }
                .lyric-wave--flip { transform: scaleX(-1); }

                .lyric-quote-text {
                    font-family: Georgia, 'Times New Roman', serif;
                    font-style: italic;
                    font-size: 1.45rem;
                    line-height: 1.55;
                    color: rgba(255, 255, 255, 0.92);
                    text-align: center;
                    max-width: 460px;
                    margin: 0;
                    text-wrap: balance;
                }

                @media (max-width: 640px) {
                    .lyric-wave { display: none; }
                    .lyric-quote-text { font-size: 1.25rem; }
                }

                /* ===================================
                   OPTIONS — A/B/C/D rows
                =================================== */
                .options-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin-bottom: 16px;
                    outline: none;
                }

                .options-list:focus-visible {
                    outline: none;
                }

                .options-list:focus-visible .option-btn:first-child {
                    border-color: rgba(139, 92, 246, 0.6);
                    box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.35);
                }

                .option-btn {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    width: 100%;
                    padding: 14px 18px;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.09);
                    border-radius: 14px;
                    color: rgba(255, 255, 255, 0.85);
                    font-size: 1rem;
                    font-weight: 500;
                    text-align: left;
                    cursor: pointer;
                    transition: background-color 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
                    touch-action: manipulation;
                }

                .option-btn:hover:not(:disabled) {
                    background: rgba(139, 92, 246, 0.1);
                    border-color: rgba(139, 92, 246, 0.5);
                    box-shadow: 0 0 20px rgba(139, 92, 246, 0.15);
                }

                .option-btn:focus-visible {
                    outline: 2px solid var(--color-purple);
                    outline-offset: 2px;
                }

                .option-btn:disabled {
                    cursor: default;
                }

                .option-letter {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 32px;
                    height: 32px;
                    flex-shrink: 0;
                    border-radius: 50%;
                    border: 1px solid rgba(139, 92, 246, 0.5);
                    background: rgba(139, 92, 246, 0.12);
                    color: #c4b5fd;
                    font-family: var(--font-condensed);
                    font-size: 0.85rem;
                    font-weight: 700;
                }

                .option-label {
                    flex: 1;
                    min-width: 0;
                }

                .option-btn.correct,
                .option-btn.reveal-correct {
                    background: rgba(16, 185, 129, 0.12);
                    border-color: rgba(16, 185, 129, 0.6);
                    box-shadow: 0 0 24px rgba(16, 185, 129, 0.15);
                }

                .option-btn.correct .option-letter,
                .option-btn.reveal-correct .option-letter {
                    border-color: rgba(16, 185, 129, 0.7);
                    background: rgba(16, 185, 129, 0.2);
                    color: #34d399;
                }

                .option-btn.wrong {
                    background: rgba(239, 68, 68, 0.1);
                    border-color: rgba(239, 68, 68, 0.6);
                }

                .option-btn.wrong .option-letter {
                    border-color: rgba(239, 68, 68, 0.7);
                    background: rgba(239, 68, 68, 0.18);
                    color: #fca5a5;
                }

                .feedback-icon {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 26px;
                    height: 26px;
                    flex-shrink: 0;
                    border-radius: 50%;
                    font-size: 0.85rem;
                    font-weight: 700;
                }

                .feedback-icon--correct { background: rgba(16, 185, 129, 0.25); color: #34d399; }
                .feedback-icon--wrong { background: rgba(239, 68, 68, 0.25); color: #fca5a5; }

                .keyboard-hint {
                    text-align: center;
                    font-size: 0.72rem;
                    color: rgba(255, 255, 255, 0.35);
                    margin-bottom: 14px;
                }

                .keyboard-hint kbd {
                    display: inline-block;
                    padding: 2px 8px;
                    background: rgba(255, 255, 255, 0.06);
                    border: 1px solid rgba(255, 255, 255, 0.14);
                    border-radius: 5px;
                    font-family: var(--font-condensed);
                    font-size: 0.7rem;
                    color: rgba(255, 255, 255, 0.6);
                }

                /* ===================================
                   TIP STRIP
                =================================== */
                .tip-strip {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    background: rgba(245, 158, 11, 0.06);
                    border: 1px solid rgba(245, 158, 11, 0.2);
                    border-radius: 12px;
                }

                .tip-icon { font-size: 1rem; flex-shrink: 0; }

                .tip-text {
                    font-size: 0.82rem;
                    color: rgba(255, 255, 255, 0.65);
                    line-height: 1.5;
                }

                .tip-text strong {
                    color: #fcd34d;
                    font-family: var(--font-condensed);
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    font-size: 0.75rem;
                }

                /* ===================================
                   RESULT BANNER (interstitial)
                =================================== */
                .result-banner {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 16px;
                    flex-wrap: wrap;
                    padding: 16px 18px;
                    border-radius: 14px;
                }

                .result-correct-bg {
                    background: rgba(16, 185, 129, 0.08);
                    border: 1px solid rgba(16, 185, 129, 0.35);
                }

                .result-wrong-bg {
                    background: rgba(239, 68, 68, 0.07);
                    border: 1px solid rgba(239, 68, 68, 0.35);
                }

                .result-banner-main {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    min-width: 0;
                    flex: 1;
                }

                .result-banner-text {
                    font-size: 0.92rem;
                    font-weight: 600;
                }

                .result-correct { color: #34d399; }
                .result-wrong { color: #fca5a5; }

                .result-banner-meta {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-size: 0.75rem;
                }

                .interstitial-points {
                    font-family: var(--font-condensed);
                    font-weight: 700;
                    color: #34d399;
                    letter-spacing: 0.05em;
                }

                .interstitial-countdown {
                    color: rgba(255, 255, 255, 0.45);
                    font-variant-numeric: tabular-nums;
                }

                .btn-next {
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    padding: 13px 26px;
                    background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-family: var(--font-condensed);
                    font-size: 0.9rem;
                    font-weight: 700;
                    letter-spacing: 0.1em;
                    text-transform: uppercase;
                    cursor: pointer;
                    transition: transform 0.25s ease, box-shadow 0.25s ease;
                    box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4);
                    touch-action: manipulation;
                    flex-shrink: 0;
                }

                .btn-next:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 28px rgba(139, 92, 246, 0.55);
                }

                .btn-next:focus-visible {
                    outline: 2px solid var(--color-purple);
                    outline-offset: 2px;
                }

                .btn-next-arrow { font-size: 1rem; }

                /* ===================================
                   RESULTS PANEL (game over)
                =================================== */
                .results-panel {
                    position: relative;
                    background: linear-gradient(170deg, rgba(18, 18, 30, 0.92) 0%, rgba(8, 8, 16, 0.96) 100%);
                    -webkit-backdrop-filter: blur(20px);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 24px;
                    padding: 36px 32px 28px;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 0 0 1px rgba(139, 92, 246, 0.1);
                    overflow: hidden;
                    text-align: center;
                }

                .results-panel::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 1px;
                    background: linear-gradient(90deg, transparent 0%, rgba(139, 92, 246, 0.5) 50%, transparent 100%);
                }

                .confetti-layer {
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                    overflow: hidden;
                }

                .confetti-dot {
                    position: absolute;
                    top: -12px;
                    width: 7px;
                    height: 11px;
                    border-radius: 2px;
                    opacity: 0;
                    animation: confettiFall 1.6s ease-out forwards;
                }

                .confetti-dot--1 { left: 8%;  background: #8B5CF6; animation-delay: 0.1s; }
                .confetti-dot--2 { left: 20%; background: #EC4899; animation-delay: 0.35s; }
                .confetti-dot--3 { left: 32%; background: #34D399; animation-delay: 0.2s; }
                .confetti-dot--4 { left: 45%; background: #F59E0B; animation-delay: 0.5s; }
                .confetti-dot--5 { left: 57%; background: #3B82F6; animation-delay: 0.15s; }
                .confetti-dot--6 { left: 68%; background: #EC4899; animation-delay: 0.42s; }
                .confetti-dot--7 { left: 79%; background: #34D399; animation-delay: 0.28s; }
                .confetti-dot--8 { left: 90%; background: #8B5CF6; animation-delay: 0.55s; }
                .confetti-dot--9 { left: 14%; background: #F59E0B; animation-delay: 0.65s; }
                .confetti-dot--10 { left: 84%; background: #3B82F6; animation-delay: 0.38s; }

                @keyframes confettiFall {
                    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(220px) rotate(320deg); opacity: 0; }
                }

                .results-title {
                    font-family: var(--font-display);
                    font-size: clamp(2.2rem, 5vw, 3rem);
                    margin-bottom: 10px;
                    background: linear-gradient(135deg, #FFFFFF 0%, #8B5CF6 55%, #EC4899 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    letter-spacing: 0.02em;
                    filter: drop-shadow(0 4px 20px rgba(139, 92, 246, 0.3));
                }

                .results-subtitle {
                    font-size: 0.95rem;
                    color: var(--color-text-muted);
                    max-width: 420px;
                    margin: 0 auto 26px;
                    line-height: 1.6;
                }

                .score-ring-wrap {
                    position: relative;
                    width: 190px;
                    height: 190px;
                    margin: 0 auto 26px;
                }

                .score-ring {
                    width: 100%;
                    height: 100%;
                    transform: rotate(-90deg);
                }

                .score-ring-bg {
                    fill: none;
                    stroke: rgba(255, 255, 255, 0.07);
                    stroke-width: 9;
                }

                .score-ring-fill {
                    fill: none;
                    stroke-width: 9;
                    stroke-linecap: round;
                    filter: drop-shadow(0 0 10px rgba(139, 92, 246, 0.45));
                }

                .score-ring-center {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 2px;
                }

                .score-ring-label {
                    font-family: var(--font-condensed);
                    font-size: 0.65rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.2em;
                    color: rgba(255, 255, 255, 0.45);
                }

                .score-ring-value {
                    font-size: 2.4rem;
                    font-weight: 800;
                    color: white;
                    line-height: 1;
                    font-variant-numeric: tabular-nums;
                }

                .score-ring-max {
                    font-size: 0.75rem;
                    color: rgba(255, 255, 255, 0.4);
                    font-variant-numeric: tabular-nums;
                }

                .results-trio {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 10px;
                    margin-bottom: 18px;
                }

                .trio-stat {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 3px;
                    padding: 16px 10px;
                    border-radius: 14px;
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    background: rgba(255, 255, 255, 0.03);
                }

                .trio-icon {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    font-size: 0.85rem;
                    font-weight: 700;
                    margin-bottom: 4px;
                }

                .trio-stat--correct .trio-icon { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); }
                .trio-stat--wrong .trio-icon { background: rgba(239, 68, 68, 0.12); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.4); }
                .trio-stat--accuracy .trio-icon { background: rgba(59, 130, 246, 0.12); color: #93c5fd; border: 1px solid rgba(59, 130, 246, 0.4); }

                .trio-label {
                    font-family: var(--font-condensed);
                    font-size: 0.6rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.14em;
                    color: rgba(255, 255, 255, 0.4);
                }

                .trio-value {
                    font-size: 1.4rem;
                    font-weight: 800;
                    color: white;
                    font-variant-numeric: tabular-nums;
                }

                .best-banner {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    text-align: left;
                    padding: 14px 18px;
                    margin-bottom: 18px;
                    background: rgba(245, 158, 11, 0.07);
                    border: 1px solid rgba(245, 158, 11, 0.35);
                    border-radius: 14px;
                }

                .best-banner-icon {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 38px;
                    height: 38px;
                    flex-shrink: 0;
                    border-radius: 50%;
                    background: rgba(245, 158, 11, 0.15);
                    font-size: 1.1rem;
                }

                .best-banner-body {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    min-width: 0;
                }

                .best-banner-title {
                    font-family: var(--font-condensed);
                    font-size: 0.8rem;
                    font-weight: 700;
                    letter-spacing: 0.1em;
                    text-transform: uppercase;
                    color: #fcd34d;
                }

                .best-banner-sub {
                    font-size: 0.8rem;
                    color: rgba(255, 255, 255, 0.55);
                }

                .share-row {
                    margin-bottom: 22px;
                }

                .share-row-label {
                    display: block;
                    font-family: var(--font-condensed);
                    font-size: 0.65rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.2em;
                    color: rgba(255, 255, 255, 0.4);
                    margin-bottom: 10px;
                }

                .share-row-buttons {
                    display: flex;
                    justify-content: center;
                    flex-wrap: wrap;
                    gap: 10px;
                }

                .share-pill {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 18px;
                    border-radius: var(--radius-pill);
                    font-family: var(--font-condensed);
                    font-size: 0.8rem;
                    font-weight: 700;
                    letter-spacing: 0.06em;
                    text-transform: uppercase;
                    text-decoration: none;
                    cursor: pointer;
                    transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
                    touch-action: manipulation;
                    border: 1px solid transparent;
                }

                .share-pill:hover { transform: translateY(-2px); }
                .share-pill:focus-visible { outline: 2px solid var(--color-purple); outline-offset: 2px; }

                .share-pill--wa {
                    background: rgba(16, 185, 129, 0.12);
                    border-color: rgba(16, 185, 129, 0.4);
                    color: #34d399;
                }

                .share-pill--wa:hover { box-shadow: 0 6px 18px rgba(16, 185, 129, 0.25); }

                .share-pill--x {
                    background: rgba(59, 130, 246, 0.12);
                    border-color: rgba(59, 130, 246, 0.4);
                    color: #93c5fd;
                }

                .share-pill--x:hover { box-shadow: 0 6px 18px rgba(59, 130, 246, 0.25); }

                .share-pill--copy {
                    background: rgba(255, 255, 255, 0.05);
                    border-color: rgba(255, 255, 255, 0.14);
                    color: rgba(255, 255, 255, 0.7);
                }

                .share-pill--copy:hover { box-shadow: 0 6px 18px rgba(0, 0, 0, 0.3); color: white; }

                .results-actions {
                    display: flex;
                    justify-content: center;
                    flex-wrap: wrap;
                    gap: 12px;
                    margin-bottom: 14px;
                }

                .btn-home {
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    padding: 14px 28px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.14);
                    border-radius: 12px;
                    color: rgba(255, 255, 255, 0.8);
                    font-family: var(--font-condensed);
                    font-size: 0.9rem;
                    font-weight: 700;
                    letter-spacing: 0.1em;
                    text-transform: uppercase;
                    cursor: pointer;
                    transition: background-color 0.25s ease, color 0.25s ease, border-color 0.25s ease;
                    touch-action: manipulation;
                }

                .btn-home:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                    border-color: rgba(255, 255, 255, 0.3);
                }

                .btn-home:focus-visible {
                    outline: 2px solid var(--color-purple);
                    outline-offset: 2px;
                }

                .btn-again {
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    padding: 14px 32px;
                    background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
                    border: none;
                    border-radius: 12px;
                    color: white;
                    font-family: var(--font-condensed);
                    font-size: 0.9rem;
                    font-weight: 700;
                    letter-spacing: 0.1em;
                    text-transform: uppercase;
                    cursor: pointer;
                    transition: transform 0.25s ease, box-shadow 0.25s ease;
                    box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4);
                    touch-action: manipulation;
                }

                .btn-again:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 28px rgba(139, 92, 246, 0.55);
                }

                .btn-again:focus-visible {
                    outline: 2px solid var(--color-purple);
                    outline-offset: 2px;
                }

                .submit-link {
                    background: none;
                    border: none;
                    color: rgba(255, 255, 255, 0.45);
                    font-family: var(--font-condensed);
                    font-size: 0.78rem;
                    font-weight: 600;
                    letter-spacing: 0.1em;
                    text-transform: uppercase;
                    cursor: pointer;
                    text-decoration: underline;
                    text-underline-offset: 4px;
                    padding: 6px 10px;
                    transition: color 0.2s ease;
                }

                .submit-link:hover { color: rgba(255, 255, 255, 0.8); }

                .submit-link:focus-visible {
                    outline: 2px solid var(--color-purple);
                    outline-offset: 2px;
                }

                @media (max-width: 640px) {
                    .results-panel { padding: 28px 18px 22px; }
                    .results-trio { grid-template-columns: repeat(3, 1fr); gap: 8px; }
                    .score-ring-wrap { width: 160px; height: 160px; }
                    .score-ring-value { font-size: 2rem; }
                }

                .game-loading {
                    text-align: center;
                    padding: 60px 0;
                    color: var(--color-grey-blue);
                }

                /* ===================================
                   SUBMIT MODAL
                =================================== */
                .modal-header {
                    text-align: center;
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
