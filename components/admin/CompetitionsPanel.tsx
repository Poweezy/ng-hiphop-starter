'use client';

import { useState, useEffect } from 'react';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/components/ToastProvider';
import Pagination from '@/components/Pagination';

const PAGE_SIZE = 20;

interface Competition {
  id: string;
  title: string;
  period: string;
  startDate: string;
  endDate: string;
  is_active: boolean;
  winnerId: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { lyrics: number; subscribers: number };
}

interface Lyric {
  id: string;
  lyric_text: string;
  correct_artist: string;
  is_active: boolean;
}

interface Subscriber {
  id: string;
  email: string;
  subscribedAt: string;
}

interface Props {
  initialCompetitions: Competition[];
  initialLyrics: Lyric[];
}

export default function CompetitionsPanel({ initialCompetitions, initialLyrics }: Props) {
  const [competitions, setCompetitions] = useState<Competition[]>(initialCompetitions);
  const [lyrics] = useState<Lyric[]>(initialLyrics);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState('');
  const toast = useToast();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [is_active, setIs_active] = useState(false);

  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string | null>(null);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [subscriberPage, setSubscriberPage] = useState(1);
  const [totalSubscribers, setTotalSubscribers] = useState(0);
  const [showSubscribers, setShowSubscribers] = useState(false);
  const [loadingSubscribers, setLoadingSubscribers] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [winnerConfirm, setWinnerConfirm] = useState<{ id: string; title: string } | null>(null);
  const [selectedWinnerId, setSelectedWinnerId] = useState<string>('');

  const resetForm = () => {
    setTitle('');
    setPeriod('monthly');
    setStartDate('');
    setEndDate('');
    setIs_active(false);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate || !endDate) return;

    setLoading(true);
    try {
      const url = editingId ? `/api/competitions/${editingId}` : '/api/competitions';
      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), period, startDate, endDate, is_active }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setMsg(editingId ? 'Competition updated!' : 'Competition created!');
        if (editingId) {
          setCompetitions(competitions.map(c => c.id === editingId ? { ...c, ...data } : c));
        } else {
          setCompetitions([data, ...competitions]);
        }
        resetForm();
      } else {
        setStatus('error');
        setMsg(data.error?.message || data.message || 'Operation failed');
      }
    } catch {
      setStatus('error');
      setMsg('Network error');
    }
    setLoading(false);
    setTimeout(() => setStatus('idle'), 3000);
  };

  const handleEdit = (competition: Competition) => {
    setEditingId(competition.id);
    setTitle(competition.title);
    setPeriod(competition.period as 'monthly' | 'yearly');
    setStartDate(competition.startDate.slice(0, 16));
    setEndDate(competition.endDate.slice(0, 16));
    setIs_active(competition.is_active);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const res = await fetch(`/api/competitions/${deleteId}`, { method: 'DELETE' });
    if (res.ok) {
      setCompetitions(competitions.filter(c => c.id !== deleteId));
      toast.success('Competition deleted');
    } else {
      toast.error('Delete failed');
    }
    setDeleteId(null);
  };

  const handleDeclareWinner = async () => {
    if (!winnerConfirm || !selectedWinnerId) return;
    const res = await fetch(`/api/competitions/${winnerConfirm.id}/winner`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winnerId: selectedWinnerId }),
    });
    if (res.ok) {
      const data = await res.json();
      setCompetitions(competitions.map(c => c.id === winnerConfirm.id ? { ...c, winnerId: selectedWinnerId } : c));
      toast.success('Winner declared!');
    } else {
      toast.error('Failed to declare winner');
    }
    setWinnerConfirm(null);
    setSelectedWinnerId('');
  };

  const loadSubscribers = async (competitionId: string) => {
    setLoadingSubscribers(true);
    try {
      const res = await fetch(`/api/competitions/${competitionId}/subscribers?page=1&limit=50`);
      if (res.ok) {
        const data = await res.json();
        setSubscribers(data.data.subscribers || []);
        setTotalSubscribers(data.data.pagination?.total || 0);
      }
    } catch {
      toast.error('Failed to load subscribers');
    }
    setLoadingSubscribers(false);
  };

  const handleNotify = async (competitionId: string) => {
    const res = await fetch(`/api/competitions/${competitionId}/notify`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      toast.success(data.message || 'Notification queued');
    } else {
      toast.error('Notification failed');
    }
  };

  const activeCompetitions = competitions.filter(c => c.is_active);
  const pastCompetitions = competitions.filter(c => !c.is_active);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 className="panel-title">LYRIC COMPETITIONS</h2>
          <p className="panel-desc">Create and manage monthly/yearly lyric competitions.</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-admin">
          + New Competition
        </button>
      </div>

      {showForm && (
        <div className="glass-panel glass-panel--padded" style={{ marginBottom: 32 }}>
          <h3 className="admin-section-title">{editingId ? 'Edit Competition' : 'Create Competition'}</h3>
          <form onSubmit={handleSubmit} className="form-stack">
            <div className="form-group">
              <label className="form-label admin-label--green">Title</label>
              <input className="admin-input" value={title} onChange={e => setTitle(e.target.value)} required maxLength={200} placeholder="e.g. Best Bars of August 2026" />
            </div>
            <div className="panel-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label admin-label--green">Period</label>
                <select className="admin-input" value={period} onChange={e => setPeriod(e.target.value as 'monthly' | 'yearly')}>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label admin-label--green">Active</label>
                <select className="admin-input" value={is_active ? 'true' : 'false'} onChange={e => setIs_active(e.target.value === 'true')}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
            <div className="panel-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label admin-label--green">Start Date</label>
                <input type="datetime-local" className="admin-input" value={startDate} onChange={e => setStartDate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label admin-label--green">End Date</label>
                <input type="datetime-local" className="admin-input" value={endDate} onChange={e => setEndDate(e.target.value)} required />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" className="btn-admin" disabled={loading}>
                {loading ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </button>
              <button type="button" onClick={resetForm} className="btn-outline-cancel">Cancel</button>
            </div>
            {status !== 'idle' && (
              <div className={`status-message status-message--${status}`}>{msg}</div>
            )}
          </form>
        </div>
      )}

      <div style={{ marginBottom: 40 }}>
        <h3 className="admin-section-title admin-section-title--green">Active Competitions ({activeCompetitions.length})</h3>
        {activeCompetitions.length === 0 ? (
          <p className="admin-text-muted">No active competitions.</p>
        ) : (
          <div className="form-stack">
            {activeCompetitions.map(competition => (
              <div key={competition.id} className={`admin-card ${competition.winnerId ? 'admin-card--featured' : ''}`}>
                <div className="admin-card-header">
                  <div className="admin-card-body">
                    <div style={{ fontFamily: 'var(--font-condensed)', fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>{competition.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-grey-blue)', marginTop: 4 }}>
                      {competition.period.toUpperCase()} • Ends {new Date(competition.endDate).toLocaleDateString()}
                    </div>
                    {competition.winnerId && (
                      <div style={{ marginTop: 8 }}>
                        <span className="badge-approved">WINNER DECLARED</span>
                      </div>
                    )}
                    {competition._count && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-grey-blue)', marginTop: 6 }}>
                        {competition._count.lyrics} lyrics • {competition._count.subscribers} subscribers
                      </div>
                    )}
                  </div>
                  <div className="admin-card-actions">
                    <button onClick={() => handleEdit(competition)} className="btn-badge">Edit</button>
                    <button onClick={() => { setSelectedCompetitionId(competition.id); loadSubscribers(competition.id); setShowSubscribers(true); }} className="btn-badge">
                      Subscribers ({competition._count?.subscribers || 0})
                    </button>
                    {!competition.winnerId && (
                      <button onClick={() => setWinnerConfirm({ id: competition.id, title: competition.title })} className="btn-admin btn-sm">
                        👑 Winner
                      </button>
                    )}
                    <button onClick={() => setDeleteId(competition.id)} className="btn-danger btn-xs">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="admin-section-title">Past Competitions ({pastCompetitions.length})</h3>
        {pastCompetitions.length === 0 ? (
          <p className="admin-text-muted">No past competitions.</p>
        ) : (
          <div className="form-stack">
            {pastCompetitions.map(competition => (
              <div key={competition.id} className={`admin-card ${competition.winnerId ? 'admin-card--featured' : ''}`}>
                <div className="admin-card-header">
                  <div className="admin-card-body">
                    <div style={{ fontFamily: 'var(--font-condensed)', fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>{competition.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-grey-blue)', marginTop: 4 }}>
                      {competition.period.toUpperCase()} • Ended {new Date(competition.endDate).toLocaleDateString()}
                    </div>
                    {competition.winnerId && (
                      <div style={{ marginTop: 8 }}>
                        <span className="badge-approved">WINNER DECLARED</span>
                      </div>
                    )}
                  </div>
                  <div className="admin-card-actions">
                    <button onClick={() => handleEdit(competition)} className="btn-badge">Edit</button>
                    <button onClick={() => { setSelectedCompetitionId(competition.id); loadSubscribers(competition.id); setShowSubscribers(true); }} className="btn-badge">
                      Subscribers ({competition._count?.subscribers || 0})
                    </button>
                    {competition.winnerId && (
                      <button onClick={() => handleNotify(competition.id)} className="btn-admin btn-sm">
                        📧 Notify
                      </button>
                    )}
                    <button onClick={() => setDeleteId(competition.id)} className="btn-danger btn-xs">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Delete Competition?"
        message="This will permanently delete the competition and all associated data. This cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      {winnerConfirm && (
        <div className="modal-overlay" onClick={() => setWinnerConfirm(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <h3 className="modal-title">Declare Winner: {winnerConfirm.title}</h3>
            <p style={{ color: 'var(--color-grey-blue)', marginBottom: 16 }}>Select a lyric to declare as the winner.</p>
            <div className="form-stack">
              <select
                className="admin-input"
                value={selectedWinnerId}
                onChange={e => setSelectedWinnerId(e.target.value)}
              >
                <option value="">Select a lyric...</option>
                {lyrics.filter(l => l.is_active).map(lyric => (
                  <option key={lyric.id} value={lyric.id}>
                    "{lyric.lyric_text}" — {lyric.correct_artist}
                  </option>
                ))}
              </select>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={handleDeclareWinner} className="btn-admin" disabled={!selectedWinnerId}>
                  Declare Winner
                </button>
                <button onClick={() => { setWinnerConfirm(null); setSelectedWinnerId(''); }} className="btn-outline-cancel">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSubscribers && selectedCompetitionId && (
        <div className="modal-overlay" onClick={() => setShowSubscribers(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 className="modal-title">Subscribers</h3>
              <button onClick={() => setShowSubscribers(false)} className="close-btn-text">Close</button>
            </div>
            {loadingSubscribers ? (
              <p className="admin-text-muted">Loading...</p>
            ) : subscribers.length === 0 ? (
              <p className="admin-text-muted">No subscribers yet.</p>
            ) : (
              <div className="admin-users-list">
                {subscribers.map(sub => (
                  <div key={sub.id} className="admin-card admin-card--compact">
                    <div className="admin-card-body">
                      <div className="admin-text-ellipsis">{sub.email}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-grey-blue)' }}>
                        Subscribed {new Date(sub.subscribedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {totalSubscribers > 50 && (
              <Pagination currentPage={subscriberPage} totalPages={Math.ceil(totalSubscribers / 50)} onPageChange={setSubscriberPage} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
