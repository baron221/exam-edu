'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
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
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;
  const { t } = useTranslation();
  const [exam, setExam] = useState<any>(null);
  const [attempt, setAttempt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  
  // Terminal State
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [isPrompting, setIsPrompting] = useState(false);
  const [stdinValue, setStdinValue] = useState('');
  const [expectedPrompts, setExpectedPrompts] = useState<string[]>([]);
  const [judging, setJudging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const promptInputRef = useRef<HTMLInputElement>(null);

  const getPromptHints = (code: string) => {
    const cleanCode = code.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, '');
    const statements = cleanCode.split(/;/);
    const hints: string[] = [];
    let lastCout = null;
    
    for (const stmt of statements) {
        const coutMatch = stmt.match(/cout\s*<<\s*["']([^"']+)["']/);
        if (coutMatch) {
            lastCout = coutMatch[1].replace(/\\n/g, '');
        }
        
        if (/(?:std::)?cin|scanf|getline/.test(stmt)) {
            if (lastCout) {
                hints.push(lastCout);
                lastCout = null; // reset
            }
        }
    }
    return hints;
  };

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLines]);

  useEffect(() => {
    if (isPrompting) {
        promptInputRef.current?.focus();
    }
  }, [isPrompting]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/exams/${examId}/start`, { method: 'POST' });
        const examData = await res.json();
        
        if (examData.error) {
          router.push('/');
          return;
        } else {
          setExam(examData);
          const att = examData.attempts[0];
          setAttempt(att);

          // Restore answers: Priority 1 - Database
          const initialAnswers: Record<string, string> = {};
          if (att?.responses) {
            att.responses.forEach((r: any) => {
              initialAnswers[r.questionId] = r.answer || "";
            });
          }

          // Restore answers: Priority 2 - User-specific LocalStorage (for unsaved session data)
          if (userId) {
            const cacheKey = `exam_${examId}_user_${userId}`;
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
              const parsed = JSON.parse(cached);
              Object.assign(initialAnswers, parsed);
            }
          }

          setAnswers(initialAnswers);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    if (userId) fetchData();
  }, [examId, userId, router]);

  const handleAnswer = (questionId: string, value: string) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
    if (userId) {
      localStorage.setItem(`exam_${examId}_user_${userId}`, JSON.stringify(newAnswers));
    }
  };

  const handleStartRun = () => {
    const currentQ = exam.questions[currentIndex];
    const sourceCode = answers[currentQ.id] || currentQ.starterCode || '';
    
    setTerminalLines(["[System]: Compiling and preparing execution..."]);
    setStdinValue('');
    
    if (/(?:std::)?cin|scanf|getline/.test(sourceCode)) {
      const hints = getPromptHints(sourceCode);
      setExpectedPrompts(hints);
      setIsPrompting(true);
    } else {
      executeJudge(sourceCode, "");
    }
  };

  const submitBatchInput = () => {
    setIsPrompting(false);
    setTerminalLines(prev => [...prev, `[System]: Input received. Executing with batch input...`]);
    
    const currentQ = exam.questions[currentIndex];
    const sourceCode = answers[currentQ.id] || currentQ.starterCode || '';
    executeJudge(sourceCode, stdinValue);
  };

  const safeBase64Decode = (str: string) => {
    if (!str) return "";
    try {
      // Decode base64 to utf-8 safely in browser
      return decodeURIComponent(escape(atob(str)));
    } catch (error) {
      return atob(str);
    }
  };

  const executeJudge = async (sourceCode: string, input: string) => {
    setJudging(true);
    setTerminalLines(prev => [...prev, "[System]: Executing kernel..."]);
    try {
      // Safely check language, defaulting to C++ (105)
      const isPython = (exam.questions[currentIndex] as any).language === 'python';
      
      const response = await fetch('/api/exams/judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          source_code: sourceCode, 
          stdin: input + '\n',
          language_id: isPython ? 71 : 105 
        }),
      });
      const data = await response.json();
      
      const newLines: string[] = [];
      if (data.compile_output) newLines.push(`[Compile]: ${safeBase64Decode(data.compile_output)}`);
      
      if (data.stdout) {
          let outText = safeBase64Decode(data.stdout);
          
          // Filter out strings that were used as input prompts to keep the terminal output clean
          if (expectedPrompts.length > 0) {
            expectedPrompts.forEach(prompt => {
                // Remove the prompt string from the output if it exists at the start or is identical
                // Note: We use a simple replace here which works for the sequential stdout in Judge0
                outText = outText.replace(prompt, "");
            });
          }
          
          if (outText.trim()) {
            newLines.push(outText.trimStart());
          }
      }
      
      if (data.stderr) newLines.push(`[Error]: ${safeBase64Decode(data.stderr)}`);
      if (!data.stdout && !data.stderr && !data.compile_output) newLines.push(t('exec_no_output'));
      
      setTerminalLines(prev => [...prev, ...newLines]);
    } catch (error) {
      setTerminalLines(prev => [...prev, "[System]: Execution failed. Network or Server error."]);
    } finally {
      setJudging(false);
    }
  };

  const submitExam = async (isAuto = false) => {
    if (!isAuto && !confirm(t('confirm_submit'))) return;
    setSubmitting(true);
    try {
      await fetch(`/api/exams/${examId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      
      // Clear user-specific cache on successful submission
      if (userId) {
        localStorage.removeItem(`exam_${examId}_user_${userId}`);
      }

      router.push(`/exams/${examId}/result`);
    } catch (error) {
      console.error(error);
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
              {(exam.userLanguage === 'ru' && currentQ.textRu) ? currentQ.textRu : currentQ.text}
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
                    <div>{(exam.userLanguage === 'ru' && opt.textRu) ? opt.textRu : opt.text}</div>
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
                  <button className={styles.runBtn} onClick={handleStartRun} disabled={judging || isPrompting}>
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
                            <div className={styles.batchInputBlock}>
                                <label className={styles.batchInputLabel}>
                                  Standart Kiritish (STDIN)
                                  <span className={styles.batchInputHint}>
                                    Dasturga kerakli barcha kiritiluvchi ma'lumotlarni yozing (qatorlar yozishda 'Enter' yoki 'Probel' ishlating)
                                  </span>
                                </label>
                                {expectedPrompts.length > 0 && (
                                    <div style={{ padding: '8px', backgroundColor: '#151521', border: '1px dashed #4f46e5', borderRadius: '4px', marginBottom: '8px' }}>
                                        <div style={{fontSize: '0.75rem', color: '#8892b0', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Kompyuter quyidagi ma'lumotlarni kutmoqda:</div>
                                        {expectedPrompts.map((p, i) => (
                                            <div key={i} style={{color: '#fbbf24', fontSize: '0.85rem', fontFamily: 'monospace', paddingLeft: '8px', borderLeft: '2px solid #fbbf24', marginBottom: '4px'}}>{p} ________</div>
                                        ))}
                                    </div>
                                )}
                                <textarea
                                  ref={promptInputRef as any}
                                  value={stdinValue}
                                  onChange={(e) => setStdinValue(e.target.value)}
                                  className={styles.batchTextarea}
                                  placeholder="Masalan: \n12\n5\n"
                                  rows={5}
                                  autoFocus
                                />
                                <button type="button" onClick={submitBatchInput} className={styles.batchSubmitBtn}>
                                    Ma'lumotlarni Yuborish (Ishga Tushirish)
                                </button>
                            </div>
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
