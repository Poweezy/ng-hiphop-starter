'use client';

import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import type { SongSummary, QuoteSummary, GraffitiSummary, LyricSummary, CompetitionSummary, LyricSubmissionSummary, WinnerSummary, SubscriberSummary } from '@/lib/adminTypes';

// Panels
import OverviewPanel from './OverviewPanel';
import SloganPanel from './SloganPanel';
import SongsPanel from './SongsPanel';
import QuotesPanel from './QuotesPanel';
import GraffitiPanel from './GraffitiPanel';
import LyricsPanel from './LyricsPanel';
import BestLyricsPortalPanel from './BestLyricsPortalPanel';
import SubmissionsPanel from './SubmissionsPanel';
import WinnersPanel from './WinnersPanel';
import EmailSubscribersPanel from './EmailSubscribersPanel';
import SecurityPanel from './SecurityPanel';
import UsersPanel from './UsersPanel';

import Image from 'next/image';
import ErrorBoundary from '@/components/ErrorBoundary';

export type Tab = 'overview' | 'users' | 'slogan' | 'songs' | 'quotes' | 'graffiti' | 'lyrics' | 'best-lyrics' | 'submissions' | 'winners' | 'subscribers' | 'security';

interface Props {
    initialSlogan: string;
    initialSongs: SongSummary[];
    initialQuotes: QuoteSummary[];
    initialGraffiti: GraffitiSummary[];
    initialLyrics: LyricSummary[];
    initialCompetitions: CompetitionSummary[];
    initialSubmissions: LyricSubmissionSummary[];
    initialWinners: WinnerSummary[];
    initialSubscribers: SubscriberSummary[];
    initialUsers: { id: string; email: string; role: string; createdAt: string; updatedAt: string; submissionCount: number }[];
}

const TABS: { id: Tab; label: string; icon: string; group: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📊', group: 'content' },
    { id: 'songs', label: 'Songs', icon: '🎵', group: 'content' },
    { id: 'quotes', label: 'Quotes', icon: '💬', group: 'content' },
    { id: 'graffiti', label: 'Graffiti', icon: '🎨', group: 'content' },
    { id: 'lyrics', label: 'Lyrics', icon: '🎤', group: 'content' },
    { id: 'submissions', label: 'Submissions', icon: '📝', group: 'content' },
    { id: 'best-lyrics', label: 'Competitions', icon: '🏆', group: 'management' },
    { id: 'winners', label: 'Winners', icon: '👑', group: 'management' },
    { id: 'subscribers', label: 'Subscribers', icon: '📧', group: 'management' },
    { id: 'users', label: 'Users', icon: '👥', group: 'management' },
    { id: 'slogan', label: 'Slogan', icon: '✏️', group: 'system' },
    { id: 'security', label: 'Security', icon: '🔐', group: 'system' },
];

const GROUP_LABELS: Record<string, string> = {
    content: 'Content',
    management: 'Management',
    system: 'System',
};

