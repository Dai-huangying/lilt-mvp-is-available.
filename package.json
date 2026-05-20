import { useState, useCallback, useRef, useEffect } from 'react';

export interface UseAudioPlayerReturn {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isReady: boolean;
  error: string | null;
  waveformData: number[];
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  startAudioContext: () => Promise<void>;
  audioContext: AudioContext | null;
  analyser: AnalyserNode | null;
  mediaElementSource: MediaElementAudioSourceNode | null;
}

function resolveAudioUrl(audioUrl: string): string {
  if (!audioUrl) return '';
  if (audioUrl.startsWith('http://') || audioUrl.startsWith('https://')) {
    return audioUrl;
  }
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${audioUrl}`;
  }
  return audioUrl;
}

export function useAudioPlayer(audioUrl: string): UseAudioPlayerReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waveformData, setWaveformData] = useState<number[]>(Array(80).fill(0.3));
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const updateIntervalRef = useRef<number | null>(null);

  // Initialize audio element
  useEffect(() => {
    if (!audioUrl) return;

    const resolvedUrl = resolveAudioUrl(audioUrl);
    audioRef.current = new Audio(resolvedUrl);
    const audio = audioRef.current;
    
    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
      setIsReady(true);
      setError(null);
    });

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
    });

    audio.addEventListener('error', () => {
      setError('Failed to load audio');
      setIsReady(false);
    });

    return () => {
      audio.pause();
      audio.src = '';
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [audioUrl]);

  // Initialize audio context for visualization
  const startAudioContext = useCallback(async () => {
    if (audioContextRef.current || !audioRef.current) return;

    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);

      sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
    } catch (err) {
      console.error('Failed to initialize audio context:', err);
    }
  }, []);

  // Update waveform visualization
  const updateWaveform = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current) return;

    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    
    const normalizedData = Array.from(dataArrayRef.current)
      .slice(0, 80)
      .map(value => value / 255);
    
    setWaveformData(normalizedData);
    animationFrameRef.current = requestAnimationFrame(updateWaveform);
  }, []);

  // Play
  const play = useCallback(async () => {
    if (!audioRef.current) return;

    // Start audio context on user interaction (required for most browsers)
    if (!audioContextRef.current) {
      await startAudioContext();
    }

    try {
      await audioRef.current.play();
      setIsPlaying(true);
      setError(null);
      
      // Start waveform animation
      if (audioContextRef.current && analyserRef.current) {
        updateWaveform();
      }
    } catch (err) {
      setError('Failed to play audio');
      console.error('Play error:', err);
    }
  }, [startAudioContext, updateWaveform]);

  // Pause
  const pause = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setIsPlaying(false);
  }, []);

  // Toggle play/pause
  const togglePlay = useCallback(async () => {
    if (isPlaying) {
      pause();
    } else {
      await play();
    }
  }, [isPlaying, play, pause]);

  // Seek to specific time
  const seekTo = useCallback((time: number) => {
    if (!audioRef.current) return;
    const newTime = Math.max(0, Math.min(time, duration));
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, [duration]);

  // Set volume
  const setVolume = useCallback((volume: number) => {
    if (!audioRef.current) return;
    audioRef.current.volume = Math.max(0, Math.min(1, volume));
  }, []);

  return {
    isPlaying,
    currentTime,
    duration,
    isReady,
    error,
    waveformData,
    play,
    pause,
    togglePlay,
    seekTo,
    setVolume,
    startAudioContext,
    audioContext: audioContextRef.current,
    analyser: analyserRef.current,
    mediaElementSource: sourceRef.current
  };
}