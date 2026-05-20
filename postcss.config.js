import { useState, useCallback, useRef } from 'react';
import { RecordingMetadata, RecordingAnalysis, AnalyzeRecordingInput } from '@/types/recording';
import { analyzeRecording } from '@/lib/analyzeRecording';

export interface UseRecordingSessionReturn {
  recordings: RecordingMetadata[];
  analyses: Map<string, RecordingAnalysis>;
  isAnalyzing: boolean;
  addRecording: (recording: RecordingMetadata) => void;
  getRecording: (id: string) => RecordingMetadata | undefined;
  getAnalysis: (recordingId: string) => RecordingAnalysis | undefined;
  deleteRecording: (id: string) => void;
  clearAll: () => void;
  analyzeRecording: (recordingId: string) => Promise<RecordingAnalysis | null>;
  downloadRecording: (recording: RecordingMetadata) => void;
}

export function useRecordingSession(): UseRecordingSessionReturn {
  const [recordings, setRecordings] = useState<RecordingMetadata[]>([]);
  const [analyses, setAnalyses] = useState<Map<string, RecordingAnalysis>>(new Map());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const recordingIdToAnalyzeRef = useRef<string | null>(null);

  const addRecording = useCallback((recording: RecordingMetadata) => {
    console.log('[RecordingSession] Adding recording:', recording.id);
    setRecordings(prev => [...prev, recording]);
  }, []);

  const getRecording = useCallback((id: string): RecordingMetadata | undefined => {
    return recordings.find(r => r.id === id);
  }, [recordings]);

  const getAnalysis = useCallback((recordingId: string): RecordingAnalysis | undefined => {
    return analyses.get(recordingId);
  }, [analyses]);

  const deleteRecording = useCallback((id: string) => {
    console.log('[RecordingSession] Deleting recording:', id);
    const recording = recordings.find(r => r.id === id);
    if (recording) {
      URL.revokeObjectURL(recording.blobUrl);
    }
    setRecordings(prev => prev.filter(r => r.id !== id));
    setAnalyses(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, [recordings]);

  const clearAll = useCallback(() => {
    console.log('[RecordingSession] Clearing all recordings');
    recordings.forEach(r => URL.revokeObjectURL(r.blobUrl));
    setRecordings([]);
    setAnalyses(new Map());
  }, [recordings]);

  const analyzeRecordingById = useCallback(async (recordingId: string): Promise<RecordingAnalysis | null> => {
    const recording = recordings.find(r => r.id === recordingId);
    if (!recording) {
      console.error('[RecordingSession] Recording not found:', recordingId);
      return null;
    }

    console.log('[RecordingSession] Starting analysis for:', recordingId);
    setIsAnalyzing(true);
    recordingIdToAnalyzeRef.current = recordingId;

    try {
      const input: AnalyzeRecordingInput = {
        recordingBlob: await fetch(recording.blobUrl).then(r => r.blob()),
        metadata: recording,
      };

      const result = await analyzeRecording(input);

      if (result.success && result.analysis) {
        console.log('[RecordingSession] Analysis complete:', result.analysis);
        setAnalyses(prev => new Map(prev).set(recordingId, result.analysis!));
        return result.analysis;
      } else {
        console.error('[RecordingSession] Analysis failed:', result.error);
        return null;
      }
    } catch (error) {
      console.error('[RecordingSession] Analysis error:', error);
      return null;
    } finally {
      setIsAnalyzing(false);
      recordingIdToAnalyzeRef.current = null;
    }
  }, [recordings]);

  const downloadRecording = useCallback((recording: RecordingMetadata) => {
    console.log('[RecordingSession] Downloading recording:', recording.id);
    
    const link = document.createElement('a');
    link.href = recording.blobUrl;
    link.download = `lilt_recording_${recording.lyricLineId}_${recording.timestamp.getTime()}.webm`;
    link.click();
    
    console.log('[RecordingSession] Download started:', link.download);
  }, []);

  return {
    recordings,
    analyses,
    isAnalyzing,
    addRecording,
    getRecording,
    getAnalysis,
    deleteRecording,
    clearAll,
    analyzeRecording: analyzeRecordingById,
    downloadRecording,
  };
}
