'use client';

import { useState } from 'react';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import EmptyState from '@/components/EmptyState';
import Pagination from '@/components/Pagination';
import { useToast } from '@/components/ToastProvider';

interface Competition {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  status: string;
  slug?: string | null;
  startDate: string;
  endDate: string;
  submissionDeadline: string;
  bannerUrl?: string | null;
  shortDescription?: string | null;
  socialSharingText?: string | null;
  viewCount: number;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { subscribers: number; submissions: number };
}

interface Props {
  initialCompetitions: Competition[];
  initialSubmissions: any[];
  initialWinners: any[];
  initialSubscribers: any[];
}

interface Prize {
  id: string;
  competitionId: string;
  position: number;
  name: string;
  cashAmount: number | null;
  description: string | null;
}

interface Rule {
  id: string;
  competitionId: string;
  minLength: number | null;
  maxLength: number | null;
  originalityRequired: boolean;
  copyrightRequirements: string | null;
  maxSubmissionsPerUser: number;
  eligibilityRequirements: string | null;
  ageRestriction: string | null;
  moderationRequired: boolean;
}

const PAGE_SIZE = 10;

export default function BestLyricsPortalPanel({ initialCompetitions, initialSubmissions, initialWinners, initialSubscribers }: Props) {
  const [competitions, setCompetitions] = useState<Competition[]>(initialCompetitions);
  const [submissions] = useState(initialSubmissions);
  const [winners] = useState(initialWinners);
  const [subscribers] = useState(initialSubscribers);
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'upcoming' | 'completed'>('all');
  const [page, setPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalTab, setModalTab] = useState<'basic' | 'schedule' | 'rules' | 'prizes'>('basic');
  const [fetchingDetails, setFetchingDetails] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('monthly');
  const [status, setStatus] = useState('draft');
  const [slug, setSlug] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [socialSharingText, setSocialSharingText] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [is_active, setIs_active] = useState(false);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [submissionDeadline, setSubmissionDeadline] = useState('');

  const [rules, setRules] = useState<Rule | null>(null);
  const [minLength, setMinLength] = useState('');
  const [maxLength, setMaxLength] = useState('');
  const [originalityRequired, setOriginalityRequired] = useState(true);
  const [copyrightRequirements, setCopyrightRequirements] = useState('');
  const [maxSubmissionsPerUser, setMaxSubmissionsPerUser] = useState(1);
  const [eligibilityRequirements, setEligibilityRequirements] = useState('');
  const [ageRestriction, setAgeRestriction] = useState('');
  const [moderationRequired, setModerationRequired] = useState(true);

  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [prizePosition, setPrizePosition] = useState(1);
  const [prizeName, setPrizeName] = useState('');
  const [prizeCashAmount, setPrizeCashAmount] = useState('');
  const [prizeDescription, setPrizeDescription] = useState('');

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [viewCompetition, setViewCompetition] = useState<Competition | null>(null);

  const loadCompetitions = async () => {
    try {
      const res = await fetch('/api/competitions');
      if (res.ok) {
        const data = await res.json();
        setCompetitions(data.data?.competitions || data.competitions || []);
      }
    } catch {
      // silent
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setType('monthly');
    setStatus('draft');
    setSlug('');
    setShortDescription('');
    setSocialSharingText('');
    setBannerUrl('');
    setIs_active(false);
    setStartDate('');
    setEndDate('');
    setSubmissionDeadline('');
    setRules(null);
    setMinLength('');
    setMaxLength('');
    setOriginalityRequired(true);
    setCopyrightRequirements('');
    setMaxSubmissionsPerUser(1);
    setEligibilityRequirements('');
    setAgeRestriction('');
    setModerationRequired(true);
    setPrizes([]);
    setPrizePosition(1);
    setPrizeName('');
    setPrizeCashAmount('');
    setPrizeDescription('');
    setEditingId(null);
    setModalTab('basic');
    setShowModal(false);
    setFetchingDetails(false);
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = async (competition: Competition) => {
    setEditingId(competition.id);
    setTitle(competition.title);
    setDescription(competition.description || '');
    setType(competition.type);
    setStatus(competition.status);
    setSlug(competition.slug || '');
    setShortDescription(competition.shortDescription || '');
    setSocialSharingText(competition.socialSharingText || '');
    setBannerUrl(competition.bannerUrl || '');
    setIs_active(competition.is_active);
    setStartDate(competition.startDate.slice(0, 16));
    setEndDate(competition.endDate.slice(0, 16));
    setSubmissionDeadline(competition.submissionDeadline.slice(0, 16));
    setModalTab('basic');
    setShowModal(true);

    setFetchingDetails(true);
    try {
      const [rulesRes, prizesRes] = await Promise.all([
        fetch(`/api/competitions/${competition.id}/rules`),
        fetch(`/api/competitions/${competition.id}/prizes`),
      ]);
      if (rulesRes.ok) {
        const rulesData = await rulesRes.json();
        const r = rulesData.data || rulesData;
        setRules(r);
        setMinLength(r.minLength?.toString() || '');
        setMaxLength(r.maxLength?.toString() || '');
        setOriginalityRequired(r.originalityRequired ?? true);
        setCopyrightRequirements(r.copyrightRequirements || '');
        setMaxSubmissionsPerUser(r.maxSubmissionsPerUser || 1);
        setEligibilityRequirements(r.eligibilityRequirements || '');
        setAgeRestriction(r.ageRestriction || '');
        setModerationRequired(r.moderationRequired ?? true);
      }
      if (prizesRes.ok) {
        const prizesData = await prizesRes.json();
        setPrizes(prizesData.data || prizesData || []);
      }
    } catch {
      toast.error('Failed to load competition details');
    }
    setFetchingDetails(false);
  };

  const handleSubmitMain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate || !endDate || !submissionDeadline) return;

    setFormLoading(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        type,
        status,
        slug: slug.trim() || null,
        shortDescription: shortDescription.trim() || null,
        socialSharingText: socialSharingText.trim() || null,
        bannerUrl: bannerUrl.trim() || null,
        is_active: is_active,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        submissionDeadline: new Date(submissionDeadline).toISOString(),
      };

      const url = editingId ? `/api/competitions/${editingId}` : '/api/competitions';
      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(editingId ? 'Competition updated' : 'Competition created');
        if (!editingId) {
          setEditingId(data.data?.id || data.id);
        }
        await loadCompetitions();
      } else {
        toast.error(data.data?.error?.message || data.data?.message || 'Operation failed');
      }
    } catch {
      toast.error('Network error');
    }
    setFormLoading(false);
  };

  const handleSaveRules = async () => {
    if (!editingId) return;
    setFormLoading(true);
    try {
      const payload = {
        minLength: minLength ? parseInt(minLength) : null,
        maxLength: maxLength ? parseInt(maxLength) : null,
        originalityRequired,
        copyrightRequirements: copyrightRequirements.trim() || null,
        maxSubmissionsPerUser: maxSubmissionsPerUser || 1,
        eligibilityRequirements: eligibilityRequirements.trim() || null,
        ageRestriction: ageRestriction.trim() || null,
        moderationRequired,
      };

      const res = await fetch(`/api/competitions/${editingId}/rules`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Rules saved');
        setRules(data.data || data);
      } else {
        toast.error(data.data?.error?.message || data.data?.message || 'Failed to save rules');
      }
    } catch {
      toast.error('Network error');
    }
    setFormLoading(false);
  };

  const handleAddPrize = async () => {
    if (!editingId || !prizeName.trim()) return;
    setFormLoading(true);
    try {
      const payload = {
        position: prizePosition,
        name: prizeName.trim(),
        cashAmount: prizeCashAmount ? parseFloat(prizeCashAmount) : null,
        description: prizeDescription.trim() || null,
      };

      const res = await fetch(`/api/competitions/${editingId}/prizes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Prize added');
        setPrizes([...prizes, data.data || data]);
        setPrizePosition(prizePosition + 1);
        setPrizeName('');
        setPrizeCashAmount('');
        setPrizeDescription('');
      } else {
        toast.error(data.data?.error?.message || data.data?.message || 'Failed to add prize');
      }
    } catch {
      toast.error('Network error');
    }
    setFormLoading(false);
  };

  const handleDeletePrize = async (prizeId: string) => {
    setFormLoading(true);
    try {
      const res = await fetch(`/api/competitions/prizes/${prizeId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Prize removed');
        setPrizes(prizes.filter(p => p.id !== prizeId));
      } else {
        toast.error('Failed to remove prize');
      }
    } catch {
      toast.error('Network error');
    }
    setFormLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/competitions/${deleteId}`, { method: 'DELETE' });
      if (res.ok) {
        setCompetitions(competitions.filter(c => c.id !== deleteId));
        toast.success('Competition deleted');
      } else {
        toast.error('Delete failed');
      }
    } catch {
      toast.error('Network error');
    }
    setDeleteId(null);
    setDeleteLoading(false);
  };

  const now = new Date();
  const filtered = competitions.filter(c => {
    if (filter === 'active') return c.is_active;
    if (filter === 'upcoming') return !c.is_active && new Date(c.startDate) > now;
    if (filter === 'completed') return !c.is_active && new Date(c.endDate) < now;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const activeCount = competitions.filter(c => c.is_active).length;
  const totalSubmissionsCount = competitions.reduce((sum, c) => sum + (c._count?.submissions || 0), 0);
  const totalSubscribersCount = competitions.reduce((sum, c) => sum + (c._count?.subscribers || 0), 0);
  const totalPrizesAwarded = winners.length;

  const getStatusBadge = (competition: Competition) => {
    if (competition.is_active || competition.status === 'published') {
      return <span className="badge-approved">ACTIVE</span>;
    }
    if (competition.status === 'draft') {
      return <span className="badge-pending">DRAFT</span>;
    }
    if (competition.status === 'archived' || new Date(competition.endDate) < now) {
      return <span className="badge-rejected">ARCHIVED</span>;
    }
    return <span className="badge-pending">{competition.status.toUpperCase()}</span>;
  };

  const getPrizePool = (competition: Competition) => {
    const compWinners = winners.filter((w: any) => w.competitionId === competition.id);
    const total = compWinners.reduce((sum: number, w: any) => sum + (w.cashAmount || 0), 0);
    return total > 0 ? `$${total.toLocaleString()}` : 'No prizes';
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 className="panel-title">BEST LYRICS PORTAL</h2>
          <p className="panel-desc">Create and manage monthly and yearly competitions to find the best lyrics in the game.</p>
        </div>
        <button onClick={openCreate} className="btn btn-primary$1">
          + Create New Competition
        </button>
      </div>

      <div className="grid-4" style={{ marginBottom: 32 }}>
        <div className="card">
          <div style={{ color: 'var(--color-grey-blue)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Active Competitions</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'white', marginTop: 8 }}>{activeCount}</div>
        </div>
        <div className="card">
          <div style={{ color: 'var(--color-grey-blue)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total Submissions</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'white', marginTop: 8 }}>{totalSubmissionsCount}</div>
        </div>
        <div className="card">
          <div style={{ color: 'var(--color-grey-blue)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total Subscribers</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'white', marginTop: 8 }}>{totalSubscribersCount}</div>
        </div>
        <div className="card">
          <div style={{ color: 'var(--color-grey-blue)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total Prizes Awarded</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'white', marginTop: 8 }}>{totalPrizesAwarded}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {(['all', 'active', 'upcoming', 'completed'] as const).map(f => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(1); }}
            className={filter === f ? 'btn-admin' : 'btn-outline-cancel'}
            style={filter === f ? {} : { background: 'transparent', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {paginated.length === 0 ? (
        <EmptyState
          icon="🏆"
          title="No competitions found"
          description="Get started by creating your first competition."
          action={{ label: '+ Create New Competition', onClick: openCreate }}
        />
      ) : (
        <div className="form-stack">
          {paginated.map(competition => (
            <div key={competition.id} className="admin-card">
              <div className="admin-card-header">
                <div className="admin-card-body">
                  <div style={{ fontFamily: 'var(--font-condensed)', fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>{competition.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-grey-blue)', marginTop: 4 }}>
                    {competition.type.toUpperCase()} • {new Date(competition.startDate).toLocaleDateString()} - {new Date(competition.endDate).toLocaleDateString()}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-grey-blue)', marginTop: 6 }}>
                    {competition._count?.submissions || 0} submissions • {competition._count?.subscribers || 0} subscribers
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    {getStatusBadge(competition)}
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-grey-blue)' }}>Prize Pool: {getPrizePool(competition)}</span>
                  </div>
                </div>
                <div className="admin-card-actions">
                  <button onClick={() => openEdit(competition)} className="btn btn-primary$1">Edit</button>
                  <button onClick={() => setViewCompetition(competition)} className="btn btn-primary$1">View</button>
                  <button onClick={() => setDeleteId(competition.id)} className="btn-danger btn-xs">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ marginTop: 24 }}>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      {showModal && (
        <Modal isOpen={showModal} onClose={resetForm} titleId="competition-modal-title">
          <h3 className="modal-title" id="competition-modal-title">
            {editingId ? 'Edit Competition' : 'Create Competition'}
          </h3>

          <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 8 }}>
            {(['basic', 'schedule', 'rules', 'prizes'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setModalTab(tab)}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  background: modalTab === tab ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                  color: modalTab === tab ? 'white' : 'var(--color-grey-blue)',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-condensed)',
                  fontSize: '0.85rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {tab === 'basic' ? 'Basic Info' : tab === 'schedule' ? 'Schedule' : tab === 'rules' ? 'Rules' : 'Prizes'}
              </button>
            ))}
          </div>

          {fetchingDetails ? (
            <p className="admin-text-muted">Loading details...</p>
          ) : (
            <form onSubmit={handleSubmitMain} className="form-stack">
              {modalTab === 'basic' && (
                <>
                  <div className="form-group">
                    <label className="form-label admin-label--green">Title</label>
                    <input className="admin-input" value={title} onChange={e => setTitle(e.target.value)} required maxLength={200} placeholder="e.g. Best Bars of August 2026" />
                  </div>
                  <div className="form-group">
                    <label className="form-label admin-label--green">Description</label>
                    <textarea className="admin-input admin-textarea" value={description} onChange={e => setDescription(e.target.value)} maxLength={2000} rows={3} placeholder="Describe the competition..." />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="form-group">
                      <label className="form-label admin-label--green">Type</label>
                      <select className="admin-input" value={type} onChange={e => setType(e.target.value)}>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label admin-label--green">Status</label>
                      <select className="admin-input" value={status} onChange={e => setStatus(e.target.value)}>
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label admin-label--green">Slug</label>
                    <input className="admin-input" value={slug} onChange={e => setSlug(e.target.value)} maxLength={200} placeholder="best-bars-august-2026" />
                  </div>
                  <div className="form-group">
                    <label className="form-label admin-label--green">Short Description</label>
                    <input className="admin-input" value={shortDescription} onChange={e => setShortDescription(e.target.value)} maxLength={500} />
                  </div>
                  <div className="form-group">
                    <label className="form-label admin-label--green">Social Sharing Text</label>
                    <input className="admin-input" value={socialSharingText} onChange={e => setSocialSharingText(e.target.value)} maxLength={280} />
                  </div>
                  <div className="form-group">
                    <label className="form-label admin-label--green">Banner URL</label>
                    <input className="admin-input" value={bannerUrl} onChange={e => setBannerUrl(e.target.value)} maxLength={500} placeholder="https://..." />
                  </div>
                  <div className="form-group">
                    <label className="form-label admin-label--green">Active</label>
                    <select className="admin-input" value={is_active ? 'true' : 'false'} onChange={e => setIs_active(e.target.value === 'true')}>
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </>
              )}

              {modalTab === 'schedule' && (
                <>
                  <div className="form-group">
                    <label className="form-label admin-label--green">Start Date</label>
                    <input type="datetime-local" className="admin-input" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label admin-label--green">End Date</label>
                    <input type="datetime-local" className="admin-input" value={endDate} onChange={e => setEndDate(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label admin-label--green">Submission Deadline</label>
                    <input type="datetime-local" className="admin-input" value={submissionDeadline} onChange={e => setSubmissionDeadline(e.target.value)} required />
                  </div>
                </>
              )}

              {modalTab === 'rules' && (
                <>
                  {!editingId ? (
                    <p className="admin-text-muted">Save the competition first to configure rules.</p>
                  ) : (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div className="form-group">
                          <label className="form-label admin-label--green">Min Length</label>
                          <input type="number" className="admin-input" value={minLength} onChange={e => setMinLength(e.target.value)} min={0} />
                        </div>
                        <div className="form-group">
                          <label className="form-label admin-label--green">Max Length</label>
                          <input type="number" className="admin-input" value={maxLength} onChange={e => setMaxLength(e.target.value)} min={0} />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label admin-label--green">Max Submissions Per User</label>
                        <input type="number" className="admin-input" value={maxSubmissionsPerUser} onChange={e => setMaxSubmissionsPerUser(parseInt(e.target.value) || 1)} min={1} />
                      </div>
                      <div className="form-group">
                        <label className="form-label admin-label--green">Age Restriction</label>
                        <input className="admin-input" value={ageRestriction} onChange={e => setAgeRestriction(e.target.value)} maxLength={50} placeholder="e.g. 13+" />
                      </div>
                      <div className="form-group">
                        <label className="form-label admin-label--green">Copyright Requirements</label>
                        <textarea className="admin-input admin-textarea" value={copyrightRequirements} onChange={e => setCopyrightRequirements(e.target.value)} maxLength={1000} rows={2} />
                      </div>
                      <div className="form-group">
                        <label className="form-label admin-label--green">Eligibility Requirements</label>
                        <textarea className="admin-input admin-textarea" value={eligibilityRequirements} onChange={e => setEligibilityRequirements(e.target.value)} maxLength={1000} rows={2} />
                      </div>
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'white', cursor: 'pointer' }}>
                          <input type="checkbox" checked={originalityRequired} onChange={e => setOriginalityRequired(e.target.checked)} />
                          Originality Required
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'white', cursor: 'pointer' }}>
                          <input type="checkbox" checked={moderationRequired} onChange={e => setModerationRequired(e.target.checked)} />
                          Moderation Required
                        </label>
                      </div>
                      <button type="button" onClick={handleSaveRules} className="btn btn-primary$1" disabled={formLoading}>
                        {formLoading ? 'Saving...' : 'Save Rules'}
                      </button>
                    </>
                  )}
                </>
              )}

              {modalTab === 'prizes' && (
                <>
                  {!editingId ? (
                    <p className="admin-text-muted">Save the competition first to add prizes.</p>
                  ) : (
                    <>
                      <div className="form-stack" style={{ marginBottom: 16 }}>
                        {prizes.length === 0 ? (
                          <p className="admin-text-muted">No prizes yet. Add one below.</p>
                        ) : (
                          prizes.map(prize => (
                            <div key={prize.id} className="admin-card admin-card--compact">
                              <div className="admin-card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                                <div>
                                  <div style={{ color: 'white', fontWeight: 600 }}>#{prize.position} {prize.name}</div>
                                  <div style={{ fontSize: '0.8rem', color: 'var(--color-grey-blue)' }}>
                                    {prize.cashAmount ? `$${prize.cashAmount.toLocaleString()}` : 'No cash'} • {prize.description || 'No description'}
                                  </div>
                                </div>
                                <button type="button" onClick={() => handleDeletePrize(prize.id)} className="btn-danger btn-xs" style={{ padding: '4px 10px' }}>Remove</button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div className="form-group">
                          <label className="form-label admin-label--green">Position</label>
                          <input type="number" className="admin-input" value={prizePosition} onChange={e => setPrizePosition(parseInt(e.target.value) || 1)} min={1} />
                        </div>
                        <div className="form-group">
                          <label className="form-label admin-label--green">Prize Name</label>
                          <input className="admin-input" value={prizeName} onChange={e => setPrizeName(e.target.value)} required maxLength={200} />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label admin-label--green">Cash Amount</label>
                        <input type="number" className="admin-input" value={prizeCashAmount} onChange={e => setPrizeCashAmount(e.target.value)} min={0} step={0.01} />
                      </div>
                      <div className="form-group">
                        <label className="form-label admin-label--green">Description</label>
                        <input className="admin-input" value={prizeDescription} onChange={e => setPrizeDescription(e.target.value)} maxLength={500} />
                      </div>
                      <button type="button" onClick={handleAddPrize} className="btn btn-primary$1" disabled={formLoading || !prizeName.trim()}>
                        Add Prize
                      </button>
                    </>
                  )}
                </>
              )}

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="submit" className="btn btn-primary$1" disabled={formLoading}>
                  {formLoading ? 'Saving...' : editingId ? 'Save Changes' : 'Create Competition'}
                </button>
                <button type="button" onClick={resetForm} className="btn btn-secondary$1">Cancel</button>
              </div>
            </form>
          )}
        </Modal>
      )}

      {viewCompetition && (
        <Modal isOpen={!!viewCompetition} onClose={() => setViewCompetition(null)} titleId="view-competition-title">
          <h3 className="modal-title" id="view-competition-title">{viewCompetition.title}</h3>
          <div className="form-stack">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ color: 'var(--color-grey-blue)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Type</div>
                <div style={{ color: 'white', marginTop: 4 }}>{viewCompetition.type}</div>
              </div>
              <div>
                <div style={{ color: 'var(--color-grey-blue)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Status</div>
                <div style={{ marginTop: 4 }}>{getStatusBadge(viewCompetition)}</div>
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--color-grey-blue)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Description</div>
              <div style={{ color: 'white', marginTop: 4 }}>{viewCompetition.description || 'No description'}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ color: 'var(--color-grey-blue)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Start Date</div>
                <div style={{ color: 'white', marginTop: 4 }}>{new Date(viewCompetition.startDate).toLocaleDateString()}</div>
              </div>
              <div>
                <div style={{ color: 'var(--color-grey-blue)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>End Date</div>
                <div style={{ color: 'white', marginTop: 4 }}>{new Date(viewCompetition.endDate).toLocaleDateString()}</div>
              </div>
              <div>
                <div style={{ color: 'var(--color-grey-blue)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Submission Deadline</div>
                <div style={{ color: 'white', marginTop: 4 }}>{new Date(viewCompetition.submissionDeadline).toLocaleDateString()}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ color: 'var(--color-grey-blue)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Submissions</div>
                <div style={{ color: 'white', marginTop: 4 }}>{viewCompetition._count?.submissions || 0}</div>
              </div>
              <div>
                <div style={{ color: 'var(--color-grey-blue)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Subscribers</div>
                <div style={{ color: 'white', marginTop: 4 }}>{viewCompetition._count?.subscribers || 0}</div>
              </div>
              <div>
                <div style={{ color: 'var(--color-grey-blue)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Prize Pool</div>
                <div style={{ color: 'white', marginTop: 4 }}>{getPrizePool(viewCompetition)}</div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button onClick={() => setViewCompetition(null)} className="btn btn-secondary$1">Close</button>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Delete Competition?"
        message="This will permanently delete the competition and all associated data. This cannot be undone."
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        variant="danger"
        disabled={deleteLoading}
      />
    </div>
  );
}
