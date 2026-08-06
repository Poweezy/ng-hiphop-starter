'use client';

import { useState } from 'react';
import ConfirmDialog from '@/components/ConfirmDialog';

interface UserData {
    id: string;
    email: string;
    role: string;
    createdAt: string;
    updatedAt: string;
    submissionCount: number;
}

interface Props {
    initialUsers: UserData[];
}

export default function UsersPanel({ initialUsers }: Props) {
    const [users, setUsers] = useState<UserData[]>(initialUsers);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [msg, setMsg] = useState('');
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('');

    const handleRoleChange = async (id: string, newRole: string) => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, role: newRole }),
            });
            const data = await res.json();
            if (res.ok) {
                setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
                setStatus('success'); setMsg('Role updated!');
            } else {
                setStatus('error'); setMsg(data.error?.message || 'Update failed');
            }
        } catch {
            setStatus('error'); setMsg('Network error');
        }
        setLoading(false);
        setTimeout(() => setStatus('idle'), 3000);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        const res = await fetch(`/api/admin/users/${deleteId}`, { method: 'DELETE' });
        if (res.ok) {
            setUsers(users.filter(u => u.id !== deleteId));
            setStatus('success'); setMsg('User deleted');
        } else {
            setStatus('error'); setMsg('Delete failed');
        }
        setDeleteId(null);
        setTimeout(() => setStatus('idle'), 3000);
    };

    const filtered = users.filter(u => {
        const matchesSearch = u.email.toLowerCase().includes(search.toLowerCase());
        const matchesRole = !roleFilter || u.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    return (
        <div>
            <h2 className="panel-title">USER MANAGEMENT</h2>
            <p className="panel-desc">View and manage registered users and their roles.</p>

            <div className="form-stack glass-panel glass-panel--padded" style={{ marginBottom: 24 }}>
                <div className="panel-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="form-group">
                        <label htmlFor="user-search" className="form-label admin-label--green">Search Email</label>
                        <input
                            id="user-search"
                            type="text"
                            className="admin-input"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by email..."
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="role-filter" className="form-label admin-label--green">Filter by Role</label>
                        <select
                            id="role-filter"
                            className="admin-input"
                            value={roleFilter}
                            onChange={e => setRoleFilter(e.target.value)}
                        >
                            <option value="">All Roles</option>
                            <option value="USER">USER</option>
                            <option value="ADMIN">ADMIN</option>
                        </select>
                    </div>
                </div>
                {status !== 'idle' && (
                    <div className={`status-message status-message--${status}`}>{msg}</div>
                )}
            </div>

            <div>
                <h3 className="admin-section-title">All Users ({filtered.length})</h3>
                {filtered.length === 0 ? (
                    <p className="admin-text-muted">No users found.</p>
                ) : (
                    <div className="admin-users-list">
                        {filtered.map(u => (
                            <div key={u.id} className="admin-card admin-card--compact">
                                <div className="admin-card-body admin-card-body--no-shrink">
                                    <div className="admin-text-ellipsis">{u.email}</div>
                                    <span className={`badge-approved ${u.role === 'ADMIN' ? 'badge-approved--inline' : ''}`} style={{ marginTop: 4, display: 'inline-block' }}>
                                        {u.role}
                                    </span>
                                    <span className="admin-text-muted" style={{ marginLeft: 8, fontSize: '0.75rem' }}>
                                        {u.submissionCount} submissions
                                    </span>
                                </div>
                                <div className="admin-card-actions">
                                    <select
                                        value={u.role}
                                        onChange={e => handleRoleChange(u.id, e.target.value)}
                                        className="admin-input"
                                        style={{ width: 'auto', padding: '6px 10px', fontSize: '0.8rem' }}
                                        disabled={loading}
                                    >
                                        <option value="USER">USER</option>
                                        <option value="ADMIN">ADMIN</option>
                                    </select>
                                    <button onClick={() => setDeleteId(u.id)} className="btn-danger btn-xs">Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <ConfirmDialog
                isOpen={!!deleteId}
                title="Delete User?"
                message="This will permanently delete the user account and all associated data. This cannot be undone."
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
            />
        </div>
    );
}
