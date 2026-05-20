export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverImage: string;
  audioUrl: string;
  duration: string;
  bpm: number;
}

export interface Lyric {
  id: number;
  text: string;
  startTime: number;
  endTime: number;
}

export interface Feedback {
  vibe_feedback: string;
  chinese_explanation: string;
  singing_tip: string;
  tags: string[];
}

export const demoSong: Song = {
  id: '1',
  title: "I Wanna Be Yours",
  artist: "Arctic Monkeys",
  album: "AM",
  coverImage: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=400&fit=crop",
  audioUrl: "/audio/demo.mp3",
  duration: "4:15",
  bpm: 135,
};

export const lyrics: Lyric[] = [
  { id: 1, text: "I wanna be your vacuum cleaner", startTime: 0, endTime: 3 },
  { id: 2, text: "Breathing in your dust", startTime: 3, endTime: 6 },
  { id: 3, text: "I wanna be your Ford Cortina", startTime: 6, endTime: 9 },
  { id: 4, text: "I will never rust", startTime: 9, endTime: 12 },
  { id: 5, text: "If you like your coffee hot", startTime: 12, endTime: 15 },
  { id: 6, text: "Let me be your coffee pot", startTime: 15, endTime: 18 },
  { id: 7, text: "You call the shots, babe", startTime: 18, endTime: 21 },
  { id: 8, text: "I just wanna be yours", startTime: 21, endTime: 25 },
  { id: 9, text: "I wanna be your setting lotion", startTime: 25, endTime: 28 },
  { id: 10, text: "Hold your hair in deep devotion", startTime: 28, endTime: 31 },
  { id: 11, text: "I wanna be your lipstick traces", startTime: 31, endTime: 34 },
  { id: 12, text: "Like a tattoo that'll always be there", startTime: 34, endTime: 38 },
];

export const feedbacks: Feedback[] = [
  {
    vibe_feedback: "Relax the ending a little.",
    chinese_explanation: "尾音不要太重。",
    singing_tip: "Connect wanna and be smoothly.",
    tags: ["smooth-flow", "connected-speech"],
  },
  {
    vibe_feedback: "Nice breath control!",
    chinese_explanation: "气息控制得很好。",
    singing_tip: "Keep that relaxed tone going.",
    tags: ["breath-control", "tone"],
  },
  {
    vibe_feedback: "Great energy!",
    chinese_explanation: "能量很足！",
    singing_tip: "Try to match the original's laid-back feel.",
    tags: ["energy", "vibe"],
  },
];
