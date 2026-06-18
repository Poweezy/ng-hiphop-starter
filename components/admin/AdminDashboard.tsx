'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';

// Panels
import OverviewPanel from './OverviewPanel';
import SloganPanel from './SloganPanel';
import SongsPanel from './SongsPanel';
import QuotesPanel from './QuotesPanel';
import GraffitiPanel from './GraffitiPanel';
import LyricsPanel from './LyricsPanel';
import SecurityPanel from './SecurityPanel';

import Image from 'next/image';

export type Tab = 'overview' | 'slogan' | 'songs' | 'quotes' | 'graffiti' | 'lyrics' | 'security';

interface Props {
    initialSlogan: string;
    initialSongs: any[];
    initialQuotes: any[];
    initialGraffiti: any[];
    initialLyrics: any[];
}

const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'slogan', label: 'Slogan', icon: '✏️' },
    { id: 'songs', label: 'Songs', icon: '🎵' },
    { id: 'quotes', label: 'Quotes', icon: '💬' },
    { id: 'graffiti', label: 'Graffiti', icon: '🎨' },
    { id: 'lyrics', label: 'Lyrics', icon: '🎤' },
    { id: 'security', label: 'Security', icon: '🔐' },
];

export default function AdminDashboard({ initialSlogan, initialSongs, initialQuotes, initialGraffiti, initialLyrics }: Props) {
    const [activeTab, setActiveTab] = useState<Tab>('overview');

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
                    <a href="/" target="_blank" rel="noopener noreferrer" className="btn-outline">
                        View Site ↗
                    </a>
                    <button
                        onClick={() => signOut({ callbackUrl: '/admin/login' })}
                        className="btn-danger"
                    >
                        Sign Out
                    </button>
                </div>
            </header>

            <div className="admin-layout">
                {/* Sidebar Nav */}
                <nav className="admin-sidebar">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
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
                </nav>

                {/* Main Content Area */}
                <main className="admin-main">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            style={{ flex: 1 }}
                        >
                            {activeTab === 'overview' && (
                                <OverviewPanel 
                                    songs={initialSongs} 
                                    quotes={initialQuotes} 
                                    graffiti={initialGraffiti} 
                                    lyrics={initialLyrics} 
                                    onNavigate={setActiveTab} 
                                />
                            )}
                            {activeTab === 'slogan' && <SloganPanel initialSlogan={initialSlogan} />}
                            {activeTab === 'songs' && <SongsPanel initialSongs={initialSongs} />}
                            {activeTab === 'quotes' && <QuotesPanel initialQuotes={initialQuotes} />}
                            {activeTab === 'graffiti' && <GraffitiPanel initialGraffiti={initialGraffiti} />}
                            {activeTab === 'lyrics' && <LyricsPanel initialLyrics={initialLyrics} />}
                            {activeTab === 'security' && <SecurityPanel />}
                        </motion.div>
                    </AnimatePresence>
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

                .btn-outline {
                    font-family: var(--font-condensed);
                    font-size: 0.8rem;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    color: var(--color-grey-blue);
                    padding: 8px 20px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    transition: all 0.2s ease;
                    text-decoration: none;
                }

                .btn-outline:hover {
                    border-color: rgba(255, 255, 255, 0.3);
                    color: white;
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
                }
            `}</style>
        </div>
    );
}
