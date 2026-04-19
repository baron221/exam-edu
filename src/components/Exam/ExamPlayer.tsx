'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import CodeMirror from '@uiw/react-codemirror';
import { cpp } from '@codemirror/lang-cpp';
import { oneDark } from '@codemirror/theme-one-dark';
import { 
  ChevronLeft, 
  ChevronRight, 
  Timer as TimerIcon, 
  Play, 
  Terminal as TerminalIcon,
  Code2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import styles from './ExamPlayer.module.css';
import { useTranslation } from '@/i18n/translations';

export default function ExamPlayer({ examId }: { examId: string }) {
  const router = useRouter();
  const { t } = useTranslation();
  const [exam, setExam] = useState<any>(null);
  const [attempt, setAttempt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [judging, setJudging] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Xterm Refs
  const terminalRef = useRef<HTMLDivElement>(null);
  const termInstance = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  
  // Interactive State
  const isInputMode = useRef(false);
  const inputBuffer = useRef('');
  const resolveInput = useRef<((value: string) => void) | null>(null);

  // Initialize Terminal
  useEffect(() => {
    if (!terminalRef.current || termInstance.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: '"JetBrains Mono", monospace',
      theme: {
        background: '#0f172a',
        foreground: '#cbd5e1',
        cursor: '#818cf8',
        selectionBackground: 'rgba(129, 140, 248, 0.3)',
      },
      convertEol: true
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    term.writeln('\x1b[1;34m[System]\x1b[0m Terminal initialized. Welcome to NPUU Kernel.');
    
    // Handle Input Typing
    term.onData((data) => {
        if (!isInputMode.current) return;

        if (data === '\r') { // Enter
            term.write('\r\n');
            const result = inputBuffer.current;
            inputBuffer.current = '';
            isInputMode.current = false;
            resolveInput.current?.(result);
        } else if (data === '\x7f') { // Backspace
            if (inputBuffer.current.length > 0) {
                inputBuffer.current = inputBuffer.current.slice(0, -1);
                term.write('\b \b');
            }
        } else {
            inputBuffer.current += data;
            term.write(data);
        }
    });

    termInstance.current = term;
    fitAddonRef.current = fitAddon;

    return () => {
      term.dispose();
      termInstance.current = null;
    };
  }, []);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => fitAddonRef.current?.fit();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch Data
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/exams/${examId}`);
        const examData = await res.json();
        if (examData.error) return;

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
        if (savedAnswers) setAnswers(JSON.parse(savedAnswers));
      } catch (error) {
        console.error(error);
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

  const requestInput = (prompt: string): Promise<string> => {
    return new Promise((resolve) => {
      termInstance.current?.write(`\x1b[1;33m${prompt}\x1b[0m `);
      isInputMode.current = true;
      resolveInput.current = resolve;
    });
  };

  const runCode = async () => {
    if (!termInstance.current) return;
    const currentQ = exam.questions[currentIndex];
    const sourceCode = answers[currentQ.id] || currentQ.starterCode || '';
    
    termInstance.current.clear();
    termInstance.current.writeln('\x1b[1;32m[Compile]\x1b[0m g++ main.cpp -o main');
    
    // Smart Interactive Hint
    let capturedStdin = "";
    const needsInput = /cin\s*>>|scanf|getline|std::cin/.test(sourceCode);
    
    if (needsInput) {
        const promptMatch = sourceCode.match(/cout\s*<<\s*["']([^"']+)["'](?=[^]*?(cin|scanf))/);
        const promptText = promptMatch ? promptMatch[1].replace(/\\n/g, '') : "Enter input: ";
        capturedStdin = await requestInput(promptText);
    }

    setJudging(true);
    termInstance.current.writeln('\x1b[1;34m[System]\x1b[0m Executing kernel...');
    
    try {
      const response = await fetch('/api/exams/judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          source_code: sourceCode, 
          stdin: capturedStdin + '\n',
          language_id: currentQ.language === 'cpp' ? 105 : 71 
        }),
      });
      const data = await response.json();
      
      if (data.compile_output) {
        termInstance.current.writeln('\x1b[1;31m[Build Error]\x1b[0m');
        termInstance.current.writeln(atob(data.compile_output));
      } else {
        if (data.stdout) termInstance.current.writeln(atob(data.stdout));
        if (data.stderr) termInstance.current.writeln(`\x1b[1;31m[Runtime Error]:\x1b[0m ${atob(data.stderr)}`);
        if (!data.stdout && !data.stderr) termInstance.current.writeln('\x1b[1;30m(No output returned)\x1b[0m');
      }
      
      termInstance.current.writeln(`\r\n\x1b[1;32m[Finished]\x1b[0m Process exited with code ${data.status.id === 3 ? 0 : data.status.id}`);
    } catch (error) {
      termInstance.current.writeln('\x1b[1;31m[Critical Error]\x1b[0m System failed to respond.');
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
      router.push('/dashboard');
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !exam || !attempt) {
    return (
        <div className={styles.loadingOverlay}>
            <div className={styles.loadingText}>Loading Workspace...</div>
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
        <div className={styles.title}>
          <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center">
            <Code2 size={14} className="text-white" />
          </div>
          {exam.title}
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-slate-400">
            <TimerIcon size={14} />
            <span className="font-mono font-bold text-slate-200">
              {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
            </span>
          </div>
          <button className={styles.submitBtn} onClick={() => submitExam()}>
            Finalize Attempt
          </button>
        </div>
      </header>

      <div className={styles.main}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarSection}>
            <div className={styles.sectionTitle}>Examination Progress</div>
            <div className={styles.questionNav}>
              {exam.questions.map((q: any, idx: number) => (
                <button 
                  key={q.id} 
                  className={`${styles.navBtn} ${currentIndex === idx ? styles.active : ''} ${answers[q.id] ? styles.answered : ''}`}
                  onClick={() => { setCurrentIndex(idx); termInstance.current?.clear(); }}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className={styles.workspaceWrapper}>
          <div className={styles.questionHeader}>
            <div className={styles.questionText}>{currentQ.text}</div>
          </div>

          <div className={styles.editorArea}>
            <div className={styles.editorContainer}>
              <div className={styles.panelHeader}>
                <div className={styles.panelTitle}>Source Code (main.cpp)</div>
              </div>
              <CodeMirror 
                value={answers[currentQ.id] || currentQ.starterCode || ''} 
                height="100%"
                theme={oneDark}
                extensions={[cpp()]}
                onChange={(val) => handleAnswer(currentQ.id, val)}
                className="flex-1"
              />
            </div>

            <div className={styles.terminalContainer}>
              <div className={styles.panelHeader}>
                <div className={styles.panelTitle}>
                  <TerminalIcon size={12} />
                  Standard Terminal
                </div>
                <button className={styles.runBtn} onClick={runCode} disabled={judging}>
                  <Play size={10} className="mr-2" />
                  {judging ? 'Compiling...' : 'Run Kernel'}
                </button>
              </div>
              <div ref={terminalRef} className={styles.terminalInstance} />
            </div>
          </div>
        </section>
      </div>

      <footer className={styles.footer}>
        <button 
          className={styles.footerBtn}
          disabled={currentIndex === 0}
          onClick={() => { setCurrentIndex(i => i - 1); termInstance.current?.clear(); }}
        >
          <ChevronLeft size={16} /> Previous
        </button>
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Question {currentIndex + 1} of {totalQuestions}
        </div>
        <button 
          className={styles.footerBtn}
          disabled={currentIndex === totalQuestions - 1}
          onClick={() => { setCurrentIndex(i => i + 1); termInstance.current?.clear(); }}
        >
          Next <ChevronRight size={16} />
        </button>
      </footer>
    </div>
  );
}
