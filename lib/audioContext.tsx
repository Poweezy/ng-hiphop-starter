'use client';

import { createContext, useContext, useEffect, useState, useRef, useCallback, type ReactNode } from 'react';

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

const MEDIA_SESSION_SUPPORTED =
  typeof navigator !== 'undefined' && 'mediaSession' in navigator;

function artworkType(url: string): string {
  if (/\.png(\?|$)/i.test(url)) return 'image/png';
  if (/\.webp(\?|$)/i.test(url)) return 'image/webp';
  if (/\.gif(\?|$)/i.test(url)) return 'image/gif';
  return 'image/jpeg';
}

/** Expose the current track to the OS so mobile lock screens / notification
 *  trays show artwork and working play/pause controls. */
function updateMediaSession(song: Song) {
  if (!MEDIA_SESSION_SUPPORTED) return;
  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title,
      artist: 'Nerd Gauge',
      album: 'Nerd Gauge',
      artwork: [{ src: song.cover_url, sizes: '512x512', type: artworkType(song.cover_url) }],
    });
    navigator.mediaSession.playbackState = 'playing';
  } catch {
    // MediaSession is best-effort; never break playback over it.
  }
}

function setMediaSessionState(state: 'playing' | 'paused' | 'none') {
  if (!MEDIA_SESSION_SUPPORTED) return;
  try {
    navigator.mediaSession.playbackState = state;
  } catch {
    // ignore
  }
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
    setMediaSessionState(playing ? 'playing' : 'paused');
  }, []);

  const pause = useCallback(() => {
    activeElRef.current?.pause();
    remoteRef.current?.pause();
    setIsPlaying(false);
    setMediaSessionState('paused');
  }, []);

  const play = useCallback((song: Song, el?: HTMLAudioElement) => {
    updateMediaSession(song);
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
    setMediaSessionState('none');
  }, []);

  // Wire OS media keys / lock-screen controls once.
  useEffect(() => {
    if (!MEDIA_SESSION_SUPPORTED) return;
    const ms = navigator.mediaSession;
    try {
      ms.setActionHandler('play', () => toggle());
      ms.setActionHandler('pause', () => pause());
      ms.setActionHandler('stop', () => close());
    } catch {
      // Action handlers are optional per spec.
    }
    return () => {
      try {
        ms.setActionHandler('play', null);
        ms.setActionHandler('pause', null);
        ms.setActionHandler('stop', null);
      } catch {
        // ignore
      }
    };
  }, [toggle, pause, close]);

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

