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

  // Variant State
  const [activeTab, setActiveTab] = useState<'QUESTIONS' | 'VARIANTS'>('QUESTIONS');
  const [variants, setVariants] = useState<any[]>([]);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [vName, setVName] = useState('');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [loadingVariant, setLoadingVariant] = useState(false);

  // Single Question Form
  const [qText, setQText] = useState('');
  const [qTextRu, setQTextRu] = useState('');
  const [qType, setQType] = useState('MCQ');
  const [points, setPoints] = useState(1);
  const [options, setOptions] = useState([
    { text: '', textRu: '', isCorrect: true },
    { text: '', textRu: '', isCorrect: false },
    { text: '', textRu: '', isCorrect: false },
    { text: '', textRu: '', isCorrect: false },
  ]);
  const [starterCode, setStarterCode] = useState('');
  const [language, setLanguage] = useState('cpp');
  const [loadingAdd, setLoadingAdd] = useState(false);

  useEffect(() => {
    if (!id) return;
    refreshData();
    fetchVariants();
  }, [id]);

  const fetchVariants = async () => {
    try {
      const res = await fetch(`/api/admin/exams/${id}/variants`);
      const data = await res.json();
      setVariants(data);
    } catch (err) {
      toast.error('Failed to load variants');
    }
  };

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
        textRu: qTextRu,
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
      setQTextRu('');
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

  const handleCreateVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedQuestionIds.length === 0) return toast.error('Select at least one question');
    setLoadingVariant(true);
    try {
      const res = await fetch(`/api/admin/exams/${id}/variants`, {
        method: 'POST',
        body: JSON.stringify({ name: vName, questionIds: selectedQuestionIds })
      });
      if (res.ok) {
        const newV = await res.json();
        setVariants([...variants, newV]);
        setShowVariantModal(false);
        setVName('');
        setSelectedQuestionIds([]);
        toast.success('Variant created');
      }
    } catch (err) {
      toast.error('Failed to create variant');
    }
    setLoadingVariant(false);
  };

  const handleDeleteVariant = async (vId: string) => {
    if (!confirm('Delete this variant?')) return;
    const res = await fetch(`/api/admin/exams/${id}/variants/${vId}`, { method: 'DELETE' });
    if (res.ok) {
      setVariants(variants.filter(v => v.id !== vId));
      toast.success('Variant deleted');
    }
  };

  const toggleQuestionSelection = (qId: string) => {
    setSelectedQuestionIds(prev => 
      prev.includes(qId) ? prev.filter(id => id !== qId) : [...prev, qId]
    );
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

      <div className={styles.tabGroup} style={{ maxWidth: 400, marginBottom: 32 }}>
        <button onClick={() => setActiveTab('QUESTIONS')} className={`${styles.tabBtn} ${activeTab === 'QUESTIONS' ? styles.active : ''}`} style={{ fontSize: 12, padding: 12 }}>
          {t('question_repository')}
        </button>
        <button onClick={() => setActiveTab('VARIANTS')} className={`${styles.tabBtn} ${activeTab === 'VARIANTS' ? styles.active : ''}`} style={{ fontSize: 12, padding: 12 }}>
          Variantlar (Biletlar)
        </button>
      </div>

      <div className={styles.mainGrid}>
        
        <div className="space-y-6">
          {activeTab === 'QUESTIONS' ? (
            <>
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
            </>
          ) : (
            <>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Variantlar ({variants.length})</h2>
                <button onClick={() => setShowVariantModal(true)} className={styles.primaryBtn}>
                    <Plus size={14} /> Variant qo'shish
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                {variants.length === 0 ? (
                  <div className={styles.emptyState} style={{ gridColumn: '1/-1' }}>
                    <AlertCircle size={32} />
                    Hali variantlar yaratilmagan.
                  </div>
                ) : variants.map((v: any, idx: number) => (
                  <div key={v.id} className={styles.questionCard} style={{ margin: 0 }}>
                    <div className={styles.qHeader}>
                      <span className={styles.qBadge}>Variant {idx + 1}</span>
                      <button onClick={() => handleDeleteVariant(v.id)} className={styles.deleteBtn}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 12 }}>{v.name}</h3>
                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 12 }}>
                      <FileStack size={12} style={{ marginBottom: -2, marginRight: 4 }} />
                      {v.questions.length} ta savol
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {v.questions.map((vq: any, qIdx: number) => (
                        <div key={vq.id} style={{ fontSize: 11, color: '#475569', background: '#f8fafc', padding: '6px 10px', borderRadius: 8, border: '1px solid #f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <span style={{ fontWeight: 800, color: '#6366f1', marginRight: 6 }}>#{qIdx + 1}</span>
                          {vq.question?.text}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {activeTab === 'QUESTIONS' ? (
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
                <label className={styles.label}>{t('question_content')} (UZ)</label>
                <textarea required value={qText} onChange={e => setQText(e.target.value)} rows={3} className={styles.inputArea} placeholder="O'zbek matni..." />
              </div>
              
              <div className={styles.formField} style={{ marginTop: '-8px' }}>
                <label className={styles.label} style={{ color: '#94a3b8' }}>Savol Matni (RU) - Ixtiyoriy</label>
                <textarea value={qTextRu} onChange={e => setQTextRu(e.target.value)} rows={3} className={styles.inputArea} placeholder="Русский текст..." style={{ border: '1px dashed #e2e8f0' }} />
              </div>
              
              {qType === 'MCQ' ? (
                <div className={styles.formField}>
                  <label className={styles.label}>{t('option_pool')}</label>
                  {options.map((opt, idx) => (
                    <div key={idx} className={styles.optionInputGroup} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input type="text" value={opt.text} onChange={e => {
                          const newOpts = [...options];
                          newOpts[idx].text = e.target.value;
                          setOptions(newOpts);
                        }} placeholder={`Variant ${idx + 1} (UZ)`} className={styles.inputText} />
                        
                        <button type="button" onClick={() => {
                          const newOpts = options.map((o, i) => ({ ...o, isCorrect: i === idx }));
                          setOptions(newOpts);
                        }} className={`${styles.checkBtn} ${opt.isCorrect ? styles.active : ''}`}>
                          <CheckCircle2 size={18} />
                        </button>
                      </div>
                      
                      <input type="text" value={opt.textRu} onChange={e => {
                        const newOpts = [...options];
                        newOpts[idx].textRu = e.target.value;
                        setOptions(newOpts);
                      }} placeholder={`Вариант ${idx + 1} (RU) - ixtiyoriy`} className={styles.inputText} style={{ background: '#f8fafc', borderStyle: 'dashed' }} />
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
        ) : (
          <div className={styles.sidebarCard}>
            <h3 className={styles.sideTitle}>
              <FileStack size={16} color="#6366f1" /> Variant Ma'lumoti
            </h3>
            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, marginBottom: 20 }}>
              Variantlar talabalarga tasodifiy yoki tanlov asosida beriladigan savollar to'plamidir. Har bir variantga o'zingiz xohlagan savollarni biriktirishingiz mumkin.
            </p>
            <div style={{ padding: 16, background: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', marginBottom: 8 }}>Statistika</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                <span>Umumiy savollar:</span>
                <span>{exam.questions.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700 }}>
                <span>Jami variantlar:</span>
                <span>{variants.length}</span>
              </div>
            </div>
          </div>
        )}
      </div></div>
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

      {showVariantModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: 600 }}>
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: 24, fontWeight: 950 }}>Yangi Variant yaratish</h2>
                <button onClick={() => setShowVariantModal(false)} className={styles.deleteBtn} style={{ opacity: 1 }}><X /></button>
              </div>
            </div>
            <form onSubmit={handleCreateVariant}>
              <div className={styles.modalBody}>
                <div className={styles.formField}>
                  <label className={styles.label}>Variant Nomi (masalan: Variant 1 yoki Bilet-5)</label>
                  <input required value={vName} onChange={e => setVName(e.target.value)} className={styles.inputText} placeholder="Variant nomini yozing..." />
                </div>
                <label className={styles.label}>Savollarni tanlang ({selectedQuestionIds.length} ta tanlandi)</label>
                <div style={{ maxHeight: 400, overflowY: 'auto', border: '1.5px solid #f1f5f9', borderRadius: 16, padding: 12 }}>
                  {exam.questions.map((q: any, idx: number) => (
                    <div 
                      key={q.id} 
                      onClick={() => toggleQuestionSelection(q.id)}
                      style={{ 
                        display: 'flex', gap: 12, padding: 10, borderRadius: 10, cursor: 'pointer',
                        background: selectedQuestionIds.includes(q.id) ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                        border: selectedQuestionIds.includes(q.id) ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid transparent',
                        marginBottom: 4
                      }}
                    >
                      <div style={{ 
                        width: 20, height: 20, borderRadius: 6, border: '2px solid #cbd5e1', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: selectedQuestionIds.includes(q.id) ? '#6366f1' : 'transparent',
                        borderColor: selectedQuestionIds.includes(q.id) ? '#6366f1' : '#cbd5e1'
                      }}>
                        {selectedQuestionIds.includes(q.id) && <CheckCircle2 size={12} color="#fff" />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>Savol #{idx + 1}</div>
                        <div style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 400 }}>{q.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="submit" disabled={loadingVariant} className={styles.primaryBtn} style={{ width: '100%', height: 50, fontSize: 13 }}>
                  {loadingVariant ? <RefreshCw className="animate-spin" /> : 'Variantni Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
