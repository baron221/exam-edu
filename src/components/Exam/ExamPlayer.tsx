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
import Timer from './Timer';

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
  
  // Variant selection state
  const [requiresVariant, setRequiresVariant] = useState(false);
  const [availableVariants, setAvailableVariants] = useState<any[]>([]);
  const [selectingVariantId, setSelectingVariantId] = useState<string | null>(null);

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

  const fetchData = async (vId?: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/exams/${examId}/start`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId: vId })
      });
      const data = await res.json();
      
      if (data.error) {
        router.push('/');
        return;
      }

      if (data.requiresVariant) {
        setRequiresVariant(true);
        setAvailableVariants(data.variants);
        setExam(data);
        return;
      }

      setRequiresVariant(false);
      setExam(data);
      const att = data.attempts[0];
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
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (userId) fetchData();
  }, [examId, userId, router]);

  const handleVariantSelect = (vId: string) => {
    setSelectingVariantId(vId);
    fetchData(vId);
  };

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

  if (loading || !exam || (!attempt && !requiresVariant)) {
    return (
        <div className={styles.loadingOverlay}>
            <div className={styles.loadingText}>{t('authenticating')}</div>
        </div>
    );
  }

  if (requiresVariant) {
    return (
      <div className={styles.loadingOverlay} style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #fafbff 50%, #f4f0ff 100%)', display: 'flex', flexDirection: 'column', padding: '40px' }}>
        <div style={{ maxWidth: 800, width: '100%', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <Image src="/logo_npuu.png" alt="Logo" width={64} height={64} style={{ margin: '0 auto 24px' }} />
            <h1 style={{ fontSize: 32, fontWeight: 950, color: '#0f172a', marginBottom: 12 }}>Variantni tanlang</h1>
            <p style={{ fontSize: 16, color: '#64748b', fontWeight: 500 }}>{exam.title} imtihoni uchun berilgan variantlardan birini tanlang. Har bir variant o'zining savollar to'plamiga ega.</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 24 }}>
            {availableVariants.map((v: any) => (
              <div 
                key={v.id} 
                onClick={() => handleVariantSelect(v.id)}
                style={{ 
                  background: '#fff', borderRadius: 24, padding: 32, border: '2px solid #e2e8f0', cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', position: 'relative', overflow: 'hidden',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.02)', textAlign: 'center'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(99, 102, 241, 0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.02)'; }}
              >
                <div style={{ fontSize: 40, marginBottom: 16 }}>📄</div>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>{v.name}</h3>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#6366f1', background: 'rgba(99, 102, 241, 0.08)', padding: '6px 12px', borderRadius: 12, display: 'inline-block' }}>
                  {v.questionCount} ta savol
                </div>
              </div>
            ))}
          </div>
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
      <header className={styles.header}>
        <div className="flex items-center gap-4">
          <Image src="/logo_npuu.png" alt="Logo" width={32} height={32} />
          <div className={styles.title}>
            {exam.title}
            {exam.selectedVariant && (
              <span style={{ marginLeft: 12, fontSize: 12, opacity: 0.6, fontWeight: 700, background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: 6 }}>
                {exam.selectedVariant.name}
              </span>
            )}
          </div>
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
