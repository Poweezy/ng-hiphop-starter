'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface Competition {
  id: string;
  title: string;
  period: string;
  endDate: string;
  is_active: boolean;
  winnerId: string | null;
}

interface Winner {
  lyric_text: string;
  correct_artist: string;
}

interface Props {
  competition: Competition | null;
  winner: Winner | null;
}

export default function CompetitionBanner({ competition, winner }: Props) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  if (!competition) return null;

  const isEnded = new Date(competition.endDate) < new Date();
  const daysLeft = Math.max(0, Math.ceil((new Date(competition.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !competition) return;

    setStatus('loading');
    try {
      const res = await fetch('/api/competitions/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitionId: competition.id, email: email.trim() }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setMessage(data.data?.message || 'Subscribed!');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error?.message || data.data?.message || 'Subscription failed');
      }
    } catch {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
    setTimeout(() => setStatus('idle'), 4000);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="section competition-section"
    >
      <div className="container">
        <div className="competition-banner">
          <div className="competition-badge">🎤 Lyric Competition</div>

          {winner ? (
            <div className="winner-announcement">
              <div className="winner-crown">👑</div>
              <h2 className="competition-title">Winner: {competition.title}</h2>
              <div className="winner-lyric">
                <p className="winner-text">"{winner.lyric_text}"</p>
                <p className="winner-artist">— {winner.correct_artist}</p>
              </div>
            </div>
          ) : (
            <>
              <h2 className="competition-title">{competition.title}</h2>
              <div className="competition-meta">
                <span className="competition-period">{competition.period.toUpperCase()}</span>
                {isEnded ? (
                  <span className="competition-ended">Ended</span>
                ) : (
                  <span className="competition-timer">{daysLeft} days left</span>
                )}
              </div>
              <p className="competition-desc">
                Guess the artists and compete with the community. The winner will be announced when the competition ends.
              </p>
            </>
          )}

          {!winner && !isEnded && (
            <form onSubmit={handleSubscribe} className="subscribe-form">
              <label htmlFor="subscribe-email" className="subscribe-label">
                Get notified when the winner is announced
              </label>
              <div className="subscribe-input-group">
                <input
                  id="subscribe-email"
                  type="email"
                  className="subscribe-input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  disabled={status === 'loading'}
                />
                <button type="submit" className="btn-subscribe" disabled={status === 'loading' || !email.trim()}>
                  {status === 'loading' ? '...' : 'Subscribe'}
                </button>
              </div>
              {status !== 'idle' && (
                <div className={`subscribe-message subscribe-message--${status}`}>{message}</div>
              )}
            </form>
          )}

          {isEnded && !winner && (
            <p className="competition-ended-text">Results coming soon. Stay tuned!</p>
          )}
        </div>
      </div>

      <style jsx>{`
        .competition-section {
          background: linear-gradient(180deg, rgba(139, 92, 246, 0.05) 0%, transparent 100%);
          padding: 60px 0;
        }

        .competition-banner {
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 32px;
          padding: 48px;
          max-width: 800px;
          margin: 0 auto;
          text-align: center;
          box-shadow: 0 40px 100px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(139, 92, 246, 0.1);
        }

        .competition-badge {
          display: inline-block;
          font-family: var(--font-condensed);
          font-weight: 700;
          font-size: 0.75rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--color-green-light);
          border: 1px solid var(--color-green);
          padding: 4px 14px;
          border-radius: 2px;
          margin-bottom: 16px;
        }

        .competition-title {
          font-family: var(--font-display);
          font-size: clamp(2rem, 5vw, 3.5rem);
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: -0.02em;
          color: white;
          margin-bottom: 12px;
          line-height: 1.1;
        }

        .competition-meta {
          display: flex;
          justify-content: center;
          gap: 16px;
          align-items: center;
          margin-bottom: 24px;
        }

        .competition-period {
          font-family: var(--font-condensed);
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--color-purple-light);
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.3);
          padding: 4px 12px;
          border-radius: 4px;
        }

        .competition-timer {
          font-family: var(--font-condensed);
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: var(--color-yellow);
          background: rgba(251, 191, 36, 0.1);
          border: 1px solid rgba(251, 191, 36, 0.3);
          padding: 4px 12px;
          border-radius: 4px;
        }

        .competition-ended {
          font-family: var(--font-condensed);
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: var(--color-grey-blue);
          background: rgba(148, 163, 184, 0.1);
          border: 1px solid rgba(148, 163, 184, 0.3);
          padding: 4px 12px;
          border-radius: 4px;
        }

        .competition-desc {
          color: var(--color-grey-blue);
          font-size: 1.05rem;
          line-height: 1.6;
          max-width: 600px;
          margin: 0 auto 32px;
        }

        .subscribe-form {
          max-width: 480px;
          margin: 0 auto;
        }

        .subscribe-label {
          display: block;
          font-family: var(--font-condensed);
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 12px;
        }

        .subscribe-input-group {
          display: flex;
          gap: 8px;
        }

        .subscribe-input {
          flex: 1;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 14px 18px;
          color: white;
          font-size: 1rem;
          outline: none;
          transition: all 0.2s ease;
        }

        .subscribe-input:focus {
          border-color: var(--color-purple);
          box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.15);
        }

        .btn-subscribe {
          background: var(--gradient-green);
          color: white;
          border: none;
          border-radius: 12px;
          padding: 14px 24px;
          font-family: var(--font-condensed);
          font-weight: 700;
          font-size: 0.9rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .btn-subscribe:hover:not(:disabled) {
          box-shadow: var(--shadow-glow-green);
          transform: translateY(-2px);
        }

        .btn-subscribe:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .subscribe-message {
          margin-top: 12px;
          font-size: 0.85rem;
          padding: 10px 14px;
          border-radius: 8px;
        }

        .subscribe-message--success {
          color: #10b981;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .subscribe-message--error {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .winner-announcement {
          padding: 24px 0;
        }

        .winner-crown {
          font-size: 3rem;
          margin-bottom: 16px;
          animation: float 3s ease-in-out infinite;
        }

        .winner-lyric {
          background: rgba(139, 92, 246, 0.05);
          border-left: 4px solid var(--color-purple);
          padding: 24px 32px;
          border-radius: 0 16px 16px 0;
          margin-top: 24px;
          text-align: left;
        }

        .winner-text {
          font-size: 1.5rem;
          font-weight: 500;
          color: white;
          font-style: italic;
          line-height: 1.4;
          margin-bottom: 8px;
        }

        .winner-artist {
          font-family: var(--font-condensed);
          font-size: 0.9rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--color-purple-light);
        }

        .competition-ended-text {
          color: var(--color-grey-blue);
          font-size: 1rem;
          margin-top: 16px;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        @media (max-width: 640px) {
          .competition-banner {
            padding: 32px 20px;
          }
          .subscribe-input-group {
            flex-direction: column;
          }
          .winner-lyric {
            padding: 16px 20px;
          }
          .winner-text {
            font-size: 1.2rem;
          }
        }
      `}</style>
    </motion.section>
  );
}
