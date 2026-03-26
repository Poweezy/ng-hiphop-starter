'use client';

import { useState } from 'react';
import ConfirmDialog from '@/components/ConfirmDialog';
import Toast from '@/components/Toast';

interface Quote { id: string; quote_text: string; submitted_by: string; approved: boolean; is_featured: boolean; display_until: string | null; createdAt: string; }
interface Props { initialQuotes: Quote[]; }

export default function QuotesPanel({ initialQuotes }: Props) {
    const [quotes, setQuotes] = useState<Quote[]>(initialQuotes);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; action: () => void; title: string; message: string }>({ 
        isOpen: false, 
        action: () => {}, 
        title: '', 
        message: '' 
    });

    const handlePatch = async (id: string, patch: Partial<Quote>) => {
        const res = await fetch('/api/quotes', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...patch }),
        });
        if (res.ok) {
            const updated = await res.json();
            setQuotes(quotes.map(q => {
                if (patch.is_featured) return q.id === id ? { ...q, ...updated } : { ...q, is_featured: false };
                return q.id === id ? { ...q, ...updated } : q;
            }));
            if (patch.approved) setToast({ message: 'Quote approved!', type: 'success' });
            else if (patch.is_featured) setToast({ message: 'Quote featured!', type: 'success' });
            else setToast({ message: 'Quote updated', type: 'info' });
        }
    };

    const handleDelete = async (id: string) => {
        const res = await fetch('/api/quotes', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        });
        if (res.ok) {
            setQuotes(quotes.filter(q => q.id !== id));
            setToast({ message: 'Quote deleted', type: 'success' });
        } else {
            setToast({ message: 'Delete failed', type: 'error' });
        }
        setConfirmDialog({ isOpen: false, action: () => {}, title: '', message: '' });
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

    const renderQuote = (q: Quote) => (
        <div
            key={q.id}
            style={{
                background: q.is_featured ? 'rgba(4,120,87,0.08)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${q.is_featured ? 'rgba(4,120,87,0.4)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '8px', padding: '16px', marginBottom: '10px',
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                    <p style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.85)', marginBottom: '6px', lineHeight: 1.5 }}>"{q.quote_text}"</p>
                    <p style={{ fontFamily: 'var(--font-condensed)', fontSize: '0.8rem', color: 'var(--color-green-light)', letterSpacing: '0.06em' }}>— {q.submitted_by}</p>
                    {q.is_featured && <span className="badge-approved" style={{ marginTop: '6px', display: 'inline-block' }}>FEATURED</span>}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flexShrink: 0 }}>
                    {!q.approved && (
                        <button onClick={() => handlePatch(q.id, { approved: true })} className="btn-admin" style={{ fontSize: '0.78rem', padding: '7px 14px' }}>✓ Approve</button>
                    )}
                    {q.approved && !q.is_featured && (
                        <button onClick={() => handlePatch(q.id, { is_featured: true })} className="btn-admin" style={{ fontSize: '0.78rem', padding: '7px 14px' }}>⭐ Feature</button>
                    )}
                    {q.approved && (
                        <>
                            <button onClick={() => handlePatch(q.id, { approved: false, is_featured: false })} className="btn-danger" style={{ fontSize: '0.78rem', padding: '7px 14px' }}>✗ Reject</button>
                            <button onClick={() => confirmDelete(q.id, q.submitted_by)} className="btn-danger" style={{ fontSize: '0.78rem', padding: '7px 14px' }}>🗑️ Delete</button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', letterSpacing: '0.05em', marginBottom: '8px' }}>QUOTE MODERATION</h2>
            <p style={{ color: 'var(--color-grey-blue)', fontSize: '0.9rem', marginBottom: '32px' }}>Approve fan-submitted quotes and feature one on the homepage.</p>

            <div className="panel-grid">
                <div>
                    <h3 style={{ fontFamily: 'var(--font-condensed)', fontSize: '0.85rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-yellow)', marginBottom: '16px' }}>
                        Pending Approval ({pending.length})
                    </h3>
                    {pending.length === 0 ? <p style={{ color: 'var(--color-grey-blue)', fontSize: '0.9rem' }}>No pending quotes.</p> : pending.map(renderQuote)}
                </div>
                <div>
                    <h3 style={{ fontFamily: 'var(--font-condensed)', fontSize: '0.85rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-green-light)', marginBottom: '16px' }}>
                        Approved ({approved.length})
                    </h3>
                    {approved.length === 0 ? <p style={{ color: 'var(--color-grey-blue)', fontSize: '0.9rem' }}>No approved quotes.</p> : approved.map(renderQuote)}
                </div>
            </div>

            <style jsx>{`
                .panel-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
                @media (max-width: 768px) { .panel-grid { grid-template-columns: 1fr; } }
            `}</style>
            
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title={confirmDialog.title}
                message={confirmDialog.message}
                confirmText="Delete"
                onConfirm={confirmDialog.action}
                onCancel={() => setConfirmDialog({ isOpen: false, action: () => {}, title: '', message: '' })}
                variant="danger"
            />
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
