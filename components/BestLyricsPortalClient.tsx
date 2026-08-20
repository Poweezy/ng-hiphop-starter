'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';

interface Prize {
  id: string;
  position: number;
  name: string;
  cashAmount: number | null;
  description: string | null;
}

interface Winner {
  id: string;
  position: number;
  prizeName: string | null;
  cashAmount: number | null;
  submission: {
    artistAlias: string;
    lyrics: string;
    songTitle: string | null;
  };
}

interface Submission {
  id: string;
  artistAlias: string;
  lyrics: string;
  songTitle: string | null;
  createdAt: string;
}

interface Competition {
  id: string;
  title: string;
  description: string | null;
  shortDescription: string | null;
  type: string;
  startDate: string;
  endDate: string;
  submissionDeadline: string;
  rules: {
    minLength: number | null;
    maxLength: number | null;
    originalityRequired: boolean;
    copyrightRequirements: string | null;
    maxSubmissionsPerUser: number;
  } | null;
  prizes: Prize[];
}

interface Props {
  competition: Competition | null;
  winners: Winner[];
  recentSubmissions: Submission[];
  subscriberCount: number;
}

type SubmitStatus = 'idle' | 'loading' | 'success' | 'error';

export default function BestLyricsPortalClient({ competition, winners, recentSubmissions, subscriberCount }: Props) {
  const { data: session, status } = useSession();
  const isLoggedIn = status === 'authenticated';

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isEnded, setIsEnded] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle');
  const [submitMessage, setSubmitMessage] = useState('');

  const [subName, setSubName] = useState('');
  const [subEmail, setSubEmail] = useState('');
  const [subConsent, setSubConsent] = useState(false);
  const [submittingSub, setSubmittingSub] = useState(false);
  const [subStatus, setSubStatus] = useState<SubmitStatus>('idle');
  const [subMessage, setSubMessage] = useState('');

  const submissionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!competition) return;

    const deadline = new Date(competition.submissionDeadline).getTime();
    const end = new Date(competition.endDate).getTime();

    const compute = () => {
      const now = Date.now();
      if (now >= end) {
        setIsEnded(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      if (now >= deadline) {
        setIsEnded(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      const diff = deadline - now;
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };

    compute();
    const timer = setInterval(compute, 1000);
    return () => clearInterval(timer);
  }, [competition]);

  const scrollToSubmission = () => {
    submissionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!competition || submitting) return;

    setSubmitting(true);
    setSubmitStatus('loading');
    setSubmitMessage('');

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competitionId: competition.id,
          artistAlias: submissionForm.artistAlias.trim(),
          lyrics: submissionForm.lyrics.trim(),
          songTitle: submissionForm.songTitle.trim() || null,
          audioUrl: submissionForm.audioUrl.trim() || null,
          socialLinks: submissionForm.socialLinks.trim() || null,
          copyrightAccepted: submissionForm.copyrightAccepted,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSubmitStatus('success');
        setSubmitMessage('Your bars have been submitted for moderation. Stay tuned!');
        setSubmissionForm({ artistAlias: '', lyrics: '', songTitle: '', audioUrl: '', socialLinks: '', copyrightAccepted: false });
      } else {
        setSubmitStatus('error');
        setSubmitMessage(data.error?.message || 'Submission failed. Please try again.');
      }
    } catch {
      setSubmitStatus('error');
      setSubmitMessage('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!competition || !subConsent || !subEmail.trim()) return;

    setSubmittingSub(true);
    setSubStatus('idle');
    setSubMessage('');

    try {
      const res = await fetch('/api/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competitionId: competition.id,
          email: subEmail.trim(),
          name: subName.trim() || null,
          source: 'Best Lyrics Portal',
          consentStatus: 'granted',
          subscriptionStatus: 'active',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSubStatus('success');
        setSubMessage('You\'re on the list. Watch your inbox.');
        setSubName('');
        setSubEmail('');
        setSubConsent(false);
      } else {
        setSubStatus('error');
        setSubMessage(data.error?.message || 'Subscription failed. Please try again.');
      }
    } catch {
      setSubStatus('error');
      setSubMessage('Network error. Please try again.');
    } finally {
      setSubmittingSub(false);
    }
  };

  const [submissionForm, setSubmissionForm] = useState({
    artistAlias: '',
    lyrics: '',
    songTitle: '',
    audioUrl: '',
    socialLinks: '',
    copyrightAccepted: false,
  });

  if (!competition) {
    return (
      <>
        <section className="section">
          <div className="container">
            <div className="empty-state">
              <div className="empty-state-icon">🏆</div>
              <h2 className="empty-state-title">No Active Competition</h2>
              <p className="empty-state-desc">Check back soon for the next Best Lyrics competition.</p>
            </div>
          </div>
        </section>
        <style jsx>{`
          .empty-state {
            text-align: center;
            padding: clamp(40px, 8vw, 80px) 20px;
            background: rgba(17, 24, 39, 0.4);
            border: 2px dashed rgba(139, 92, 246, 0.3);
            border-radius: 20px;
            backdrop-filter: blur(8px);
          }
          .empty-state-icon {
            font-size: clamp(3rem, 8vw, 5rem);
            margin-bottom: 20px;
            opacity: 0.6;
          }
          .empty-state-title {
            font-family: var(--font-display);
            font-size: clamp(1.5rem, 4vw, 2rem);
            margin-bottom: 12px;
            color: rgba(255, 255, 255, 0.9);
            letter-spacing: 0.05em;
          }
          .empty-state-desc {
            color: var(--color-grey-blue);
            font-size: clamp(0.9rem, 2vw, 1.1rem);
            max-width: 400px;
            margin: 0 auto 28px;
            line-height: 1.6;
          }
        `}</style>
      </>
    );
  }

  const prizePool = competition.prizes.reduce((sum, p) => sum + (p.cashAmount || 0), 0);
  const competitionHasEnded = isEnded || new Date(competition.endDate) < new Date();
  const deadlinePassed = new Date(competition.submissionDeadline) < new Date();

  return (
    <>
      {/* HERO */}
      <section className="section best-lyrics-hero">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="best-lyrics-hero-inner"
          >
            <span className="section-badge">Competition</span>
            <h1 className="best-lyrics-title">BEST LYRICS</h1>
            <p className="best-lyrics-subtitle">Drop your hardest bars. Let the community decide.</p>
            <div className="best-lyrics-hero-actions">
              <button onClick={scrollToSubmission} className="hero-btn-primary">
                ENTER COMPETITION
              </button>
              <button onClick={() => document.getElementById('recent-submissions')?.scrollIntoView({ behavior: 'smooth' })} className="hero-btn-ghost">
                RECENT DROPS
              </button>
            </div>
          </motion.div>
        </div>
        <div className="graffiti-overlay" aria-hidden="true" />
      </section>

      {/* COMPETITION INFO */}
      <section className="section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.6 }}
            className="glass-panel glass-panel--padded competition-info"
          >
            <div className="competition-info-header">
              <div>
                <h2 className="section-title" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', marginBottom: 8 }}>
                  {competition.title}
                </h2>
                {competition.shortDescription && (
                  <p className="section-subtitle" style={{ maxWidth: '100%' }}>{competition.shortDescription}</p>
                )}
              </div>
              <div className="competition-type-badge">{competition.type.toUpperCase()}</div>
            </div>

            <div className="competition-stats">
              <div className="competition-stat">
                <span className="competition-stat-value">
                  {prizePool > 0 ? `$${prizePool.toLocaleString()}` : 'TBD'}
                </span>
                <span className="competition-stat-label">Prize Pool</span>
              </div>
              <div className="competition-stat">
                <span className="competition-stat-value">{subscriberCount.toLocaleString()}</span>
                <span className="competition-stat-label">Subscribers</span>
              </div>
              <div className="competition-stat">
                <span className="competition-stat-value">{recentSubmissions.length}</span>
                <span className="competition-stat-label">Recent Submissions</span>
              </div>
            </div>

            {!competitionHasEnded && !deadlinePassed && (
              <div className="countdown-wrap">
                <div className="countdown-label">
                  {deadlinePassed ? 'Ended' : 'Submissions close in'}
                </div>
                <div className="countdown-grid">
                  {[
                    { value: timeLeft.days, label: 'Days' },
                    { value: timeLeft.hours, label: 'Hours' },
                    { value: timeLeft.minutes, label: 'Mins' },
                    { value: timeLeft.seconds, label: 'Secs' },
                  ].map((item) => (
                    <div key={item.label} className="countdown-item">
                      <span className="countdown-value">{String(item.value).padStart(2, '0')}</span>
                      <span className="countdown-label-sm">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {competitionHasEnded && (
              <div className="competition-ended-banner">
                <span className="competition-ended-icon">🏁</span>
                <span>This competition has ended</span>
              </div>
            )}

            {competition.rules && (
              <div className="rules-summary">
                <h3 className="rules-title">Rules</h3>
                <ul className="rules-list">
                  {competition.rules.minLength != null && (
                    <li>Minimum {competition.rules.minLength} characters</li>
                  )}
                  {competition.rules.maxLength != null && (
                    <li>Maximum {competition.rules.maxLength} characters</li>
                  )}
                  {competition.rules.originalityRequired && (
                    <li>Original work required</li>
                  )}
                  {competition.rules.maxSubmissionsPerUser > 1 && (
                    <li>Up to {competition.rules.maxSubmissionsPerUser} submissions per participant</li>
                  )}
                  {competition.rules.copyrightRequirements && (
                    <li>{competition.rules.copyrightRequirements}</li>
                  )}
                </ul>
              </div>
            )}

            {!competitionHasEnded && (
              <div className="competition-cta">
                <button onClick={scrollToSubmission} className="btn btn-primary">
                  Enter Competition
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* SUBMISSION FORM */}
      <section className="section" ref={submissionRef}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.6 }}
            className="glass-panel glass-panel--padded submission-panel"
          >
            <span className="section-badge">Submit</span>
            <h2 className="section-title">Drop Your Bars</h2>
            <p className="section-subtitle">Enter the competition. Original lyrics only.</p>

            {!isLoggedIn ? (
              <div className="auth-notice">
                <p>Please sign in to submit your lyrics.</p>
                <a href="/admin/login" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>
                  Sign In
                </a>
              </div>
            ) : (
              <form onSubmit={handleSubmission} className="form-stack">
                {submitStatus === 'success' && (
                  <div className="status-message status-message--success" role="status">
                    {submitMessage}
                  </div>
                )}
                {submitStatus === 'error' && (
                  <div className="status-message status-message--error" role="alert">
                    {submitMessage}
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="artist-alias" className="form-label">Artist / Alias *</label>
                  <input
                    id="artist-alias"
                    type="text"
                    className="form-input"
                    value={submissionForm.artistAlias}
                    onChange={(e) => setSubmissionForm((f) => ({ ...f, artistAlias: e.target.value }))}
                    required
                    maxLength={100}
                    placeholder="Your stage name"
                    disabled={submitStatus === 'loading'}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="lyrics" className="form-label">Lyrics *</label>
                  <textarea
                    id="lyrics"
                    className="form-textarea"
                    value={submissionForm.lyrics}
                    onChange={(e) => setSubmissionForm((f) => ({ ...f, lyrics: e.target.value }))}
                    required
                    minLength={10}
                    maxLength={5000}
                    rows={8}
                    placeholder="Paste your original lyrics here..."
                    disabled={submitStatus === 'loading'}
                  />
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label htmlFor="song-title" className="form-label">Song Title (optional)</label>
                    <input
                      id="song-title"
                      type="text"
                      className="form-input"
                      value={submissionForm.songTitle}
                      onChange={(e) => setSubmissionForm((f) => ({ ...f, songTitle: e.target.value }))}
                      maxLength={200}
                      placeholder="Track name"
                      disabled={submitStatus === 'loading'}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="audio-url" className="form-label">Audio / Demo URL (optional)</label>
                    <input
                      id="audio-url"
                      type="url"
                      className="form-input"
                      value={submissionForm.audioUrl}
                      onChange={(e) => setSubmissionForm((f) => ({ ...f, audioUrl: e.target.value }))}
                      placeholder="https://..."
                      disabled={submitStatus === 'loading'}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="social-links" className="form-label">Social Links (optional)</label>
                  <input
                    id="social-links"
                    type="text"
                    className="form-input"
                    value={submissionForm.socialLinks}
                    onChange={(e) => setSubmissionForm((f) => ({ ...f, socialLinks: e.target.value }))}
                    maxLength={500}
                    placeholder="Instagram, YouTube, Spotify, etc."
                    disabled={submitStatus === 'loading'}
                  />
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={submissionForm.copyrightAccepted}
                      onChange={(e) => setSubmissionForm((f) => ({ ...f, copyrightAccepted: e.target.checked }))}
                      required
                      disabled={submitStatus === 'loading'}
                    />
                    <span>
                      I confirm that these lyrics are my original work or that I have the necessary rights to submit them.
                    </span>
                  </label>
                </div>

                <button type="submit" className="btn btn-primary" disabled={submitStatus === 'loading' || !submissionForm.copyrightAccepted}>
                  {submitStatus === 'loading' ? 'Submitting...' : 'Submit Lyrics'}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </section>

      {/* WINNERS */}
      {competitionHasEnded && winners.length > 0 && (
        <section className="section section-alt">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6 }}
            >
              <span className="section-badge">Winners</span>
              <h2 className="section-title">Champions</h2>
              <p className="section-subtitle">The bars that took the crown.</p>

              <div className="winners-grid">
                {winners.map((winner, idx) => (
                  <motion.div
                    key={winner.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                    className={`card winner-card winner-card--${winner.position}`}
                  >
                    <div className="winner-position">
                      {winner.position === 1 && '🥇'}
                      {winner.position === 2 && '🥈'}
                      {winner.position === 3 && '🥉'}
                      {winner.position > 3 && `#${winner.position}`}
                    </div>
                    <div className="winner-body">
                      <div className="winner-artist">{winner.submission.artistAlias}</div>
                      {winner.submission.songTitle && (
                        <div className="winner-song">{winner.submission.songTitle}</div>
                      )}
                      <div className="winner-lyrics">
                        &ldquo;{winner.submission.lyrics.length > 160 ? winner.submission.lyrics.slice(0, 160) + '...' : winner.submission.lyrics}&rdquo;
                      </div>
                    </div>
                    {winner.prizeName && (
                      <div className="winner-prize">
                        <span className="winner-prize-name">{winner.prizeName}</span>
                        {winner.cashAmount != null && (
                          <span className="winner-prize-amount">${winner.cashAmount.toLocaleString()}</span>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* RECENT SUBMISSIONS */}
      <section className="section" id="recent-submissions">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.6 }}
          >
            <span className="section-badge">Community</span>
            <h2 className="section-title">Recent Drops</h2>
            <p className="section-subtitle">Approved submissions from the community.</p>

            {recentSubmissions.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🎤</div>
                <h3 className="empty-state-title">No submissions yet</h3>
                <p className="empty-state-desc">Be the first to drop your bars in this competition.</p>
              </div>
            ) : (
              <div className="submissions-grid">
                {recentSubmissions.map((sub, idx) => (
                  <motion.div
                    key={sub.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.05 }}
                    className="card submission-card"
                  >
                    <div className="submission-header">
                      <span className="submission-artist">{sub.artistAlias}</span>
                      <span className="badge-approved">APPROVED</span>
                    </div>
                    {sub.songTitle && (
                      <div className="submission-song">{sub.songTitle}</div>
                    )}
                    <div className="submission-lyrics">
                      &ldquo;{sub.lyrics.length > 180 ? sub.lyrics.slice(0, 180) + '...' : sub.lyrics}&rdquo;
                    </div>
                    <div className="submission-meta">
                      <span>{new Date(sub.createdAt).toLocaleDateString()}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* EMAIL SUBSCRIPTION */}
      <section className="section section-alt">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.6 }}
            className="glass-panel glass-panel--padded subscribe-panel"
          >
            <span className="section-badge">Stay Updated</span>
            <h2 className="section-title">Don&apos;t Miss The Next Drop</h2>
            <p className="section-subtitle">Get notified about new competitions, music releases, and community events.</p>

            <form onSubmit={handleSubscribe} className="subscribe-form">
              {subStatus === 'success' && (
                <div className="status-message status-message--success" role="status">
                  {subMessage}
                </div>
              )}
              {subStatus === 'error' && (
                <div className="status-message status-message--error" role="alert">
                  {subMessage}
                </div>
              )}

              <div className="grid-2">
                <div className="form-group">
                  <label htmlFor="sub-name" className="form-label">Name (optional)</label>
                  <input
                    id="sub-name"
                    type="text"
                    className="form-input"
                    value={subName}
                    onChange={(e) => setSubName(e.target.value)}
                    maxLength={100}
                    placeholder="Your name"
                    disabled={subStatus === 'loading'}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="sub-email" className="form-label">Email *</label>
                  <input
                    id="sub-email"
                    type="email"
                    className="form-input"
                    value={subEmail}
                    onChange={(e) => setSubEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    disabled={subStatus === 'loading'}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={subConsent}
                    onChange={(e) => setSubConsent(e.target.checked)}
                    required
                    disabled={subStatus === 'loading'}
                  />
                  <span>
                    Send me updates about Nerd Gauge competitions, music drops and community events.
                  </span>
                </label>
              </div>

              <button type="submit" className="btn btn-primary" disabled={subStatus === 'loading' || !subConsent || !subEmail.trim()}>
                {subStatus === 'loading' ? 'Joining...' : 'JOIN THE LIST'}
              </button>
            </form>
          </motion.div>
        </div>
      </section>

      <style jsx>{`
        .best-lyrics-hero {
          background: linear-gradient(180deg, rgba(139, 92, 246, 0.08) 0%, transparent 100%);
          text-align: center;
          padding: clamp(80px, 12vw, 140px) 0 clamp(60px, 8vw, 100px);
        }

        .best-lyrics-hero-inner {
          max-width: 800px;
          margin: 0 auto;
        }

        .best-lyrics-title {
          font-family: var(--font-display);
          font-size: clamp(3.5rem, 10vw, 7rem);
          line-height: 0.9;
          letter-spacing: -0.02em;
          margin-bottom: 16px;
          font-weight: 900;
          background: linear-gradient(135deg, #FFFFFF 0%, #8B5CF6 50%, #EC4899 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-transform: uppercase;
        }

        .best-lyrics-subtitle {
          color: var(--color-grey-blue);
          font-size: clamp(1rem, 2vw, 1.25rem);
          max-width: 500px;
          margin: 0 auto 32px;
          line-height: 1.6;
        }

        .best-lyrics-hero-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .competition-info-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 24px;
          flex-wrap: wrap;
          margin-bottom: 32px;
        }

        .competition-type-badge {
          font-family: var(--font-condensed);
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--color-purple-light);
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.3);
          padding: 6px 16px;
          border-radius: 4px;
          white-space: nowrap;
        }

        .competition-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-bottom: 32px;
        }

        .competition-stat {
          text-align: center;
          padding: 20px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
        }

        .competition-stat-value {
          display: block;
          font-family: var(--font-display);
          font-size: clamp(1.5rem, 4vw, 2.5rem);
          color: white;
          line-height: 1;
          margin-bottom: 6px;
        }

        .competition-stat-label {
          font-family: var(--font-condensed);
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--color-grey-blue);
        }

        .countdown-wrap {
          text-align: center;
          padding: 24px;
          background: rgba(139, 92, 246, 0.05);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 16px;
          margin-bottom: 24px;
        }

        .countdown-label {
          font-family: var(--font-condensed);
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--color-purple-light);
          margin-bottom: 16px;
        }

        .countdown-grid {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .countdown-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          min-width: 70px;
        }

        .countdown-value {
          font-family: var(--font-display);
          font-size: clamp(2rem, 5vw, 3rem);
          color: white;
          line-height: 1;
        }

        .countdown-label-sm {
          font-family: var(--font-condensed);
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--color-grey-blue);
        }

        .competition-ended-banner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 16px;
          background: rgba(148, 163, 184, 0.08);
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 12px;
          color: var(--color-grey-blue);
          font-family: var(--font-condensed);
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 24px;
        }

        .competition-ended-icon {
          font-size: 1.2rem;
        }

        .rules-summary {
          margin-bottom: 24px;
        }

        .rules-title {
          font-family: var(--font-condensed);
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--color-green-light);
          margin-bottom: 12px;
        }

        .rules-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .rules-list li {
          position: relative;
          padding-left: 20px;
          color: rgba(255, 255, 255, 0.75);
          font-size: 0.95rem;
          line-height: 1.5;
        }

        .rules-list li::before {
          content: '▹';
          position: absolute;
          left: 0;
          color: var(--color-green);
        }

        .competition-cta {
          text-align: center;
        }

        .submission-panel {
          max-width: 800px;
          margin: 0 auto;
        }

        .auth-notice {
          text-align: center;
          padding: 32px;
          background: rgba(139, 92, 246, 0.05);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 12px;
        }

        .auth-notice p {
          color: var(--color-grey-blue);
          margin-bottom: 16px;
        }

        .checkbox-label {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          cursor: pointer;
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.5;
        }

        .checkbox-label input[type='checkbox'] {
          width: 20px;
          height: 20px;
          accent-color: var(--color-purple);
          margin-top: 2px;
          flex-shrink: 0;
        }

        .winners-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          margin-top: 40px;
        }

        .winner-card {
          display: flex;
          flex-direction: column;
          gap: 16px;
          position: relative;
          overflow: hidden;
        }

        .winner-card--1 {
          border-color: rgba(251, 191, 36, 0.3);
          box-shadow: 0 0 30px rgba(251, 191, 36, 0.1);
        }

        .winner-card--2 {
          border-color: rgba(148, 163, 184, 0.3);
        }

        .winner-card--3 {
          border-color: rgba(217, 119, 60, 0.3);
        }

        .winner-position {
          font-size: 2.5rem;
          line-height: 1;
        }

        .winner-body {
          flex: 1;
        }

        .winner-artist {
          font-family: var(--font-condensed);
          font-size: 1.2rem;
          font-weight: 700;
          color: white;
          letter-spacing: 0.04em;
          margin-bottom: 4px;
        }

        .winner-song {
          font-size: 0.85rem;
          color: var(--color-grey-blue);
          margin-bottom: 12px;
        }

        .winner-lyrics {
          font-style: italic;
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.95rem;
          line-height: 1.6;
        }

        .winner-prize {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .winner-prize-name {
          font-family: var(--font-condensed);
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--color-green-light);
        }

        .winner-prize-amount {
          font-family: var(--font-display);
          font-size: 1.2rem;
          color: white;
        }

        .submissions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 24px;
          margin-top: 40px;
        }

        .submission-card {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .submission-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .submission-artist {
          font-family: var(--font-condensed);
          font-size: 1.1rem;
          font-weight: 700;
          color: white;
          letter-spacing: 0.04em;
        }

        .submission-song {
          font-size: 0.85rem;
          color: var(--color-grey-blue);
        }

        .submission-lyrics {
          font-style: italic;
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.95rem;
          line-height: 1.6;
        }

        .submission-meta {
          font-size: 0.8rem;
          color: var(--color-grey-blue);
          font-family: var(--font-condensed);
          letter-spacing: 0.06em;
        }

        .subscribe-panel {
          max-width: 700px;
          margin: 0 auto;
        }

        .subscribe-form {
          margin-top: 24px;
        }

        @media (max-width: 768px) {
          .competition-info-header {
            flex-direction: column;
          }

          .competition-stats {
            grid-template-columns: 1fr;
          }

          .countdown-grid {
            gap: 12px;
          }

          .countdown-item {
            min-width: 60px;
          }

          .winners-grid {
            grid-template-columns: 1fr;
          }

          .submissions-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
