'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import EmptyState from '@/components/EmptyState';
import Pagination from '@/components/Pagination';
import { useToast } from '@/components/ToastProvider';

interface WinnerSummary {
  id: string;
  competitionId: string;
  prizeId?: string | null;
  submissionId: string;
  position: number;
  prizeName?: string | null;
  cashAmount?: number | null;
  winningDate: string;
  selectedBy?: string | null;
  announcementStatus: string;
  createdAt: string;
  submission?: {
    artistAlias: string;
    lyrics: string;
    songTitle?: string | null;
  };
  competition?: { id: string; title: string };
}

interface Props {
  initialWinners: WinnerSummary[];
}

export default function WinnersPanel({ initialWinners }: Props) {
  const [winners, setWinners] = useState<WinnerSummary[]>(initialWinners);
  const [filter, setFilter] = useState('');
  const toast = useToast();

  const [selectOpen, setSelectOpen] = useState(false);
  const [competitions, setCompetitions] = useState<{ id: string; title: string }[]>([]);
  const [selectedCompetitionId, setSelectedCompetitionId] = useState('');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState('');
  const [position, setPosition] = useState(1);
  const [selectedPrizeId, setSelectedPrizeId] = useState('');
  const [prizes, setPrizes] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filtered = winners.filter(w => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return (
      w.competition?.title?.toLowerCase().includes(q) ||
      w.submission?.artistAlias?.toLowerCase().includes(q) ||
      w.prizeName?.toLowerCase().includes(q)
    );
  });

  const grouped = filtered.reduce<Record<string, WinnerSummary[]>>((acc, w) => {
    const key = w.competition?.title || w.competitionId;
    if (!acc[key]) acc[key] = [];
    acc[key].push(w);
    return acc;
  }, {});

  const loadCompetitions = async () => {
    try {
      const res = await fetch('/api/competitions?limit=100');
      if (res.ok) {
        const data = await res.json();
        setCompetitions(data.data?.competitions || []);
      }
    } catch {
      toast.error('Failed to load competitions');
    }
  };

  const loadSubmissions = async (competitionId: string) => {
    try {
      const res = await fetch(`/api/submissions?competitionId=${competitionId}&status=approved&limit=100`);
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.data?.submissions || []);
      }
    } catch {
      toast.error('Failed to load submissions');
    }
  };

  const loadPrizes = async (competitionId: string) => {
    try {
      const res = await fetch(`/api/competitions/${competitionId}/prizes`);
      if (res.ok) {
        const data = await res.json();
        setPrizes(data.data?.prizes || []);
      }
    } catch {
      toast.error('Failed to load prizes');
    }
  };

  const openSelect = async () => {
    await loadCompetitions();
    setSelectedCompetitionId('');
    setSelectedSubmissionId('');
    setPosition(1);
    setSelectedPrizeId('');
    setSelectOpen(true);
  };

  const handleCompetitionChange = (id: string) => {
    setSelectedCompetitionId(id);
    setSelectedSubmissionId('');
    setSelectedPrizeId('');
    if (id) {
      loadSubmissions(id);
      loadPrizes(id);
    } else {
      setSubmissions([]);
      setPrizes([]);
    }
  };

  const handleSelectWinner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompetitionId || !selectedSubmissionId || !position) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/winners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competitionId: selectedCompetitionId,
          submissionId: selectedSubmissionId,
          position,
          prizeId: selectedPrizeId || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success('Winner selected!');
        setSelectOpen(false);
        setWinners(prev => [data.data, ...prev]);
      } else {
        const err = await res.json();
        toast.error(err.error?.message || 'Failed to select winner');
      }
    } catch {
      toast.error('Network error');
    }
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/winners/${deleteId}`, { method: 'DELETE' });
      if (res.ok) {
        setWinners(prev => prev.filter(w => w.id !== deleteId));
        toast.success('Winner removed');
      } else {
        toast.error('Failed to remove winner');
      }
    } catch {
      toast.error('Network error');
    }
    setDeleteLoading(false);
    setDeleteId(null);
  };

  const getPositionEmoji = (pos: number) => {
    if (pos === 1) return '🥇';
    if (pos === 2) return '🥈';
    if (pos === 3) return '🥉';
    return `#${pos}`;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'published' || status === 'announced') return 'badge-approved';
    if (status === 'pending') return 'badge-pending';
    return 'badge-rejected';
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 className="panel-title">WINNERS</h2>
          <p className="panel-desc">Historical winners and prize records across all competitions.</p>
        </div>
        <button onClick={openSelect} className="btn-admin">
          + Select Winner
        </button>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <EmptyState
          icon="🏆"
          title="No winners yet"
          description="Select winners from approved submissions to see them here."
          action={{
            label: 'Select Winner',
            onClick: openSelect,
          }}
        />
      ) : (
        <div className="form-stack">
          {Object.entries(grouped).map(([compTitle, compWinners]) => (
            <div key={compTitle} className="glass-panel glass-panel--padded">
              <h3 className="admin-section-title admin-section-title--green" style={{ marginBottom: 16 }}>
                {compTitle}
              </h3>
              <div className="form-stack">
                {compWinners.sort((a, b) => a.position - b.position).map(winner => (
                  <div key={winner.id} className={`admin-card ${winner.announcementStatus === 'published' ? 'admin-card--featured' : ''}`}>
                    <div className="admin-card-header">
                      <div className="admin-card-body">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                          <span style={{ fontSize: '1.5rem' }}>{getPositionEmoji(winner.position)}</span>
                          <div>
                            <div style={{ fontFamily: 'var(--font-condensed)', fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>
                              {winner.submission?.artistAlias || 'Unknown Artist'}
                            </div>
                            {winner.prizeName && (
                              <div style={{ fontSize: '0.8rem', color: 'var(--color-grey-blue)' }}>
                                {winner.prizeName}
                                {winner.cashAmount != null && ` • ${winner.cashAmount.toLocaleString()}`}
                              </div>
                            )}
                          </div>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', fontStyle: 'italic', marginTop: 8 }}>
                          "{winner.submission?.lyrics ? winner.submission.lyrics.substring(0, 120) : ''}{winner.submission?.lyrics && winner.submission.lyrics.length > 120 ? '...' : ''}"
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-grey-blue)', marginTop: 6 }}>
                          Won on {new Date(winner.winningDate).toLocaleDateString()}
                        </div>
                        <span className={`${getStatusBadge(winner.announcementStatus)} badge-approved--inline badge-approved--mt`}>
                          {winner.announcementStatus.toUpperCase()}
                        </span>
                      </div>
                      <div className="admin-card-actions">
                        <button onClick={() => setDeleteId(winner.id)} className="btn-danger btn-xs">
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Remove Winner?"
        message="This will remove the winner record. This cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        disabled={deleteLoading}
      />

      <Modal isOpen={selectOpen} onClose={() => setSelectOpen(false)} titleId="select-winner-title" className="modal-lg">
        <h3 className="modal-title" id="select-winner-title">Select Winner</h3>
        <p style={{ color: 'var(--color-grey-blue)', marginBottom: 16 }}>Choose a competition and an approved submission to declare as winner.</p>
        <form onSubmit={handleSelectWinner} className="form-stack">
          <div className="form-group">
            <label className="form-label admin-label--green">Competition</label>
            <select
              className="admin-input"
              value={selectedCompetitionId}
              onChange={e => handleCompetitionChange(e.target.value)}
              required
            >
              <option value="">Select a competition...</option>
              {competitions.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label admin-label--green">Submission</label>
            <select
              className="admin-input"
              value={selectedSubmissionId}
              onChange={e => setSelectedSubmissionId(e.target.value)}
              required
              disabled={!selectedCompetitionId}
            >
              <option value="">Select a submission...</option>
              {submissions.map(s => (
                <option key={s.id} value={s.id}>
                  {s.artistAlias} — {s.songTitle || s.lyrics.substring(0, 50)}
                </option>
              ))}
            </select>
          </div>
          <div className="panel-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label admin-label--green">Position</label>
              <input type="number" className="admin-input" value={position} onChange={e => setPosition(parseInt(e.target.value) || 1)} min={1} max={10} required />
            </div>
            <div className="form-group">
              <label className="form-label admin-label--green">Prize (optional)</label>
              <select className="admin-input" value={selectedPrizeId} onChange={e => setSelectedPrizeId(e.target.value)}>
                <option value="">No prize assigned</option>
                {prizes.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (Position {p.position})</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="submit" className="btn-admin" disabled={submitting || !selectedCompetitionId || !selectedSubmissionId}>
              {submitting ? 'Selecting...' : 'Select Winner'}
            </button>
            <button type="button" onClick={() => setSelectOpen(false)} className="btn-outline-cancel">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
