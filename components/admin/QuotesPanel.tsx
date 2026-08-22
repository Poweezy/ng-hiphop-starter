'use client';

import { useState } from 'react';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/components/ToastProvider';
import { patchDisplayUntil } from '@/lib/adminHooks';
import Pagination from '@/components/Pagination';

const PAGE_SIZE = 20;

interface Quote { id: string; quote_text: string; submitted_by: string; approved: boolean; is_featured: boolean; display_until: string | null; createdAt: string; }
interface Props { initialQuotes: Quote[]; }

export default function QuotesPanel({ initialQuotes }: Props) {
    const [quotes, setQuotes] = useState<Quote[]>(initialQuotes);
    const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; action: () => void; title: string; message: string }>({ 
        isOpen: false, 
        action: () => {}, 
        title: '', 
        message: '' 
    });
    const toast = useToast();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved'>('all');
    const [pendingPage, setPendingPage] = useState(1);
    const [approvedPage, setApprovedPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [batchLoading, setBatchLoading] = useState(false);

    const handlePatch = async (id: string, patch: Partial<Quote>) => {
        const res = await fetch('/api/quotes', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...patch }),
        });
        if (res.ok) {
            const json = await res.json();
            const updated = json.data;
            setQuotes(quotes.map(q => {
                if (patch.is_featured) return q.id === id ? { ...q, ...updated } : { ...q, is_featured: false };
                return q.id === id ? { ...q, ...updated } : q;
            }));
            if (patch.approved) toast.success('Quote approved!');
            else if (patch.is_featured) toast.success('Quote featured!');
            else toast.info('Quote updated');
        }
    };

    const handleDisplayUntil = async (id: string, date: string) => {
        try {
            const updated = await patchDisplayUntil('quotes', id, date || null);
            setQuotes(quotes.map(q => q.id === id ? { ...q, ...updated } : q));
            toast.success('Display schedule updated');
        } catch (err: any) {
            toast.error(err.message || 'Update failed');
        }
    };

    const handleDelete = async (id: string) => {
        const res = await fetch(`/api/quotes/${id}`, { method: 'DELETE' });
        if (res.ok) {
            setQuotes(quotes.filter(q => q.id !== id));
            toast.success('Quote deleted');
        } else {
            toast.error('Delete failed');
        }
        setConfirmDialog({ isOpen: false, action: () => {}, title: '', message: '' });
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = (ids: string[]) => {
        const allSelected = ids.every(id => selectedIds.has(id));
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (allSelected) {
                ids.forEach(id => next.delete(id));
            } else {
                ids.forEach(id => next.add(id));
            }
            return next;
        });
    };

    const batchApprove = async () => {
        setBatchLoading(true);
        try {
            const results = await Promise.allSettled(Array.from(selectedIds).map(id =>
                fetch('/api/quotes', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, approved: true }),
                })
            ));
            const succeeded = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;
            setQuotes(quotes.map(q => selectedIds.has(q.id) ? { ...q, approved: true } : q));
            setSelectedIds(new Set());
            if (failed === 0) {
                toast.success(`${succeeded} quotes approved`);
            } else {
                toast.warning(`${succeeded} approved, ${failed} failed`);
            }
        } catch {
            toast.error('Batch approve failed');
        }
        setBatchLoading(false);
    };

    const batchReject = async () => {
        setBatchLoading(true);
        try {
            const results = await Promise.allSettled(Array.from(selectedIds).map(id =>
                fetch('/api/quotes', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, approved: false, is_featured: false }),
                })
            ));
            const succeeded = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;
            setQuotes(quotes.map(q => selectedIds.has(q.id) ? { ...q, approved: false, is_featured: false } : q));
            setSelectedIds(new Set());
            if (failed === 0) {
                toast.success(`${succeeded} quotes rejected`);
            } else {
                toast.warning(`${succeeded} rejected, ${failed} failed`);
            }
        } catch {
            toast.error('Batch reject failed');
        }
        setBatchLoading(false);
    };

    const batchDelete = async () => {
        setBatchLoading(true);
        try {
            const results = await Promise.allSettled(Array.from(selectedIds).map(id =>
                fetch(`/api/quotes/${id}`, { method: 'DELETE' })
            ));
            const succeeded = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;
            setQuotes(quotes.filter(q => !selectedIds.has(q.id)));
            setSelectedIds(new Set());
            if (failed === 0) {
                toast.success(`${succeeded} quotes deleted`);
            } else {
                toast.warning(`${succeeded} deleted, ${failed} failed`);
            }
        } catch {
            toast.error('Batch delete failed');
        }
        setBatchLoading(false);
    };

    const confirmDelete = (id: string, quoteName: string) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Delete Quote',
            message: `Are you sure you want to delete the quote by "${quoteName}"? This action cannot be undone.`,
            action: () => handleDelete(id),
        });
    };

    const pending = quotes.filter(q => !q.approved);
    const approved = quotes.filter(q => q.approved);

    const filteredPending = pending.filter(q => q.quote_text.toLowerCase().includes(search.toLowerCase()) || q.submitted_by.toLowerCase().includes(search.toLowerCase()));
    const filteredApproved = approved.filter(q => q.quote_text.toLowerCase().includes(search.toLowerCase()) || q.submitted_by.toLowerCase().includes(search.toLowerCase()));

    const pendingTotalPages = Math.max(1, Math.ceil(filteredPending.length / PAGE_SIZE));
    const approvedTotalPages = Math.max(1, Math.ceil(filteredApproved.length / PAGE_SIZE));

    const paginatedPending = filteredPending.slice((pendingPage - 1) * PAGE_SIZE, pendingPage * PAGE_SIZE);
    const paginatedApproved = filteredApproved.slice((approvedPage - 1) * PAGE_SIZE, approvedPage * PAGE_SIZE);

    const renderQuote = (q: Quote) => (
        <div
            key={q.id}
            className={`admin-card ${q.is_featured ? 'admin-card--featured' : ''} ${selectedIds.has(q.id) ? 'admin-card--selected' : ''}`}
        >
            <div className="admin-card-header">
                <div className="admin-card-body">
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <input
                            type="checkbox"
                            checked={selectedIds.has(q.id)}
                            onChange={() => toggleSelect(q.id)}
                            style={{ width: 16, height: 16, accentColor: 'var(--color-purple)' }}
                            aria-label={`Select quote by ${q.submitted_by}`}
                        />
                    </label>
                    <p className="admin-text-quote">"{q.quote_text}"</p>
                    <p className="admin-text-artist">— {q.submitted_by}</p>
                    {q.is_featured && <span className="badge-approved badge-approved--inline badge-approved--mt">FEATURED</span>}
                </div>
                <div className="admin-card-actions">
                    {!q.approved && (
                        <button onClick={() => handlePatch(q.id, { approved: true })} className="btn-admin btn-md">✓ Approve</button>
                    )}
                    {q.approved && !q.is_featured && (
                        <button onClick={() => handlePatch(q.id, { is_featured: true })} className="btn-admin btn-md">⭐ Feature</button>
                    )}
                    {q.approved && (
                        <>
                            <button onClick={() => handlePatch(q.id, { approved: false, is_featured: false })} className="btn-danger btn-md">✗ Reject</button>
                            <button onClick={() => confirmDelete(q.id, q.submitted_by)} className="btn-danger btn-md">🗑️ Delete</button>
                        </>
                    )}
                </div>
            </div>
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--color-grey-blue)', fontFamily: 'var(--font-condensed)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Display Until:
                </label>
                <input
                    type="datetime-local"
                    className="admin-input"
                    style={{ width: 'auto', padding: '6px 10px', fontSize: '0.8rem' }}
                    value={q.display_until ? q.display_until.slice(0, 16) : ''}
                    onChange={e => handleDisplayUntil(q.id, e.target.value ? new Date(e.target.value).toISOString() : '')}
                />
                {q.display_until && (
                    <button onClick={() => handleDisplayUntil(q.id, '')} className="btn-danger btn-xs">Clear</button>
                )}
            </div>
        </div>
    );

    return (
        <div>
            <h2 className="panel-title">QUOTE MODERATION</h2>
            <p className="panel-desc">Approve fan-submitted quotes and feature one on the homepage.</p>

            <div className="form-stack glass-panel glass-panel--padded" style={{ marginBottom: 24 }}>
                <div className="panel-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="form-group">
                        <label htmlFor="quote-search" className="form-label admin-label--green">Search</label>
                        <input
                            id="quote-search"
                            type="text"
                            className="admin-input"
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPendingPage(1); setApprovedPage(1); }}
                            placeholder="Search quotes or authors..."
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="quote-status" className="form-label admin-label--green">Status</label>
                        <select
                            id="quote-status"
                            className="admin-input"
                            value={statusFilter}
                            onChange={e => { setStatusFilter(e.target.value as any); setPendingPage(1); setApprovedPage(1); }}
                        >
                            <option value="all">All</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="panel-grid">
                <div>
                    <h3 className="admin-section-title">Pending Approval ({filteredPending.length})</h3>
                    {selectedIds.size > 0 && (
                        <div className="batch-actions" style={{ marginBottom: 16 }}>
                            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>{selectedIds.size} selected</span>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={batchApprove} className="btn-admin btn-sm" disabled={batchLoading}>✓ Approve Selected</button>
                                <button onClick={batchReject} className="btn-danger btn-sm" disabled={batchLoading}>✗ Reject Selected</button>
                                <button onClick={batchDelete} className="btn-danger btn-sm" disabled={batchLoading}>🗑️ Delete Selected</button>
                                <button onClick={() => setSelectedIds(new Set())} className="btn-outline-cancel btn-sm">Cancel</button>
                            </div>
                        </div>
                    )}
                    {(statusFilter === 'all' || statusFilter === 'pending') ? (
                        filteredPending.length === 0 ? <p className="admin-text-muted">No pending quotes.</p> : (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                    <input
                                        type="checkbox"
                                        checked={filteredPending.length > 0 && filteredPending.every(q => selectedIds.has(q.id))}
                                        onChange={() => toggleSelectAll(filteredPending.map(q => q.id))}
                                        style={{ width: 16, height: 16, accentColor: 'var(--color-purple)' }}
                                        aria-label="Select all pending quotes"
                                    />
                                    <span style={{ fontSize: '0.8rem', color: 'var(--color-grey-blue)' }}>Select all pending</span>
                                </div>
                                {paginatedPending.map(q => renderQuote(q))}
                                <Pagination currentPage={pendingPage} totalPages={pendingTotalPages} onPageChange={setPendingPage} />
                            </>
                        )
                    ) : null}
                </div>
                <div>
                    <h3 className="admin-section-title admin-section-title--green">Approved ({filteredApproved.length})</h3>
                    {(statusFilter === 'all' || statusFilter === 'approved') ? (
                        filteredApproved.length === 0 ? <p className="admin-text-muted">No approved quotes.</p> : (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                    <input
                                        type="checkbox"
                                        checked={filteredApproved.length > 0 && filteredApproved.every(q => selectedIds.has(q.id))}
                                        onChange={() => toggleSelectAll(filteredApproved.map(q => q.id))}
                                        style={{ width: 16, height: 16, accentColor: 'var(--color-purple)' }}
                                        aria-label="Select all approved quotes"
                                    />
                                    <span style={{ fontSize: '0.8rem', color: 'var(--color-grey-blue)' }}>Select all approved</span>
                                </div>
                                {paginatedApproved.map(q => renderQuote(q))}
                                <Pagination currentPage={approvedPage} totalPages={approvedTotalPages} onPageChange={setApprovedPage} />
                            </>
                        )
                    ) : null}
                </div>
            </div>
            
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title={confirmDialog.title}
                message={confirmDialog.message}
                confirmText="Delete"
                onConfirm={confirmDialog.action}
                onCancel={() => setConfirmDialog({ isOpen: false, action: () => {}, title: '', message: '' })}
                variant="danger"
            />
        </div>
    );
}
