'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Timer from './Timer';
import MonacoEditor from '../MonacoEditor';
import styles from './ExamPlayer.module.css';
import Image from 'next/image';

interface ExamPlayerProps {
  examId: string;
}

export default function ExamPlayer({ examId }: ExamPlayerProps) {
  const router = useRouter();
  const [exam, setExam] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [judgeResult, setJudgeResult] = useState<any>(null);
  const [judging, setJudging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [starting, setStarting] = useState(false);
  const [attempt, setAttempt] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadExam = async () => {
      try {
        const res = await fetch(`/api/exams/${examId}`);
        if (!res.ok) throw new Error('Failed to load exam.');
        const data = await res.json();
        setExam(data);
        if (data.attempts?.[0]) {
          setAttempt(data.attempts[0]);
        }
      } catch (err: any) {
        setError(err.message);
      }
    };
    loadExam();
  }, [examId]);

  const startExam = async () => {
    setStarting(true);
    try {
      const res = await fetch(`/api/exams/${examId}/start`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start exam.');
      setAttempt(data);
      const examRes = await fetch(`/api/exams/${examId}`);
      setExam(await examRes.json());
    } catch (err: any) {
      alert(err.message);
    } finally {
      setStarting(false);
    }
  };

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const runCode = async (code: string) => {
    if (!code.trim()) return;
    setJudging(true);
    setJudgeResult(null);
    try {
      const res = await fetch('/api/exams/judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_code: code })
      });
      const data = await res.json();
      setJudgeResult(data);
    } catch (err) {
      setJudgeResult({ error: 'Connection to judge failed.' });
    } finally {
      setJudging(false);
    }
  };

  const submitExam = async (automatic = false) => {
    if (!automatic && !confirm('Are you certain you wish to finalize and submit this examination? This action cannot be undone.')) return;
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
        alert(data.error || 'Submission failed.');
      }
    } catch (err) {
      alert('Network error during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  if (error) return <div className={styles.loadingOverlay}>{error}</div>;
  if (!exam) return <div className={styles.loadingOverlay}>Initializing Secure Session...</div>;

  if (!attempt || attempt.status === 'READY') {
    return (
      <div className={styles.viewer} style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className={styles.questionCard} style={{ textAlign: 'center', backgroundColor: 'white' }}>
          <div className="relative w-20 h-20 mx-auto mb-8">
            <Image src="/logo_npuu.png" alt="NPUU Logo" fill className="object-contain" />
          </div>
          <h2 className="text-sm font-bold text-npuu-teal uppercase tracking-widest mb-2">Examination Terminal</h2>
          <h1 className={styles.title} style={{ fontSize: '32px', marginBottom: '16px' }}>{exam.title}</h1>
          <p className="text-slate-500 font-medium mb-10 max-w-md mx-auto">{exam.description || 'Welcome to the formal examination system. Please prepare your workstation.'}</p>
          
          <div className="flex justify-center gap-12 mb-12 border-y border-slate-100 py-8">
            <div className="text-center">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Time Limit</div>
              <div className="text-2xl font-display font-black text-npuu-navy">{exam.timeLimit} MIN</div>
            </div>
            <div className="text-center border-l border-slate-100 pl-12">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Weight</div>
              <div className="text-2xl font-display font-black text-npuu-navy">{exam.questions?.length || 0} Qs</div>
            </div>
          </div>

          <button className={styles.submitBtn} onClick={startExam} disabled={starting}>
            {starting ? 'Acquiring Secure Token...' : '🚀 Authenticate & Begin Exam'}
          </button>
          <p className="mt-6 text-[11px] font-bold text-slate-300 uppercase tracking-tight">Standard Security Protocols Active</p>
        </div>
      </div>
    );
  }

  const currentQ = exam.questions[currentIndex];
  const totalQuestions = exam.questions.length;
  
  const startTime = new Date(attempt.startTime).getTime();
  const endTime = startTime + (exam.timeLimit * 60 * 1000);
  const secondsLeft = Math.max(0, Math.floor((endTime - Date.now()) / 1000));

  return (
    <div className={styles.viewer}>
      {submitting && <div className={styles.loadingOverlay}>Securing Submission Data...</div>}
      
      <header className={styles.header}>
        <div className="flex items-center gap-4">
          <div className="relative w-8 h-8">
            <Image src="/logo_npuu.png" alt="NPUU Logo" fill className="object-contain" />
          </div>
          <div className={styles.title}>{exam.title}</div>
        </div>
        <Timer initialSeconds={secondsLeft} onTimeUp={() => submitExam(true)} />
        <button className={styles.submitBtn} style={{ padding: '8px 24px', fontSize: '13px' }} onClick={() => submitExam()}>Finish Submssion</button>
      </header>

      <div className={styles.main}>
        <aside className={styles.sidebar}>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Question Progress</div>
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

          <div className="mt-auto p-6 bg-slate-50 border border-slate-100 rounded-2xl">
            <h5 className="text-[10px] font-bold text-npuu-navy uppercase tracking-widest mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Official Terminal
            </h5>
            <p className="text-[11px] leading-relaxed text-slate-500 font-medium italic">
              "Your performance today is a reflection of your dedication to pedagogical excellence."
            </p>
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
                    <div className="text-slate-700 font-semibold">{opt.text}</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className={styles.codingArea}>
                <div className={styles.editorHeader}>
                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    <span className="text-xs">💻</span> Enterprise C++ Environment
                  </div>
                  <button className={styles.runBtn} onClick={() => runCode(answers[currentQ.id] || currentQ.starterCode || '')} disabled={judging}>
                    {judging ? 'Executing...' : '▶ Verify Solution'}
                  </button>
                </div>
                
                <div className="rounded-2xl overflow-hidden border border-slate-200">
                  <MonacoEditor 
                      value={answers[currentQ.id] || currentQ.starterCode || ''} 
                      onChange={(val) => handleAnswer(currentQ.id, val || '')}
                      height="450px"
                  />
                </div>

                {judgeResult && (
                  <div className={`${styles.judgeResult} ${judgeResult.status?.id === 3 ? styles.resultSuccess : styles.resultError}`}>
                    <div className="font-bold mb-2 uppercase tracking-tight text-xs">Terminal Output:</div>
                    <pre className="whitespace-pre-wrap">{JSON.stringify(judgeResult, null, 2)}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      <footer className={styles.footer}>
        <button 
          className="px-6 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-30"
          disabled={currentIndex === 0}
          onClick={() => { setCurrentIndex(i => i - 1); setJudgeResult(null); }}
        >
          ← Previous Question
        </button>
        <div className="flex flex-col items-center">
            <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1">Question Status</div>
            <div className="text-sm font-bold text-slate-600">
                {currentIndex + 1} / {totalQuestions}
            </div>
        </div>
        <button 
          className="px-8 py-2.5 rounded-xl bg-slate-100 text-sm font-bold text-slate-700 hover:bg-npuu-blue hover:text-white transition-all disabled:opacity-30"
          disabled={currentIndex === totalQuestions - 1}
          onClick={() => { setCurrentIndex(i => i + 1); setJudgeResult(null); }}
        >
          Continue Assessment →
        </button>
      </footer>
    </div>
  );
}
