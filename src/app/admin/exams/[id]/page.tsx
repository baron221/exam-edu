'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Sparkles, FileStack, X, Trash2, CheckCircle2, AlertCircle, Plus, Send, RefreshCw, ChevronLeft } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import styles from './ExamDetail.module.css';

export default function ExamDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkMode, setBulkMode] = useState<'TEXT' | 'AI'>('TEXT');
  const [bulkInput, setBulkInput] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [pendingQuestions, setPendingQuestions] = useState<any[]>([]);
  const [loadingBulk, setLoadingBulk] = useState(false);

  // Single Question Form
  const [qText, setQText] = useState('');
  const [qType, setQType] = useState('MCQ');
  const [points, setPoints] = useState(1);
  const [options, setOptions] = useState([
    { text: '', isCorrect: true },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ]);
  const [starterCode, setStarterCode] = useState('');
  const [language, setLanguage] = useState('cpp');
  const [loadingAdd, setLoadingAdd] = useState(false);

  useEffect(() => {
    if (!id) return;
    refreshData();
  }, [id]);

  const refreshData = async () => {
    try {
        const res = await fetch(`/api/admin/exams/${id}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setExam(data);
        setLoading(false);
    } catch (err) {
        toast.error('Failed to load exam details');
        setLoading(false);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAdd(true);
    const res = await fetch(`/api/admin/exams/${id}/questions`, {
      method: 'POST',
      body: JSON.stringify({
        text: qText,
        type: qType,
        points,
        options: qType === 'MCQ' ? options.filter(o => o.text.trim()) : [],
        starterCode: qType === 'CODING' ? starterCode : '',
        language: qType === 'CODING' ? language : '',
      }),
    });
    if (res.ok) {
      const newQ = await res.json();
      setExam({ ...exam, questions: [...exam.questions, newQ] });
      setQText('');
      setStarterCode('');
      toast.success('Question added to database');
    } else {
      toast.error('Critical: Database injection failed');
    }
    setLoadingAdd(false);
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!confirm('Permanently remove this question?')) return;
    const res = await fetch(`/api/admin/questions/${qId}`, { method: 'DELETE' });
    if (res.ok) {
      setExam({ ...exam, questions: exam.questions.filter((q: any) => q.id !== qId) });
      toast.success('Question purged');
    }
  };

  // Bulk / AI Logic
  const parseSmartText = () => {
    try {
        const lines = bulkInput.split('\n').map(l => l.trim()).filter(Boolean);
        const questions: any[] = [];
        let currentQ: any = null;

        lines.forEach(line => {
            if (line.toLowerCase().startsWith('q:') || line.toLowerCase().startsWith('question:')) {
                if (currentQ) questions.push(currentQ);
                currentQ = { text: line.replace(/^(Q:|Question:)\s*/i, ''), type: 'MCQ', options: [], points: 1 };
            } else if (line.startsWith('*')) {
                currentQ?.options.push({ text: line.substring(1).trim(), isCorrect: true });
            } else if (line.startsWith('-') || line.match(/^[A-Z]\)/)) {
                currentQ?.options.push({ text: line.replace(/^[A-Z]\)\s*/, ''), isCorrect: false });
            } else if (line.toLowerCase().startsWith('type:')) {
                if (currentQ) currentQ.type = line.split(':')[1].trim().toUpperCase();
            } else if (line.toLowerCase().startsWith('starter:')) {
                if (currentQ) currentQ.starterCode = line.split(':')[1].trim();
            } else if (currentQ) {
                 currentQ.options.push({ text: line.replace(/^-\s*/, ''), isCorrect: false });
            }
        });
        if (currentQ) questions.push(currentQ);
        setPendingQuestions(questions);
        toast.success(`Success: ${questions.length} questions parsed`);
    } catch (e) {
        toast.error('UI: Text parsing exception');
    }
  };

  const generateAIQuestions = async () => {
    if (!aiPrompt) return toast.error('Topic prompt required for AI engine');
    setLoadingBulk(true);
    try {
        const res = await fetch('/api/admin/exams/generate-ai', {
            method: 'POST',
            body: JSON.stringify({ prompt: aiPrompt, count: 10 })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setPendingQuestions(data.questions || []);
        toast.success('AI Engine: Synthesis complete');
    } catch (err: any) {
        toast.error(err.message || 'AI Engine Failure');
    }
    setLoadingBulk(false);
  };

  const saveBulkQuestions = async () => {
    if (pendingQuestions.length === 0) return;
    setLoadingBulk(true);
    try {
        const res = await fetch(`/api/admin/exams/${id}/bulk`, {
            method: 'POST',
            body: JSON.stringify({ questions: pendingQuestions })
        });
        if (res.ok) {
            toast.success(`Pipeline: ${pendingQuestions.length} units injected`);
            setShowBulkModal(false);
            setPendingQuestions([]);
            refreshData();
        } else {
            throw new Error('Transaction rejected by server');
        }
    } catch (err: any) {
        toast.error(err.message);
    }
    setLoadingBulk(false);
  };

  if (loading) return (
    <div className={styles.pageContainer} style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
       <RefreshCw className="animate-spin" size={32} color="#6366f1" />
    </div>
  );

  return (
    <div className={styles.pageContainer}>
      <Toaster position="top-right" />
      
      <button onClick={() => router.back()} className={styles.backBtn}>
        <ChevronLeft size={14} /> Back to Examinations
      </button>
      
      <div className={styles.examHeader}>
        <span className={styles.typeBadge}>Terminal Protocol: {exam.type}</span>
        <h1 className={styles.title}>{exam.title}</h1>
        <p className={styles.description}>{exam.description || 'Secure examination environment established for the National Pedagogical University.'}</p>
        
        <div className={styles.metaGrid}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Academic Course</span>
            <span className={styles.metaValue}>{exam.course.title}</span>
          </div>
          <div className={styles.metaDivider} />
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Session Duration</span>
            <span className={styles.metaValue}>{exam.timeLimit} Minutes</span>
          </div>
          <div className={styles.metaDivider} />
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Pass Threshold</span>
            <span className={styles.metaValue}>{exam.passingScore}% Accuracy</span>
          </div>
        </div>
      </div>

      <div className={styles.mainGrid}>
        
        <div className="space-y-6">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Question Repository ({exam.questions.length})</h2>
            <div className={styles.actionRow}>
                <button onClick={() => { setBulkMode('TEXT'); setShowBulkModal(true); }} className={styles.secondaryBtn}>
                    <FileStack size={14} /> Bulk Import
                </button>
                <button onClick={() => { setBulkMode('AI'); setShowBulkModal(true); }} className={styles.primaryBtn}>
                    <Sparkles size={14} /> Magic AI
                </button>
            </div>
          </div>

          <div>
            {exam.questions.length === 0 ? (
              <div className={styles.emptyState}>
                <AlertCircle size={32} />
                No questions defined for this protocol
              </div>
            ) : exam.questions.map((q: any, idx: number) => (
              <div key={q.id} className={styles.questionCard}>
                <div className={styles.qHeader}>
                  <span className={styles.qBadge}>Segment {idx + 1} &bull; {q.type}</span>
                  <button onClick={() => handleDeleteQuestion(q.id)} className={styles.deleteBtn}>
                    <Trash2 size={16} />
                  </button>
                </div>
                <p className={styles.qText}>{q.text}</p>
                
                {q.type === 'MCQ' && (
                  <div className={styles.optionsGrid}>
                    {q.options.map((o: any) => (
                      <div key={o.id} className={`${styles.optionItem} ${o.isCorrect ? styles.correct : ''}`}>
                        {o.isCorrect ? <CheckCircle2 size={14} /> : <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #e2e8f0' }} />}
                        {o.text}
                      </div>
                    ))}
                  </div>
                )}
                
                {q.type === 'CODING' && (
                  <div className={styles.codeBox}>
                    <span className={styles.codeLabel}>{q.language} Core</span>
                    <pre style={{ margin: 0 }}>{q.starterCode || '// No starter code established'}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className={styles.sidebarCard}>
          <h3 className={styles.sideTitle}>
            <Plus size={20} color="#6366f1" /> Manual Injection
          </h3>

          <div className={styles.tabGroup}>
            <button onClick={() => setQType('MCQ')} className={`${styles.tabBtn} ${qType === 'MCQ' ? styles.active : ''}`}>MCQ</button>
            <button onClick={() => setQType('CODING')} className={`${styles.tabBtn} ${qType === 'CODING' ? styles.active : ''}`}>Coding</button>
          </div>

          <form onSubmit={handleAddQuestion}>
            <div className={styles.formField}>
              <label className={styles.label}>Question Content</label>
              <textarea required value={qText} onChange={e => setQText(e.target.value)} rows={4} className={styles.inputArea} placeholder="Enter problem statement..." />
            </div>
            
            {qType === 'MCQ' ? (
              <div className={styles.formField}>
                <label className={styles.label}>Option Pool</label>
                {options.map((opt, idx) => (
                  <div key={idx} className={styles.optionInputGroup}>
                    <input type="text" value={opt.text} onChange={e => {
                      const newOpts = [...options];
                      newOpts[idx].text = e.target.value;
                      setOptions(newOpts);
                    }} placeholder={`Option ${idx + 1}`} className={styles.inputText} />
                    <button type="button" onClick={() => {
                      const newOpts = options.map((o, i) => ({ ...o, isCorrect: i === idx }));
                      setOptions(newOpts);
                    }} className={`${styles.checkBtn} ${opt.isCorrect ? styles.active : ''}`}>
                      <CheckCircle2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.formField}>
                <label className={styles.label}>Starter Skeleton</label>
                <textarea value={starterCode} onChange={e => setStarterCode(e.target.value)} rows={8} className={styles.inputArea} style={{ fontFamily: 'monospace', background: '#1e293b', color: '#10b981', fontSize: '12px' }} />
              </div>
            )}

            <button type="submit" disabled={loadingAdd} className={styles.submitBtn}>
              {loadingAdd ? <RefreshCw className="animate-spin" size={14} /> : 'Finalize & Inject'}
            </button>
          </form>
        </div>
      </div>

      {showBulkModal && (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                        <div style={{ padding: 12, background: '#f8fafc', borderRadius: 16 }}>
                            {bulkMode === 'AI' ? <Sparkles color="#6366f1" /> : <FileStack color="#6366f1" />}
                        </div>
                        <div>
                            <h2 style={{ fontSize: 24, fontWeight: 950, margin: 0 }}>{bulkMode === 'AI' ? 'Magic AI Genesis' : 'Smart Protocol Import'}</h2>
                            <p style={{ margin: 0, color: '#94a3b8', fontSize: 13, fontWeight: 700 }}>{bulkMode === 'AI' ? 'Leverage Gemini Pro for industrial-grade question synthesis.' : 'Parse raw educational text into structured database units.'}</p>
                        </div>
                    </div>
                    <button onClick={() => setShowBulkModal(false)} className={styles.deleteBtn} style={{ opacity: 1, color: '#94a3b8' }}>
                        <X size={24} />
                    </button>
                </div>

                <div className={styles.modalBody}>
                    <div className={styles.splitView}>
                        <div className="space-y-6">
                            {bulkMode === 'AI' ? (
                                <div className="space-y-4">
                                    <label className={styles.label}>Synthesis Prompt</label>
                                    <textarea 
                                        rows={8} 
                                        value={aiPrompt} 
                                        onChange={e => setAiPrompt(e.target.value)}
                                        className={styles.inputArea}
                                        style={{ fontSize: 16 }}
                                        placeholder="Describe the topic (e.g., 'Core OOP concepts in C++, focused on encapsulation')..." 
                                    />
                                    <button onClick={generateAIQuestions} disabled={loadingBulk} className={styles.primaryBtn} style={{ width: '100%', height: 64, justifyContent: 'center', fontSize: 13 }}>
                                        {loadingBulk ? <RefreshCw className="animate-spin" /> : <><Sparkles /> Initiate Generation</>}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <label className={styles.label}>Educational Source Metadata</label>
                                    <textarea 
                                        rows={12} 
                                        value={bulkInput}
                                        onChange={e => setBulkInput(e.target.value)}
                                        className={styles.inputArea}
                                        style={{ fontFamily: 'monospace', fontSize: 12 }}
                                        placeholder="Q: What is a pointer?\n* A variable for memory address\n- A type of integer"
                                    />
                                    <button onClick={parseSmartText} className={styles.submitBtn}>
                                        <FileStack size={14} /> Execute Smart Parser
                                    </button>
                                </div>
                            )}

                            <div style={{ padding: 24, background: 'rgba(99, 102, 241, 0.03)', borderRadius: 24, border: '1px solid rgba(99, 102, 241, 0.05)' }}>
                                <div style={{ fontSize: 9, fontWeight: 950, color: '#6366f1', marginBottom: 8, letterSpacing: '0.1em' }}><AlertCircle size={10} style={{ marginBottom: -2 }} /> PIPELINE SPECS</div>
                                <p style={{ margin: 0, fontSize: 11, color: '#64748b', fontWeight: 700, lineHeight: 1.6 }}>System supports Multi-Question synthesis. Ensure all MCQ correct answers are identified before batch injection.</p>
                            </div>
                        </div>

                        <div>
                            <h3 style={{ fontSize: 12, fontWeight: 950, color: '#cbd5e1', textTransform: 'uppercase', marginBottom: 20 }}>Staging Area ({pendingQuestions.length})</h3>
                            <div className={styles.previewList} style={{ maxHeight: 400, overflowY: 'auto', paddingRight: 8 }}>
                                {pendingQuestions.length === 0 ? (
                                    <div className={styles.emptyState} style={{ height: 200, borderRadius: 24 }}>STAGING EMPTY</div>
                                ) : pendingQuestions.map((pq, idx) => (
                                    <div key={idx} className={styles.previewItem}>
                                        <button onClick={() => setPendingQuestions(pendingQuestions.filter((_, i) => i !== idx))} className={styles.deleteBtn} style={{ position: 'absolute', top: 12, right: 12, opacity: 1 }}>
                                            <Trash2 size={12} />
                                        </button>
                                        <div style={{ fontSize: 8, fontWeight: 950, color: '#4f46e5', marginBottom: 6 }}>{pq.type}</div>
                                        <div style={{ fontSize: 13, fontWeight: 800, color: '#1e293b' }}>{pq.text.substring(0, 100)}{pq.text.length > 100 ? '...' : ''}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.modalFooter}>
                    <button 
                        onClick={saveBulkQuestions}
                        disabled={pendingQuestions.length === 0 || loadingBulk}
                        className={styles.primaryBtn}
                        style={{ background: '#10b981', boxShadow: '0 10px 20px rgba(16, 185, 129, 0.1)' }}
                    >
                        {loadingBulk ? <RefreshCw className="animate-spin" /> : <><CheckCircle2 /> Inject Stage Into Database</>}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
