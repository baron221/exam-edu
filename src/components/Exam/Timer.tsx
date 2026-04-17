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
        gap: '12px', 
        padding: '6px 20px', 
        borderRadius: '14px', 
        background: isLowTime ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255, 255, 255, 0.9)', 
        border: `1.5px solid ${isLowTime ? 'rgba(239, 68, 68, 0.15)' : 'rgba(99, 102, 241, 0.1)'}`,
        backdropFilter: 'blur(20px)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isLowTime ? '0 4px 20px rgba(239, 68, 68, 0.1)' : '0 4px 15px rgba(99, 102, 241, 0.04)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg 
            width="14" 
            height="14" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke={isLowTime ? '#ef4444' : '#6366f1'} 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            style={{ filter: isLowTime ? 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.3))' : 'none' }}
        >
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
      </div>

      <div style={{ 
        fontSize: '18px', 
        fontWeight: 900, 
        color: isLowTime ? '#ef4444' : '#0f172a', 
        letterSpacing: '-1px',
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace"
      }}>
        {formatTime(seconds)}
      </div>

      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        borderLeft: '1.5px solid rgba(99, 102, 241, 0.1)', 
        paddingLeft: '12px',
        lineHeight: 1.1
      }}>
        <span style={{ fontSize: '7px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: isLowTime ? '#ef4444' : '#6366f1' }}>
            {isLowTime ? t('urgent') : t('remaining')}
        </span>
        <span style={{ fontSize: '6px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', marginTop: '1px' }}>
            {t('active_session')}
        </span>
      </div>
    </div>
  );
};

export default Timer;
