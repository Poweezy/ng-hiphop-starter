'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { useAudio } from '@/lib/audioContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function MiniPlayer() {
  const { currentSong, isPlaying, toggle, close } = useAudio();

  useEffect(() => {
    if (currentSong) {
      document.body.classList.add('has-mini-player');
    } else {
      document.body.classList.remove('has-mini-player');
    }
    return () => document.body.classList.remove('has-mini-player');
  }, [currentSong]);

  if (!currentSong) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="mini-player"
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        role="region"
        aria-label="Audio player"
      >
        <div className="mini-player-inner">
          <div className="mini-player-cover">
            <Image
              src={currentSong.cover_url}
              alt={currentSong.title}
              width={48}
              height={48}
              className="mini-player-cover-img"
            />
          </div>

          <div className="mini-player-info">
            <p className="mini-player-title">{currentSong.title}</p>
            <p className="mini-player-status">
              {isPlaying ? 'Now Playing' : 'Paused'}
            </p>
          </div>

          <div className="mini-player-controls">
            <button
              onClick={() => toggle()}
              className="mini-player-btn"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <button
              onClick={close}
              className="mini-player-btn mini-player-btn--close"
              aria-label="Close player"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
