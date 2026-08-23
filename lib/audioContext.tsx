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
  /**
   * Register playback. Call from an inline <audio> element's onPlay handler,
   * passing the element so the provider can pause every other source and
   * route MiniPlayer controls to it. Called without an element (Play All /
   * Shuffle), the provider plays through its own headless audio element.
   */
  play: (song: Song, el?: HTMLAudioElement) => void;
  pause: () => void;
  toggle: () => void;
  close: () => void;
  syncPlaying: (playing: boolean) => void;
}

const AudioContext = createContext<AudioContextValue | null>(null);

function pauseOtherAudio(except: HTMLAudioElement | null) {
  document.querySelectorAll('audio').forEach((el) => {
    if (el !== except && !el.paused) {
      el.pause();
    }
  });
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const activeElRef = useRef<HTMLAudioElement | null>(null);
  const remoteRef = useRef<HTMLAudioElement | null>(null);
  const currentIdRef = useRef<string | null>(null);

  const ensureRemote = useCallback(() => {
    if (!remoteRef.current) {
      const audio = new Audio();
      audio.preload = 'metadata';
      audio.addEventListener('play', () => setIsPlaying(true));
      audio.addEventListener('pause', () => setIsPlaying(false));
      audio.addEventListener('ended', () => setIsPlaying(false));
      remoteRef.current = audio;
    }
    return remoteRef.current;
  }, []);

  const syncPlaying = useCallback((playing: boolean) => {
    setIsPlaying(playing);
  }, []);

  const pause = useCallback(() => {
    activeElRef.current?.pause();
    remoteRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const play = useCallback((song: Song, el?: HTMLAudioElement) => {
    if (el) {
      // The inline element is already playing natively — take ownership of it,
      // mute everything else, and mirror state for the MiniPlayer.
      pauseOtherAudio(el);
      activeElRef.current = el;
      currentIdRef.current = song.id;
      setCurrentSong(song);
      setIsPlaying(true);
      return;
    }

    // Programmatic playback through the headless element.
    const audio = ensureRemote();
    pauseOtherAudio(audio);
    activeElRef.current = null;
    if (currentIdRef.current !== song.id) {
      audio.src = song.file_url;
      currentIdRef.current = song.id;
    }
    setCurrentSong(song);
    audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  }, [ensureRemote]);

  const toggle = useCallback(() => {
    const el = activeElRef.current ?? remoteRef.current;
    if (!el || !currentIdRef.current) return;
    if (el.paused) {
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, []);

  const close = useCallback(() => {
    activeElRef.current?.pause();
    remoteRef.current?.pause();
    activeElRef.current = null;
    currentIdRef.current = null;
    setCurrentSong(null);
    setIsPlaying(false);
  }, []);

  return (
    <AudioContext.Provider value={{ currentSong, isPlaying, play, pause, toggle, close, syncPlaying }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error('useAudio must be used within AudioProvider');
  return ctx;
}
