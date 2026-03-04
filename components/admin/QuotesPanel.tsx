'use client';

import { useState } from 'react';

interface Quote { id: string; quote_text: string; submitted_by: string; approved: boolean; is_featured: boolean; display_until: string | null; createdAt: string; }
interface Props { initialQuotes: Quote[]; }

export default function QuotesPanel({ initialQuotes }: Props) {
    const [quotes, setQuotes] = useState<Quote[]>(initialQuotes);

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
        }
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
                        <button onClick={() => handlePatch(q.id, { approved: false, is_featured: false })} className="btn-danger" style={{ fontSize: '0.78rem', padding: '7px 14px' }}>✗ Reject</button>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', letterSpacing: '0.05em', marginBottom: '8px' }}>QUOTE MODERATION</h2>
            <p style={{ color: 'var(--color-grey-blue)', fontSize: '0.9rem', marginBottom: '32px' }}>Approve fan-submitted quotes and feature one on the homepage.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
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

            <style>{`@media(max-width:768px){div[style*="grid-template-columns: 1fr 1fr"]{grid-template-columns:1fr!important}}`}</style>
        </div>
    );
}
