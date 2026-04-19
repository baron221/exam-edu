'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import MonacoEditor from '@monaco-editor/react';
import { ChevronLeft, ChevronRight, Timer as TimerIcon, Play, Save } from 'lucide-react';
import styles from './ExamPlayer.module.css';
import { useTranslation } from '@/i18n/translations';

interface TimerProps {
  initialSeconds: number;
  onTimeUp: () => void;
}

const Timer: React.FC<TimerProps> = ({ initialSeconds, onTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const { t } = useTranslation();

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-lg border border-indigo-100">
      <TimerIcon className="text-indigo-600" size={18} />
      <span className="font-mono font-bold text-indigo-700 text-lg">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
};

export default function ExamPlayer({ examId }: { examId: string }) {
  const router = useRouter();
  const { t } = useTranslation();
  const [exam, setExam] = useState<any>(null);
  const [attempt, setAttempt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [judging, setJudging] = useState(false);
  const [judgeResult, setJudgeResult] = useState<any>(null);
  const [stdin, setStdin] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch exam and attempt data
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/exams/${examId}`);
        const examData = await res.json();
        
        if (examData.error) {
           console.error("API error:", examData.error);
           return;
        }

        setExam(examData);
        // Robust attempt search: ensure it is an array before accessing first element
        if (Array.isArray(examData.attempts) && examData.attempts.length > 0) {
          setAttempt(examData.attempts[0]);
        }
        
        // Load saved answers
        const savedAnswers = localStorage.getItem(`exam_answers_${examId}`);
        if (savedAnswers) {
          setAnswers(JSON.parse(savedAnswers));
        }
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [examId]);

  const handleAnswer = (questionId: string, value: string) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
    localStorage.setItem(`exam_answers_${examId}`, JSON.stringify(newAnswers));
  };

  const runCode = async (sourceCode: string, input: string, language: string) => {
    setJudging(true);
    setJudgeResult(null);
    try {
      const response = await fetch('/api/exams/judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          source_code: sourceCode, 
          stdin: input, 
          language_id: language === 'cpp' ? 105 : 71 
        }),
      });
      const data = await response.json();
      setJudgeResult(data);
    } catch (error) {
      console.error('Judge error:', error);
      setJudgeResult({ error: 'System error' });
    } finally {
      setJudging(false);
    }
  };

  const submitExam = async (isAuto = false) => {
    if (!isAuto && !confirm(t('confirm_submit'))) return;
    
    setSubmitting(true);
    try {
      const response = await fetch(`/api/exams/${examId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      localStorage.removeItem(`exam_answers_${examId}`);
      router.push('/dashboard');
    } catch (error) {
      console.error('Submit error:', error);
      alert('Error submitting exam: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !exam || !attempt) {
    return <div className={styles.loadingOverlay}>{t('authenticating')}...</div>;
  }

  const currentQ = exam.questions[currentIndex];
  const totalQuestions = exam.questions.length;
  
  const startTime = new Date(attempt.startTime).getTime();
  const endTime = startTime + (exam.timeLimit * 60 * 1000);
  const secondsLeft = Math.max(0, Math.floor((endTime - Date.now()) / 1000));

  return (
    <div className={styles.viewer}>
      {submitting && <div className={styles.loadingOverlay}>{t('authenticating')}...</div>}
      
      <header className={styles.header}>
        <div className="flex items-center gap-4">
          <Image src="/logo_npuu.png" alt="Logo" width={32} height={32} />
          <div className={styles.title}>{exam.title}</div>
        </div>
        <Timer initialSeconds={secondsLeft} onTimeUp={() => submitExam(true)} />
        <button className={styles.submitBtn} onClick={() => submitExam()}>
          {t('finalize_submit')}
        </button>
      </header>

      <div className={styles.main}>
        <aside className={styles.sidebar}>
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
                    <div>{opt.text}</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className={styles.codingArea}>
                <div className={styles.editorHeader}>
                  <div className="font-semibold text-slate-500">{t('kernel_terminal')}</div>
                  <button 
                    className={styles.runBtn} 
                    onClick={() => runCode(answers[currentQ.id] || currentQ.starterCode || '', stdin, currentQ.language || 'cpp')}
                    disabled={judging}
                  >
                    {judging ? t('compiling') : t('verify_solution')}
                  </button>
                </div>
                
                <div className={styles.workspace}>
                  <div className={styles.editorContainerContainer}>
                    <MonacoEditor 
                        theme="vs-dark"
                        value={answers[currentQ.id] || currentQ.starterCode || ''} 
                        onChange={(val) => handleAnswer(currentQ.id, val || '')}
                        height="400px"
                    />
                  </div>
                  <div className={styles.judgeResult}>
                    <div className={styles.outputArea}>
                      <div className={styles.panelLabel}>{t('custom_output')}</div>
                      <div className={styles.terminalOutput}>
                        {judgeResult ? (
                          <>
                            {judgeResult.stdout && atob(judgeResult.stdout)}
                            {judgeResult.stderr && atob(judgeResult.stderr)}
                            {judgeResult.compile_output && atob(judgeResult.compile_output)}
                            {!judgeResult.stdout && !judgeResult.stderr && !judgeResult.compile_output && t('exec_no_output')}
                          </>
                        ) : (
                          <span className="opacity-50 italic">{t('waiting_for_execution')}</span>
                        )}
                      </div>
                    </div>

                    <div className={styles.inputArea}>
                      <div className={styles.panelLabel}>{t('custom_input')}</div>
                      <div className={styles.inputWrapper}>
                         <span className={styles.terminalPrompt}>$</span>
                         <textarea 
                           className={styles.terminalTextarea}
                           placeholder={t('stdin_placeholder')}
                           value={stdin}
                           onChange={(e) => setStdin(e.target.value)}
                         />
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
          <ChevronLeft size={20} />
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
          <ChevronRight size={20} />
        </button>
      </footer>
    </div>
  );
}
