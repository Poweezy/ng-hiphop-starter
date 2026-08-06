'use client';

import { useState } from 'react';
import { useToast } from '@/components/ToastProvider';
import PasswordStrength from '@/components/PasswordStrength';

function PasswordInput({ id, label, value, onChange, placeholder, required = true }: { id: string; label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean }) {
    const [visible, setVisible] = useState(false);
    return (
        <div className="form-group">
            <label htmlFor={id}>{label}</label>
            <div style={{ position: 'relative' }}>
                <input
                    id={id}
                    type={visible ? 'text' : 'password'}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    required={required}
                    style={{ paddingRight: 44 }}
                />
                <button
                    type="button"
                    onClick={() => setVisible(v => !v)}
                    aria-label={visible ? 'Hide password' : 'Show password'}
                    style={{
                        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
                        cursor: 'pointer', fontSize: '0.8rem', padding: '4px 8px'
                    }}
                >
                    {visible ? '🙈' : '👁️'}
                </button>
            </div>
        </div>
    );
}

export default function SecurityPanel() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const toast = useToast();

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
                <PasswordInput
                    id="current-password"
                    label="Current Password"
                    value={currentPassword}
                    onChange={setCurrentPassword}
                    placeholder="••••••••"
                />

                <PasswordInput
                    id="new-password"
                    label="New Password"
                    value={newPassword}
                    onChange={setNewPassword}
                    placeholder="Min 8 characters"
                />
                <PasswordStrength password={newPassword} />

                <PasswordInput
                    id="confirm-password"
                    label="Confirm New Password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    placeholder="Retype password"
                />

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
