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
            <h2 className="panel-title">SLOGAN EDITOR</h2>
            <p className="panel-desc">Update the hero slogan. Changes go live immediately on the main site.</p>

            <div className="glass-panel glass-panel--narrow">
                <div className="admin-preview-box">
                    <p className="admin-preview-label">Current Live Slogan</p>
                    <p className="admin-preview-text">{saved || '—'}</p>
                </div>

                <form onSubmit={handleSave} className="form-stack">
                    <div className="form-group">
                        <label htmlFor="slogan-input" className="form-label admin-label--green">New Slogan</label>
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
                        <span className="admin-char-count">{slogan.length}/200</span>
                    </div>

                    <button type="submit" className="btn-admin" disabled={status === 'loading' || slogan.trim() === saved}>
                        {status === 'loading' ? '⏳ Saving...' : '✅ Update Live Slogan'}
                    </button>

                    {(status === 'success' || status === 'error') && (
                        <div role="status" aria-live="polite" className={`status-message status-message--${status}`}>{msg}</div>
                    )}
                </form>
            </div>
        </div>
    );
}
