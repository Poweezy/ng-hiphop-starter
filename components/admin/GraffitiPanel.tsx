'use client';

import { useState } from 'react';
import Image from 'next/image';
import ConfirmDialog from '../ConfirmDialog';
import { patchDisplayUntil } from '@/lib/adminHooks';

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
                const created = await res.json();
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
            const updated = await res.json();
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

    const pending = items.filter(g => !g.approved);
    const approved = items.filter(g => g.approved);

    const renderCard = (g: Graffiti, showApprove: boolean) => (
        <div key={g.id} className={`admin-card admin-card--overflow-hidden ${g.approved ? 'admin-card--featured' : ''}`}>
            <div className="admin-card-media">
                <Image src={g.image_url} alt={`Graffiti by ${g.artist_name}`} fill style={{ objectFit: 'cover' }} sizes="200px" />
                {g.approved && (
                    <div className="admin-card-badge">
                        <span className="badge-approved">LIVE</span>
                    </div>
                )}
            </div>
            <div className="admin-card-body">
                <p className="admin-artist-name">{g.artist_name}</p>
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
                            <div className={`status-message status-message--${status}`}>{msg}</div>
                        )}
                    </form>
                </div>

                <div>
                    <h3 className="admin-section-title">Pending ({pending.length})</h3>
                    {pending.length === 0 ? (
                        <p className="admin-text-muted">No pending graffiti.</p>
                    ) : (
                        <div className="admin-grid-gallery">
                            {pending.map(g => renderCard(g, true))}
                        </div>
                    )}

                    <h3 className="admin-section-title admin-section-title--green admin-section-title--spaced">Live on Site ({approved.length})</h3>
                    {approved.length === 0 ? (
                        <p className="admin-text-muted">No approved graffiti yet.</p>
                    ) : (
                        <div className="admin-grid-gallery">
                            {approved.map(g => renderCard(g, false))}
                        </div>
                    )}
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
