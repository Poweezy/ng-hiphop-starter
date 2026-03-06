'use client';

import { useState } from 'react';
import Image from 'next/image';
import ConfirmDialog from '../ConfirmDialog';

interface Song { id: string; title: string; description?: string; file_url: string; cover_url: string; is_active: boolean; distribution_links: any; publisher_link?: string; }
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

    const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const audioFile = (form.elements.namedItem('audio') as HTMLInputElement).files?.[0];
        const coverFile = (form.elements.namedItem('cover') as HTMLInputElement).files?.[0];
        if (!audioFile || !coverFile || !title.trim()) { setStatus('error'); setMsg('Title, audio, and cover are required'); return; }

        setUploading(true);
        const fd = new FormData();
        fd.append('audio', audioFile);
        fd.append('cover', coverFile);
        fd.append('title', title.trim());
        fd.append('description', desc.trim());
        fd.append('distributionLinks', JSON.stringify({ spotify, apple, distro }));
        fd.append('publisherLink', pubLink);

        try {
            const res = await fetch('/api/songs', { method: 'POST', body: fd });
            const data = await res.json();
            if (res.ok) {
                setStatus('success'); setMsg('Song uploaded and set as active!');
                setSongs([data, ...songs.map(s => ({ ...s, is_active: false }))]);
                setTitle(''); setDesc(''); setSpotify(''); setApple(''); setDistro(''); setPubLink('');
                form.reset();
            } else { setStatus('error'); setMsg(data.message); }
        } catch { setStatus('error'); setMsg('Upload failed'); }
        setUploading(false);
        setTimeout(() => setStatus('idle'), 4000);
    };

    const toggleActive = async (id: string, current: boolean) => {
        const res = await fetch('/api/songs', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, is_active: !current }) });
        if (res.ok) setSongs(songs.map(s => ({ ...s, is_active: s.id === id ? !current : false })));
    };

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const handleDelete = async () => {
        if (!deleteId) return;
        const res = await fetch('/api/songs', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: deleteId }) });
        if (res.ok) setSongs(songs.filter(s => s.id !== deleteId));
        setDeleteId(null);
    };

    return (
        <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', letterSpacing: '0.05em', marginBottom: '8px' }}>SONG MANAGER</h2>
            <p style={{ color: 'var(--color-grey-blue)', fontSize: '0.9rem', marginBottom: '32px' }}>Upload and manage the active release.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'start' }}>
                {/* Upload form */}
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(4,120,87,0.25)', borderRadius: '10px', padding: '24px' }}>
                    <h3 style={{ fontFamily: 'var(--font-condensed)', fontSize: '1rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-green-light)', marginBottom: '20px' }}>Upload New Song</h3>
                    <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {[{ label: 'Song Title *', id: 's-title', type: 'text', val: title, set: setTitle, ph: 'Enter track name' },
                        { label: 'Description', id: 's-desc', type: 'text', val: desc, set: setDesc, ph: 'Short description...' },
                        { label: 'Spotify URL', id: 's-spot', type: 'url', val: spotify, set: setSpotify, ph: 'https://open.spotify.com/...' },
                        { label: 'Apple Music URL', id: 's-apple', type: 'url', val: apple, set: setApple, ph: 'https://music.apple.com/...' },
                        { label: 'Distro/Distribution URL', id: 's-dist', type: 'url', val: distro, set: setDistro, ph: 'https://...' },
                        { label: 'Publisher URL', id: 's-pub', type: 'url', val: pubLink, set: setPubLink, ph: 'https://...' },
                        ].map(f => (
                            <div className="form-group" key={f.id}>
                                <label htmlFor={f.id} className="form-label" style={{ color: 'var(--color-green-light)' }}>{f.label}</label>
                                <input id={f.id} type={f.type} className="admin-input" value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} disabled={uploading} maxLength={300} />
                            </div>
                        ))}

                        <div className="form-group">
                            <label htmlFor="audio-file" className="form-label" style={{ color: 'var(--color-green-light)' }}>Audio File * (MP3/WAV, max 50MB)</label>
                            <input id="audio-file" name="audio" type="file" accept="audio/*" required className="admin-input" disabled={uploading} style={{ padding: '8px' }} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="cover-file" className="form-label" style={{ color: 'var(--color-green-light)' }}>Cover Art * (JPG/PNG/WEBP, max 5MB)</label>
                            <input id="cover-file" name="cover" type="file" accept="image/jpeg,image/png,image/webp" required className="admin-input" disabled={uploading} style={{ padding: '8px' }} />
                        </div>

                        <button type="submit" className="btn-admin" disabled={uploading} style={{ marginTop: '4px' }}>
                            {uploading ? '⏳ Uploading...' : '🎵 Upload & Set Active'}
                        </button>
                        {status !== 'idle' && (
                            <div style={{ padding: '10px 14px', borderRadius: '6px', background: status === 'success' ? 'rgba(4,120,87,0.15)' : 'rgba(220,38,38,0.15)', border: `1px solid ${status === 'success' ? 'rgba(4,120,87,0.4)' : 'rgba(220,38,38,0.4)'}`, color: status === 'success' ? 'var(--color-green-light)' : '#F87171', fontSize: '0.9rem' }}>{msg}</div>
                        )}
                    </form>
                </div>

                {/* Song list */}
                <div>
                    <h3 style={{ fontFamily: 'var(--font-condensed)', fontSize: '1rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-green-light)', marginBottom: '16px' }}>Existing Songs</h3>
                    {songs.length === 0 ? (
                        <p style={{ color: 'var(--color-grey-blue)', fontSize: '0.9rem' }}>No songs uploaded yet.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {songs.map(song => (
                                <div key={song.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${song.is_active ? 'rgba(4,120,87,0.4)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '8px', padding: '14px' }}>
                                    {song.cover_url && (
                                        <div style={{ width: '48px', height: '48px', borderRadius: '4px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                                            <Image src={song.cover_url} alt={song.title} fill style={{ objectFit: 'cover' }} sizes="48px" />
                                        </div>
                                    )}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontFamily: 'var(--font-condensed)', fontWeight: 700, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.title}</div>
                                        {song.is_active && <span className="badge-approved" style={{ marginTop: '4px', display: 'inline-block' }}>ACTIVE</span>}
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <button
                                            onClick={() => toggleActive(song.id, song.is_active)}
                                            style={{ padding: '6px 14px', borderRadius: '3px', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-condensed)', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', transition: 'all 0.2s ease', background: song.is_active ? 'rgba(220,38,38,0.2)' : 'rgba(4,120,87,0.2)', color: song.is_active ? '#F87171' : 'var(--color-green-light)' }}
                                        >
                                            {song.is_active ? 'Deactivate' : 'Set Active'}
                                        </button>
                                        <button onClick={() => setDeleteId(song.id)} className="btn-danger" style={{ fontSize: '0.8rem', padding: '6px 14px' }}>Delete</button>
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
            <style>{`@media(max-width:768px){.songs-grid{grid-template-columns:1fr!important}}`}</style>
        </div>
    );
}
