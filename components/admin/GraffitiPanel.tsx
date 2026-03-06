'use client';

import { useState } from 'react';
import Image from 'next/image';
import ConfirmDialog from '../ConfirmDialog';

interface Graffiti { id: string; image_url: string; artist_name: string; approved: boolean; display_until: string | null; createdAt: string; }
interface Props { initialGraffiti: Graffiti[]; }

export default function GraffitiPanel({ initialGraffiti }: Props) {
    const [items, setItems] = useState<Graffiti[]>(initialGraffiti);
    const [deleteId, setDeleteId] = useState<string | null>(null);

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
        <div
            key={g.id}
            style={{
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${g.approved ? 'rgba(4,120,87,0.35)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '8px',
                overflow: 'hidden',
            }}
        >
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
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {showApprove && <button onClick={() => handlePatch(g.id, { approved: true })} className="btn-admin" style={{ fontSize: '0.75rem', padding: '6px 12px' }}>✓ Approve</button>}
                    {g.approved && <button onClick={() => handlePatch(g.id, { approved: false })} className="btn-danger" style={{ fontSize: '0.75rem', padding: '6px 12px' }}>✗ Remove</button>}
                    <button onClick={() => setDeleteId(g.id)} className="btn-danger" style={{ fontSize: '0.75rem', padding: '6px 12px' }}>Delete</button>
                </div>
            </div>
        </div>
    );

    return (
        <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', letterSpacing: '0.05em', marginBottom: '8px' }}>GRAFFITI WALL</h2>
            <p style={{ color: 'var(--color-grey-blue)', fontSize: '0.9rem', marginBottom: '32px' }}>Review and approve fan-submitted graffiti artwork.</p>

            {pending.length > 0 && (
                <div style={{ marginBottom: '36px' }}>
                    <h3 style={{ fontFamily: 'var(--font-condensed)', fontSize: '0.85rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-yellow)', marginBottom: '16px' }}>Pending ({pending.length})</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
                        {pending.map(g => renderCard(g, true))}
                    </div>
                </div>
            )}

            <div>
                <h3 style={{ fontFamily: 'var(--font-condensed)', fontSize: '0.85rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-green-light)', marginBottom: '16px' }}>Live on Site ({approved.length})</h3>
                {approved.length === 0 ? (
                    <p style={{ color: 'var(--color-grey-blue)', fontSize: '0.9rem' }}>No approved graffiti yet.</p>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
                        {approved.map(g => renderCard(g, false))}
                    </div>
                )}
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
