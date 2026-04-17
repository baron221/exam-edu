'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Sparkles, FileStack, X, Trash2, CheckCircle2, AlertCircle, Plus, Send, RefreshCw, ChevronLeft } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import styles from './ExamDetail.module.css';
import { useTranslation } from '@/context/LanguageContext';

export default function ExamDetailPage() {
  const { t } = useTranslation();
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
  const [aiQuestionCount, setAiQuestionCount] = useState(10);

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

  const updatePendingQuestion = (idx: number, updates: any) => {
    const newQuestions = [...pendingQuestions];
    newQuestions[idx] = { ...newQuestions[idx], ...updates };
    setPendingQuestions(newQuestions);
  };

  const updatePendingOption = (qIdx: number, oIdx: number, text: string) => {
    const newQuestions = [...pendingQuestions];
    newQuestions[qIdx].options[oIdx].text = text;
    setPendingQuestions(newQuestions);
  };

  const setPendingCorrect = (qIdx: number, oIdx: number) => {
    const newQuestions = [...pendingQuestions];
    newQuestions[qIdx].options = newQuestions[qIdx].options.map((o: any, idx: number) => ({
      ...o,
      isCorrect: idx === oIdx
    }));
    setPendingQuestions(newQuestions);
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
            body: JSON.stringify({ prompt: aiPrompt, count: aiQuestionCount })
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
        <ChevronLeft size={14} /> {t('back_to_exams')}
      </button>
      
      <div className={styles.examHeader}>
        <span className={styles.typeBadge}>{t('terminal_protocol')}: {exam.type}</span>
        <h1 className={styles.title}>{exam.title}</h1>
        <p className={styles.description}>{exam.description || 'Secure examination environment established for the National Pedagogical University.'}</p>
        
        <div className={styles.metaGrid}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>{t('academic_course')}</span>
            <span className={styles.metaValue}>{exam.course.title}</span>
          </div>
          <div className={styles.metaDivider} />
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>{t('session_duration')}</span>
            <span className={styles.metaValue}>{exam.timeLimit} {t('minutes')}</span>
          </div>
          <div className={styles.metaDivider} />
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>{t('pass_threshold')}</span>
            <span className={styles.metaValue}>{exam.passingScore}% Accuracy</span>
          </div>
        </div>
      </div>

      <div className={styles.mainGrid}>
        
        <div className="space-y-6">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{t('question_repository')} ({exam.questions.length})</h2>
            <div className={styles.actionRow}>
                <button onClick={() => { setBulkMode('TEXT'); setShowBulkModal(true); }} className={styles.secondaryBtn}>
                    <FileStack size={14} /> {t('bulk_import')}
                </button>
                <button onClick={() => { setBulkMode('AI'); setShowBulkModal(true); }} className={styles.primaryBtn}>
                    <Sparkles size={14} /> {t('magic_ai')}
                </button>
            </div>
          </div>

          <div>
            {exam.questions.length === 0 ? (
              <div className={styles.emptyState}>
                <AlertCircle size={32} />
                {t('no_exams_title')}
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
            <Plus size={16} color="#6366f1" /> {t('manual_injection')}
          </h3>

          <div className={styles.tabGroup}>
            <button onClick={() => setQType('MCQ')} className={`${styles.tabBtn} ${qType === 'MCQ' ? styles.active : ''}`}>MCQ</button>
            <button onClick={() => setQType('CODING')} className={`${styles.tabBtn} ${qType === 'CODING' ? styles.active : ''}`}>Coding</button>
          </div>

          <form onSubmit={handleAddQuestion}>
            <div className={styles.formField}>
              <label className={styles.label}>{t('question_content')}</label>
              <textarea required value={qText} onChange={e => setQText(e.target.value)} rows={4} className={styles.inputArea} placeholder="..." />
            </div>
            
            {qType === 'MCQ' ? (
              <div className={styles.formField}>
                <label className={styles.label}>{t('option_pool')}</label>
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
                <label className={styles.label}>{t('starter_skeleton')}</label>
                <textarea value={starterCode} onChange={e => setStarterCode(e.target.value)} rows={8} className={styles.inputArea} style={{ fontFamily: 'monospace', background: '#1e293b', color: '#10b981', fontSize: '12px' }} />
              </div>
            )}

            <button type="submit" disabled={loadingAdd} className={styles.submitBtn}>
              {loadingAdd ? <RefreshCw className="animate-spin" size={14} /> : t('finalize_inject')}
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
                            <h2 style={{ fontSize: 24, fontWeight: 950, margin: 0 }}>{bulkMode === 'AI' ? t('magic_ai_genesis') : t('bulk_import')}</h2>
                            <p style={{ margin: 0, color: '#94a3b8', fontSize: 13, fontWeight: 700 }}>{t('industrial_grade_synthesis')}</p>
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
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <label className={styles.label}>{t('question_content')}</label>
                                        <div className={styles.quantityControl}>
                                            <span style={{ fontSize: 9, fontWeight: 900, color: '#cbd5e1' }}>{t('req_qty')}:</span>
                                            <input 
                                              type="number" 
                                              min="1" max="25" 
                                              value={aiQuestionCount} 
                                              onChange={e => setAiQuestionCount(parseInt(e.target.value) || 1)} 
                                              className={styles.quantityInput} 
                                            />
                                        </div>
                                    </div>
                                    <textarea 
                                        rows={8} 
                                        value={aiPrompt} 
                                        onChange={e => setAiPrompt(e.target.value)}
                                        className={styles.inputArea}
                                        style={{ fontSize: 16 }}
                                        placeholder="..." 
                                    />
                                    <button onClick={generateAIQuestions} disabled={loadingBulk} className={styles.primaryBtn} style={{ width: '100%', height: 64, justifyContent: 'center', fontSize: 13 }}>
                                        {loadingBulk ? <RefreshCw className="animate-spin" /> : <><Sparkles /> {t('initiate_generation')}</>}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <label className={styles.label}>{t('question_content')}</label>
                                    <textarea 
                                        rows={12} 
                                        value={bulkInput}
                                        onChange={e => setBulkInput(e.target.value)}
                                        className={styles.inputArea}
                                        style={{ fontFamily: 'monospace', fontSize: 12 }}
                                        placeholder="Q: What is a pointer?..."
                                    />
                                    <button onClick={parseSmartText} className={styles.submitBtn}>
                                        <FileStack size={14} /> {t('bulk_import')}
                                    </button>
                                </div>
                            )}

                            <div style={{ padding: 24, background: 'rgba(99, 102, 241, 0.03)', borderRadius: 24, border: '1px solid rgba(99, 102, 241, 0.05)' }}>
                                <div style={{ fontSize: 9, fontWeight: 950, color: '#6366f1', marginBottom: 8, letterSpacing: '0.1em' }}><AlertCircle size={10} style={{ marginBottom: -2 }} /> {t('pipeline_specs')}</div>
                                <p style={{ margin: 0, fontSize: 11, color: '#64748b', fontWeight: 700, lineHeight: 1.6 }}>{t('process_complete')}</p>
                            </div>
                        </div>

                        <div>
                            <h3 style={{ fontSize: 12, fontWeight: 950, color: '#cbd5e1', textTransform: 'uppercase', marginBottom: 20 }}>{t('staging_area')} ({pendingQuestions.length})</h3>
                            <div className={styles.previewList} style={{ maxHeight: 480, overflowY: 'auto', paddingRight: 8 }}>
                                {pendingQuestions.length === 0 ? (
                                    <div className={styles.emptyState} style={{ height: 200, borderRadius: 24 }}>{t('no_data')}</div>
                                ) : pendingQuestions.map((pq, qIdx) => (
                                    <div key={qIdx} className={styles.stageCard}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <span className={styles.stageBadge}>{pq.type} Unit</span>
                                            <button onClick={() => setPendingQuestions(pendingQuestions.filter((_, i) => i !== qIdx))} className={styles.deleteBtn} style={{ opacity: 1 }}>
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                        
                                        <input 
                                          className={styles.stageInput} 
                                          value={pq.text} 
                                          onChange={e => updatePendingQuestion(qIdx, { text: e.target.value })} 
                                        />

                                        {pq.type === 'MCQ' && (
                                          <div className="space-y-1">
                                            {pq.options.map((opt: any, oIdx: number) => (
                                              <div key={oIdx} className={styles.stageOptionRow}>
                                                <CheckCircle2 
                                                  size={14} 
                                                  className={`${styles.stageOptionCheck} ${opt.isCorrect ? styles.active : ''}`}
                                                  onClick={() => setPendingCorrect(qIdx, oIdx)}
                                                />
                                                <input 
                                                  className={styles.stageOptionInput} 
                                                  value={opt.text} 
                                                  onChange={e => updatePendingOption(qIdx, oIdx, e.target.value)}
                                                />
                                              </div>
                                            ))}
                                          </div>
                                        )}

                                        {pq.type === 'CODING' && (
                                          <>
                                            <textarea 
                                              className={styles.stageOptionInput} 
                                              style={{ fontFamily: 'monospace', color: '#10b981', background: '#1e293b', width: '100%', height: 80, marginTop: 8 }}
                                              value={pq.starterCode}
                                              onChange={e => updatePendingQuestion(qIdx, { starterCode: e.target.value })}
                                            />
                                            <div style={{ marginTop: 12 }}>
                                              <span style={{ fontSize: 9, fontWeight: 950, color: '#6366f1', textTransform: 'uppercase' }}>Test Cases</span>
                                              {pq.testCases?.map((tc: any, tcIdx: number) => (
                                                <div key={tcIdx} style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                                                  <input 
                                                    placeholder="Input"
                                                    className={styles.stageOptionInput}
                                                    style={{ fontSize: 10, flex: 1 }}
                                                    value={tc.input}
                                                    onChange={e => {
                                                      const newTC = [...pq.testCases];
                                                      newTC[tcIdx].input = e.target.value;
                                                      updatePendingQuestion(qIdx, { testCases: newTC });
                                                    }}
                                                  />
                                                  <input 
                                                    placeholder="Output"
                                                    className={styles.stageOptionInput}
                                                    style={{ fontSize: 10, flex: 1 }}
                                                    value={tc.expected_output}
                                                    onChange={e => {
                                                      const newTC = [...pq.testCases];
                                                      newTC[tcIdx].expected_output = e.target.value;
                                                      updatePendingQuestion(qIdx, { testCases: newTC });
                                                    }}
                                                  />
                                                </div>
                                              ))}
                                            </div>
                                          </>
                                        )}
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
                        {loadingBulk ? <RefreshCw className="animate-spin" /> : <><CheckCircle2 /> {t('inject_stage')}</>}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
