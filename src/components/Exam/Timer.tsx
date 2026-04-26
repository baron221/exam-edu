'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/context/LanguageContext';

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

  const isLowTime = seconds < 300; // 5 minutes

  return (
    <div 
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '16px', 
        padding: '8px 20px', 
        borderRadius: '16px', 
        background: isLowTime 
          ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)' 
          : 'rgba(255, 255, 255, 0.03)', 
        border: `1px solid ${isLowTime ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isLowTime 
          ? '0 0 20px rgba(239, 68, 68, 0.15)' 
          : 'none',
        position: 'relative'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: isLowTime ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 102, 241, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: isLowTime ? 'pulse 2s infinite' : 'none'
        }}>
            <svg 
                width="14" 
                height="14" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke={isLowTime ? '#ff4d4d' : '#818cf8'} 
                strokeWidth="3" 
                strokeLinecap="round" 
                strokeLinejoin="round"
            >
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
        </div>
      </div>

      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        <div style={{ 
            fontSize: '18px', 
            fontWeight: 800, 
            color: isLowTime ? '#ff4d4d' : '#ffffff', 
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            lineHeight: 1,
            letterSpacing: '0.02em'
        }}>
            {formatTime(seconds)}
        </div>
        <div style={{ 
            fontSize: '8px', 
            fontWeight: 900, 
            textTransform: 'uppercase', 
            letterSpacing: '0.1em', 
            color: isLowTime ? 'rgba(239, 68, 68, 0.7)' : 'rgba(255, 255, 255, 0.3)',
            marginTop: '3px'
        }}>
            {isLowTime ? t('urgent') : t('remaining')}
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Timer;