export default function AdminDashboard({ initialSlogan, initialSongs, initialQuotes, initialGraffiti, initialLyrics, initialCompetitions, initialSubmissions, initialWinners, initialSubscribers, initialUsers }: Props) {
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [showShortcuts, setShowShortcuts] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const tab = searchParams.get('tab') as Tab | null;
        if (tab && ['overview', 'users', 'slogan', 'songs', 'quotes', 'graffiti', 'lyrics', 'best-lyrics', 'submissions', 'winners', 'subscribers', 'security'].includes(tab)) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
                return;
            }

            if (e.key === '?') {
                setShowShortcuts((v) => !v);
                return;
            }

            if (e.key === 'Escape') {
                setShowShortcuts(false);
                return;
            }

            const tabKeys: Record<string, Tab> = {
                '1': 'overview',
                '2': 'users',
                '3': 'slogan',
                '4': 'songs',
                '5': 'quotes',
                '6': 'graffiti',
                '7': 'lyrics',
                '8': 'best-lyrics',
                '9': 'submissions',
                '0': 'winners',
                'e': 'subscribers',
                's': 'security',
            };

            const tab = tabKeys[e.key.toLowerCase()];
            if (tab) {
                e.preventDefault();
                handleTabChange(tab);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [searchParams]);

    const handleTabChange = (tab: Tab) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tab);
        router.replace(`/admin?${params.toString()}`, { scroll: false });
    };

    const handleBackToSite = () => {
        router.push('/');
    };

    const handleViewSite = () => {
        window.open('/', '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="admin-wrapper">
            {/* Top Bar */}
            <header className="admin-header">
                <div className="header-left">
                    <Image
                        src="/images/logo.png"
                        alt="Nerd Gauge Logo"
                        width={36}
                        height={36}
                        style={{ objectFit: 'contain' }}
                    />
                    <div className="header-text">
                        <div className="title">ADMIN DASHBOARD</div>
                        <div className="subtitle">Content Management Portal</div>
                    </div>
                </div>

                <div className="header-right">
                    <button onClick={handleBackToSite} className="btn btn-secondary btn-sm">
                        ← Back to Site
                    </button>
                    <button onClick={handleViewSite} className="btn btn-secondary btn-sm">
                        View Site ↗
                    </button>
                    <button
                        onClick={() => signOut({ callbackUrl: '/admin/login' })}
                        className="btn btn-danger btn-sm"
                    >
                        Sign Out
                    </button>
                </div>
            </header>

            <div className="admin-layout">
                {/* Sidebar Nav */}
                <nav className="admin-sidebar" aria-label="Admin navigation">
                    {Object.entries(GROUP_LABELS).map(([groupKey, groupLabel]) => (
                        <div key={groupKey} className="sidebar-group">
                            <div className="sidebar-group-label" aria-hidden="true">{groupLabel}</div>
                            {TABS.filter(t => t.group === groupKey).map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id)}
                                    aria-current={activeTab === tab.id ? 'page' : undefined}
                                    className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                                >
                                    <motion.span
                                        initial={false}
                                        animate={activeTab === tab.id ? { scale: 1.2 } : { scale: 1 }}
                                        className="nav-icon"
                                    >
                                        {tab.icon}
                                    </motion.span>
                                    {tab.label}
                                    {activeTab === tab.id && (
                                        <motion.div layoutId="sidebar-active" className="active-indicator" />
                                    )}
                                </button>
                            ))}
                        </div>
                    ))}
                </nav>

                {/* Main Content Area */}
                <main className="admin-main">
                    <h1 className="sr-only">Admin Dashboard</h1>
                    <ErrorBoundary>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="flex-1"
                            >
                                {activeTab === 'overview' && (
                                    <OverviewPanel 
                                        songs={initialSongs} 
                                        quotes={initialQuotes} 
                                        graffiti={initialGraffiti} 
                                        lyrics={initialLyrics}
                                        userCount={initialUsers.length}
                                        onNavigate={setActiveTab} 
                                    />
                                )}
                                {activeTab === 'users' && (
                                    <UsersPanel initialUsers={initialUsers} />
                                )}
                                {activeTab === 'slogan' && <SloganPanel initialSlogan={initialSlogan} />}
                                {activeTab === 'songs' && <SongsPanel initialSongs={initialSongs} />}
                                {activeTab === 'quotes' && <QuotesPanel initialQuotes={initialQuotes} />}
                                {activeTab === 'graffiti' && <GraffitiPanel initialGraffiti={initialGraffiti} />}
                                {activeTab === 'lyrics' && <LyricsPanel initialLyrics={initialLyrics} />}
                                {activeTab === 'best-lyrics' && (
                                    <BestLyricsPortalPanel
                                        initialCompetitions={initialCompetitions}
                                        initialSubmissions={initialSubmissions}
                                        initialWinners={initialWinners}
                                        initialSubscribers={initialSubscribers}
                                    />
                                )}
                                {activeTab === 'submissions' && (
                                    <SubmissionsPanel initialSubmissions={initialSubmissions} />
                                )}
                                {activeTab === 'winners' && (
                                    <WinnersPanel initialWinners={initialWinners} />
                                )}
                                {activeTab === 'subscribers' && (
                                    <EmailSubscribersPanel initialSubscribers={initialSubscribers} />
                                )}
                                {activeTab === 'security' && <SecurityPanel />}
                            </motion.div>
                        </AnimatePresence>
                    </ErrorBoundary>
                </main>
            </div>

            <style jsx>{`
                .admin-wrapper {
                    min-height: 100vh;
                    background: #050508;
                    display: flex;
                    flex-direction: column;
                    font-family: 'Inter', sans-serif;
                }

                .admin-header {
                    background: rgba(0, 0, 0, 0.95);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    padding: 16px 32px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    position: sticky;
                    top: 0;
                    z-index: 100;
                    backdrop-filter: blur(10px);
                }

                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                }

                .logo {
                    font-family: var(--font-cursive);
                    font-size: 2rem;
                    background: linear-gradient(135deg, #a855f7, #3b82f6);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .title {
                    font-family: var(--font-condensed);
                    font-size: 1rem;
                    font-weight: 700;
                    letter-spacing: 0.15em;
                    color: white;
                }

                .subtitle {
                    font-size: 0.75rem;
                    color: var(--color-grey-blue);
                    letter-spacing: 0.05em;
                    margin-top: 2px;
                }

                .header-right {
                    display: flex;
                    gap: 16px;
                    align-items: center;
                }

                .admin-layout {
                    display: flex;
                    flex: 1;
                }

                .admin-sidebar {
                    width: 240px;
                    background: rgba(0, 0, 0, 0.3);
                    border-right: 1px solid rgba(255, 255, 255, 0.05);
                    padding: 32px 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    flex-shrink: 0;
                }

                .nav-item {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 14px 20px;
                    border-radius: 12px;
                    border: none;
                    cursor: pointer;
                    background: transparent;
                    color: rgba(255, 255, 255, 0.5);
                    font-family: var(--font-condensed);
                    font-size: 0.95rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    transition: all 0.2s ease;
                    position: relative;
                }

                .nav-item:hover {
                    color: white;
                    background: rgba(255, 255, 255, 0.03);
                }

                .nav-item.active {
                    color: var(--color-purple-light);
                    background: rgba(139, 92, 246, 0.08);
                }

                .nav-icon {
                    font-size: 1.2rem;
                }

                .active-indicator {
                    position: absolute;
                    left: 0;
                    top: 25%;
                    bottom: 25%;
                    width: 3px;
                    background: var(--color-purple);
                    border-radius: 0 4px 4px 0;
                }

                .sidebar-group {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .sidebar-group + .sidebar-group {
                    margin-top: 16px;
                    padding-top: 16px;
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                }

                .sidebar-group-label {
                    font-family: var(--font-condensed);
                    font-size: 0.65rem;
                    font-weight: 700;
                    letter-spacing: 0.2em;
                    text-transform: uppercase;
                    color: rgba(255, 255, 255, 0.25);
                    padding: 0 20px 8px;
                }

                .admin-main {
                    flex: 1;
                    padding: 40px;
                    overflow-y: auto;
                    background: radial-gradient(circle at top right, rgba(139, 92, 246, 0.03), transparent 40%);
                }

                .btn-danger {
                    background: rgba(239, 68, 68, 0.1);
                    color: #ef4444;
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    padding: 8px 20px;
                    border-radius: 8px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .btn-danger:hover {
                    background: #ef4444;
                    color: white;
                }

                @media (max-width: 768px) {
                    .admin-header {
                        padding: 16px;
                        flex-direction: column;
                        align-items: stretch;
                        gap: 16px;
                    }
                    .header-left {
                        justify-content: center;
                    }
                    .header-right {
                        justify-content: center;
                        gap: 12px;
                    }
                    .admin-sidebar {
                        width: 80px;
                        padding: 24px 8px;
                    }
                    .nav-item {
                        padding: 14px;
                        justify-content: center;
                        font-size: 0;
                    }
                    .nav-icon {
                        margin: 0;
                    }
                    .admin-main {
                        padding: 24px 16px;
                    }

                    .shortcuts-overlay {
                        position: fixed;
                        inset: 0;
                        background: rgba(0, 0, 0, 0.8);
                        backdrop-filter: blur(8px);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 2000;
                        padding: 24px;
                    }

                    .shortcuts-modal {
                        background: var(--color-bg-card);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: var(--radius-lg);
                        padding: 32px;
                        max-width: 480px;
                        width: 100%;
                        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
                    }

                    .shortcuts-title {
                        font-family: var(--font-display);
                        font-size: 1.5rem;
                        color: white;
                        margin-bottom: 24px;
                        letter-spacing: 0.05em;
                    }

                    .shortcuts-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 12px;
                    }

                    .shortcut-item {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        font-size: 0.85rem;
                        color: rgba(255, 255, 255, 0.7);
                    }

                    .shortcut-item kbd {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        min-width: 28px;
                        height: 28px;
                        padding: 0 8px;
                        background: rgba(255, 255, 255, 0.08);
                        border: 1px solid rgba(255, 255, 255, 0.15);
                        border-radius: 6px;
                        font-family: var(--font-condensed);
                        font-size: 0.75rem;
                        font-weight: 700;
                        color: white;
                        text-transform: uppercase;
                    }

                    @media (max-width: 480px) {
                        .shortcuts-grid {
                            grid-template-columns: 1fr;
                        }
                    }
                }
            `}</style>
            {showShortcuts && (
                <div className="shortcuts-overlay" onClick={() => setShowShortcuts(false)}>
                    <div className="shortcuts-modal" onClick={(e) => e.stopPropagation()}>
                        <h3 className="shortcuts-title">Keyboard Shortcuts</h3>
                        <div className="shortcuts-grid">
                            <div className="shortcut-item"><kbd>1</kbd>–<kbd>9</kbd><span>Switch tabs</span></div>
                            <div className="shortcut-item"><kbd>0</kbd><span>Winners tab</span></div>
                            <div className="shortcut-item"><kbd>E</kbd><span>Email Subscribers</span></div>
                            <div className="shortcut-item"><kbd>S</kbd><span>Security</span></div>
                            <div className="shortcut-item"><kbd>?</kbd><span>Toggle this help</span></div>
                            <div className="shortcut-item"><kbd>Esc</kbd><span>Close dialogs</span></div>
                        </div>
                        <button onClick={() => setShowShortcuts(false)} className="btn btn-secondary btn-sm" style={{ marginTop: 20 }}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
}
