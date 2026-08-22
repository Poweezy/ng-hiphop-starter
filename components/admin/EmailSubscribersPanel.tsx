'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import Pagination from '@/components/Pagination';
import EmptyState from '@/components/EmptyState';
import { useToast } from '@/components/ToastProvider';

const PAGE_SIZE = 20;

interface SubscriberSummary {
  id: string;
  email: string;
  name?: string | null;
  competitionId: string;
  source: string;
  consentStatus: string;
  consentTimestamp: string;
  subscriptionStatus: string;
  unsubscribedAt?: string | null;
  lastEmailSentAt?: string | null;
  createdAt: string;
  updatedAt: string;
  competition?: { title: string };
}

interface CompetitionOption {
  id: string;
  title: string;
}

interface Props {
  initialSubscribers: SubscriberSummary[];
}

export default function EmailSubscribersPanel({ initialSubscribers }: Props) {
  const toast = useToast();
  const [subscribers, setSubscribers] = useState<SubscriberSummary[]>(initialSubscribers);
  const [competitions, setCompetitions] = useState<CompetitionOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [competitionFilter, setCompetitionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [viewSubscriber, setViewSubscriber] = useState<SubscriberSummary | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [unsubscribeId, setUnsubscribeId] = useState<string | null>(null);
  const [unsubscribeLoading, setUnsubscribeLoading] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [campaignSubject, setCampaignSubject] = useState('');
  const [campaignBody, setCampaignBody] = useState('');
  const [campaignLoading, setCampaignLoading] = useState(false);

  useEffect(() => {
    const loadCompetitions = async () => {
      try {
        const res = await fetch('/api/competitions');
        if (res.ok) {
          const data = await res.json();
          setCompetitions(data.data?.competitions || data.competitions || []);
        }
      } catch {
        // silently fail
      }
    };
    loadCompetitions();
  }, []);

  const filtered = subscribers.filter((s) => {
    const matchesSearch = s.email.toLowerCase().includes(search.toLowerCase());
    const matchesCompetition = !competitionFilter || s.competitionId === competitionFilter;
    const matchesStatus = !statusFilter || s.subscriptionStatus === statusFilter;
    return matchesSearch && matchesCompetition && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSelectAll = () => {
    if (selectedIds.size === paginated.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.map((s) => s.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleUnsubscribe = async () => {
    if (!unsubscribeId) return;
    setUnsubscribeLoading(true);
    try {
      const res = await fetch(`/api/subscribers/${unsubscribeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionStatus: 'unsubscribed' }),
      });
      if (res.ok) {
        setSubscribers((prev) =>
          prev.map((s) =>
            s.id === unsubscribeId ? { ...s, subscriptionStatus: 'unsubscribed', unsubscribedAt: new Date().toISOString() } : s
          )
        );
        toast.success('Subscriber unsubscribed');
      } else {
        toast.error('Unsubscribe failed');
      }
    } catch {
      toast.error('Network error');
    }
    setUnsubscribeId(null);
    setUnsubscribeLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/subscribers/${deleteId}`, { method: 'DELETE' });
      if (res.ok) {
        setSubscribers((prev) => prev.filter((s) => s.id !== deleteId));
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(deleteId);
          return next;
        });
        toast.success('Subscriber deleted');
      } else {
        toast.error('Delete failed');
      }
    } catch {
      toast.error('Network error');
    }
    setDeleteId(null);
    setDeleteLoading(false);
  };

  const handleExportCSV = async () => {
    const url = competitionFilter
      ? `/api/subscribers/export?competitionId=${encodeURIComponent(competitionFilter)}`
      : '/api/subscribers/export';
    try {
      const res = await fetch(url);
      if (res.ok) {
        const blob = await res.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `subscribers${competitionFilter ? `-${competitionFilter}` : ''}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
        toast.success('CSV exported');
      } else {
        toast.error('Export failed');
      }
    } catch {
      toast.error('Export failed');
    }
  };

  const handleSendCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignName.trim() || !campaignSubject.trim() || !campaignBody.trim()) return;
    setCampaignLoading(true);
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignName.trim(),
          subject: campaignSubject.trim(),
          body: campaignBody.trim(),
          recipientIds: Array.from(selectedIds),
          recipientFilter: competitionFilter || undefined,
          status: 'draft',
        }),
      });
      if (res.ok) {
        toast.success('Campaign created');
        setShowCampaignModal(false);
        setCampaignName('');
        setCampaignSubject('');
        setCampaignBody('');
      } else {
        const data = await res.json();
        toast.error(data.error?.message || 'Failed to create campaign');
      }
    } catch {
      toast.error('Network error');
    }
    setCampaignLoading(false);
  };

  return (
    <div>
      <h2 className="panel-title">EMAIL SUBSCRIBERS</h2>
      <p className="panel-desc">Manage newsletter subscribers, view engagement, and send campaigns.</p>

      <div className="glass-panel glass-panel--padded" style={{ marginBottom: 24 }}>
        <div className="panel-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <div className="form-group">
            <label htmlFor="sub-search" className="form-label admin-label--green">Search Email</label>
            <input
              id="sub-search"
              type="text"
              className="admin-input"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by email..."
            />
          </div>
          <div className="form-group">
            <label htmlFor="comp-filter" className="form-label admin-label--green">Competition</label>
            <select
              id="comp-filter"
              className="admin-input"
              value={competitionFilter}
              onChange={(e) => { setCompetitionFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Competitions</option>
              {competitions.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="status-filter" className="form-label admin-label--green">Status</label>
            <select
              id="status-filter"
              className="admin-input"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="unsubscribed">Unsubscribed</option>
              <option value="bounced">Bounced</option>
            </select>
          </div>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="batch-actions" style={{ marginBottom: 16 }}>
          <span style={{ fontFamily: 'var(--font-condensed)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-green-light)' }}>
            {selectedIds.size} selected
          </span>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={handleExportCSV} className="btn-badge">
              Export CSV
            </button>
            <button onClick={() => setShowCampaignModal(true)} className="btn btn-primary$1">
              Send Email
            </button>
            <button onClick={() => setSelectedIds(new Set())} className="btn btn-secondary$1">
              Clear Selection
            </button>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <h3 className="admin-section-title">All Subscribers ({filtered.length})</h3>
        {filtered.length === 0 ? (
          <EmptyState
            icon="📧"
            title="No Subscribers"
            description="There are no subscribers matching your current filters."
          />
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '12px 8px', textAlign: 'left', fontFamily: 'var(--font-condensed)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-grey-blue)', fontSize: '0.75rem' }}>
                      <input
                        type="checkbox"
                        checked={paginated.length > 0 && selectedIds.size === paginated.length}
                        onChange={toggleSelectAll}
                        style={{ width: 16, height: 16, accentColor: 'var(--color-purple)', cursor: 'pointer' }}
                        aria-label="Select all on this page"
                      />
                    </th>
                    <th style={{ padding: '12px 8px', textAlign: 'left', fontFamily: 'var(--font-condensed)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-grey-blue)', fontSize: '0.75rem' }}>Email</th>
                    <th style={{ padding: '12px 8px', textAlign: 'left', fontFamily: 'var(--font-condensed)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-grey-blue)', fontSize: '0.75rem' }}>Name</th>
                    <th style={{ padding: '12px 8px', textAlign: 'left', fontFamily: 'var(--font-condensed)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-grey-blue)', fontSize: '0.75rem' }}>Subscribed</th>
                    <th style={{ padding: '12px 8px', textAlign: 'left', fontFamily: 'var(--font-condensed)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-grey-blue)', fontSize: '0.75rem' }}>Source</th>
                    <th style={{ padding: '12px 8px', textAlign: 'left', fontFamily: 'var(--font-condensed)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-grey-blue)', fontSize: '0.75rem' }}>Competition</th>
                    <th style={{ padding: '12px 8px', textAlign: 'left', fontFamily: 'var(--font-condensed)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-grey-blue)', fontSize: '0.75rem' }}>Status</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right', fontFamily: 'var(--font-condensed)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-grey-blue)', fontSize: '0.75rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((s) => (
                    <tr key={s.id} className="admin-card" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s ease' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '10px 8px' }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(s.id)}
                          onChange={() => toggleSelect(s.id)}
                          style={{ width: 16, height: 16, accentColor: 'var(--color-purple)', cursor: 'pointer' }}
                          aria-label={`Select ${s.email}`}
                        />
                      </td>
                      <td style={{ padding: '10px 8px', fontFamily: 'var(--font-condensed)', fontWeight: 600, color: 'white' }}>{s.email}</td>
                      <td style={{ padding: '10px 8px', color: 'rgba(255,255,255,0.7)' }}>{s.name || '—'}</td>
                      <td style={{ padding: '10px 8px', color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap' }}>{new Date(s.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: '10px 8px', color: 'rgba(255,255,255,0.7)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.source}</td>
                      <td style={{ padding: '10px 8px', color: 'rgba(255,255,255,0.7)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.competition?.title || '—'}</td>
                      <td style={{ padding: '10px 8px' }}>
                        <span className={s.subscriptionStatus === 'active' ? 'badge-approved' : 'badge-rejected'}>
                          {s.subscriptionStatus}
                        </span>
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button onClick={() => setViewSubscriber(s)} className="btn-badge" style={{ marginRight: 6 }}>View</button>
                        {s.subscriptionStatus !== 'unsubscribed' && (
                          <button onClick={() => setUnsubscribeId(s.id)} className="btn-danger btn-xs" style={{ marginRight: 6 }}>Unsubscribe</button>
                        )}
                        <button onClick={() => setDeleteId(s.id)} className="btn-danger btn-xs">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Delete Subscriber?"
        message="This will permanently anonymize the subscriber record. This cannot be undone."
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        variant="danger"
        disabled={deleteLoading}
      />

      <ConfirmDialog
        isOpen={!!unsubscribeId}
        title="Unsubscribe Subscriber?"
        message="This will mark the subscriber as unsubscribed and they will no longer receive emails."
        confirmText="Unsubscribe"
        onConfirm={handleUnsubscribe}
        onCancel={() => setUnsubscribeId(null)}
        variant="warning"
        disabled={unsubscribeLoading}
      />

      <Modal isOpen={!!viewSubscriber} onClose={() => setViewSubscriber(null)} titleId="view-subscriber-title" className="modal-content--sm">
        <h3 className="modal-title" id="view-subscriber-title">Subscriber Details</h3>
        {viewSubscriber && (
          <div className="form-stack">
            <div className="form-group">
              <label className="form-label admin-label--green">Email</label>
              <div style={{ color: 'white', fontSize: '0.95rem' }}>{viewSubscriber.email}</div>
            </div>
            <div className="form-group">
              <label className="form-label admin-label--green">Name</label>
              <div style={{ color: 'white', fontSize: '0.95rem' }}>{viewSubscriber.name || '—'}</div>
            </div>
            <div className="form-group">
              <label className="form-label admin-label--green">Competition</label>
              <div style={{ color: 'white', fontSize: '0.95rem' }}>{viewSubscriber.competition?.title || '—'}</div>
            </div>
            <div className="form-group">
              <label className="form-label admin-label--green">Source</label>
              <div style={{ color: 'white', fontSize: '0.95rem' }}>{viewSubscriber.source}</div>
            </div>
            <div className="form-group">
              <label className="form-label admin-label--green">Status</label>
              <div>
                <span className={viewSubscriber.subscriptionStatus === 'active' ? 'badge-approved' : 'badge-rejected'}>
                  {viewSubscriber.subscriptionStatus}
                </span>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label admin-label--green">Consent</label>
              <div style={{ color: 'white', fontSize: '0.95rem' }}>{viewSubscriber.consentStatus}</div>
            </div>
            <div className="form-group">
              <label className="form-label admin-label--green">Subscribed At</label>
              <div style={{ color: 'white', fontSize: '0.95rem' }}>{new Date(viewSubscriber.consentTimestamp).toLocaleString()}</div>
            </div>
            <div className="form-group">
              <label className="form-label admin-label--green">Created At</label>
              <div style={{ color: 'white', fontSize: '0.95rem' }}>{new Date(viewSubscriber.createdAt).toLocaleString()}</div>
            </div>
            {viewSubscriber.lastEmailSentAt && (
              <div className="form-group">
                <label className="form-label admin-label--green">Last Email Sent</label>
                <div style={{ color: 'white', fontSize: '0.95rem' }}>{new Date(viewSubscriber.lastEmailSentAt).toLocaleString()}</div>
              </div>
            )}
            <div className="modal-actions">
              <button type="button" onClick={() => setViewSubscriber(null)} className="btn btn-secondary$1">Close</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showCampaignModal} onClose={() => setShowCampaignModal(false)} titleId="campaign-title">
        <h3 className="modal-title" id="campaign-title">Send Email Campaign</h3>
        <p style={{ color: 'var(--color-grey-blue)', marginBottom: 16, fontSize: '0.9rem' }}>
          Create a campaign for {selectedIds.size} selected subscriber{selectedIds.size !== 1 ? 's' : ''}.
        </p>
        <form onSubmit={handleSendCampaign} className="form-stack">
          <div className="form-group">
            <label htmlFor="campaign-name" className="form-label admin-label--green">Campaign Name</label>
            <input id="campaign-name" className="admin-input" value={campaignName} onChange={(e) => setCampaignName(e.target.value)} required maxLength={200} placeholder="e.g. August Newsletter" />
          </div>
          <div className="form-group">
            <label htmlFor="campaign-subject" className="form-label admin-label--green">Subject</label>
            <input id="campaign-subject" className="admin-input" value={campaignSubject} onChange={(e) => setCampaignSubject(e.target.value)} required maxLength={200} placeholder="Email subject line" />
          </div>
          <div className="form-group">
            <label htmlFor="campaign-body" className="form-label admin-label--green">Body</label>
            <textarea id="campaign-body" className="admin-input admin-textarea" value={campaignBody} onChange={(e) => setCampaignBody(e.target.value)} required maxLength={10000} placeholder="Write your email content..." rows={6} />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={() => setShowCampaignModal(false)} className="btn btn-secondary$1">Cancel</button>
            <button type="submit" className="btn btn-primary$1" disabled={campaignLoading}>
              {campaignLoading ? 'Creating...' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
