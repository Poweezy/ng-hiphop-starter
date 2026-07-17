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
        const res = await fetch(`/api/lyrics/${id}`, { method: 'DELETE' });
        if (res.ok) setLyrics(lyrics.filter(l => l.id !== id));
    };

    return (
        <div>
            <h2 className="panel-title">LYRIC GAME</h2>
            <p className="panel-desc">Add and manage &quot;Guess the Artist&quot; game entries.</p>

            <div className="panel-grid">
                <div className="form-stack glass-panel">
                    <h3 className="admin-section-title">Add New Entry</h3>
                    <form onSubmit={handleAdd} className="form-stack">
                        <div className="form-group">
                            <label htmlFor="lyric-input" className="form-label admin-label--green">Lyric Line *</label>
                            <textarea
                                id="lyric-input"
                                className="admin-input admin-textarea"
                                value={lyricText}
                                onChange={(e) => setLyricText(e.target.value)}
                                placeholder="Enter the lyric line..."
                                maxLength={300}
                                rows={3}
                                required
                                disabled={saving}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="artist-input" className="form-label admin-label--green">Correct Artist *</label>
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
                            <div className={`status-message status-message--${status}`}>{msg}</div>
                        )}
                    </form>
                </div>

                <div>
                    <h3 className="admin-section-title admin-section-title--green">All Entries ({lyrics.length})</h3>
                    {lyrics.length === 0 ? (
                        <p className="admin-text-muted">No lyrics added yet.</p>
                    ) : (
                        <div className="admin-lyrics-list">
                            {lyrics.map(l => (
                                <div key={l.id} className={`admin-card ${l.is_active ? 'admin-card--active' : ''}`}>
                                    <div className="admin-card-body">
                                        <p className="admin-text-quote">"{l.lyric_text}"</p>
                                        <p className="admin-text-artist">— {l.correct_artist}</p>
                                    </div>
                                    <div className="admin-card-actions">
                                        <button
                                            onClick={() => toggle(l.id, l.is_active)}
                                            className={`admin-lyric-toggle ${l.is_active ? 'admin-lyric-toggle--off' : 'admin-lyric-toggle--on'}`}
                                        >
                                            {l.is_active ? 'OFF' : 'ON'}
                                        </button>
                                        <button onClick={() => remove(l.id)} className="btn-danger btn-sm">Del</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
