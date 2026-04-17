'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Sparkles, FileStack, X, Trash2, CheckCircle2, AlertCircle, Plus, Send, RefreshCw } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

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
      toast.success('Question added');
    } else {
      toast.error('Failed to add question');
    }
    setLoadingAdd(false);
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!confirm('Are you sure?')) return;
    const res = await fetch(`/api/admin/questions/${qId}`, { method: 'DELETE' });
    if (res.ok) {
      setExam({ ...exam, questions: exam.questions.filter((q: any) => q.id !== qId) });
      toast.success('Question deleted');
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
                currentQ?.options.push({ text: line.replace(/^[A-Z]\)\s*/, '').substring(1).trim(), isCorrect: false });
            } else if (line.toLowerCase().startsWith('type:')) {
                if (currentQ) currentQ.type = line.split(':')[1].trim().toUpperCase();
            } else if (line.toLowerCase().startsWith('starter:')) {
                if (currentQ) currentQ.starterCode = line.split(':')[1].trim();
            } else if (currentQ && !line.startsWith('*') && !line.startsWith('-')) {
                 // Might be a simple option or continuation of text
                 currentQ.options.push({ text: line, isCorrect: false });
            }
        });
        if (currentQ) questions.push(currentQ);
        setPendingQuestions(questions);
    } catch (e) {
        toast.error('Error parsing text formatting');
    }
  };

  const generateAIQuestions = async () => {
    if (!aiPrompt) return toast.error('Please enter a topic for the AI');
    setLoadingBulk(true);
    try {
        const res = await fetch('/api/admin/exams/generate-ai', {
            method: 'POST',
            body: JSON.stringify({ prompt: aiPrompt, count: 10 })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setPendingQuestions(data.questions || []);
        toast.success('AI magic complete!');
    } catch (err: any) {
        toast.error(err.message || 'AI Generation failed');
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
            toast.success(`Successfully added ${pendingQuestions.length} questions!`);
            setShowBulkModal(false);
            setPendingQuestions([]);
            refreshData();
        } else {
            throw new Error('Server rejected bulk upload');
        }
    } catch (err: any) {
        toast.error(err.message);
    }
    setLoadingBulk(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin" />
            <h2 className="text-xl font-black text-indigo-900 uppercase tracking-widest">Loading Exam Details...</h2>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-10 font-[var(--font-inter)] text-slate-900">
      <Toaster position="top-right" />
      
      {/* Header Navigation */}
      <button onClick={() => router.back()} className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:translate-x-[-4px] transition-transform mb-8">
        <RefreshCw className="w-3 h-3 rotate-[270deg]" /> Back to Dashboard
      </button>
      
      {/* Exam Header Card */}
      <div className="bg-white rounded-[2rem] border border-slate-200 p-10 mb-10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8">
            <span className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                {exam.type} Protocol
            </span>
        </div>

        <h1 className="text-5xl font-black tracking-tighter text-slate-900 mb-4">{exam.title}</h1>
        <p className="text-slate-400 text-lg max-w-2xl leading-relaxed mb-10">{exam.description || 'Global examination infrastructure established for this unit.'}</p>
        
        <div className="flex gap-12">
          <div><div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">Academic Course</div><div className="text-lg font-black text-slate-800 tracking-tight">{exam.course.title}</div></div>
          <div className="w-[1px] h-12 bg-slate-100" />
          <div><div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">Duration</div><div className="text-lg font-black text-slate-800 tracking-tight">{exam.timeLimit} Minutes</div></div>
          <div className="w-[1px] h-12 bg-slate-100" />
          <div><div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">Pass Mark</div><div className="text-lg font-black text-slate-800 tracking-tight">{exam.passingScore}% Correct</div></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr,380px] gap-10 items-start">
        
        {/* Questions Workspace */}
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Active Pool ({exam.questions.length})</h2>
            <div className="flex gap-4">
                <button onClick={() => { setBulkMode('TEXT'); setShowBulkModal(true); }} className="flex items-center gap-2 bg-white border border-slate-200 px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-600 hover:border-indigo-400 hover:text-indigo-600 transition-all shadow-sm active:scale-95">
                    <FileStack className="w-4 h-4" /> Bulk Import
                </button>
                <button onClick={() => { setBulkMode('AI'); setShowBulkModal(true); }} className="flex items-center gap-2 bg-indigo-600 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95">
                    <Sparkles className="w-4 h-4" /> Magic AI
                </button>
            </div>
          </div>

          <div className="space-y-4">
            {exam.questions.length === 0 ? (
              <div className="h-64 border-4 border-dashed border-slate-100 rounded-[2rem] flex flex-col items-center justify-center text-slate-300 gap-4">
                <AlertCircle className="w-12 h-12 opacity-50" />
                <span className="font-black text-sm uppercase tracking-widest">Question Bank Empty</span>
              </div>
            ) : exam.questions.map((q: any, idx: number) => (
              <div key={q.id} className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Question Segment {idx + 1} • {q.type}</span>
                  <button onClick={() => handleDeleteQuestion(q.id)} className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 p-2 transition-all">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xl font-bold text-slate-800 leading-tight mb-6">{q.text}</p>
                
                {q.type === 'MCQ' && (
                  <div className="grid grid-cols-2 gap-3">
                    {q.options.map((o: any) => (
                      <div key={o.id} className={`p-4 rounded-xl border text-sm font-bold flex items-center gap-3 ${o.isCorrect ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                        {o.isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-200" />}
                        {o.text}
                      </div>
                    ))}
                  </div>
                )}
                
                {q.type === 'CODING' && (
                  <div className="bg-slate-900 rounded-2xl p-6 font-mono text-[12px] text-indigo-300 border border-slate-800 overflow-x-auto whitespace-pre">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-4 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-slate-700" /> Starter Code ({q.language})
                    </div>
                    {q.starterCode || '// Internal Protocol - Ready for Injection'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Manual Add Sidebar */}
        <div className="sticky top-10">
          <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-lg shadow-slate-200/50">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-8 flex items-center gap-3">
                <Plus className="w-6 h-6 text-indigo-500" /> Manual Entry
            </h3>

            <div className="flex bg-slate-50 p-1.5 rounded-2xl mb-8">
              <button onClick={() => setQType('MCQ')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${qType === 'MCQ' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>MCQ</button>
              <button onClick={() => setQType('CODING')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${qType === 'CODING' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Coding</button>
            </div>

            <form onSubmit={handleAddQuestion} className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 block">Question Content</label>
                <textarea required value={qText} onChange={e => setQText(e.target.value)} rows={3} className="w-100 p-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-bold text-sm" placeholder="Enter problem text..." />
              </div>
              
              {qType === 'MCQ' ? (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 block">Option Set</label>
                  {options.map((opt, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input type="text" value={opt.text} onChange={e => {
                        const newOpts = [...options];
                        newOpts[idx].text = e.target.value;
                        setOptions(newOpts);
                      }} placeholder={`Option ${idx + 1}`} className="flex-1 p-3 rounded-xl bg-slate-50 border-none text-sm font-bold" />
                      <button type="button" onClick={() => {
                        const newOpts = options.map((o, i) => ({ ...o, isCorrect: i === idx }));
                        setOptions(newOpts);
                      }} className={`w-12 rounded-xl flex items-center justify-center transition-all ${opt.isCorrect ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-slate-100 text-slate-300'}`}>
                        {opt.isCorrect ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 block">Starter Logic</label>
                  <textarea value={starterCode} onChange={e => setStarterCode(e.target.value)} rows={6} className="w-100 p-4 rounded-2xl bg-slate-900 border-none text-emerald-500 font-mono text-xs" />
                </div>
              )}

              <button type="submit" disabled={loadingAdd} className="w-100 py-5 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-[0.98]">
                {loadingAdd ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Finalize Setup</>}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bulk/AI Import Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[2000] flex items-center justify-center p-10">
            <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                            {bulkMode === 'AI' ? <Sparkles className="w-6 h-6" /> : <FileStack className="w-6 h-6" />}
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">{bulkMode === 'AI' ? 'Magic AI Generator' : 'Smart Bulk Import'}</h2>
                            <p className="text-slate-400 text-sm font-bold">{bulkMode === 'AI' ? 'Describe your topic and let Gemini create the questions.' : 'Paste formatted text to create multiple questions.'}</p>
                        </div>
                    </div>
                    <button onClick={() => setShowBulkModal(false)} className="p-4 rounded-full bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-10 bg-slate-50/50">
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-10">
                        {/* Input Section */}
                        <div className="space-y-6">
                            {bulkMode === 'AI' ? (
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Generation Prompt</label>
                                    <textarea 
                                        rows={6} 
                                        value={aiPrompt} 
                                        onChange={e => setAiPrompt(e.target.value)}
                                        className="w-full p-6 bg-white border-2 border-slate-100 rounded-3xl focus:border-indigo-500/50 outline-none text-lg font-bold text-slate-800"
                                        placeholder="Explain the topic here (e.g., 'Inheritance and Polymorphism in C++, specifically focus on virtual functions')..." 
                                    />
                                    <button 
                                        onClick={generateAIQuestions}
                                        disabled={loadingBulk}
                                        className="w-full h-20 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl font-black text-md uppercase tracking-widest transition-all flex items-center justify-center gap-4 shadow-xl shadow-indigo-200"
                                    >
                                        {loadingBulk ? <RefreshCw className="w-6 h-6 animate-spin" /> : <><Sparkles className="w-6 h-6" /> Ignite AI Engine</>}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center block">Smart Format: Q/Question prefix, * for correct, - for wrong</label>
                                    <textarea 
                                        rows={12} 
                                        value={bulkInput}
                                        onChange={e => setBulkInput(e.target.value)}
                                        className="w-full p-6 bg-white border-2 border-slate-100 rounded-3xl focus:border-indigo-500/50 outline-none font-mono text-sm leading-relaxed"
                                        placeholder={`Example:\nQ: What is 2+2?\n* 4\n- 5\n- 6\n\nQ: Write a Hello World\nType: CODING\nStarter: int main() { ... }`}
                                    />
                                    <button 
                                        onClick={parseSmartText}
                                        className="w-full h-16 bg-slate-900 hover:bg-black text-white rounded-3xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-4 shadow-xl"
                                    >
                                        <FileStack className="w-5 h-5" /> Run Smart Parser
                                    </button>
                                </div>
                            )}

                            <div className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100">
                                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <AlertCircle className="w-3 h-3" /> System Capability
                                </h4>
                                <p className="text-[11px] text-indigo-700 font-bold leading-relaxed">
                                    {bulkMode === 'AI' 
                                      ? "Our AI model will generate up to 10 contextually relevant questions based on your prompt. Verify all results before finalizing injection."
                                      : "The Smart Parser identifies MCQ patterns naturally. Coding questions must include 'Type: CODING' and 'Starter:' prefixes for best results."}
                                </p>
                            </div>
                        </div>

                        {/* Preview Section */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Injection Preview ({pendingQuestions.length})</h3>
                                {pendingQuestions.length > 0 && <button onClick={() => setPendingQuestions([])} className="text-rose-500 font-black text-[10px] uppercase tracking-widest hover:underline">Clear All</button>}
                            </div>

                            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                {pendingQuestions.length === 0 ? (
                                    <div className="h-64 border-4 border-dashed border-slate-100 rounded-[2rem] flex flex-col items-center justify-center text-slate-300">
                                        <span className="font-black text-[10px] uppercase tracking-widest">No questions pending</span>
                                    </div>
                                ) : pendingQuestions.map((pq, idx) => (
                                    <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative group">
                                        <button onClick={() => setPendingQuestions(pendingQuestions.filter((_, i) => i !== idx))} className="absolute top-4 right-4 text-slate-200 group-hover:text-rose-400 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <div className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-2">{pq.type} Spec</div>
                                        <h5 className="font-bold text-slate-800 text-sm mb-3 line-clamp-2">{pq.text}</h5>
                                        {pq.type === 'MCQ' && (
                                            <div className="flex flex-wrap gap-2">
                                                {pq.options?.slice(0, 4).map((o: any, i: number) => (
                                                    <div key={i} className={`text-[9px] font-black px-2 py-1 rounded-md ${o.isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                        {o.text.substring(0, 15)}...
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <button 
                                onClick={saveBulkQuestions}
                                disabled={pendingQuestions.length === 0 || loadingBulk}
                                className="w-full h-20 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 text-white rounded-3xl font-black text-lg uppercase tracking-widest transition-all flex items-center justify-center gap-4 shadow-xl shadow-emerald-100"
                            >
                                {loadingBulk ? <RefreshCw className="w-6 h-6 animate-spin" /> : <><CheckCircle2 className="w-6 h-6" /> Inject Into Exam Pool</>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
