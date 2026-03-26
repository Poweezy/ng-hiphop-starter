'use client';

import { useState } from 'react';

interface Lyric { id: string; lyric_text: string; correct_artist: string; is_active: boolean; }
interface Props { initialLyrics: Lyric[]; }

export default function LyricsPanel({ initialLyrics }: Props) {
    const [lyrics, setLyrics] = useState<Lyric[]>(initialLyrics);
    const [lyricText, setLyricText] = useState('');
    const [artist, setArtist] = useState('');
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [msg, setMsg] = useState('');

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!lyricText.trim() || !artist.trim()) return;
        setSaving(true);
        try {
            const res = await fetch('/api/lyrics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lyric_text: lyricText.trim(), correct_artist: artist.trim(), is_active: true }),
            });
            const data = await res.json();
            if (res.ok) {
                setLyrics([data, ...lyrics]);
                setLyricText(''); setArtist('');
                setStatus('success'); setMsg('Lyric added!');
            } else { setStatus('error'); setMsg(data.message); }
        } catch { setStatus('error'); setMsg('Failed to save'); }
        setSaving(false);
        setTimeout(() => setStatus('idle'), 3000);
    };

    const toggle = async (id: string, current: boolean) => {
        const res = await fetch('/api/lyrics', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, is_active: !current }),
        });
        if (res.ok) setLyrics(lyrics.map(l => l.id === id ? { ...l, is_active: !current } : l));
    };

    const remove = async (id: string) => {
        const res = await fetch('/api/lyrics', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        });
        if (res.ok) setLyrics(lyrics.filter(l => l.id !== id));
    };

    return (
        <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', letterSpacing: '0.05em', marginBottom: '8px' }}>LYRIC GAME</h2>
            <p style={{ color: 'var(--color-grey-blue)', fontSize: '0.9rem', marginBottom: '32px' }}>Add and manage "Guess the Artist" game entries.</p>

            <div className="panel-grid">
                {/* Add form */}
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(4,120,87,0.25)', borderRadius: '10px', padding: '24px' }}>
                    <h3 style={{ fontFamily: 'var(--font-condensed)', fontSize: '1rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-green-light)', marginBottom: '20px' }}>Add New Entry</h3>
                    <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div className="form-group">
                            <label htmlFor="lyric-input" className="form-label" style={{ color: 'var(--color-green-light)' }}>Lyric Line *</label>
                            <textarea
                                id="lyric-input"
                                className="admin-input"
                                value={lyricText}
                                onChange={(e) => setLyricText(e.target.value)}
                                placeholder="Enter the lyric line..."
                                maxLength={300}
                                rows={3}
                                required
                                disabled={saving}
                                style={{ resize: 'vertical' }}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="artist-input" className="form-label" style={{ color: 'var(--color-green-light)' }}>Correct Artist *</label>
                            <input
                                id="artist-input"
                                type="text"
                                className="admin-input"
                                value={artist}
                                onChange={(e) => setArtist(e.target.value)}
                                placeholder="e.g. Kendrick Lamar"
                                maxLength={80}
                                required
                                disabled={saving}
                            />
                        </div>
                        <button type="submit" className="btn-admin" disabled={saving}>
                            {saving ? '⏳ Saving...' : '+ Add Lyric'}
                        </button>
                        {status !== 'idle' && (
                            <div style={{ padding: '10px 14px', borderRadius: '6px', background: status === 'success' ? 'rgba(4,120,87,0.15)' : 'rgba(220,38,38,0.15)', border: `1px solid ${status === 'success' ? 'rgba(4,120,87,0.4)' : 'rgba(220,38,38,0.4)'}`, color: status === 'success' ? 'var(--color-green-light)' : '#F87171', fontSize: '0.9rem' }}>{msg}</div>
                        )}
                    </form>
                </div>

                {/* Lyric list */}
                <div>
                    <h3 style={{ fontFamily: 'var(--font-condensed)', fontSize: '0.85rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-green-light)', marginBottom: '16px' }}>
                        All Entries ({lyrics.length})
                    </h3>
                    {lyrics.length === 0 ? (
                        <p style={{ color: 'var(--color-grey-blue)', fontSize: '0.9rem' }}>No lyrics added yet.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '500px', overflowY: 'auto' }}>
                            {lyrics.map(l => (
                                <div key={l.id} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${l.is_active ? 'rgba(4,120,87,0.3)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '8px', padding: '14px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontStyle: 'italic', fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)', marginBottom: '4px', lineHeight: 1.5 }}>"{l.lyric_text}"</p>
                                        <p style={{ fontFamily: 'var(--font-condensed)', fontSize: '0.8rem', color: 'var(--color-green-light)' }}>— {l.correct_artist}</p>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
                                        <button
                                            onClick={() => toggle(l.id, l.is_active)}
                                            style={{ padding: '5px 10px', borderRadius: '3px', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-condensed)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', transition: 'all 0.2s ease', background: l.is_active ? 'rgba(220,38,38,0.2)' : 'rgba(4,120,87,0.2)', color: l.is_active ? '#F87171' : 'var(--color-green-light)' }}
                                        >
                                            {l.is_active ? 'OFF' : 'ON'}
                                        </button>
                                        <button onClick={() => remove(l.id)} className="btn-danger" style={{ fontSize: '0.75rem', padding: '5px 10px' }}>Del</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .panel-grid { display: grid; grid-template-columns: 1fr 1.5fr; gap: 32px; align-items: start; }
                @media (max-width: 900px) { .panel-grid { grid-template-columns: 1fr; } }
            `}</style>
        </div>
    );
}
