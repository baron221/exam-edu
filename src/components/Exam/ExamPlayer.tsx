'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Timer from './Timer';
import MonacoEditor from '../MonacoEditor';
import styles from './ExamPlayer.module.css';
import Image from 'next/image';
import { useTranslation } from '@/context/LanguageContext';

interface ExamPlayerProps {
  examId: string;
}

export default function ExamPlayer({ examId }: ExamPlayerProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [exam, setExam] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [judgeResult, setJudgeResult] = useState<any>(null);
  const [judging, setJudging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [starting, setStarting] = useState(false);
  const [stdin, setStdin] = useState('');
  const [attempt, setAttempt] = useState<any>(null);
  const [error, setError] = useState('');

  const LANGUAGE_MAP: Record<string, number> = {
    'cpp': 54,
    'python': 71,
    'javascript': 63,
    'java': 62,
    'c': 48,
    'go': 60
  };

  useEffect(() => {
    const loadExam = async () => {
      try {
        const res = await fetch(`/api/exams/${examId}?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) throw new Error(t('error_load_exam'));
        const data = await res.json();
        setExam(data);
        
        if (data.attempts?.[0]) {
          const latestAttempt = data.attempts[0];
          setAttempt(latestAttempt);
          
          // Redirect if already submitted to prevent 400 errors on the submit endpoint
          if (latestAttempt.status === 'SUBMITTED') {
            router.replace(`/exams/${examId}/result`);
          }
        }
      } catch (err: any) {
        setError(err.message);
      }
    };
    loadExam();
  }, [examId, router]);

  const startExam = async () => {
    setStarting(true);
    try {
      const res = await fetch(`/api/exams/${examId}/start`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('authenticating'));
      
      // Update states from the consolidated response
      setExam(data);
      if (data.attempts?.[0]) {
        setAttempt(data.attempts[0]);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setStarting(false);
    }
  };

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const runCode = async (code: string, input: string = '', lang: string = 'cpp') => {
    if (!code.trim()) return;
    setJudging(true);
    setJudgeResult(null);

    const language_id = LANGUAGE_MAP[lang.toLowerCase()] || 54;

    try {
      const res = await fetch('/api/exams/judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_code: code, stdin: input, language_id })
      });
      const data = await res.json();
      setJudgeResult(data);
    } catch (err) {
      setJudgeResult({ error: t('error_judge_connection') });
    } finally {
      setJudging(false);
    }
  };

  const submitExam = async (automatic = false) => {
    console.log('SUBMIT_TRIGGERED: auto=', automatic);
    // Remove the blocking confirm() as it can be unreliable in some environments
    // We can rely on the prominent "Finalize" design as confirmation
    setSubmitting(true);
    try {
      const res = await fetch(`/api/exams/${examId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers })
      });
      if (res.ok) {
        router.push(`/exams/${examId}/result`);
      } else {
        const data = await res.json();
        alert(data.error || t('error_submit_failed'));
      }
    } catch (err) {
      alert(t('error_network'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!exam) return (
    <div className={styles.loadingOverlay}>
      <div className={styles.loadingText}>{t('authenticating')}</div>
    </div>
  );

  if (!attempt || attempt.status === 'READY') {
    return (
      <div className={styles.viewer} style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className={styles.questionCard} style={{ textAlign: 'center', backdropFilter: 'blur(40px)', background: 'rgba(255,255,255,0.02)' }}>
          <div className="relative w-24 h-24 mx-auto mb-10 opacity-80">
            <Image src="/logo_npuu.png" alt="NPUU Logo" fill className="object-contain" />
          </div>
          <h2 className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.3em] mb-2">{t('terminal_title')}</h2>
          <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#fff', marginBottom: '12px', letterSpacing: '-1px' }}>{exam.title}</h1>
          <p className="text-slate-400 font-medium mb-8 max-w-sm mx-auto leading-relaxed text-[13px]">{exam.description || t('dashboard_desc')}</p>
          
          <div className="flex justify-center gap-10 mb-8 border-y border-white/5 py-6">
            <div className="text-center">
              <div className="text-[9px] font-extrabold text-white/20 uppercase tracking-[0.2em] mb-2">{t('time_limit')}</div>
              <div className="text-3xl font-black text-white leading-none">{exam.timeLimit} <span className="text-[10px] text-white/30 uppercase tracking-widest ml-1">{t('minutes')}</span></div>
            </div>
            <div className="text-center border-l border-white/5 pl-10">
              <div className="text-[9px] font-extrabold text-white/20 uppercase tracking-[0.2em] mb-2">{t('capacity')}</div>
              <div className="text-3xl font-black text-white leading-none">{exam.questionsCount || exam.questions?.length || 0} <span className="text-[10px] text-white/30 uppercase tracking-widest ml-1">{t('units')}</span></div>
            </div>
          </div>

          <button className={styles.submitBtn} style={{ width: 'auto', padding: '1rem 3.5rem', fontSize: '14px' }} onClick={startExam} disabled={starting}>
            {starting ? `${t('authenticating')}...` : `⚡ ${t('enter_portal')}`}
          </button>
          <p className="mt-8 text-[8px] font-black text-white/10 uppercase tracking-[0.3em]">{t('protocol_secured')}</p>
        </div>
      </div>
    );
  }

  // Safety guard: Ensure questions exist and are loaded before continuing to the player view
  if (!exam.questions || exam.questions.length === 0) {
    if (attempt?.status === 'IN_PROGRESS') {
        return (
          <div className={styles.loadingOverlay}>
            <div className={styles.loadingText}>{t('syncing_data')}</div>
          </div>
        );
    }
    return <div className={styles.loadingOverlay}><div className={styles.loadingText}>{t('no_data')}</div></div>;
  }

  const currentQ = exam.questions[currentIndex];
  const totalQuestions = exam.questions.length;
  
  const startTime = new Date(attempt.startTime).getTime();
  const endTime = startTime + (exam.timeLimit * 60 * 1000);
  const secondsLeft = Math.max(0, Math.floor((endTime - Date.now()) / 1000));

  return (
    <div className={styles.viewer}>
      {submitting && <div className={styles.loadingOverlay}><div className={styles.loadingText}>{t('authenticating')}</div></div>}
      
      <header className={styles.header}>
        <div className="flex items-center gap-5">
          <div className="relative w-9 h-9 opacity-90">
            <Image src="/logo_npuu.png" alt="NPUU Logo" fill className="object-contain" />
          </div>
          <div className="h-6 w-px bg-white/10 mx-1" />
          <div className={styles.title}>{exam.title}</div>
        </div>
        <Timer initialSeconds={secondsLeft} onTimeUp={() => submitExam(true)} />
        <button 
          className={styles.submitBtn} 
          style={{ 
            padding: '10px 24px', 
            fontSize: '12px', 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#ef4444',
            boxShadow: 'none' 
          }} 
          onClick={() => submitExam()}
        >
          {t('sign_out')}
        </button>
      </header>

      <div className={styles.main}>
        <aside className={styles.sidebar}>
          <div>
            <div className={styles.sidebarTitle}>{t('assigned_portals')}</div>
            <div className={styles.questionNav}>
              {exam.questions.map((q: any, idx: number) => (
                <button 
                  key={q.id} 
                  className={`${styles.navBtn} ${currentIndex === idx ? styles.active : ''} ${answers[q.id] ? styles.answered : ''}`}
                  onClick={() => { setCurrentIndex(idx); setJudgeResult(null); }}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>

          <div style={{ 
            marginTop: 'auto', 
            padding: '28px', 
            background: 'rgba(255, 255, 255, 0.02)', 
            border: '1px solid rgba(255, 255, 255, 0.05)', 
            borderRadius: '24px',
            backdropFilter: 'blur(20px)'
          }}>
            <h5 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.25em] mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" /> {t('finalize_session')}
            </h5>
            <p className="text-[11px] leading-relaxed text-indigo-300/40 font-medium italic mb-8">
                Consistency is the hallmark of architectural integrity.
            </p>
            <button 
                onClick={() => submitExam()}
                className={styles.submitBtn}
                style={{ width: '100%', fontSize: '10px', padding: '16px' }}
            >
                🏁 {t('finalize_submit')}
            </button>
          </div>
        </aside>

        <section className={styles.content}>
          <div className={styles.questionCard}>
            <div className={styles.questionText}>
                {currentQ.text}
            </div>

            {currentQ.type === 'MCQ' ? (
              <div className={styles.optionsList}>
                {currentQ.options.map((opt: any, idx: number) => (
                  <button 
                    key={opt.id} 
                    className={`${styles.optionBtn} ${answers[currentQ.id] === opt.id ? styles.selected : ''}`}
                    onClick={() => handleAnswer(currentQ.id, opt.id)}
                  >
                    <div className={styles.optionLetter}>{String.fromCharCode(65 + idx)}</div>
                    <div className="text-white/90 font-semibold">{opt.text}</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className={styles.codingArea}>
                <div className={styles.editorHeader}>
                  <div className="flex items-center gap-3 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">
                    <span className="text-xs">💻</span> {t('kernel_terminal')}
                  </div>
                  <button className={styles.runBtn} onClick={() => runCode(answers[currentQ.id] || currentQ.starterCode || '', stdin, currentQ.language || 'cpp')} disabled={judging}>
                    {judging ? t('compiling') : `▶ ${t('verify_solution')}`}
                  </button>
                </div>
                
                <div className={styles.workspace}>
                  <div className={styles.editorContainer}>
                    <MonacoEditor 
                        theme="vs-dark"
                        value={answers[currentQ.id] || currentQ.starterCode || ''} 
                        onChange={(val) => handleAnswer(currentQ.id, val || '')}
                        height="460px"
                    />
                  </div>
                  <div className={styles.judgeResult}>
                    <div className={styles.consoleHeader}>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                        <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">Exam Terminal v4.2</span>
                      </div>
                      {judgeResult && (
                        <div className={`text-[9px] font-black px-3 py-1 rounded-full ${judgeResult.status?.id === 3 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                            {judgeResult.status?.description || t('result')}
                        </div>
                      )}
                    </div>

                    <div className={styles.terminalBody}>
                      <div className={styles.outputArea}>
                        <div className={styles.panelLabel}>{t('custom_output')}</div>
                        <div className={styles.terminalOutput}>
                          {judging ? (
                            <div className="flex flex-col gap-3 h-full justify-center items-center opacity-40">
                              <div className="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                              <div className="text-[10px] uppercase tracking-widest">{t('compiling')}</div>
                            </div>
                          ) : judgeResult ? (
                            <>
                              {(() => {
                                  const safeAtob = (str: string) => {
                                      try { return atob(str); } catch (e) { return str; }
                                  };
                                  return (
                                      <>
                                          {judgeResult.stdout ? safeAtob(judgeResult.stdout) : ''}
                                          {judgeResult.stderr ? safeAtob(judgeResult.stderr) : ''}
                                          {judgeResult.compile_output ? safeAtob(judgeResult.compile_output) : ''}
                                      </>
                                  );
                              })()}
                              {!judgeResult.stdout && !judgeResult.stderr && !judgeResult.compile_output && t('exec_no_output')}
                              {judgeResult.error && <span className="text-red-400">{judgeResult.error}</span>}
                            </>
                          ) : (
                            <div className="flex items-center justify-center h-full opacity-20 italic text-[10px]">
                              Waiting for execution...
                            </div>
                          )}
                        </div>
                      </div>

                      <div className={styles.inputArea}>
                        <div className={styles.panelLabel}>{t('custom_input')} <span className="opacity-40 italic ml-2 lowercase">(Enter all inputs before run)</span></div>
                        <div className={styles.inputWrapper}>
                           <span className={styles.terminalPrompt}>$</span>
                           <textarea 
                             className={styles.terminalTextarea}
                             placeholder={t('stdin_placeholder')}
                             value={stdin}
                             rows={3}
                             onChange={(e) => setStdin(e.target.value)}
                           />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      <footer className={styles.footer}>
        <button 
          className={styles.footerBtn}
          disabled={currentIndex === 0}
          onClick={() => { setCurrentIndex(i => i - 1); setJudgeResult(null); }}
        >
          <ChevronLeft size={18} strokeWidth={3} />
          {t('prevPortal')}
        </button>

        <div className={styles.sequenceContainer}>
            <div className={styles.sequenceLabel}>{t('sequence')}</div>
            <div className={styles.sequenceValue}>
                {currentIndex + 1} <span className={styles.sequenceDivider}>/</span> {totalQuestions}
            </div>
        </div>

        <button 
          className={styles.footerBtn}
          disabled={currentIndex === totalQuestions - 1}
          onClick={() => { setCurrentIndex(i => i + 1); setJudgeResult(null); }}
        >
          {t('nextPortal')}
          <ChevronRight size={18} strokeWidth={3} />
        </button>
      </footer>
    </div>
  );
}

