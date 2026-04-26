'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/context/LanguageContext';
import { Clock, AlertTriangle } from 'lucide-react';

interface TimerProps {
  initialSeconds: number;
  onTimeUp: () => void;
}

const Timer: React.FC<TimerProps> = ({ initialSeconds, onTimeUp }) => {
  const { t } = useTranslation();
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

  const percentage = (seconds / initialSeconds) * 100;
  const isLowTime = seconds < 300; // 5 minutes
  const isCritical = seconds < 60; // 1 minute

  const getProgressColor = () => {
    if (isCritical) return '#ef4444';
    if (isLowTime) return '#f59e0b';
    return '#6366f1';
  };

  return (
    <>
      {/* Top Progress Bar */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '4px',
        background: 'rgba(255,255,255,0.05)',
        zIndex: 9999,
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${percentage}%`,
          height: '100%',
          background: getProgressColor(),
          transition: 'width 1s linear, background 0.5s ease',
          boxShadow: `0 0 10px ${getProgressColor()}`
        }} />
      </div>

      {/* Timer Pill */}
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          padding: '6px 16px', 
          borderRadius: '12px', 
          background: isLowTime 
            ? 'rgba(239, 68, 68, 0.1)' 
            : 'rgba(255, 255, 255, 0.05)', 
          border: `1.5px solid ${isLowTime ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
          backdropFilter: 'blur(8px)',
          transition: 'all 0.3s ease',
          boxShadow: isLowTime ? '0 0 15px rgba(239, 68, 68, 0.1)' : 'none'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: getProgressColor(),
          animation: isLowTime ? 'pulse 2s infinite' : 'none'
        }}>
          {isLowTime ? <AlertTriangle size={16} /> : <Clock size={16} />}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ 
            fontSize: '16px', 
            fontWeight: 850, 
            color: isLowTime ? '#ff4d4d' : '#fff',
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '0.02em',
            lineHeight: 1
          }}>
            {formatTime(seconds)}
          </span>
        </div>

        <style jsx>{`
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.7; }
            100% { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    </>
  );
};

export default Timer;

