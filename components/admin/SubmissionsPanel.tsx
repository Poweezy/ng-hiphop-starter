'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import EmptyState from '@/components/EmptyState';
import Pagination from '@/components/Pagination';
import { useToast } from '@/components/ToastProvider';

const PAGE_SIZE = 20;

interface LyricSubmissionSummary {
  id: string;
  competitionId: string;
  artistAlias: string;
  userId?: string | null;
  lyrics: string;
  songTitle?: string | null;
  audioUrl?: string | null;
  socialLinks?: string | null;
  status: string;
  moderationStatus: string;
  moderationNotes?: string | null;
  moderationReason?: string | null;
  score?: number | null;
  copyrightAccepted: boolean;
  createdAt: string;
  updatedAt: string;
  competition?: { id: string; title: string };
}

interface Props {
  initialSubmissions: LyricSubmissionSummary[];
}

export default function SubmissionsPanel({ initialSubmissions }: Props) {
  const [submissions, setSubmissions] = useState<LyricSubmissionSummary[]>(initialSubmissions);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [moderationFilter, setModerationFilter] = useState('');
  const [page, setPage] = useState(1);
  const toast = useToast();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<LyricSubmissionSummary & { moderationHistory?: any[] } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [moderating, setModerating] = useState(false);
  const [modAction, setModAction] = useState('');
  const [modReason, setModReason] = useState('');
  const [modNotes, setModNotes] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    setDetailLoading(true);
    setDetail(null);
    fetch(`/api/submissions/${selectedId}`)
      .then(res => res.ok ? res.json() : Promise.reject('Failed to load'))
      .then(data => { if (!cancelled) setDetail(data.data || data); })
      .catch(() => { if (!cancelled) toast.error('Failed to load submission details'); })
      .finally(() => { if (!cancelled) setDetailLoading(false); });
    return () => { cancelled = true; };
  }, [selectedId]);

  const handleModerate = async () => {
    if (!selectedId || !modAction) return;
    setModerating(true);
    try {
      const res = await fetch(`/api/submissions/${selectedId}/moderate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: selectedId,
          action: modAction,
          reason: modReason || null,
          notes: modNotes || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const updated = data.data || data;
        setSubmissions(prev => prev.map(s => s.id === selectedId ? { ...s, ...updated } : s));
        setDetail(updated);
        toast.success('Submission moderated successfully');
        setModAction('');
        setModReason('');
        setModNotes('');
      } else {
        toast.error(data.data?.error?.message || data.message || 'Moderation failed');
      }
    } catch {
      toast.error('Network error');
    }
    setModerating(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/submissions/${deleteId}`, { method: 'DELETE' });
      if (res.ok) {
        setSubmissions(prev => prev.filter(s => s.id !== deleteId));
        toast.success('Submission deleted');
        setDeleteId(null);
      } else {
        toast.error('Delete failed');
      }
    } catch {
      toast.error('Network error');
    }
  };

  const filtered = submissions.filter(s => {
    const matchesSearch = s.artistAlias.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || s.status === statusFilter;
    const matchesModeration = !moderationFilter || s.moderationStatus === moderationFilter;
    return matchesSearch && matchesStatus && matchesModeration;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const getStatusBadge = (status: string) => {
    if (status === 'approved' || status === 'winner') return <span className="badge-approved">{status.toUpperCase()}</span>;
    if (status === 'rejected' || status === 'disqualified') return <span className="badge-rejected">{status.toUpperCase()}</span>;
    return <span className="badge-pending">{status.toUpperCase()}</span>;
  };

  const getModerationBadge = (status: string) => {
    if (status === 'approved') return <span className="badge-approved">{status.toUpperCase()}</span>;
    if (status === 'rejected' || status === 'changes_requested') return <span className="badge-pending">{status.toUpperCase()}</span>;
    return <span className="badge-pending">{status.toUpperCase()}</span>;
  };

  return (
    <div>
      <h2 className="panel-title">SUBMISSIONS</h2>
      <p className="panel-desc">Review and moderate lyric submissions for competitions.</p>

      <div className="form-stack glass-panel glass-panel--padded" style={{ marginBottom: 24 }}>
        <div className="panel-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <div className="form-group">
            <label htmlFor="submission-search" className="form-label admin-label--green">Search Artist</label>
            <input
              id="submission-search"
              type="text"
              className="admin-input"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by artist alias..."
            />
          </div>
          <div className="form-group">
            <label htmlFor="status-filter" className="form-label admin-label--green">Status</label>
            <select
              id="status-filter"
              className="admin-input"
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="disqualified">Disqualified</option>
              <option value="winner">Winner</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="moderation-filter" className="form-label admin-label--green">Moderation Status</label>
            <select
              id="moderation-filter"
              className="admin-input"
              value={moderationFilter}
              onChange={e => { setModerationFilter(e.target.value); setPage(1); }}
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="changes_requested">Changes Requested</option>
            </select>
          </div>
        </div>
      </div>

      <h3 className="admin-section-title">All Submissions ({filtered.length})</h3>

      {filtered.length === 0 ? (
        <EmptyState
          icon="📝"
          title="No submissions found"
          description="There are no submissions matching your filters."
        />
      ) : (
        <>
          <div className="admin-users-list">
            {paginated.map(s => (
              <div key={s.id} className="admin-card admin-card--compact" style={{ cursor: 'pointer' }} onClick={() => setSelectedId(s.id)}>
                <div className="admin-card-body admin-card-body--no-shrink">
                  <div style={{ fontWeight: 600, color: 'white' }}>{s.artistAlias}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-grey-blue)', marginTop: 4 }}>
                    {s.competition?.title || 'Unknown Competition'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-grey-blue)', marginTop: 4 }}>
                    {new Date(s.createdAt).toLocaleDateString()}
                    {s.score !== null && s.score !== undefined && (
                      <span style={{ marginLeft: 12, color: 'var(--color-purple-light)', fontWeight: 600 }}>
                        Score: {s.score}
                      </span>
                    )}
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {getStatusBadge(s.status)}
                    {getModerationBadge(s.moderationStatus)}
                  </div>
                </div>
                <div className="admin-card-actions">
                  <button onClick={(e) => { e.stopPropagation(); setSelectedId(s.id); }} className="btn-badge">View</button>
                  <button onClick={(e) => { e.stopPropagation(); setDeleteId(s.id); }} className="btn-danger btn-xs">Delete</button>
                </div>
              </div>
            ))}
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {selectedId && (
        <Modal isOpen={!!selectedId} onClose={() => { setSelectedId(null); setDetail(null); setModAction(''); setModReason(''); setModNotes(''); }} titleId="submission-detail-title">
          <h3 className="modal-title" id="submission-detail-title">Submission Details</h3>

          {detailLoading ? (
            <p className="admin-text-muted">Loading...</p>
          ) : detail ? (
            <div className="form-stack">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ color: 'var(--color-grey-blue)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Artist Alias</div>
                  <div style={{ color: 'white', marginTop: 4, fontWeight: 600 }}>{detail.artistAlias}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--color-grey-blue)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Competition</div>
                  <div style={{ color: 'white', marginTop: 4 }}>{detail.competition?.title || 'Unknown'}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--color-grey-blue)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Song Title</div>
                  <div style={{ color: 'white', marginTop: 4 }}>{detail.songTitle || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--color-grey-blue)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Date</div>
                  <div style={{ color: 'white', marginTop: 4 }}>{new Date(detail.createdAt).toLocaleDateString()}</div>
                </div>
              </div>

              <div>
                <div style={{ color: 'var(--color-grey-blue)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Lyrics</div>
                <div style={{ color: 'white', marginTop: 4, whiteSpace: 'pre-wrap', background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 8, maxHeight: 300, overflowY: 'auto' }}>{detail.lyrics}</div>
              </div>

              {detail.audioUrl && (
                <div>
                  <div style={{ color: 'var(--color-grey-blue)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Audio URL</div>
                  <div style={{ color: 'var(--color-purple-light)', marginTop: 4 }}>{detail.audioUrl}</div>
                </div>
              )}

              {detail.socialLinks && (
                <div>
                  <div style={{ color: 'var(--color-grey-blue)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Social Links</div>
                  <div style={{ color: 'var(--color-purple-light)', marginTop: 4 }}>{detail.socialLinks}</div>
                </div>
              )}

              <div>
                <div style={{ color: 'var(--color-grey-blue)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Copyright Accepted</div>
                <div style={{ marginTop: 4 }}>{detail.copyrightAccepted ? <span className="badge-approved">YES</span> : <span className="badge-rejected">NO</span>}</div>
              </div>

              <div>
                <div style={{ color: 'var(--color-grey-blue)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Moderation History</div>
                {detail.moderationHistory && detail.moderationHistory.length > 0 ? (
                  <div className="form-stack">
                    {detail.moderationHistory.map((m: any) => (
                      <div key={m.id} className="admin-card admin-card--compact" style={{ padding: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="badge-approved">{m.action.toUpperCase()}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-grey-blue)' }}>{new Date(m.createdAt).toLocaleString()}</span>
                        </div>
                        {m.reason && <div style={{ color: 'var(--color-grey-blue)', marginTop: 4, fontSize: '0.85rem' }}>Reason: {m.reason}</div>}
                        {m.notes && <div style={{ color: 'rgba(255,255,255,0.8)', marginTop: 4, fontSize: '0.85rem' }}>{m.notes}</div>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="admin-text-muted">No moderation history yet.</p>
                )}
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16, marginTop: 8 }}>
                <div style={{ color: 'var(--color-grey-blue)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Moderation Actions</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                  {[
                    { value: 'approve', label: 'Approve', className: 'btn-admin' },
                    { value: 'reject', label: 'Reject', className: 'btn-danger' },
                    { value: 'request_changes', label: 'Request Changes', className: 'btn-admin' },
                    { value: 'disqualify', label: 'Disqualify', className: 'btn-danger' },
                  ].map(action => (
                    <button
                      key={action.value}
                      type="button"
                      onClick={() => setModAction(action.value)}
                      className={`${action.className} btn-sm`}
                      style={modAction === action.value ? {} : { opacity: 0.7 }}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>

                {modAction && (
                  <div className="form-stack">
                    <div className="form-group">
                      <label htmlFor="mod-reason" className="form-label admin-label--green">Reason</label>
                      <select
                        id="mod-reason"
                        className="admin-input"
                        value={modReason}
                        onChange={e => setModReason(e.target.value)}
                      >
                        <option value="">Select a reason (optional)</option>
                        <option value="copyright">Copyright concern</option>
                        <option value="offensive">Offensive content</option>
                        <option value="spam">Spam</option>
                        <option value="duplicate">Duplicate submission</option>
                        <option value="rules">Does not meet rules</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="mod-notes" className="form-label admin-label--green">Notes</label>
                      <textarea
                        id="mod-notes"
                        className="admin-input admin-textarea"
                        value={modNotes}
                        onChange={e => setModNotes(e.target.value)}
                        rows={3}
                        placeholder="Add moderation notes..."
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" onClick={handleModerate} className="btn-admin" disabled={moderating}>
                        {moderating ? 'Saving...' : 'Submit Moderation'}
                      </button>
                      <button type="button" onClick={() => { setModAction(''); setModReason(''); setModNotes(''); }} className="btn-outline-cancel">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="admin-text-muted">Failed to load details.</p>
          )}
        </Modal>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Delete Submission?"
        message="This will permanently delete the submission. This cannot be undone."
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        variant="danger"
      />
    </div>
  );
}
