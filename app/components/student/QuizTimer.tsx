"use client";

import { useState, useEffect } from "react";

interface QuizTimerProps {
  initialSeconds: number;
  onTimeUp?: () => void;
}

export default function QuizTimer({ initialSeconds, onTimeUp }: QuizTimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds * 1000);

  useEffect(() => {
    setTimeLeft(initialSeconds * 1000);
    
    const startTime = Date.now();
    const endTime = startTime + (initialSeconds * 1000);

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      setTimeLeft(remaining);

      if (remaining === 0) {
        clearInterval(interval);
        if (onTimeUp) onTimeUp();
      }
    }, 10);

    return () => clearInterval(interval);
  }, [initialSeconds, onTimeUp]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = ms % 1000;

    return {
      main: `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
      ms: milliseconds.toString().padStart(3, '0')
    };
  };

  const { main, ms } = formatTime(timeLeft);

  return (
    <div className="bg-white rounded-[2rem] shadow-xl shadow-red-500/5 border border-white p-6 flex flex-col items-center justify-center min-w-[140px] relative overflow-hidden group">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 relative z-10">Remaining</span>
      <div className="flex items-baseline gap-1 relative z-10">
        <span className="text-4xl font-mono font-black text-red-500 tabular-nums">{main}</span>
        <span className="text-xl font-mono font-bold text-red-500/40 tabular-nums">.{ms}</span>
      </div>
      
      {/* Decorative pulse */}
      {timeLeft < 10000 && (
        <div className="absolute inset-0 bg-red-50 animate-pulse opacity-50"></div>
      )}
    </div>
  );
}
