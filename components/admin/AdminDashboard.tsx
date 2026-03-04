'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';

// Panels
import SloganPanel from './SloganPanel';
import SongsPanel from './SongsPanel';
import QuotesPanel from './QuotesPanel';
import GraffitiPanel from './GraffitiPanel';
import LyricsPanel from './LyricsPanel';

type Tab = 'slogan' | 'songs' | 'quotes' | 'graffiti' | 'lyrics';

interface Props {
    initialSlogan: string;
    initialSongs: any[];
    initialQuotes: any[];
    initialGraffiti: any[];
    initialLyrics: any[];
}

const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'slogan', label: 'Slogan', icon: '✏️' },
    { id: 'songs', label: 'Songs', icon: '🎵' },
    { id: 'quotes', label: 'Quotes', icon: '💬' },
    { id: 'graffiti', label: 'Graffiti', icon: '🎨' },
    { id: 'lyrics', label: 'Lyrics', icon: '🎤' },
];

export default function AdminDashboard({ initialSlogan, initialSongs, initialQuotes, initialGraffiti, initialLyrics }: Props) {
    const [activeTab, setActiveTab] = useState<Tab>('slogan');

    return (
        <div
            style={{
                minHeight: '100vh',
                background: 'var(--color-black)',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: 'var(--font-body)',
            }}
        >
            {/* Top Bar */}
            <header
                style={{
                    background: 'rgba(0,0,0,0.9)',
                    borderBottom: '1px solid rgba(4,120,87,0.3)',
                    padding: '16px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    position: 'sticky',
                    top: 0,
                    zIndex: 100,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span
                        style={{
                            fontFamily: 'var(--font-cursive)',
                            fontSize: '1.8rem',
                            background: 'linear-gradient(135deg,#a855f7,#3b82f6)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}
                    >
                        NG
                    </span>
                    <div>
                        <div
                            style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: '1rem',
                                letterSpacing: '0.15em',
                                color: 'var(--color-white)',
                            }}
                        >
                            ADMIN DASHBOARD
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-grey-blue)', letterSpacing: '0.06em' }}>
                            Content Management Portal
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <a
                        href="/"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            fontFamily: 'var(--font-condensed)',
                            fontSize: '0.8rem',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            color: 'var(--color-grey-blue)',
                            padding: '8px 16px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '4px',
                            transition: 'all 0.2s ease',
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)')}
                        onMouseOut={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                    >
                        View Site ↗
                    </a>
                    <button
                        onClick={() => signOut({ callbackUrl: '/admin/login' })}
                        className="btn-danger"
                        style={{ fontSize: '0.8rem' }}
                    >
                        Sign Out
                    </button>
                </div>
            </header>

            <div style={{ display: 'flex', flex: 1 }}>
                {/* Sidebar Nav */}
                <nav
                    style={{
                        width: '220px',
                        background: 'rgba(0,0,0,0.5)',
                        borderRight: '1px solid rgba(255,255,255,0.06)',
                        padding: '24px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        flexShrink: 0,
                    }}
                >
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px 16px',
                                borderRadius: '6px',
                                border: 'none',
                                cursor: 'pointer',
                                textAlign: 'left',
                                fontFamily: 'var(--font-condensed)',
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase',
                                transition: 'all 0.2s ease',
                                background: activeTab === tab.id ? 'rgba(4,120,87,0.15)' : 'transparent',
                                color: activeTab === tab.id ? 'var(--color-green-light)' : 'rgba(255,255,255,0.5)',
                                borderLeft: activeTab === tab.id ? '3px solid var(--color-green)' : '3px solid transparent',
                            }}
                            onMouseOver={(e) => {
                                if (activeTab !== tab.id) (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.8)';
                            }}
                            onMouseOut={(e) => {
                                if (activeTab !== tab.id) (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.5)';
                            }}
                        >
                            <span style={{ fontSize: '1rem' }}>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </nav>

                {/* Main Content Area */}
                <main style={{ flex: 1, padding: 'clamp(20px, 3vw, 40px)', overflowY: 'auto' }}>
                    {activeTab === 'slogan' && <SloganPanel initialSlogan={initialSlogan} />}
                    {activeTab === 'songs' && <SongsPanel initialSongs={initialSongs} />}
                    {activeTab === 'quotes' && <QuotesPanel initialQuotes={initialQuotes} />}
                    {activeTab === 'graffiti' && <GraffitiPanel initialGraffiti={initialGraffiti} />}
                    {activeTab === 'lyrics' && <LyricsPanel initialLyrics={initialLyrics} />}
                </main>
            </div>
        </div>
    );
}
