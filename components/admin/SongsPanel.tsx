'use client';

import { useState } from 'react';
import Image from 'next/image';
import ConfirmDialog from '../ConfirmDialog';
import Modal from '../Modal';

interface Song { id: string; title: string; description?: string | null; file_url: string; cover_url: string; is_active: boolean; distribution_links: string | null; publisher_link?: string | null; }
interface Props { initialSongs: Song[]; }

export default function SongsPanel({ initialSongs }: Props) {
    const [songs, setSongs] = useState<Song[]>(initialSongs);
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [msg, setMsg] = useState('');
    const [spotify, setSpotify] = useState('');
    const [apple, setApple] = useState('');
    const [distro, setDistro] = useState('');
    const [pubLink, setPubLink] = useState('');
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editSpotify, setEditSpotify] = useState('');
    const [editApple, setEditApple] = useState('');
    const [editDistro, setEditDistro] = useState('');
    const [editPubLink, setEditPubLink] = useState('');
    const [editLoading, setEditLoading] = useState(false);

    const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const audioFile = (form.elements.namedItem('audio') as HTMLInputElement).files?.[0];
        const coverFile = (form.elements.namedItem('cover') as HTMLInputElement).files?.[0];
        if (!audioFile || !coverFile || !title.trim()) { setStatus('error'); setMsg('Title, audio, and cover are required'); return; }

        setUploading(true);
        try {
            // Optimize cover image server-side
            const coverForm = new FormData();
            coverForm.append('image', coverFile);
            coverForm.append('folder', 'covers');

            const optimizeRes = await fetch('/api/uploads/optimize', { method: 'POST', body: coverForm });
            if (!optimizeRes.ok) {
                const err = await optimizeRes.json();
                setStatus('error'); setMsg(err.message || 'Cover optimization failed');
                setUploading(false);
                return;
            }
            const { url: coverUrl } = await optimizeRes.json();

            const fd = new FormData();
            fd.append('audio', audioFile);
            fd.append('title', title.trim());
            fd.append('description', desc.trim());
            fd.append('distributionLinks', JSON.stringify({ spotify, apple, distro }));
            fd.append('publisherLink', pubLink);
            fd.append('coverUrl', coverUrl);

            const res = await fetch('/api/songs', { method: 'POST', body: fd });
            const data = await res.json();
            if (res.ok) {
                setStatus('success'); setMsg('Song uploaded and set as active!');
                setSongs([data.data, ...songs.map(s => ({ ...s, is_active: false }))]);
                setTitle(''); setDesc(''); setSpotify(''); setApple(''); setDistro(''); setPubLink('');
                form.reset();
            } else { setStatus('error'); setMsg(data.message); }
        } catch {
            setStatus('error'); setMsg('Upload failed');
        }
        setUploading(false);
        setTimeout(() => setStatus('idle'), 4000);
    };

    const toggleActive = async (id: string, current: boolean) => {
        const res = await fetch('/api/songs', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, is_active: !current }) });
        if (res.ok) setSongs(songs.map(s => ({ ...s, is_active: s.id === id ? !current : s.is_active })));
    };

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const handleDelete = async () => {
        if (!deleteId) return;
        const res = await fetch(`/api/songs/${deleteId}`, { method: 'DELETE' });
        if (res.ok) setSongs(songs.filter(s => s.id !== deleteId));
        setDeleteId(null);
    };

    const openEdit = (song: Song) => {
        setEditingId(song.id);
        setEditTitle(song.title);
        setEditDesc(song.description || '');
        let links: Record<string, string> = {};
        try { links = typeof song.distribution_links === 'string' ? JSON.parse(song.distribution_links) : (song.distribution_links || {}); } catch { /* ignore malformed JSON */ }
        setEditSpotify(links.spotify || '');
        setEditApple(links.apple || '');
        setEditDistro(links.distro || '');
        setEditPubLink(song.publisher_link || '');
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingId) return;
        setEditLoading(true);
        try {
            const res = await fetch('/api/songs', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingId,
                    title: editTitle.trim(),
                    description: editDesc.trim() || null,
                    distribution_links: JSON.stringify({ spotify: editSpotify, apple: editApple, distro: editDistro }),
                    publisher_link: editPubLink.trim() || null,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setSongs(songs.map(s => s.id === editingId ? { ...s, ...data.data, distribution_links: typeof data.data.distribution_links === 'string' ? data.data.distribution_links : JSON.stringify(data.data.distribution_links) } : s));
                setEditingId(null);
                setStatus('success'); setMsg('Song updated!');
            } else {
                setStatus('error'); setMsg(data.message || 'Update failed');
            }
        } catch {
            setStatus('error'); setMsg('Update failed');
        }
        setEditLoading(false);
        setTimeout(() => setStatus('idle'), 3000);
    };

    return (
        <div>
            <h2 className="panel-title">SONG MANAGER</h2>
            <p className="panel-desc">Upload and manage the active release.</p>

            <div className="panel-grid">
                <div className="glass-panel glass-panel--padded">
                    <h3 className="admin-section-title">Upload New Song</h3>
                    <form onSubmit={handleUpload} className="form-stack">
                        {[{ label: 'Song Title *', id: 's-title', type: 'text', val: title, set: setTitle, ph: 'Enter track name' },
                        { label: 'Description', id: 's-desc', type: 'text', val: desc, set: setDesc, ph: 'Short description...' },
                        { label: 'Spotify URL', id: 's-spot', type: 'url', val: spotify, set: setSpotify, ph: 'https://open.spotify.com/...' },
                        { label: 'Apple Music URL', id: 's-apple', type: 'url', val: apple, set: setApple, ph: 'https://music.apple.com/...' },
                        { label: 'Distro/Distribution URL', id: 's-dist', type: 'url', val: distro, set: setDistro, ph: 'https://...' },
                        { label: 'Publisher URL', id: 's-pub', type: 'url', val: pubLink, set: setPubLink, ph: 'https://...' },
                        ].map(f => (
                            <div className="form-group" key={f.id}>
                                <label htmlFor={f.id} className="form-label admin-label--green">{f.label}</label>
                                <input id={f.id} type={f.type} className="admin-input" value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} disabled={uploading} maxLength={300} />
                            </div>
                        ))}

                        <div className="form-group">
                            <label htmlFor="audio-file" className="form-label admin-label--green">Audio File * (MP3/WAV, max 50MB)</label>
                            <input id="audio-file" name="audio" type="file" accept="audio/*" required className="admin-input admin-file-input" disabled={uploading} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="cover-file" className="form-label admin-label--green">Cover Art * (JPG/PNG/WEBP, max 5MB)</label>
                            <input id="cover-file" name="cover" type="file" accept="image/jpeg,image/png,image/webp" required className="admin-input admin-file-input" disabled={uploading} />
                        </div>

                        <button type="submit" className="btn-admin mt-1" disabled={uploading}>
                            {uploading ? '⏳ Uploading...' : '🎵 Upload & Set Active'}
                        </button>
                        {status !== 'idle' && (
                            <div className={`status-message status-message--${status}`}>{msg}</div>
                        )}
                    </form>
                </div>

                <div>
                    <h3 className="admin-section-title admin-section-title--green">Existing Songs</h3>
                    {songs.length === 0 ? (
                        <p className="admin-text-muted">No songs uploaded yet.</p>
                    ) : (
                        <div className="form-stack">
                            {songs.map(song => (
                                <div key={song.id} className={`admin-card admin-card--compact ${song.is_active ? 'admin-card--active' : ''}`}>
                                    {song.cover_url && (
                                        <div className="admin-cover-thumb">
                                            <Image src={song.cover_url} alt={song.title} fill style={{ objectFit: 'cover' }} sizes="48px" />
                                        </div>
                                    )}
                                    <div className="admin-card-body admin-card-body--no-shrink">
                                        <div className="admin-text-ellipsis">{song.title}</div>
                                        {song.is_active && <span className="badge-approved badge-approved--inline mt-1">ACTIVE</span>}
                                    </div>
                                    <div className="admin-card-actions">
                                        <button
                                            onClick={() => openEdit(song)}
                                            className="btn-badge"
                                        >
                                            Edit
                                        </button>
                                            <button
                                                onClick={() => toggleActive(song.id, song.is_active)}
                                                className={song.is_active ? 'btn-danger' : 'btn-badge'}
                                                aria-pressed={!song.is_active}
                                                aria-label={song.is_active ? 'Deactivate song' : 'Set song as active'}
                                            >
                                            {song.is_active ? 'Deactivate' : 'Set Active'}
                                        </button>
                                        <button onClick={() => setDeleteId(song.id)} className="btn-danger btn-xs">Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <ConfirmDialog
                isOpen={!!deleteId}
                title="Delete Song?"
                message="This will permanently delete the song and its files. This cannot be undone."
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
            />

            {editingId && (
                <Modal isOpen={!!editingId} onClose={() => setEditingId(null)} titleId="edit-song-title">
                    <h3 className="modal-title" id="edit-song-title">Edit Song</h3>
                    <form onSubmit={handleEdit} className="form-stack">
                        <div className="form-group">
                            <label className="form-label admin-label--green" htmlFor="edit-song-title-input">Song Title</label>
                            <input id="edit-song-title-input" className="admin-input" value={editTitle} onChange={e => setEditTitle(e.target.value)} required maxLength={120} />
                        </div>
                        <div className="form-group">
                            <label className="form-label admin-label--green" htmlFor="edit-song-desc">Description</label>
                            <input id="edit-song-desc" className="admin-input" value={editDesc} onChange={e => setEditDesc(e.target.value)} maxLength={500} />
                        </div>
                        <div className="form-group">
                            <label className="form-label admin-label--green" htmlFor="edit-song-spotify">Spotify URL</label>
                            <input id="edit-song-spotify" className="admin-input" value={editSpotify} onChange={e => setEditSpotify(e.target.value)} placeholder="https://open.spotify.com/..." />
                        </div>
                        <div className="form-group">
                            <label className="form-label admin-label--green" htmlFor="edit-song-apple">Apple Music URL</label>
                            <input id="edit-song-apple" className="admin-input" value={editApple} onChange={e => setEditApple(e.target.value)} placeholder="https://music.apple.com/..." />
                        </div>
                        <div className="form-group">
                            <label className="form-label admin-label--green" htmlFor="edit-song-distro">Distro/Distribution URL</label>
                            <input id="edit-song-distro" className="admin-input" value={editDistro} onChange={e => setEditDistro(e.target.value)} placeholder="https://..." />
                        </div>
                        <div className="form-group">
                            <label className="form-label admin-label--green" htmlFor="edit-song-pub">Publisher URL</label>
                            <input id="edit-song-pub" className="admin-input" value={editPubLink} onChange={e => setEditPubLink(e.target.value)} placeholder="https://..." />
                        </div>
                        <div className="modal-actions">
                            <button type="button" onClick={() => setEditingId(null)} className="btn btn-secondary$1">Cancel</button>
                            <button type="submit" className="btn btn-primary$1" disabled={editLoading}>{editLoading ? 'Saving...' : 'Save Changes'}</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}
