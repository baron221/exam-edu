'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import CodeMirror from '@uiw/react-codemirror';
import { cpp } from '@codemirror/lang-cpp';
import { oneDark } from '@codemirror/theme-one-dark';
import { ChevronLeft, ChevronRight, Timer as TimerIcon, Play, Save, Terminal as TerminalIcon } from 'lucide-react';
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
  
  // Terminal State
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [isPrompting, setIsPrompting] = useState(false);
  const [promptValue, setPromptValue] = useState('');
  const [judging, setJudging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const promptInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLines]);

  useEffect(() => {
    if (isPrompting) {
        promptInputRef.current?.focus();
    }
  }, [isPrompting]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/exams/${examId}`);
        const examData = await res.json();
        
        if (examData.error) {
           console.error("API error:", examData.error);
           return;
        }

        if (!examData.attempts || examData.attempts.length === 0) {
          const startRes = await fetch(`/api/exams/${examId}/start`, { method: 'POST' });
          const startData = await startRes.json();
          setExam(startData);
          setAttempt(startData.attempts[0]);
        } else {
          setExam(examData);
          setAttempt(examData.attempts[0]);
        }
        
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

  const handleStartRun = () => {
    const sourceCode = answers[currentQ.id] || currentQ.starterCode || '';
    const needsInput = /cin\s*>>|scanf|getline|std::cin/.test(sourceCode);
    
    setTerminalLines(["[System]: Compiling and preparing execution..."]);
    
    if (needsInput) {
      setIsPrompting(true);
      setTerminalLines(prev => [...prev, "Raqamni kiriting: "]);
    } else {
      executeJudge(sourceCode, "");
    }
  };

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const input = promptValue;
    setTerminalLines(prev => [...prev.slice(0, -1), `Raqamni kiriting: ${input}`]);
    setIsPrompting(false);
    setPromptValue('');
    
    const sourceCode = answers[currentQ.id] || currentQ.starterCode || '';
    executeJudge(sourceCode, input);
  };

  const executeJudge = async (sourceCode: string, input: string) => {
    setJudging(true);
    setTerminalLines(prev => [...prev, "[System]: Executing kernel..."]);
    try {
      const response = await fetch('/api/exams/judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          source_code: sourceCode, 
          stdin: input + '\n',
          language_id: (exam.questions[currentIndex] as any).language === 'cpp' ? 105 : 71 
        }),
      });
      const data = await response.json();
      
      const newLines: string[] = [];
      if (data.compile_output) newLines.push(`[Compile]: ${atob(data.compile_output)}`);
      if (data.stdout) newLines.push(atob(data.stdout));
      if (data.stderr) newLines.push(`[Error]: ${atob(data.stderr)}`);
      if (!data.stdout && !data.stderr && !data.compile_output) newLines.push(t('exec_no_output'));
      
      setTerminalLines(prev => [...prev, ...newLines]);
    } catch (error) {
      setTerminalLines(prev => [...prev, "[System]: Execution failed."]);
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
      router.push('/dashboard');
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !exam || !attempt) {
    return (
        <div className={styles.loadingOverlay}>
            <div className={styles.loadingText}>{t('authenticating')}</div>
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
      {submitting && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingText}>Syncing Protocol...</div>
        </div>
      )}
      
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
                onClick={() => { setCurrentIndex(idx); setTerminalLines([]); }}
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
                  <div className="flex items-center gap-2 font-semibold text-slate-500 uppercase text-[10px] tracking-widest">
                    <TerminalIcon size={12} />
                    {t('kernel_terminal')}
                  </div>
                  <button 
                    className={styles.runBtn} 
                    onClick={handleStartRun}
                    disabled={judging || isPrompting}
                  >
                    <Play size={14} className="mr-2" />
                    {judging ? t('compiling') : t('verify_solution')}
                  </button>
                </div>
                
                <div className={styles.workspace}>
                  <div className={styles.editorContainerContainer}>
                    <CodeMirror 
                        value={answers[currentQ.id] || currentQ.starterCode || ''} 
                        height="100%"
                        theme={oneDark}
                        extensions={[cpp()]}
                        onChange={(val) => handleAnswer(currentQ.id, val)}
                        className="h-full text-base"
                    />
                  </div>
                  <div className={styles.unifiedTerminal}>
                    <div className={styles.panelLabel}>{t('custom_output')}</div>
                    <div className={styles.terminalContainer}>
                        {terminalLines.map((line, idx) => (
                            <div key={idx} className={styles.terminalLine}>{line}</div>
                        ))}
                        {isPrompting && (
                            <form onSubmit={handlePromptSubmit} className={styles.promptLine}>
                                <span>Raqamni kiriting: </span>
                                <input 
                                    ref={promptInputRef}
                                    type="text" 
                                    value={promptValue}
                                    onChange={(e) => setPromptValue(e.target.value)}
                                    className={styles.terminalInput}
                                    autoFocus
                                />
                            </form>
                        )}
                        <div ref={terminalEndRef} />
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
          onClick={() => { setCurrentIndex(i => i - 1); setTerminalLines([]); }}
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
          onClick={() => { setCurrentIndex(i => i + 1); setTerminalLines([]); }}
        >
          {t('nextPortal')}
          <ChevronRight size={20} />
        </button>
      </footer>
    </div>
  );
}
