'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminExamsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // New Exam Form
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState('');
  const [type, setType] = useState('MIDTERM');
  const [timeLimit, setTimeLimit] = useState(60);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/exams').then(r => r.json()),
      fetch('/api/admin/courses').then(r => r.json())
    ]).then(([examsData, coursesData]) => {
      setExams(examsData);
      setCourses(coursesData);
      setLoading(false);
    });
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingCreate(true);
    const res = await fetch('/api/admin/exams', {
      method: 'POST',
      body: JSON.stringify({ title, courseId, type, timeLimit, shuffleQuestions }),
    });
    if (res.ok) {
      const newExam = await res.json();
      setExams([newExam, ...exams]);
      setShowModal(false);
      setTitle('');
      setShuffleQuestions(false);
    } else {
      alert('Failed to create exam');
    }
    setLoadingCreate(false);
  };

  const handleDelete = async (examId: string, examTitle: string) => {
    if (!confirm(`"${examTitle}" imtihonini o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi.`)) return;
    setDeletingId(examId);
    try {
      const res = await fetch(`/api/admin/exams/${examId}`, { method: 'DELETE' });
      if (res.ok) {
        setExams(prev => prev.filter(e => e.id !== examId));
      } else {
        alert('Imtihonni o\'chirishda xato yuz berdi.');
      }
    } catch {
      alert('Tarmoq xatosi. Qayta urinib ko\'ring.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <div style={{ color: '#6366f1', fontWeight: 700 }}>Loading exams…</div>;

  return (
    <div style={{ maxWidth: '1000px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', margin: 0 }}>Exams</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>Manage examination portals and questions.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          style={{ padding: '12px 24px', borderRadius: 12, background: '#6366f1', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(99,102,241,0.3)' }}
        >
          + Create Exam
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
        {exams.map(exam => (
          <div key={exam.id} style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #e2e8f0', padding: 28, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#6366f1', background: 'rgba(99,102,241,0.08)', padding: '4px 10px', borderRadius: 8, textTransform: 'uppercase' }}>
                {exam.type}
              </span>
              <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>{exam._count?.questions} Qs</span>
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>{exam.title}</h3>
            <p style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600, margin: '0 0 24px 0', textTransform: 'uppercase' }}>{exam.course?.title}</p>
            
            <div style={{ display: 'flex', gap: 10, borderTop: '1px solid #f1f5f9', paddingTop: 20 }}>
              <Link href={`/admin/exams/${exam.id}`} style={{ flex: 1, textAlign: 'center', padding: '10px', background: '#f8fafc', borderRadius: 10, color: '#0f172a', fontWeight: 700, fontSize: 13, textDecoration: 'none', border: '1px solid #e2e8f0' }}>
                Tahrirlash
              </Link>
              <a href={`/api/admin/reports/export-excel?examId=${exam.id}`} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 10, background: '#10b981', color: '#fff', textDecoration: 'none', boxShadow: '0 4px 10px rgba(16,185,129,0.2)' }} title="Excelga yuklash">
                📊
              </a>
              <button 
                onClick={() => handleDelete(exam.id, exam.title)}
                disabled={deletingId === exam.id}
                title="Imtihonni o'chirish"
                style={{ 
                  width: 40, height: 40, borderRadius: 10, 
                  border: '1px solid #fee2e2', 
                  background: deletingId === exam.id ? '#f1f5f9' : '#fff1f1', 
                  color: deletingId === exam.id ? '#94a3b8' : '#ef4444', 
                  cursor: deletingId === exam.id ? 'not-allowed' : 'pointer',
                  fontSize: 16,
                  transition: 'all 0.2s'
                }}
              >
                {deletingId === exam.id ? '⏳' : '🗑️'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 480, padding: 32, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', margin: '0 0 24px 0' }}>New Exam</h2>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Exam Title</label>
                <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Midterm Physics" style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e2e8f0', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Course</label>
                <select required value={courseId} onChange={e => setCourseId(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#fff' }}>
                  <option value="">Select Course</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Type</label>
                  <select value={type} onChange={e => setType(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#fff' }}>
                    <option value="MIDTERM">Midterm</option>
                    <option value="FINAL">Final</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Time (Min)</label>
                  <input type="number" value={timeLimit} onChange={e => setTimeLimit(Number(e.target.value))} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e2e8f0', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input 
                  type="checkbox" 
                  id="shuffle" 
                  checked={shuffleQuestions} 
                  onChange={e => setShuffleQuestions(e.target.checked)} 
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="shuffle" style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', cursor: 'pointer' }}>
                  Savollarni aralashtirib berish (Shuffle)
                </label>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#fff', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={loadingCreate} style={{ flex: 1, padding: '12px', borderRadius: 12, background: '#6366f1', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                  {loadingCreate ? 'Creating…' : 'Create Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
