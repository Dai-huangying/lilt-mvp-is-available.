'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Play, Pause, Mic, MicOff, ArrowLeft, Sparkles, SkipBack, SkipForward, Heart, Check, RotateCcw, Loader2 } from 'lucide-react';
import { demoSong, lyrics, feedbacks } from '@/data/songs';
import { useRouter } from 'next/navigation';
import { useShadowingSession } from '@/hooks/useShadowingSession';
import { useRecorder } from '@/hooks/useRecorder';
import { useRecordingSession } from '@/hooks/useRecordingSession';
import { RecordingAnalysis } from '@/types/recording';

export default function SingingExperience() {
  const router = useRouter();
  
  const {
    recordings,
    analyses,
    isAnalyzing,
    addRecording,
    analyzeRecording,
    downloadRecording,
  } = useRecordingSession();

  const {
    state: sessionState,
    currentLineIndex,
    currentTime,
    feedbackIndex,
    isCompleted,
    progress,
    currentLine,
    nextLine,
    totalDuration,
    audioPlayer,
    play,
    stopRecord,
    goToNextLine,
    skipBack,
    skipForward,
    restartLine,
    seekTo
  } = useShadowingSession();

  const {
    state: recorderState,
    duration: recordingDuration,
    waveformData: recorderWaveformData,
    startRecording,
    stopRecording,
    reset
  } = useRecorder();

  const [currentAnalysis, setCurrentAnalysis] = useState<RecordingAnalysis | null>(null);
  const [isMicPermissionDenied, setIsMicPermissionDenied] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const waveformData = sessionState === 'recording' ? recorderWaveformData : audioPlayer.waveformData;
  const isActuallyRecording = sessionState === 'recording' && recorderState === 'recording';

  useEffect(() => {
    if (sessionState === 'recording' && recorderState === 'idle') {
      startRecording({
        lyricLineId: currentLineIndex,
        lyricText: currentLine.text
      }).catch(() => {
        setIsMicPermissionDenied(true);
      });
    }
  }, [sessionState, recorderState, startRecording, currentLineIndex, currentLine.text]);

  useEffect(() => {
    if (recorderState === 'stopped') {
      const recordingMetadata = stopRecording();
      if (recordingMetadata) {
        addRecording(recordingMetadata);
        handleAnalyzeRecording(recordingMetadata.id);
      }
      stopRecord();
    }
  }, [recorderState, stopRecording, addRecording, stopRecord]);

  const handleAnalyzeRecording = async (recordingId: string) => {
    try {
      setApiError(null);
      const analysis = await analyzeRecording(recordingId);
      if (analysis) {
        setCurrentAnalysis(analysis);
      }
    } catch (error) {
      console.error('Failed to analyze recording:', error);
      setApiError('Failed to analyze recording. Showing mock feedback.');
    }
  };

  const handleStopRecording = () => {
    stopRecording();
  };

  const handleRestartLine = () => {
    reset();
    restartLine();
    setCurrentAnalysis(null);
    setApiError(null);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * totalDuration;
    const newLineIndex = lyrics.findIndex(l => newTime >= l.startTime && newTime < l.endTime);
    if (newLineIndex !== -1) {
      seekTo(newTime);
    }
  };

  const handleDownloadRecording = () => {
    if (recordings.length > 0) {
      const lastRecording = recordings[recordings.length - 1];
      downloadRecording(lastRecording);
    }
  };

  const analysisToDisplay = currentAnalysis || analyses.get(recordings[recordings.length - 1]?.id || '') || null;

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col relative overflow-hidden">
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 30% 20%, rgba(139, 92, 246, 0.15) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(236, 72, 153, 0.1) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, rgba(59, 130, 246, 0.08) 0%, transparent 60%)',
          }}
        />
        
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full blur-[180px] animate-float" style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-[150px] animate-float" style={{ background: 'radial-gradient(circle, rgba(236, 72, 153, 0.15) 0%, transparent 70%)', animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen pb-24">
        <header className="p-4 md:p-6 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="w-12 h-12 bg-white/5 backdrop-blur-xl rounded-full flex items-center justify-center hover:bg-white/10 transition-all duration-300 hover:scale-110 border border-white/10"
          >
            <ArrowLeft className="w-5 h-5 text-gray-300" />
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl rounded-full border border-white/10">
            <Sparkles className="w-4 h-4 text-lilt-purple" />
            <span className="text-sm text-gray-400 uppercase tracking-wider">Shadowing Mode</span>
          </div>
          <button className="w-12 h-12 bg-white/5 backdrop-blur-xl rounded-full flex items-center justify-center hover:bg-white/10 transition-all duration-300 hover:scale-110 border border-white/10">
            <Heart className="w-5 h-5 text-gray-400" />
          </button>
        </header>

        {isMicPermissionDenied && (
          <div className="mx-4 mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
            <p className="text-red-400 text-sm text-center">
              Microphone permission denied. Please enable microphone access in your browser settings.
            </p>
          </div>
        )}

        {apiError && (
          <div className="mx-4 mt-4 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-xl">
            <p className="text-yellow-400 text-sm text-center">{apiError}</p>
          </div>
        )}

        {audioPlayer.error && (
          <div className="mx-4 mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
            <p className="text-red-400 text-sm text-center">{audioPlayer.error}</p>
          </div>
        )}

        {!audioPlayer.isReady && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-lilt-purple animate-spin" />
            <span className="ml-2 text-gray-400">Loading audio...</span>
          </div>
        )}

        <main className="flex-1 flex flex-col items-center justify-center px-4 md:px-6">
          <div className="relative mb-8 animate-fade-in-up">
            <div className={`w-36 h-36 md:w-44 md:h-44 rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 ${sessionState === 'playing' ? 'glow-purple' : ''}`}>
              <Image
                src={demoSong.coverImage}
                alt={demoSong.title}
                width={176}
                height={176}
                className={`object-cover transition-all duration-700 ${sessionState === 'playing' ? 'scale-105' : ''}`}
              />
            </div>
            
            {isActuallyRecording && (
              <>
                <div className="absolute -top-3 -right-3 w-12 h-12 bg-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/50">
                  <div className="w-4 h-4 bg-white rounded-full animate-pulse" />
                </div>
                <div className="absolute -top-3 -right-3 w-12 h-12 bg-red-500 rounded-full animate-ping opacity-30" />
                <div className="absolute -top-3 -right-3 w-16 h-16 bg-red-500/20 rounded-full animate-ping opacity-20" style={{ animationDelay: '0.3s' }} />
              </>
            )}
            
            {sessionState === 'playing' && (
              <div className="absolute inset-0 rounded-2xl pointer-events-none">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="absolute inset-0 rounded-2xl border border-lilt-purple/20 animate-ping" style={{ animationDelay: `${i * 0.4}s`, animationDuration: '2.5s' }} />
                ))}
              </div>
            )}
          </div>

          <div className="text-center mb-6 animate-fade-in-up delay-200">
            <h2 className="text-2xl md:text-3xl font-semibold text-white mb-2">{demoSong.title}</h2>
            <p className="text-gray-400">{demoSong.artist}</p>
          </div>

          <div className="w-full max-w-lg mb-8 animate-fade-in-up delay-300">
            <div className="relative h-24 md:h-28 flex items-end justify-center px-2">
              <div className="absolute inset-0 flex items-end justify-center gap-0.5 h-full">
                {waveformData.map((height, index) => (
                  <div
                    key={index}
                    className="w-1 rounded-full transition-all duration-50"
                    style={{
                      height: `${(sessionState === 'recording' || sessionState === 'playing') ? height * 100 : 0}%`,
                      background: isActuallyRecording 
                        ? `linear-gradient(to top, rgba(139, 92, 246, ${0.7 + height * 0.3}), rgba(236, 72, 153, ${0.5 + height * 0.3}))`
                        : sessionState === 'playing'
                        ? `linear-gradient(to top, rgba(139, 92, 246, ${0.4 + height * 0.2}), rgba(236, 72, 153, ${0.3 + height * 0.15}))`
                        : 'rgba(255, 255, 255, 0.1)',
                      animation: isActuallyRecording ? 'none' : sessionState === 'playing' ? `wave ${0.3 + height * 0.4}s ease-in-out infinite` : 'none',
                      animationDelay: `${index * 0.01}s`,
                      opacity: isActuallyRecording ? 0.9 : sessionState === 'playing' ? 0.6 : 0.3,
                    }}
                  />
                ))}
              </div>
              
              {isActuallyRecording && (
                <div className="absolute inset-0 flex items-end justify-center gap-0.5 h-full overflow-hidden">
                  {waveformData.map((height, index) => (
                    <div
                      key={index}
                      className="w-0.5 bg-white/40 rounded-full transition-all duration-50"
                      style={{ height: `${(Math.sin(Date.now() / 150 + index * 0.4) * 0.4 + 0.6) * height * 100}%` }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {isActuallyRecording && (
            <div className="mb-4 animate-fade-in-up">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-red-500 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                  ))}
                </div>
                <span className="text-red-400 text-sm font-medium">Recording</span>
                <span className="text-red-400 text-sm font-mono">{formatRecordingTime(recordingDuration)}</span>
              </div>
            </div>
          )}

          <div className="w-full max-w-2xl mb-8 animate-fade-in-up delay-400">
            <div className="relative bg-white/5 backdrop-blur-2xl rounded-3xl p-6 md:p-10 border border-white/10">
              {(sessionState === 'analyzing' || isAnalyzing) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0f]/90 rounded-3xl backdrop-blur-xl z-10">
                  <div className="relative">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-4 h-4 rounded-full bg-lilt-purple animate-ping"
                        style={{
                          left: `${i * 20 - 20}px`,
                          animationDelay: `${i * 0.2}s`,
                          animationDuration: '1s',
                        }}
                      />
                    ))}
                    <div className="w-8 h-8 rounded-full bg-lilt-purple flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <p className="mt-6 text-gray-400 text-lg font-medium">Analyzing your flow...</p>
                  <p className="mt-2 text-gray-500 text-sm">AI is processing your recording</p>
                </div>
              )}

              <div className="text-center space-y-6">
                {lyrics.map((lyric, index) => {
                  const isCurrent = index === currentLineIndex;
                  const isPrevious = index < currentLineIndex;
                  const isNextLine = index === currentLineIndex + 1;
                  
                  return (
                    <div key={lyric.id} className="transition-all duration-500">
                      {isCurrent && (
                        <div className="absolute -inset-1 bg-gradient-to-r from-lilt-purple/20 via-lilt-pink/20 to-lilt-blue/20 rounded-3xl blur-sm" />
                      )}
                      <p
                        className={`text-xl md:text-3xl lg:text-4xl font-medium transition-all duration-500 ${
                          isCurrent
                            ? 'text-white scale-105'
                            : isPrevious
                            ? 'text-gray-700 scale-95'
                            : isNextLine
                            ? 'text-gray-500 scale-95'
                            : 'text-gray-600 scale-90 opacity-20'
                        }`}
                        style={{
                          animation: isCurrent && sessionState !== 'analyzing' ? 'fade-in-up 0.6s ease-out' : 'none',
                          textShadow: isCurrent ? '0 0 40px rgba(139, 92, 246, 0.3)' : 'none',
                        }}
                      >
                        <span className={isCurrent ? 'bg-gradient-to-r from-lilt-purple via-lilt-pink to-lilt-blue bg-clip-text text-transparent' : ''}>
                          {lyric.text}
                        </span>
                      </p>
                      
                      {isCurrent && sessionState !== 'analyzing' && (
                        <div className="flex items-center justify-center gap-2 mt-2">
                          <span className="text-xs text-lilt-purple font-medium uppercase tracking-wider">
                            {sessionState === 'playing' ? 'Playing...' : isActuallyRecording ? 'Sing Now!' : 'Ready'}
                          </span>
                          <div className="w-8 h-0.5 bg-gradient-to-r from-lilt-purple to-lilt-pink rounded-full" />
                        </div>
                      )}
                      
                      {isNextLine && nextLine && sessionState !== 'analyzing' && (
                        <div className="flex items-center justify-center gap-2 mt-2">
                          <div className="w-8 h-0.5 bg-gray-600 rounded-full" />
                          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Next</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-8 pt-6 border-t border-white/10">
                <div className="flex items-center justify-center gap-3">
                  {lyrics.map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-all duration-500 ${
                        i < currentLineIndex ? 'bg-lilt-purple' : i === currentLineIndex ? 'bg-white' : 'bg-white/20'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-center text-gray-500 text-sm mt-2">
                  {currentLineIndex + 1} / {lyrics.length}
                </p>
              </div>
            </div>
          </div>

          <div className="w-full max-w-lg mb-6 animate-fade-in-up delay-500">
            <div className="flex items-center justify-center gap-4">
              <span className="text-gray-400 text-sm font-medium min-w-[40px]">{formatTime(currentTime)}</span>
              <div 
                ref={progressRef}
                className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden cursor-pointer group relative"
                onClick={handleProgressClick}
              >
                <div
                  className="h-full bg-gradient-to-r from-lilt-purple via-lilt-pink to-lilt-blue transition-all duration-100 relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-lg shadow-lilt-purple/50 transform scale-0 group-hover:scale-100 transition-transform duration-200" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-lilt-purple/30 via-lilt-pink/30 to-lilt-blue/30 blur-sm" />
                
                {lyrics.map((lyric) => {
                  const position = (lyric.startTime / totalDuration) * 100;
                  return (
                    <div key={lyric.id} className="absolute top-1/2 -translate-y-1/2 w-1 h-3 bg-white/30 rounded-full" style={{ left: `${position}%` }} />
                  );
                })}
              </div>
              <span className="text-gray-400 text-sm font-medium min-w-[40px] text-right">{formatTime(totalDuration)}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 animate-fade-in-up delay-600">
            <button
              onClick={skipBack}
              disabled={currentLineIndex === 0 || !audioPlayer.isReady}
              className="w-12 h-12 bg-white/5 backdrop-blur-xl rounded-full flex items-center justify-center hover:bg-white/10 transition-all duration-300 hover:scale-110 active:scale-95 border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <SkipBack className="w-5 h-5 text-gray-300" />
            </button>
            
            {sessionState === 'recording' ? (
              <>
                <button
                  onClick={handleRestartLine}
                  className="w-14 h-14 bg-white/5 backdrop-blur-xl rounded-full flex items-center justify-center hover:bg-white/10 transition-all duration-300 hover:scale-105 active:scale-95 border border-white/10"
                >
                  <RotateCcw className="w-6 h-6 text-gray-400" />
                </button>
                
                <button
                  onClick={handleStopRecording}
                  className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-xl shadow-green-500/30 hover:scale-110 active:scale-95 transition-all duration-300"
                >
                  <Check className="w-9 h-9 text-white" />
                </button>
                
                <div className="w-14" />
              </>
            ) : sessionState === 'feedback' ? (
              <>
                <div className="w-14" />
                
                <button
                  onClick={goToNextLine}
                  className="w-20 h-20 bg-gradient-to-r from-lilt-purple via-lilt-pink to-lilt-blue rounded-full flex items-center justify-center shadow-xl shadow-lilt-purple/30 hover:scale-110 active:scale-95 transition-all duration-300"
                >
                  <SkipForward className="w-9 h-9 text-white" />
                </button>
                
                <button
                  onClick={handleRestartLine}
                  className="w-14 h-14 bg-white/5 backdrop-blur-xl rounded-full flex items-center justify-center hover:bg-white/10 transition-all duration-300 hover:scale-105 active:scale-95 border border-white/10"
                >
                  <RotateCcw className="w-6 h-6 text-gray-400" />
                </button>
              </>
            ) : (
              <>
                <div className="w-14" />
                
                <button
                  onClick={play}
                  disabled={sessionState === 'playing' || !audioPlayer.isReady}
                  className="w-20 h-20 bg-gradient-to-r from-lilt-purple via-lilt-pink to-lilt-blue rounded-full flex items-center justify-center shadow-xl shadow-lilt-purple/30 hover:scale-110 active:scale-95 transition-all duration-300 disabled:opacity-70"
                  style={{ boxShadow: sessionState === 'playing' ? '0 0 40px rgba(139, 92, 246, 0.5), 0 0 80px rgba(139, 92, 246, 0.3)' : '0 0 30px rgba(139, 92, 246, 0.3)' }}
                >
                  {sessionState === 'playing' ? (
                    <Pause className="w-9 h-9 text-white" />
                  ) : (
                    <Play className="w-9 h-9 text-white fill-white ml-0.5" />
                  )}
                </button>
                
                <div className="w-14" />
              </>
            )}
            
            <button
              onClick={skipForward}
              disabled={currentLineIndex === lyrics.length - 1 || !audioPlayer.isReady}
              className="w-12 h-12 bg-white/5 backdrop-blur-xl rounded-full flex items-center justify-center hover:bg-white/10 transition-all duration-300 hover:scale-110 active:scale-95 border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <SkipForward className="w-5 h-5 text-gray-300" />
            </button>
          </div>

          {sessionState === 'feedback' && analysisToDisplay && (
            <div className="mt-6 animate-scale-in">
              <div className="w-full max-w-sm glass-effect-strong rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-lilt-purple to-lilt-pink rounded-xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">Performance</span>
                    <p className="text-xs text-lilt-purple">Line {currentLineIndex + 1} Complete</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-white/5 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400">Pronunciation</span>
                      <span className={`text-sm font-semibold ${analysisToDisplay.pronunciation >= 85 ? 'text-green-400' : analysisToDisplay.pronunciation >= 75 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {analysisToDisplay.pronunciation}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" style={{ width: `${analysisToDisplay.pronunciation}%` }} />
                    </div>
                  </div>
                  
                  <div className="bg-white/5 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400">Smoothness</span>
                      <span className={`text-sm font-semibold ${analysisToDisplay.smoothness >= 85 ? 'text-green-400' : analysisToDisplay.smoothness >= 75 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {analysisToDisplay.smoothness}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-lilt-purple to-lilt-pink rounded-full" style={{ width: `${analysisToDisplay.smoothness}%` }} />
                    </div>
                  </div>
                  
                  <div className="bg-white/5 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400">Rhythm</span>
                      <span className={`text-sm font-semibold ${analysisToDisplay.rhythm >= 85 ? 'text-green-400' : analysisToDisplay.rhythm >= 75 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {analysisToDisplay.rhythm}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" style={{ width: `${analysisToDisplay.rhythm}%` }} />
                    </div>
                  </div>
                  
                  <div className="bg-white/5 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400">Connected Speech</span>
                      <span className={`text-sm font-semibold ${analysisToDisplay.connectedSpeech >= 85 ? 'text-green-400' : analysisToDisplay.connectedSpeech >= 75 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {analysisToDisplay.connectedSpeech}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full" style={{ width: `${analysisToDisplay.connectedSpeech}%` }} />
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-lilt-purple" />
                  <span className="text-lilt-purple text-sm font-medium">{analysisToDisplay.vibe}</span>
                </div>
                
                <div className="pt-4 border-t border-white/10">
                  <p className="text-gray-300 text-sm">{analysisToDisplay.vibeFeedback}</p>
                  <p className="text-gray-400 text-sm mt-1">{analysisToDisplay.chineseExplanation}</p>
                  <p className="text-lilt-purple text-sm font-medium mt-2">💡 {analysisToDisplay.singingTip}</p>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-4">
                  {analysisToDisplay.tags.map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-white/5 rounded-full text-xs text-gray-400">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {sessionState === 'feedback' && recordings.length > 0 && (
            <button
              onClick={handleDownloadRecording}
              className="mt-4 px-6 py-2 bg-white/5 backdrop-blur-xl rounded-full flex items-center gap-2 hover:bg-white/10 transition-all duration-300 border border-white/10"
            >
              <span className="text-sm text-gray-300">Download Recording</span>
            </button>
          )}

          {isCompleted && sessionState === 'feedback' && (
            <div className="mt-6 animate-scale-in">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/30">
                  <Check className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Great job!</h3>
                <p className="text-gray-400">You completed all {lyrics.length} lines</p>
              </div>
            </div>
          )}
        </main>

        <div className="fixed bottom-0 left-0 right-0 z-20">
          <div className="bg-black/60 backdrop-blur-2xl border-t border-white/5 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 ${sessionState === 'playing' ? 'shadow-lg shadow-lilt-purple/30' : ''}`}>
                <Image src={demoSong.coverImage} alt={demoSong.title} width={48} height={48} className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{demoSong.title}</p>
                <p className="text-xs text-gray-500">{demoSong.artist} · Shadowing Mode</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors" onClick={skipBack}>
                <SkipBack className="w-4 h-4 text-gray-400" />
              </button>
              <button
                onClick={play}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${sessionState === 'playing' ? 'bg-lilt-purple text-white' : 'bg-white/10 text-white'}`}
                disabled={!audioPlayer.isReady}
              >
                {sessionState === 'playing' ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
              </button>
              <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors" onClick={skipForward}>
                <SkipForward className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}