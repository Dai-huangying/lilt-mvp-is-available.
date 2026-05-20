import { useState, useCallback, useRef, useEffect } from 'react';
import { RecordingMetadata } from '@/types/recording';

export type RecorderState = 'idle' | 'requesting' | 'recording' | 'stopped';

export interface UseRecorderReturn {
  state: RecorderState;
  audioBlob: Blob | null;
  blobUrl: string | null;
  duration: number;
  waveformData: number[];
  startRecording: (lyricInfo?: { lyricLineId: number; lyricText: string }) => Promise<void>;
  stopRecording: () => RecordingMetadata | null;
  reset: () => void;
}

export function useRecorder(): UseRecorderReturn {
  const [state, setState] = useState<RecorderState>('idle');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>(Array(80).fill(0.3));
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lyricInfoRef = useRef<{ lyricLineId: number; lyricText: string } | null>(null);

  const updateWaveform = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current || state !== 'recording') return;
    
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    
    const normalizedData = Array.from(dataArrayRef.current)
      .slice(0, 80)
      .map(value => value / 255);
    
    setWaveformData(normalizedData);
    animationFrameRef.current = requestAnimationFrame(updateWaveform);
  }, [state]);

  const startRecording = useCallback(async (lyricInfo?: { lyricLineId: number; lyricText: string }) => {
    try {
      setState('requesting');
      
      if (lyricInfo) {
        lyricInfoRef.current = lyricInfo;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);
      
      const mimeType = 'audio/webm';
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioBlob(event.data);
        }
      };
      
      mediaRecorderRef.current.start(100);
      setState('recording');
      startTimeRef.current = Date.now();
      setDuration(0);
      
      durationIntervalRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 100);
      
      animationFrameRef.current = requestAnimationFrame(updateWaveform);
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      setState('idle');
      throw error;
    }
  }, [updateWaveform]);

  const stopRecording = useCallback((): RecordingMetadata | null => {
    if (mediaRecorderRef.current && state === 'recording') {
      mediaRecorderRef.current.stop();
      setState('stopped');
      
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      
      const finalDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const finalBlob = audioBlob;
      
      if (finalBlob) {
        const newBlobUrl = URL.createObjectURL(finalBlob);
        setBlobUrl(newBlobUrl);
        
        const metadata: RecordingMetadata = {
          id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          lyricLineId: lyricInfoRef.current?.lyricLineId ?? 0,
          lyricText: lyricInfoRef.current?.lyricText ?? '',
          duration: finalDuration,
          timestamp: new Date(),
          blobUrl: newBlobUrl,
          mimeType: 'audio/webm',
        };
        
        console.log('[Recorder] Recording stopped:', {
          id: metadata.id,
          duration: metadata.duration,
          lyric: metadata.lyricText,
          blobUrl: metadata.blobUrl,
        });
        
        return metadata;
      }
      
      return null;
    }
    return null;
  }, [state, audioBlob]);

  const reset = useCallback(() => {
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
    }
    
    stopRecording();
    setAudioBlob(null);
    setBlobUrl(null);
    setDuration(0);
    setWaveformData(Array(80).fill(0.3));
    setState('idle');
    lyricInfoRef.current = null;
  }, [stopRecording, blobUrl]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (mediaRecorderRef.current?.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  return {
    state,
    audioBlob,
    blobUrl,
    duration,
    waveformData,
    startRecording,
    stopRecording,
    reset,
  };
}
