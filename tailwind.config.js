import { useReducer, useCallback, useEffect, useRef } from 'react';
import { lyrics, feedbacks, demoSong } from '@/data/songs';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { RecordingMetadata, RecordingAnalysis } from '@/types/recording';

export type SessionState = 'idle' | 'playing' | 'paused' | 'recording' | 'analyzing' | 'feedback' | 'next';

export interface SessionStateData {
  state: SessionState;
  currentLineIndex: number;
  currentTime: number;
  feedbackIndex: number;
}

type SessionAction =
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'RECORD' }
  | { type: 'STOP_RECORD' }
  | { type: 'ANALYZE' }
  | { type: 'SHOW_FEEDBACK' }
  | { type: 'NEXT_LINE' }
  | { type: 'SKIP_BACK' }
  | { type: 'SKIP_FORWARD' }
  | { type: 'RESTART_LINE' }
  | { type: 'TICK'; payload: number };

const initialState: SessionStateData = {
  state: 'idle',
  currentLineIndex: 0,
  currentTime: 0,
  feedbackIndex: 0,
};

function sessionReducer(state: SessionStateData, action: SessionAction): SessionStateData {
  switch (action.type) {
    case 'PLAY':
      return { ...state, state: 'playing' };
    
    case 'PAUSE':
      return { ...state, state: 'paused' };
    
    case 'RECORD':
      return { ...state, state: 'recording' };
    
    case 'STOP_RECORD':
      return { ...state, state: 'analyzing' };
    
    case 'ANALYZE':
      return { ...state, state: 'analyzing' };
    
    case 'SHOW_FEEDBACK':
      return { 
        ...state, 
        state: 'feedback',
        feedbackIndex: (state.feedbackIndex + 1) % feedbacks.length
      };
    
    case 'NEXT_LINE': {
      const nextIndex = state.currentLineIndex + 1;
      if (nextIndex >= lyrics.length) {
        return { ...state, state: 'idle', currentLineIndex: 0, currentTime: 0 };
      }
      return { 
        ...state, 
        state: 'next',
        currentLineIndex: nextIndex,
        currentTime: lyrics[nextIndex].startTime
      };
    }
    
    case 'SKIP_BACK': {
      const prevIndex = Math.max(0, state.currentLineIndex - 1);
      return { 
        ...state, 
        state: 'idle',
        currentLineIndex: prevIndex,
        currentTime: lyrics[prevIndex].startTime
      };
    }
    
    case 'SKIP_FORWARD': {
      const nextIndex = Math.min(lyrics.length - 1, state.currentLineIndex + 1);
      return { 
        ...state, 
        state: 'idle',
        currentLineIndex: nextIndex,
        currentTime: lyrics[nextIndex].startTime
      };
    }
    
    case 'RESTART_LINE':
      return { 
        ...state, 
        state: 'idle',
        currentTime: lyrics[state.currentLineIndex].startTime
      };
    
    case 'TICK':
      return { ...state, currentTime: action.payload };
    
    default:
      return state;
  }
}

export interface UseShadowingSessionProps {
  recordingSession?: {
    addRecording: (recording: RecordingMetadata) => void;
    analyzeRecording: (recordingId: string) => Promise<RecordingAnalysis | null>;
  };
}

export interface UseShadowingSessionReturn {
  state: SessionState;
  currentLineIndex: number;
  currentTime: number;
  feedbackIndex: number;
  isCompleted: boolean;
  progress: number;
  currentLine: typeof lyrics[0];
  nextLine: typeof lyrics[0] | undefined;
  totalDuration: number;
  audioPlayer: ReturnType<typeof useAudioPlayer>;
  play: () => Promise<void>;
  pause: () => void;
  stopRecord: () => void;
  goToNextLine: () => void;
  skipBack: () => void;
  skipForward: () => void;
  restartLine: () => void;
  seekTo: (time: number) => void;
}

