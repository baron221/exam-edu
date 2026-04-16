'use client';

import React, { useState, useEffect } from 'react';

interface TimerProps {
  initialSeconds: number;
  onTimeUp: () => void;
}

const Timer: React.FC<TimerProps> = ({ initialSeconds, onTimeUp }) => {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (seconds <= 0) {
      onTimeUp();
      return;
    }

    const interval = setInterval(() => {
      setSeconds(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [seconds, onTimeUp]);

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const isLowTime = seconds < 300; // 5 minutes

  return (
    <div 
      className={`
        px-6 py-2 rounded-full font-mono text-xl font-black flex items-center gap-3 transition-all duration-500
        ${isLowTime 
          ? 'bg-red-50 text-red-600 border-2 border-red-500/30 animate-pulse' 
          : 'bg-npuu-navy text-white border-2 border-npuu-navy'
        }
      `}
    >
      <span className="text-xl">{isLowTime ? '🚨' : '⏲️'}</span>
      <span className="tracking-tighter">{formatTime(seconds)}</span>
      <div className="flex flex-col leading-none">
        <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">Session</span>
        <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">Timer</span>
      </div>
    </div>
  );
};

export default Timer;
