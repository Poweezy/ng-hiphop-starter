'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function SecurityPanel() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (newPassword.length < 8) {
            toast.error('New password must be at least 8 characters');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/admin/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to update password');

            toast.success('Password updated successfully');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="panel-container">
            <div className="panel-header">
                <h2>Security Settings</h2>
                <p>Update your administrator password regularly to keep the dashboard secure.</p>
            </div>

            <form onSubmit={handleSubmit} className="security-form">
                <div className="form-group">
                    <label>Current Password</label>
                    <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                    />
                </div>

                <div className="form-group">
                    <label>New Password</label>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 8 characters"
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Confirm New Password</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Retype password"
                        required
                    />
                </div>

                <button type="submit" className="btn-save" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Password'}
                </button>
            </form>

            <style jsx>{`
                .panel-container {
                    padding: 24px;
                    background: rgba(255, 255, 255, 0.02);
                    border-radius: 16px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    max-width: 500px;
                }

                .panel-header h2 {
                    font-family: var(--font-display);
                    font-size: 1.5rem;
                    color: white;
                    margin-bottom: 8px;
                }

                .panel-header p {
                    color: var(--color-grey-blue);
                    font-size: 0.9rem;
                    margin-bottom: 32px;
                }

                .security-form {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .form-group label {
                    font-size: 0.8rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    color: var(--color-purple-light);
                }

                .form-group input {
                    padding: 12px 16px;
                    background: rgba(255, 255, 255, 0.04);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 8px;
                    color: white;
                    font-size: 0.95rem;
                    transition: all 0.2s ease;
                }

                .form-group input:focus {
                    outline: none;
                    border-color: var(--color-purple);
                    background: rgba(139, 92, 246, 0.05);
                }

                .btn-save {
                    margin-top: 12px;
                    padding: 12px;
                    background: var(--color-purple);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .btn-save:hover:not(:disabled) {
                    background: #7c3aed;
                    transform: translateY(-2px);
                }

                .btn-save:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    );
}
