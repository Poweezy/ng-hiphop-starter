'use client';

import { useState } from 'react';
import Image from 'next/image';
import ConfirmDialog from '../ConfirmDialog';

interface Graffiti { id: string; image_url: string; artist_name: string; approved: boolean; display_until: string | null; createdAt: string; }
interface Props { initialGraffiti: Graffiti[]; }

export default function GraffitiPanel({ initialGraffiti }: Props) {
    const [items, setItems] = useState<Graffiti[]>(initialGraffiti);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [artistName, setArtistName] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

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
                const err = await optimizeRes.json();
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
                setItems([await res.json(), ...items]);
                setArtistName('');
                setFile(null);
            }
        } catch {
            // Handle error
        }
        setUploading(false);
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
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        const res = await fetch('/api/graffiti', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: deleteId }) });
        if (res.ok) setItems(items.filter(g => g.id !== deleteId));
        setDeleteId(null);
    };

    const pending = items.filter(g => !g.approved);
    const approved = items.filter(g => g.approved);

    const renderCard = (g: Graffiti, showApprove: boolean) => (
        <div key={g.id} className={`admin-card ${g.approved ? 'admin-card--featured' : ''}`} style={{ overflow: 'hidden' }}>
            <div style={{ position: 'relative', aspectRatio: '4/3' }}>
                <Image src={g.image_url} alt={`Graffiti by ${g.artist_name}`} fill style={{ objectFit: 'cover' }} sizes="200px" />
                {g.approved && (
                    <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
                        <span className="badge-approved">LIVE</span>
                    </div>
                )}
            </div>
            <div style={{ padding: '12px' }}>
                <p style={{ fontFamily: 'var(--font-cursive)', fontSize: '1rem', color: 'var(--color-yellow)', marginBottom: '10px' }}>{g.artist_name}</p>
                <div className="admin-card-actions">
                    {showApprove && <button onClick={() => handlePatch(g.id, { approved: true })} className="btn-admin" style={{ fontSize: '0.75rem', padding: '6px 12px' }}>✓ Approve</button>}
                    {g.approved && <button onClick={() => handlePatch(g.id, { approved: false })} className="btn-danger" style={{ fontSize: '0.75rem', padding: '6px 12px' }}>✗ Remove</button>}
                    <button onClick={() => setDeleteId(g.id)} className="btn-danger" style={{ fontSize: '0.75rem', padding: '6px 12px' }}>Delete</button>
                </div>
            </div>
        </div>
    );

    return (
        <div>
            <h2 className="panel-title">GRAFFITI WALL</h2>
            <p className="panel-desc">Review and approve fan-submitted graffiti artwork.</p>

            <div className="panel-grid">
                <div className="glass-panel" style={{ padding: '24px' }}>
                    <h3 className="admin-section-title">Submit New Artwork</h3>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div className="form-group">
                            <label htmlFor="artist-name" className="form-label" style={{ color: 'var(--color-green-light)' }}>Artist Name *</label>
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
                            <label htmlFor="graffiti-file" className="form-label" style={{ color: 'var(--color-green-light)' }}>Image * (JPG/PNG/WEBP, max 5MB)</label>
                            <input
                                id="graffiti-file"
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                required
                                className="admin-input"
                                disabled={uploading}
                                style={{ padding: '8px' }}
                                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                            />
                        </div>
                        <button type="submit" className="btn-admin" disabled={uploading || !file || !artistName.trim()}>
                            {uploading ? '⏳ Uploading...' : '🎨 Submit Artwork'}
                        </button>
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

                    <h3 className="admin-section-title admin-section-title--green" style={{ marginTop: '24px' }}>Live on Site ({approved.length})</h3>
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
