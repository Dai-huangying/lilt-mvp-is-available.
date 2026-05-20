'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Play, Sparkles, Music, Heart, Clock, Disc3 } from 'lucide-react';
import { demoSong } from '@/data/songs';
import { useRouter } from 'next/navigation';

export default function SongSelection() {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; size: number; delay: number }[]>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      delay: Math.random() * 5,
    }));
    setParticles(newParticles);
  }, []);

  const handleStartSinging = () => {
    router.push('/sing');
  };

  return (
    <div className="min-h-screen bg-lilt-darker flex flex-col relative overflow-hidden">
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 animate-gradient-shift"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(236, 72, 153, 0.05) 50%, rgba(59, 130, 246, 0.1) 100%)',
            backgroundSize: '200% 200%',
          }}
        />
        
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-lilt-purple/15 rounded-full blur-[150px] animate-float" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-lilt-pink/12 rounded-full blur-[120px] animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 right-1/3 w-[300px] h-[300px] bg-lilt-blue/10 rounded-full blur-[100px] animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-[350px] h-[350px] bg-lilt-purple/8 rounded-full blur-[130px] animate-float-slow" style={{ animationDelay: '3s' }} />

        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full bg-white/20"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animation: `float ${4 + particle.delay}s ease-in-out infinite`,
              animationDelay: `${particle.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <header className="p-4 md:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-lilt rounded-xl flex items-center justify-center shadow-lg shadow-lilt-purple/30">
              <Music className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gradient">LILT</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="w-10 h-10 glass-effect rounded-full flex items-center justify-center hover:bg-white/10 transition-all duration-300 hover:scale-110">
              <Heart className="w-5 h-5 text-gray-400" />
            </button>
            <button className="w-10 h-10 glass-effect rounded-full flex items-center justify-center hover:bg-white/10 transition-all duration-300 hover:scale-110">
              <Sparkles className="w-5 h-5 text-lilt-purple" />
            </button>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-4 md:px-6 pb-32">
          <div className="text-center mb-12 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 glass-effect rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-lilt-purple" />
              <span className="text-sm text-gray-400 uppercase tracking-widest">Cinematic Music Shadowing</span>
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-gradient mb-4">LILT</h1>
            <p className="text-gray-400 text-lg md:text-xl max-w-lg mx-auto">
              Immerse yourself. Sound natural. Feel the music.
            </p>
          </div>

          <div 
            className="w-full max-w-md glass-effect-strong rounded-3xl p-1 transition-all duration-700 hover:scale-[1.02] cursor-pointer group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleStartSinging}
          >
            <div className="bg-lilt-dark/80 rounded-[26px] p-6 transition-all duration-500">
              <div className="flex gap-6">
                <div className="relative flex-shrink-0 group">
                  <div className={`w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 ${isHovered ? 'glow-purple' : 'glow-subtle'}`}>
                    <Image
                      src={demoSong.coverImage}
                      alt={demoSong.title}
                      width={160}
                      height={160}
                      className={`object-cover transition-all duration-500 ${isHovered ? 'scale-110' : ''}`}
                    />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-lilt rounded-full flex items-center justify-center shadow-lg shadow-lilt-purple/40">
                    <Disc3 className={`w-5 h-5 text-white transition-transform duration-500 ${isHovered ? 'animate-rotate-slow' : ''}`} />
                  </div>
                  <div className={`absolute inset-0 rounded-2xl bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
                    <div className="w-14 h-14 bg-gradient-lilt rounded-full flex items-center justify-center shadow-lg shadow-lilt-purple/50 transform scale-0 group-hover:scale-100 transition-transform duration-300">
                      <Play className="w-7 h-7 text-white fill-white ml-1" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-between py-2 flex-1">
                  <div>
                    <p className="text-gray-400 text-sm mb-1 flex items-center gap-2">
                      <Music className="w-3 h-3" />
                      {demoSong.album}
                    </p>
                    <h2 className="text-xl md:text-2xl font-semibold text-white mb-1 group-hover:text-gradient transition-all duration-300">
                      {demoSong.title}
                    </h2>
                    <p className="text-gray-400">{demoSong.artist}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {demoSong.duration}
                    </span>
                    <span>•</span>
                    <span>{demoSong.bpm} BPM</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartSinging();
                  }}
                  className="w-full bg-gradient-lilt hover:opacity-90 rounded-xl py-4 px-6 font-semibold text-white flex items-center justify-center gap-3 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-lilt-purple/30 group/btn"
                >
                  <Play className="w-5 h-5 fill-white transition-transform duration-300 group-hover/btn:scale-110" />
                  <span>Start Singing</span>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-16 text-center animate-fade-in-up delay-500">
            <p className="text-gray-600 text-sm italic">
              "Becoming someone who can naturally sing like native artists"
            </p>
          </div>
        </main>

        <div className="fixed bottom-0 left-0 right-0 z-20">
          <div className="glass-dark border-t border-white/5 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg overflow-hidden">
                <Image
                  src={demoSong.coverImage}
                  alt={demoSong.title}
                  width={40}
                  height={40}
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{demoSong.title}</p>
                <p className="text-xs text-gray-500">{demoSong.artist}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
                <Play className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