export function useShadowingSession(props?: UseShadowingSessionProps): UseShadowingSessionReturn {
  const [sessionData, dispatch] = useReducer(sessionReducer, initialState);
  const audioPlayer = useAudioPlayer(demoSong.audioUrl);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentRecordingRef = useRef<RecordingMetadata | null>(null);

  const currentLine = lyrics[sessionData.currentLineIndex];
  const nextLine = lyrics[sessionData.currentLineIndex + 1];
  const totalDuration = lyrics[lyrics.length - 1].endTime;
  const progress = (sessionData.currentTime / totalDuration) * 100;
  const isCompleted = sessionData.currentLineIndex >= lyrics.length - 1 && sessionData.state === 'feedback';

  // Sync time from audio player
  useEffect(() => {
    if (sessionData.state === 'playing' && audioPlayer.isPlaying) {
      dispatch({ type: 'TICK', payload: audioPlayer.currentTime });
    }
  }, [audioPlayer.currentTime, audioPlayer.isPlaying, sessionData.state]);

  // Auto-pause when reaching line end
  useEffect(() => {
    if (sessionData.state === 'playing') {
      const currentLyric = lyrics[sessionData.currentLineIndex];
      
      if (sessionData.currentTime >= currentLyric.endTime) {
        audioPlayer.pause();
        dispatch({ type: 'PAUSE' });
        
        timeoutRef.current = setTimeout(() => {
          dispatch({ type: 'RECORD' });
        }, 500);
      }
    }
  }, [sessionData.currentTime, sessionData.state, sessionData.currentLineIndex, audioPlayer]);

  // Auto-play when entering next state
  useEffect(() => {
    if (sessionData.state === 'next') {
      timeoutRef.current = setTimeout(() => {
        play();
      }, 800);
    }
  }, [sessionData.state]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const play = useCallback(async () => {
    // Seek to current line start if not there
    if (Math.abs(audioPlayer.currentTime - lyrics[sessionData.currentLineIndex].startTime) > 0.5) {
      audioPlayer.seekTo(lyrics[sessionData.currentLineIndex].startTime);
    }
    
    await audioPlayer.play();
    dispatch({ type: 'PLAY' });
  }, [audioPlayer, sessionData.currentLineIndex]);

  const pause = useCallback(() => {
    audioPlayer.pause();
    dispatch({ type: 'PAUSE' });
  }, [audioPlayer]);

  const stopRecord = useCallback(() => {
    dispatch({ type: 'STOP_RECORD' });
    
    timeoutRef.current = setTimeout(async () => {
      if (currentRecordingRef.current && props?.recordingSession) {
        console.log('[ShadowingSession] Saving recording:', currentRecordingRef.current.id);
        props.recordingSession.addRecording(currentRecordingRef.current);
        
        console.log('[ShadowingSession] Starting analysis...');
        const analysis = await props.recordingSession.analyzeRecording(currentRecordingRef.current.id);
        
        if (analysis) {
          console.log('[ShadowingSession] Analysis complete, showing feedback');
        }
      }
      
      dispatch({ type: 'SHOW_FEEDBACK' });
    }, 1500);
  }, [props?.recordingSession]);

  const goToNextLine = useCallback(() => {
    currentRecordingRef.current = null;
    dispatch({ type: 'NEXT_LINE' });
  }, []);

  const skipBack = useCallback(() => {
    const targetIndex = Math.max(0, sessionData.currentLineIndex - 1);
    audioPlayer.seekTo(lyrics[targetIndex].startTime);
    currentRecordingRef.current = null;
    dispatch({ type: 'SKIP_BACK' });
  }, [audioPlayer, sessionData.currentLineIndex]);

  const skipForward = useCallback(() => {
    const targetIndex = Math.min(lyrics.length - 1, sessionData.currentLineIndex + 1);
    audioPlayer.seekTo(lyrics[targetIndex].startTime);
    currentRecordingRef.current = null;
    dispatch({ type: 'SKIP_FORWARD' });
  }, [audioPlayer, sessionData.currentLineIndex]);

  const restartLine = useCallback(() => {
    audioPlayer.seekTo(lyrics[sessionData.currentLineIndex].startTime);
    currentRecordingRef.current = null;
    dispatch({ type: 'RESTART_LINE' });
  }, [audioPlayer, sessionData.currentLineIndex]);

  const seekTo = useCallback((time: number) => {
    audioPlayer.seekTo(time);
    dispatch({ type: 'TICK', payload: time });
  }, [audioPlayer]);

  return {
    state: sessionData.state,
    currentLineIndex: sessionData.currentLineIndex,
    currentTime: sessionData.currentTime,
    feedbackIndex: sessionData.feedbackIndex,
    isCompleted,
    progress,
    currentLine,
    nextLine,
    totalDuration,
    audioPlayer,
    play,
    pause,
    stopRecord,
    goToNextLine,
    skipBack,
    skipForward,
    restartLine,
    seekTo,
  };
}
