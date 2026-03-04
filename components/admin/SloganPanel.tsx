'use client';

import { useState } from 'react';

interface Props { initialSlogan: string; }

export default function SloganPanel({ initialSlogan }: Props) {
    const [slogan, setSlogan] = useState(initialSlogan);
    const [saved, setSaved] = useState(initialSlogan);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [msg, setMsg] = useState('');

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!slogan.trim()) return;
        setStatus('loading');
        try {
            const res = await fetch('/api/slogan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slogan: slogan.trim() }),
            });
            const data = await res.json();
            if (res.ok) { setStatus('success'); setMsg('Slogan updated!'); setSaved(slogan.trim()); }
            else { setStatus('error'); setMsg(data.message); }
        } catch { setStatus('error'); setMsg('Network error'); }
        setTimeout(() => setStatus('idle'), 3000);
    };

    return (
        <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', letterSpacing: '0.05em', marginBottom: '8px' }}>SLOGAN EDITOR</h2>
            <p style={{ color: 'var(--color-grey-blue)', fontSize: '0.9rem', marginBottom: '32px' }}>
                Update the hero slogan. Changes go live immediately on the main site.
            </p>

            <div style={{ maxWidth: '600px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(4,120,87,0.25)', borderRadius: '10px', padding: '28px' }}>
                <div style={{ marginBottom: '20px', padding: '16px', background: 'rgba(4,120,87,0.08)', borderRadius: '6px', borderLeft: '3px solid var(--color-green)' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-grey-blue)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px', fontFamily: 'var(--font-condensed)' }}>Current Live Slogan</p>
                    <p style={{ fontFamily: 'var(--font-condensed)', fontWeight: 700, fontSize: '1.1rem', letterSpacing: '0.06em' }}>{saved || '—'}</p>
                </div>

                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="form-group">
                        <label htmlFor="slogan-input" className="form-label" style={{ color: 'var(--color-green-light)' }}>New Slogan</label>
                        <input
                            id="slogan-input"
                            type="text"
                            className="admin-input"
                            value={slogan}
                            onChange={(e) => setSlogan(e.target.value)}
                            maxLength={200}
                            placeholder="Enter new slogan..."
                            required
                            disabled={status === 'loading'}
                        />
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-grey-blue)', textAlign: 'right' }}>{slogan.length}/200</span>
                    </div>

                    <button type="submit" className="btn-admin" disabled={status === 'loading' || slogan.trim() === saved}>
                        {status === 'loading' ? '⏳ Saving...' : '✅ Update Live Slogan'}
                    </button>

                    {(status === 'success' || status === 'error') && (
                        <div style={{ padding: '10px 14px', borderRadius: '6px', background: status === 'success' ? 'rgba(4,120,87,0.15)' : 'rgba(220,38,38,0.15)', border: `1px solid ${status === 'success' ? 'rgba(4,120,87,0.4)' : 'rgba(220,38,38,0.4)'}`, color: status === 'success' ? 'var(--color-green-light)' : '#F87171', fontSize: '0.9rem' }}>{msg}</div>
                    )}
                </form>
            </div>
        </div>
    );
}
