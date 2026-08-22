'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SubmissionStatus {
  id: string;
  artistAlias: string;
  status: string;
  moderationStatus: string;
  moderationReason?: string | null;
  moderationNotes?: string | null;
  submittedAt: string;
  updatedAt: string;
  competition?: { id: string; title: string; endDate: string };
}

export default function SubmissionStatusPage() {
  const [lookupId, setLookupId] = useState('');
  const [lookupAlias, setLookupAlias] = useState('');
  const [result, setResult] = useState<SubmissionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupId.trim() && !lookupAlias.trim()) {
      setError('Enter a submission ID or artist alias.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    setSearched(true);

    try {
      const params = new URLSearchParams();
      if (lookupId.trim()) params.set('id', lookupId.trim());
      if (lookupAlias.trim()) params.set('alias', lookupAlias.trim());

      const res = await fetch(`/api/submissions/status?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setResult(data.data);
      } else {
        setError(data.error?.message || 'Submission not found.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#10B981';
      case 'rejected': return '#EF4444';
      case 'pending': return '#FBBF24';
      case 'disqualified': return '#EF4444';
      case 'winner': return '#8B5CF6';
      default: return '#94A3B8';
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'pending': return 'Pending Review';
      case 'disqualified': return 'Disqualified';
      case 'winner': return 'Winner';
      default: return status;
    }
  };

  return (
    <section className="section status-section">
      <div className="container">
        <div className="status-header">
          <div className="section-badge">Track Status</div>
          <h1 className="status-title">Submission Status</h1>
          <p className="status-subtitle">
            Enter your submission ID or artist alias to check the status of your entry.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="status-form">
          <div className="status-inputs">
            <div className="input-group">
              <label htmlFor="lookup-id">Submission ID</label>
              <input
                id="lookup-id"
                type="text"
                placeholder="e.g. abc123..."
                value={lookupId}
                onChange={(e) => { setLookupId(e.target.value); if (error) setError(''); }}
                disabled={loading}
              />
            </div>
            <div className="status-or">or</div>
            <div className="input-group">
              <label htmlFor="lookup-alias">Artist Alias</label>
              <input
                id="lookup-alias"
                type="text"
                placeholder="Your tag or artist name"
                value={lookupAlias}
                onChange={(e) => { setLookupAlias(e.target.value); if (error) setError(''); }}
                disabled={loading}
              />
            </div>
          </div>

          {error && <p className="status-error" role="alert">{error}</p>}

          <button type="submit" disabled={loading} className="btn btn-primary status-submit">
            {loading ? 'Checking...' : 'Check Status'}
          </button>
        </form>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="status-result"
            >
              <div className="status-result-header">
                <h2 className="status-result-title">Submission Found</h2>
                <span
                  className="status-badge"
                  style={{ background: `${statusColor(result.status)}20`, color: statusColor(result.status), borderColor: `${statusColor(result.status)}40` }}
                >
                  {statusLabel(result.status)}
                </span>
              </div>

              <div className="status-details">
                <div className="status-detail">
                  <span className="status-label">ID</span>
                  <span className="status-value">{result.id}</span>
                </div>
                <div className="status-detail">
                  <span className="status-label">Artist</span>
                  <span className="status-value">{result.artistAlias}</span>
                </div>
                {result.competition && (
                  <div className="status-detail">
                    <span className="status-label">Competition</span>
                    <span className="status-value">{result.competition.title}</span>
                  </div>
                )}
                <div className="status-detail">
                  <span className="status-label">Submitted</span>
                  <span className="status-value">{new Date(result.submittedAt).toLocaleDateString()}</span>
                </div>
                <div className="status-detail">
                  <span className="status-label">Last Updated</span>
                  <span className="status-value">{new Date(result.updatedAt).toLocaleDateString()}</span>
                </div>
                {result.moderationReason && (
                  <div className="status-detail">
                    <span className="status-label">Reason</span>
                    <span className="status-value">{result.moderationReason}</span>
                  </div>
                )}
                {result.moderationNotes && (
                  <div className="status-detail">
                    <span className="status-label">Notes</span>
                    <span className="status-value">{result.moderationNotes}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {searched && !result && !error && !loading && (
          <div className="status-empty">
            <p>No submission found. Double-check your ID or alias and try again.</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .status-section {
          position: relative;
          min-height: 80vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 120px 0 80px;
        }

        .status-header {
          text-align: center;
          margin-bottom: 48px;
        }

        .status-title {
          font-family: var(--font-display);
          font-size: clamp(2.5rem, 6vw, 4rem);
          color: white;
          margin-bottom: 16px;
          letter-spacing: 0.02em;
        }

        .status-subtitle {
          color: rgba(255, 255, 255, 0.6);
          font-size: 1rem;
          max-width: 480px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .status-form {
          max-width: 560px;
          margin: 0 auto 48px;
        }

        .status-inputs {
          display: flex;
          gap: 16px;
          align-items: flex-end;
          margin-bottom: 16px;
        }

        .status-or {
          color: rgba(255, 255, 255, 0.4);
          font-family: var(--font-condensed);
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding-bottom: 12px;
        }

        .status-error {
          color: #F87171;
          font-size: 0.85rem;
          text-align: center;
          margin-bottom: 16px;
        }

        .status-submit {
          width: 100%;
          justify-content: center;
        }

        .status-result {
          max-width: 560px;
          margin: 0 auto;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 32px;
          backdrop-filter: blur(16px);
        }

        .status-result-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .status-result-title {
          font-family: var(--font-display);
          font-size: 1.5rem;
          color: white;
          letter-spacing: 0.02em;
        }

        .status-badge {
          padding: 6px 16px;
          border-radius: 20px;
          font-family: var(--font-condensed);
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          border: 1px solid;
        }

        .status-details {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .status-detail {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }

        .status-detail:last-child {
          border-bottom: none;
        }

        .status-label {
          font-family: var(--font-condensed);
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: rgba(255, 255, 255, 0.5);
        }

        .status-value {
          font-size: 0.9rem;
          color: white;
          text-align: right;
          max-width: 60%;
          word-break: break-word;
        }

        .status-empty {
          text-align: center;
          padding: 48px 24px;
          color: rgba(255, 255, 255, 0.6);
          max-width: 480px;
          margin: 0 auto;
        }

        @media (max-width: 640px) {
          .status-inputs {
            flex-direction: column;
            gap: 12px;
          }

          .status-or {
            padding-bottom: 0;
          }

          .status-result {
            padding: 24px;
          }

          .status-result-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .status-detail {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }

          .status-value {
            text-align: left;
            max-width: 100%;
          }
        }
      `}</style>
    </section>
  );
}
