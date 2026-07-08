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
            className={`admin-card ${q.is_featured ? 'admin-card--featured' : ''}`}
        >
            <div className="admin-card-header">
                <div className="admin-card-body">
                    <p className="admin-text-quote">"{q.quote_text}"</p>
                    <p className="admin-text-artist">— {q.submitted_by}</p>
                    {q.is_featured && <span className="badge-approved" style={{ marginTop: '6px', display: 'inline-block' }}>FEATURED</span>}
                </div>
                <div className="admin-card-actions">
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
            <h2 className="panel-title">QUOTE MODERATION</h2>
            <p className="panel-desc">Approve fan-submitted quotes and feature one on the homepage.</p>

            <div className="panel-grid">
                <div>
                    <h3 className="admin-section-title">Pending Approval ({pending.length})</h3>
                    {pending.length === 0 ? <p className="admin-text-muted">No pending quotes.</p> : pending.map(renderQuote)}
                </div>
                <div>
                    <h3 className="admin-section-title admin-section-title--green">Approved ({approved.length})</h3>
                    {approved.length === 0 ? <p className="admin-text-muted">No approved quotes.</p> : approved.map(renderQuote)}
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
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
