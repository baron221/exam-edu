'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function ExamDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // New Question Form
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
    fetch(`/api/admin/exams/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          console.error('Fetch error:', data.error);
        } else {
          setExam(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Network error:', err);
        setLoading(false);
      });
  }, [id]);

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
    } else {
      alert('Failed to add question');
    }
    setLoadingAdd(false);
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!confirm('Are you sure?')) return;
    const res = await fetch(`/api/admin/questions/${qId}`, { method: 'DELETE' });
    if (res.ok) {
      setExam({ ...exam, questions: exam.questions.filter((q: any) => q.id !== qId) });
    }
  };

  if (loading) return <div style={{ color: '#6366f1', fontWeight: 700 }}>Loading portal details…</div>;

  return (
    <div style={{ maxWidth: '1000px' }}>
      <button onClick={() => router.back()} style={{ border: 'none', background: 'none', color: '#6366f1', fontWeight: 700, cursor: 'pointer', marginBottom: 20 }}>← Back to Exams</button>
      
      <div style={{ background: '#fff', borderRadius: 24, border: '1.5px solid #e2e8f0', padding: 40, marginBottom: 40, boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: '#0f172a', margin: 0 }}>{exam.title}</h1>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#6366f1', background: 'rgba(99,102,241,0.08)', padding: '6px 14px', borderRadius: 10, textTransform: 'uppercase' }}>
            {exam.type}
          </span>
        </div>
        <p style={{ color: '#64748b', fontSize: 16, margin: '0 0 24px 0' }}>{exam.description || 'No description provided.'}</p>
        <div style={{ display: 'flex', gap: 32 }}>
          <div><div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Course</div><div style={{ fontWeight: 700, color: '#0f172a' }}>{exam.course.title}</div></div>
          <div><div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Time Limit</div><div style={{ fontWeight: 700, color: '#0f172a' }}>{exam.timeLimit} Min</div></div>
          <div><div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Passing Score</div><div style={{ fontWeight: 700, color: '#0f172a' }}>{exam.passingScore} Pts</div></div>
        </div>
      </div>

      <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: 40, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 40 }}>
        
        {/* Questions List */}
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', margin: '0 0 24px 0' }}>Questions ({exam.questions.length})</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {exam.questions.length === 0 ? (
              <div style={{ padding: 40, border: '2px dashed #e2e8f0', borderRadius: 20, textAlign: 'center', color: '#94a3b8' }}>No questions yet. Add one to the right.</div>
            ) : exam.questions.map((q: any, idx: number) => (
              <div key={q.id} style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #e2e8f0', padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#6366f1', textTransform: 'uppercase' }}>Question {idx + 1} ({q.type})</span>
                  <button onClick={() => handleDeleteQuestion(q.id)} style={{ border: 'none', background: 'none', color: '#ef4444', fontWeight: 700, cursor: 'pointer' }}>Delete</button>
                </div>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>{q.text}</p>
                {q.type === 'MCQ' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {q.options.map((o: any) => (
                      <div key={o.id} style={{ fontSize: 13, background: o.isCorrect ? 'rgba(16,185,129,0.08)' : '#f8fafc', padding: '10px 14px', borderRadius: 8, border: o.isCorrect ? '1px solid rgba(16,185,129,0.2)' : '1px solid #e2e8f0', color: o.isCorrect ? '#10b981' : '#64748b', fontWeight: 600 }}>
                        {o.isCorrect ? '✅ ' : '⚪️ '}{o.text}
                      </div>
                    ))}
                  </div>
                )}
                {q.type === 'CODING' && (
                  <div style={{ background: '#f8fafc', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>Language: {q.language}</div>
                    <pre style={{ margin: 0, fontSize: 13, color: '#334155', whiteSpace: 'pre-wrap' }}>{q.starterCode || '// No starter code'}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Add Question Sidebar */}
        <div>
          <div style={{ background: '#fff', borderRadius: 24, border: '1.5px solid #e2e8f0', padding: 28, position: 'sticky', top: 100, boxShadow: '0 2px 12px rgba(99,102,241,0.07)' }}>
            <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: '0 0 20px 0' }}>Add Question</h3>
            <div style={{ display: 'flex', background: '#f8fafc', padding: 4, borderRadius: 12, marginBottom: 20 }}>
              <button onClick={() => setQType('MCQ')} style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', background: qType === 'MCQ' ? '#fff' : 'transparent', fontWeight: 700, color: qType === 'MCQ' ? '#6366f1' : '#94a3b8', cursor: 'pointer', boxShadow: qType === 'MCQ' ? '0 1px 4px rgba(0,0,0,0.05)' : 'none' }}>MCQ</button>
              <button onClick={() => setQType('CODING')} style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', background: qType === 'CODING' ? '#fff' : 'transparent', fontWeight: 700, color: qType === 'CODING' ? '#6366f1' : '#94a3b8', cursor: 'pointer', boxShadow: qType === 'CODING' ? '0 1px 4px rgba(0,0,0,0.05)' : 'none' }}>Coding</button>
            </div>

            <form onSubmit={handleAddQuestion} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>Text</label>
                <textarea required value={qText} onChange={e => setQText(e.target.value)} rows={3} style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #e2e8f0', boxSizing: 'border-box' }} />
              </div>
              
              {qType === 'MCQ' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Options</label>
                  {options.map((opt, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 8 }}>
                      <input type="text" value={opt.text} onChange={e => {
                        const newOpts = [...options];
                        newOpts[idx].text = e.target.value;
                        setOptions(newOpts);
                      }} placeholder={`Option ${idx + 1}`} style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1.5px solid #e2e8f0' }} />
                      <button type="button" onClick={() => {
                        const newOpts = options.map((o, i) => ({ ...o, isCorrect: i === idx }));
                        setOptions(newOpts);
                      }} style={{ width: 32, background: opt.isCorrect ? '#10b981' : '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer' }}>
                        {opt.isCorrect ? '✅' : '⚪️'}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Starter Code</label>
                  <textarea value={starterCode} onChange={e => setStarterCode(e.target.value)} rows={5} style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontFamily: 'monospace' }} />
                </div>
              )}

              <button type="submit" disabled={loadingAdd} style={{ padding: '14px', borderRadius: 12, background: '#6366f1', color: '#fff', fontWeight: 800, border: 'none', cursor: 'pointer', marginTop: 10 }}>
                {loadingAdd ? 'Adding…' : 'Add Question'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
