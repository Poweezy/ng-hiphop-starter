'use client';

import { motion } from 'framer-motion';
import type { SongSummary, QuoteSummary, GraffitiSummary, LyricSummary } from '@/lib/adminTypes';

interface OverviewPanelProps {
    songs: SongSummary[];
    quotes: QuoteSummary[];
    graffiti: GraffitiSummary[];
    lyrics: LyricSummary[];
    userCount?: number;
    onNavigate: (tab: "slogan" | "songs" | "quotes" | "graffiti" | "lyrics" | "users") => void;
}

export default function OverviewPanel({ songs, quotes, graffiti, lyrics, userCount = 0, onNavigate }: OverviewPanelProps) {
    const activeSong = songs.find(s => s.is_active);
    const pendingQuotes = quotes.filter(q => !q.approved).length;
    const pendingGraffiti = graffiti.filter(g => !g.approved).length;

    const cards = [
        {
            title: 'Music Library',
            value: songs.length,
            label: 'Total Tracks',
            highlight: activeSong ? `Active: ${activeSong.title}` : 'No active track',
            icon: '🎵',
            action: () => onNavigate('songs'),
            actionText: 'Manage Songs',
            color: 'var(--color-purple)'
        },
        {
            title: 'Registered Users',
            value: userCount,
            label: 'Total Users',
            highlight: 'Active community',
            icon: '👥',
            action: () => onNavigate('users'),
            actionText: 'Manage Users',
            color: 'var(--color-blue)'
        },
        {
            title: 'Community Quotes',
            value: pendingQuotes,
            label: 'Pending Approval',
            highlight: `${quotes.filter(q => q.approved).length} Approved`,
            icon: '💬',
            action: () => onNavigate('quotes'),
            actionText: pendingQuotes > 0 ? 'Review Quotes' : 'Manage Quotes',
            color: pendingQuotes > 0 ? '#F59E0B' : 'var(--color-green-light)'
        },
        {
            title: 'Graffiti Wall',
            value: pendingGraffiti,
            label: 'Pending Approval',
            highlight: `${graffiti.filter(g => g.approved).length} Live`,
            icon: '🎨',
            action: () => onNavigate('graffiti'),
            actionText: pendingGraffiti > 0 ? 'Review Artwork' : 'View Wall',
            color: pendingGraffiti > 0 ? '#F59E0B' : 'var(--color-green-light)'
        },
        {
            title: 'Lyric Game',
            value: lyrics.length,
            label: 'Total Entries',
            highlight: 'Interactive Challenge',
            icon: '🎤',
            action: () => onNavigate('lyrics'),
            actionText: 'Manage Lyrics',
            color: 'var(--color-yellow)'
        }
    ];

    return (
        <div className="overview-panel">
            <div className="overview-header">
                <div>
                    <h2 className="panel-title">PLATFORM OVERVIEW</h2>
                    <p className="panel-desc">Quick insights and pending actions for NG Hip Hop.</p>
                </div>
            </div>

            <div className="stat-grid">
                {cards.map((card, i) => (
                    <motion.div
                        key={card.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="stat-card"
                    >
                        <div className="card-header">
                            <span className="card-icon" style={{ color: card.color }}>{card.icon}</span>
                            <h3 className="card-title">{card.title}</h3>
                        </div>
                        <div className="card-body">
                            <div className="card-main-stat">
                                <span className="stat-value">{card.value}</span>
                                <span className="stat-label">{card.label}</span>
                            </div>
                            <p className="card-highlight">{card.highlight}</p>
                        </div>
                        <div className="card-footer">
                            <button onClick={card.action} className="action-btn" style={{ borderColor: card.color, color: card.color }}>
                                {card.actionText} →
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            <style jsx>{`
                .overview-panel {
                    animation: fadeIn 0.4s ease;
                }
                .panel-title {
                    font-family: var(--font-display);
                    font-size: 2rem;
                    letter-spacing: 0.05em;
                    margin-bottom: 8px;
                    color: white;
                }
                .panel-desc {
                    color: var(--color-grey-blue);
                    font-size: 0.9rem;
                    margin-bottom: 32px;
                }
                .stat-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 24px;
                }
                .stat-card {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 16px;
                    padding: 24px;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    height: 100%;
                    transition: all 0.3s ease;
                }
                .stat-card:hover {
                    background: rgba(255, 255, 255, 0.05);
                    border-color: rgba(255, 255, 255, 0.15);
                    transform: translateY(-4px);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                }
                .card-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 24px;
                }
                .card-icon {
                    font-size: 1.5rem;
                    background: rgba(255, 255, 255, 0.05);
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 8px;
                }
                .card-title {
                    font-family: var(--font-condensed);
                    font-weight: 700;
                    letter-spacing: 0.1em;
                    text-transform: uppercase;
                    color: white;
                    font-size: 1rem;
                }
                .card-body {
                    margin-bottom: 24px;
                    flex: 1;
                }
                .card-main-stat {
                    display: flex;
                    align-items: baseline;
                    gap: 8px;
                    margin-bottom: 8px;
                }
                .stat-value {
                    font-size: 3rem;
                    font-weight: 700;
                    line-height: 1;
                    color: white;
                }
                .stat-label {
                    font-size: 0.8rem;
                    color: rgba(255, 255, 255, 0.6);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .card-highlight {
                    font-size: 0.85rem;
                    color: var(--color-grey-blue);
                    background: rgba(255, 255, 255, 0.05);
                    padding: 6px 12px;
                    border-radius: 4px;
                    display: inline-block;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 100%;
                }
                .card-footer {
                    margin-top: auto;
                }
                .action-btn {
                    width: 100%;
                    background: transparent;
                    border: 1px solid;
                    border-radius: 8px;
                    padding: 10px;
                    font-family: var(--font-condensed);
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .action-btn:hover {
                    background: rgba(255, 255, 255, 0.05);
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
