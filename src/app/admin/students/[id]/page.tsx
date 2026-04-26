'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, User, Mail, GraduationCap, Clock, CheckCircle2, XCircle, BarChart3 } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';

function AttemptRow({ attempt }: { attempt: any }) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const isPassed = attempt.score >= (attempt.exam.passingScore || 60);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ 
          background: 'white', borderRadius: isExpanded ? '24px 24px 0 0' : 24, padding: 24, border: '1.5px solid #e2e8f0', 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
          transition: 'all 0.2s', boxShadow: isExpanded ? '0 10px 30px rgba(0,0,0,0.05)' : 'none'
        }}
      >
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <div style={{ 
            width: 48, height: 48, borderRadius: 14, 
            background: isPassed ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: isPassed ? '#10b981' : '#ef4444'
          }}>
            {isPassed ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>{attempt.exam.title}</h3>
            <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 900, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{attempt.exam.type}</span>
              <span style={{ color: '#cbd5e1' }}>&bull;</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>{new Date(attempt.startTime).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 40, alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9, fontWeight: 900, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 4 }}>Status</div>
            <span style={{ 
              fontSize: 10, fontWeight: 900, textTransform: 'uppercase', 
              color: isPassed ? '#10b981' : '#ef4444', 
              background: isPassed ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
              padding: '4px 8px', borderRadius: 6
            }}>
              {isPassed ? 'Passed' : 'Failed'}
            </span>
          </div>
          <div style={{ textAlign: 'right', minWidth: 80 }}>
            <div style={{ fontSize: 9, fontWeight: 900, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 4 }}>Score</div>
            <div style={{ fontSize: 20, fontWeight: 950, color: isPassed ? '#10b981' : '#ef4444' }}>{attempt.score}%</div>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div style={{ 
          background: '#f8fafc', borderRadius: '0 0 24px 24px', padding: '24px 32px', 
          border: '1.5px solid #e2e8f0', borderTop: 'none', display: 'flex', flexDirection: 'column', gap: 16
        }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Savollar bo'yicha tahlil (AI Feedback)</div>
          {attempt.responses?.map((resp: any, idx: number) => (
            <div key={resp.id} style={{ background: 'white', padding: 20, borderRadius: 16, border: '1.2px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#1e293b' }}>
                  <span style={{ color: '#6366f1', marginRight: 8 }}>#{idx + 1}</span>
                  {resp.question?.text || "Savol matni topilmadi"}
                </div>
                <div style={{ fontSize: 12, fontWeight: 800, color: resp.isCorrect ? '#10b981' : '#ef4444' }}>
                  {resp.pointsEarned} / {resp.question?.points || 0} ball
                </div>
              </div>
              <div style={{ background: '#f1f5f9', padding: '12px 16px', borderRadius: 12, fontSize: 12, color: '#475569', lineHeight: 1.6, borderLeft: '3px solid #6366f1' }}>
                <div style={{ fontSize: 9, fontWeight: 900, color: '#6366f1', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.05em' }}>AI Mantiqiy Xulosasi:</div>
                {resp.feedback || "Tahlil mavjud emas."}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function StudentDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const router = useRouter();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/admin/students/${id}`)
      .then(r => r.json())
      .then(data => {
        setStudent(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ color: '#6366f1', fontWeight: 900, fontSize: 18, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
        Retrieving Dossier...
      </div>
    </div>
  );

  if (!student) return <div>Student not found</div>;

  return (
    <div style={{ maxWidth: '1100px', padding: '0 0 40px 0' }}>
      <button 
        onClick={() => router.back()} 
        style={{ 
          display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', 
          color: '#6366f1', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', 
          cursor: 'pointer', marginBottom: 24, padding: 0
        }}
      >
        <ChevronLeft size={14} /> Back to Students
      </button>

      <div style={{ 
        background: 'white', borderRadius: 32, padding: 40, border: '1.5px solid #e2e8f0', 
        boxShadow: '0 4px 20px rgba(99, 102, 241, 0.03)', marginBottom: 32, position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
            <div style={{ 
              width: 80, height: 80, borderRadius: 24, background: 'rgba(99, 102, 241, 0.08)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' 
            }}>
              <User size={40} />
            </div>
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 950, color: '#0f172a', margin: 0, letterSpacing: '-0.03em' }}>{student.name}</h1>
              <div style={{ display: 'flex', gap: 24, marginTop: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: 14, fontWeight: 600 }}>
                  <Mail size={16} /> {student.email}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: 14, fontWeight: 600 }}>
                  <GraduationCap size={16} /> {student.groupName || 'N/A'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: 14, fontWeight: 600 }}>
                  <BarChart3 size={16} /> ID: {student.studentId || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: 20, fontWeight: 950, color: '#0f172a', marginBottom: 20, letterSpacing: '-0.02em' }}>Performance History</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {student.attempts.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', background: '#fff', borderRadius: 24, border: '1.5px dashed #e2e8f0', color: '#94a3b8' }}>
            No exams attempted yet.
          </div>
        ) : student.attempts.map((attempt: any) => (
          <AttemptRow key={attempt.id} attempt={attempt} />
        ))}
      </div>
    </div>
  );
}
