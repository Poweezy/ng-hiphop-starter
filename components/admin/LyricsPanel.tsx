'use client';

import { useState, useRef } from 'react';
import ConfirmDialog from '../ConfirmDialog';
import Pagination from '@/components/Pagination';

const PAGE_SIZE = 20;

interface Lyric { id: string; lyric_text: string; correct_artist: string; is_active: boolean; }
interface Props { initialLyrics: Lyric[]; }

export default function LyricsPanel({ initialLyrics }: Props) {
    const [lyrics, setLyrics] = useState<Lyric[]>(initialLyrics);
    const [lyricText, setLyricText] = useState('');
    const [artist, setArtist] = useState('');
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [msg, setMsg] = useState('');
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [page, setPage] = useState(1);
    const toggleInProgress = useRef<Set<string>>(new Set());

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
                setLyrics([data.data, ...lyrics]);
                setLyricText(''); setArtist('');
                setStatus('success'); setMsg('Lyric added!');
            } else { setStatus('error'); setMsg(data.data?.message || data.data?.error?.message || 'Failed to save'); }
        } catch { setStatus('error'); setMsg('Failed to save'); }
        setSaving(false);
        setTimeout(() => setStatus('idle'), 3000);
    };

    const toggle = async (id: string, current: boolean) => {
        if (toggleInProgress.current.has(id)) return;
        toggleInProgress.current.add(id);
        try {
            const res = await fetch('/api/lyrics', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, is_active: !current }),
            });
            if (res.ok) setLyrics(lyrics.map(l => l.id === id ? { ...l, is_active: !current } : l));
        } finally {
            toggleInProgress.current.delete(id);
        }
    };

    const remove = async (id: string) => {
        const res = await fetch(`/api/lyrics/${id}`, { method: 'DELETE' });
        if (res.ok) setLyrics(lyrics.filter(l => l.id !== id));
        setDeleteId(null);
    };

    const filtered = lyrics.filter(l => {
        const matchesSearch = l.lyric_text.toLowerCase().includes(search.toLowerCase()) || l.correct_artist.toLowerCase().includes(search.toLowerCase());
        const matchesActive = activeFilter === 'all' || (activeFilter === 'active' ? l.is_active : !l.is_active);
        return matchesSearch && matchesActive;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
        <div>
            <h2 className="panel-title">LYRIC GAME</h2>
            <p className="panel-desc">Add and manage &quot;Guess the Artist&quot; game entries.</p>

            <div className="form-stack glass-panel glass-panel--padded" style={{ marginBottom: 24 }}>
                <div className="panel-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="form-group">
                        <label htmlFor="lyric-search" className="form-label admin-label--green">Search</label>
                        <input
                            id="lyric-search"
                            type="text"
                            className="admin-input"
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                            placeholder="Search lyrics or artists..."
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="lyric-status" className="form-label admin-label--green">Status</label>
                        <select
                            id="lyric-status"
                            className="admin-input"
                            value={activeFilter}
                            onChange={e => { setActiveFilter(e.target.value as any); setPage(1); }}
                        >
                            <option value="all">All</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>
            </div>

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
                        <button type="submit" className="btn btn-primary$1" disabled={saving}>
                            {saving ? '⏳ Saving...' : '+ Add Lyric'}
                        </button>
                        {status !== 'idle' && (
                            <div className={`status-message status-message--${status}`}>{msg}</div>
                        )}
                    </form>
                </div>

                <div>
                    <h3 className="admin-section-title admin-section-title--green">All Entries ({filtered.length})</h3>
                    {filtered.length === 0 ? (
                        <p className="admin-text-muted">No lyrics found.</p>
                    ) : (
                        <>
                            <div className="admin-lyrics-list">
                                {paginated.map(l => (
                                    <div key={l.id} className={`admin-card ${l.is_active ? 'admin-card--active' : ''}`}>
                                        <div className="admin-card-body">
                                            <p className="admin-text-quote">"{l.lyric_text}"</p>
                                            <p className="admin-text-artist">— {l.correct_artist}</p>
                                        </div>
                                        <div className="admin-card-actions">
                                            <button
                                                onClick={() => toggle(l.id, l.is_active)}
                                                className={`admin-lyric-toggle ${l.is_active ? 'admin-lyric-toggle--on' : 'admin-lyric-toggle--off'}`}
                                            >
                                                {l.is_active ? 'ON' : 'OFF'}
                                            </button>
                                            <button onClick={() => setDeleteId(l.id)} className="btn-danger btn-sm">Del</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
                        </>
                    )}
                </div>
            </div>

            <ConfirmDialog
                isOpen={!!deleteId}
                title="Delete Lyric?"
                message="This will permanently delete this lyric entry. This cannot be undone."
                onConfirm={() => deleteId && remove(deleteId)}
                onCancel={() => setDeleteId(null)}
            />
        </div>
    );
}
