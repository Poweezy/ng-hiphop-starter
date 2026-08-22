'use client';

import { createContext, useContext, useState, useRef, useCallback, type ReactNode } from 'react';

interface Song {
  id: string;
  title: string;
  description?: string | null;
  file_url: string;
  cover_url: string;
}

interface AudioContextValue {
  currentSong: Song | null;
  isPlaying: boolean;
  play: (song: Song) => void;
  pause: () => void;
  toggle: (song?: Song) => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

const AudioContext = createContext<AudioContextValue | null>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = useCallback((song: Song) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentSong?.id === song.id) {
      audio.play().catch(() => {});
      setIsPlaying(true);
      return;
    }

    setCurrentSong(song);
    audio.src = song.file_url;
    audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  }, [currentSong?.id]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const toggle = useCallback((song?: Song) => {
    if (song && currentSong?.id !== song.id) {
      play(song);
      return;
    }
    if (isPlaying) {
      pause();
    } else if (currentSong) {
      audioRef.current?.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [currentSong?.id, isPlaying, play, pause]);

  return (
    <AudioContext.Provider value={{ currentSong, isPlaying, play, pause, toggle, audioRef }}>
      {children}
      <audio
        ref={audioRef}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        className="sr-only"
        aria-hidden="true"
      />
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error('useAudio must be used within AudioProvider');
  return ctx;
}
