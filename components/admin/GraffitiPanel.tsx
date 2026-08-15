'use client';

import { useState } from 'react';
import Image from 'next/image';
import ConfirmDialog from '../ConfirmDialog';
import { patchDisplayUntil } from '@/lib/adminHooks';
import Pagination from '@/components/Pagination';

const PAGE_SIZE = 20;

interface Graffiti { id: string; image_url: string; artist_name: string; approved: boolean; display_until: string | null; createdAt: string; }
interface Props { initialGraffiti: Graffiti[]; }

export default function GraffitiPanel({ initialGraffiti }: Props) {
    const [items, setItems] = useState<Graffiti[]>(initialGraffiti);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [artistName, setArtistName] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [msg, setMsg] = useState('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved'>('all');
    const [pendingPage, setPendingPage] = useState(1);
    const [approvedPage, setApprovedPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [batchLoading, setBatchLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !artistName.trim()) return;
        setUploading(true);
        try {
            // Optimize image server-side
            const formData = new FormData();
            formData.append('image', file);
            formData.append('folder', 'graffiti');

            const optimizeRes = await fetch('/api/uploads/optimize', { method: 'POST', body: formData });
            if (!optimizeRes.ok) {
                const err = await optimizeRes.json().catch(() => ({}));
                setStatus('error'); setMsg((err as { message?: string }).message || 'Cover optimization failed');
                setUploading(false);
                return;
            }
            const { url: imageUrl } = await optimizeRes.json();

            // Create graffiti submission via JSON
            const res = await fetch('/api/graffiti', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageUrl, artistName: artistName.trim() }),
                credentials: 'include',
            });

            if (res.ok) {
                const json = await res.json();
                const created = json.data;
                setItems([created, ...items]);
                setArtistName('');
                setFile(null);
                setStatus('success'); setMsg('Artwork submitted for approval!');
            } else {
                const err = await res.json().catch(() => ({}));
                setStatus('error'); setMsg((err as { message?: string }).message || 'Upload failed');
            }
        } catch {
            setStatus('error'); setMsg('Upload failed. Please try again.');
        }
        setUploading(false);
        setTimeout(() => setStatus('idle'), 4000);
    };

    const handlePatch = async (id: string, patch: Partial<Graffiti>) => {
        const res = await fetch('/api/graffiti', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...patch }),
        });
        if (res.ok) {
            const json = await res.json();
            const updated = json.data;
            setItems(items.map(g => g.id === id ? { ...g, ...updated } : g));
        } else {
            setStatus('error'); setMsg('Update failed');
        }
    };

    const handleDisplayUntil = async (id: string, date: string) => {
        try {
            const updated = await patchDisplayUntil('graffiti', id, date || null);
            setItems(items.map(g => g.id === id ? { ...g, ...updated } : g));
            setStatus('success'); setMsg('Display schedule updated');
        } catch (err: any) {
            setStatus('error'); setMsg(err.message || 'Update failed');
        }
        setTimeout(() => setStatus('idle'), 3000);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        const res = await fetch(`/api/graffiti/${deleteId}`, { method: 'DELETE' });
        if (res.ok) setItems(items.filter(g => g.id !== deleteId));
        else { setStatus('error'); setMsg('Delete failed'); }
        setDeleteId(null);
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
                fetch('/api/graffiti', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, approved: true }),
                })
            ));
            const succeeded = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;
            setItems(items.map(g => selectedIds.has(g.id) ? { ...g, approved: true } : g));
            setSelectedIds(new Set());
            if (failed === 0) {
                setStatus('success'); setMsg(`${succeeded} items approved`);
            } else {
                setStatus('error'); setMsg(`${succeeded} approved, ${failed} failed`);
            }
        } catch {
            setStatus('error'); setMsg('Batch approve failed');
        }
        setBatchLoading(false);
        setTimeout(() => setStatus('idle'), 3000);
    };

    const batchRemove = async () => {
        setBatchLoading(true);
        try {
            const results = await Promise.allSettled(Array.from(selectedIds).map(id =>
                fetch('/api/graffiti', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, approved: false }),
                })
            ));
            const succeeded = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;
            setItems(items.map(g => selectedIds.has(g.id) ? { ...g, approved: false } : g));
            setSelectedIds(new Set());
            if (failed === 0) {
                setStatus('success'); setMsg(`${succeeded} items removed`);
            } else {
                setStatus('error'); setMsg(`${succeeded} removed, ${failed} failed`);
            }
        } catch {
            setStatus('error'); setMsg('Batch remove failed');
        }
        setBatchLoading(false);
        setTimeout(() => setStatus('idle'), 3000);
    };

    const pending = items.filter(g => !g.approved);
    const approved = items.filter(g => g.approved);

    const filteredPending = pending.filter(g => g.artist_name.toLowerCase().includes(search.toLowerCase()));
    const filteredApproved = approved.filter(g => g.artist_name.toLowerCase().includes(search.toLowerCase()));

    const pendingTotalPages = Math.max(1, Math.ceil(filteredPending.length / PAGE_SIZE));
    const approvedTotalPages = Math.max(1, Math.ceil(filteredApproved.length / PAGE_SIZE));

    const paginatedPending = filteredPending.slice((pendingPage - 1) * PAGE_SIZE, pendingPage * PAGE_SIZE);
    const paginatedApproved = filteredApproved.slice((approvedPage - 1) * PAGE_SIZE, approvedPage * PAGE_SIZE);

    const renderCard = (g: Graffiti, showApprove: boolean) => (
        <div key={g.id} className={`admin-card admin-card--overflow-hidden ${g.approved ? 'admin-card--featured' : ''} ${selectedIds.has(g.id) ? 'admin-card--selected' : ''}`}>
            <div className="admin-card-media">
                <Image src={g.image_url} alt={`Graffiti by ${g.artist_name}`} fill style={{ objectFit: 'cover' }} sizes="200px" />
                {g.approved && (
                    <div className="admin-card-badge">
                        <span className="badge-approved">LIVE</span>
                    </div>
                )}
            </div>
            <div className="admin-card-body">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <input
                        type="checkbox"
                        checked={selectedIds.has(g.id)}
                        onChange={() => toggleSelect(g.id)}
                        style={{ width: 16, height: 16, accentColor: 'var(--color-purple)' }}
                    />
                    <p className="admin-artist-name" style={{ margin: 0 }}>{g.artist_name}</p>
                </label>
                <div className="admin-card-actions">
                    {showApprove && <button onClick={() => handlePatch(g.id, { approved: true })} className="btn-admin btn-sm">✓ Approve</button>}
                    {g.approved && <button onClick={() => handlePatch(g.id, { approved: false })} className="btn-danger btn-sm">✗ Remove</button>}
                    <button onClick={() => setDeleteId(g.id)} className="btn-danger btn-sm">Delete</button>
                </div>
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <label style={{ fontSize: '0.7rem', color: 'var(--color-grey-blue)', fontFamily: 'var(--font-condensed)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        Until:
                    </label>
                    <input
                        type="datetime-local"
                        className="admin-input"
                        style={{ width: 'auto', padding: '4px 8px', fontSize: '0.75rem' }}
                        value={g.display_until ? g.display_until.slice(0, 16) : ''}
                        onChange={e => handleDisplayUntil(g.id, e.target.value ? new Date(e.target.value).toISOString() : '')}
                    />
                    {g.display_until && (
                        <button onClick={() => handleDisplayUntil(g.id, '')} className="btn-danger btn-xs" style={{ padding: '3px 8px', fontSize: '0.7rem' }}>Clear</button>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div>
            <h2 className="panel-title">GRAFFITI WALL</h2>
            <p className="panel-desc">Review and approve fan-submitted graffiti artwork.</p>

            <div className="form-stack glass-panel glass-panel--padded" style={{ marginBottom: 24 }}>
                <div className="panel-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="form-group">
                        <label htmlFor="graffiti-search" className="form-label admin-label--green">Search Artist</label>
                        <input
                            id="graffiti-search"
                            type="text"
                            className="admin-input"
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPendingPage(1); setApprovedPage(1); }}
                            placeholder="Search by artist name..."
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="graffiti-status" className="form-label admin-label--green">Status</label>
                        <select
                            id="graffiti-status"
                            className="admin-input"
                            value={statusFilter}
                            onChange={e => { setStatusFilter(e.target.value as any); setPendingPage(1); setApprovedPage(1); }}
                        >
                            <option value="all">All</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Live</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="panel-grid">
                <div className="form-stack glass-panel">
                    <h3 className="admin-section-title">Submit New Artwork</h3>
                    <form onSubmit={handleSubmit} className="form-stack">
                        <div className="form-group">
                            <label htmlFor="artist-name" className="form-label admin-label--green">Artist Name *</label>
                            <input
                                id="artist-name"
                                type="text"
                                className="admin-input"
                                value={artistName}
                                onChange={(e) => setArtistName(e.target.value)}
                                placeholder="Your artist name"
                                maxLength={60}
                                required
                                disabled={uploading}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="graffiti-file" className="form-label admin-label--green">Image * (JPG/PNG/WEBP, max 5MB)</label>
                            <input
                                id="graffiti-file"
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                required
                                className="admin-input admin-file-input"
                                disabled={uploading}
                                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                            />
                        </div>
                        <button type="submit" className="btn-admin" disabled={uploading || !file || !artistName.trim()}>
                            {uploading ? '⏳ Uploading...' : '🎨 Submit Artwork'}
                        </button>
                        {status !== 'idle' && (
                            <div role="status" aria-live="polite" className={`status-message status-message--${status}`}>{msg}</div>
                        )}
                    </form>
                </div>

                <div>
                    <h3 className="admin-section-title">Pending ({filteredPending.length})</h3>
                    {selectedIds.size > 0 && (
                        <div className="batch-actions" style={{ marginBottom: 16 }}>
                            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>{selectedIds.size} selected</span>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={batchApprove} className="btn-admin btn-sm" disabled={batchLoading}>✓ Approve Selected</button>
                                <button onClick={() => { setSelectedIds(new Set()); }} className="btn-outline-cancel btn-sm">Cancel</button>
                            </div>
                        </div>
                    )}
                    {(statusFilter === 'all' || statusFilter === 'pending') ? (
                        filteredPending.length === 0 ? (
                            <p className="admin-text-muted">No pending graffiti.</p>
                        ) : (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                    <input
                                        type="checkbox"
                                        checked={filteredPending.length > 0 && filteredPending.every(g => selectedIds.has(g.id))}
                                        onChange={() => toggleSelectAll(filteredPending.map(g => g.id))}
                                        style={{ width: 16, height: 16, accentColor: 'var(--color-purple)' }}
                                    />
                                    <span style={{ fontSize: '0.8rem', color: 'var(--color-grey-blue)' }}>Select all pending</span>
                                </div>
                                <div className="admin-grid-gallery">
                                    {paginatedPending.map(g => renderCard(g, true))}
                                </div>
                                <Pagination currentPage={pendingPage} totalPages={pendingTotalPages} onPageChange={setPendingPage} />
                            </>
                        )
                    ) : null}

                    <h3 className="admin-section-title admin-section-title--green admin-section-title--spaced">Live on Site ({filteredApproved.length})</h3>
                    {(statusFilter === 'all' || statusFilter === 'approved') ? (
                        filteredApproved.length === 0 ? (
                            <p className="admin-text-muted">No approved graffiti yet.</p>
                        ) : (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                    <input
                                        type="checkbox"
                                        checked={filteredApproved.length > 0 && filteredApproved.every(g => selectedIds.has(g.id))}
                                        onChange={() => toggleSelectAll(filteredApproved.map(g => g.id))}
                                        style={{ width: 16, height: 16, accentColor: 'var(--color-purple)' }}
                                    />
                                    <span style={{ fontSize: '0.8rem', color: 'var(--color-grey-blue)' }}>Select all live</span>
                                </div>
                                <div className="admin-grid-gallery">
                                    {paginatedApproved.map(g => renderCard(g, false))}
                                </div>
                                <Pagination currentPage={approvedPage} totalPages={approvedTotalPages} onPageChange={setApprovedPage} />
                            </>
                        )
                    ) : null}
                </div>
            </div>

            <ConfirmDialog
                isOpen={!!deleteId}
                title="Delete Graffiti?"
                message="This will permanently delete the graffiti image. This cannot be undone."
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
            />
        </div>
    );
}
