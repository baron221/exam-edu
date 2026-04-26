'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, User, Mail, GraduationCap, History, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';

export default function AdminStudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/admin/students').then(r => r.json()).then(data => {
      setStudents(data);
      setLoading(false);
    });
  }, []);

  const filtered = students.filter(s => 
    s.name?.toLowerCase().includes(search.toLowerCase()) || 
    s.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.group?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
       <RefreshCw className="animate-spin" size={32} color="#6366f1" />
       <div style={{ color: '#6366f1', fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.3em' }}>Synchronizing Student Data...</div>
    </div>
  );

  return (
    <div style={{ maxWidth: '1200px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40 }}>
        <div>
          <h1 style={{ fontSize: 40, fontWeight: 950, color: '#0f172a', margin: 0, letterSpacing: '-0.04em' }}>Students</h1>
          <p style={{ color: '#64748b', margin: '8px 0 0 0', fontWeight: 600, fontSize: 16 }}>Manage and monitor the entire student body performance.</p>
        </div>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
            <Search size={18} />
          </div>
          <input 
            type="text" 
            placeholder="Search by name, email or group..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ 
              padding: '16px 16px 16px 48px', borderRadius: 16, border: '1.5px solid #e2e8f0', 
              width: 380, outline: 'none', fontSize: 14, fontWeight: 600,
              boxShadow: '0 4px 12px rgba(0,0,0,0.02)', transition: 'all 0.2s'
            }}
          />
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 28, border: '1.5px solid #e2e8f0', boxShadow: '0 10px 30px rgba(99, 102, 241, 0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
              <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Student Identity</th>
              <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Email / Contacts</th>
              <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Engagement</th>
              <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Performance Peak</th>
              <th style={{ padding: '20px 24px', textAlign: 'center', fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 80, textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <AlertCircle size={40} color="#cbd5e1" />
                    <span style={{ color: '#94a3b8', fontSize: 16, fontWeight: 600 }}>No student records match your query.</span>
                  </div>
                </td>
              </tr>
            ) : filtered.map(student => (
              <tr key={student.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                <td style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(99, 102, 241, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                      <User size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>{student.name}</div>
                      <div style={{ fontSize: 11, color: '#6366f1', fontWeight: 700, textTransform: 'uppercase', marginTop: 2 }}>{student.group || 'Individual'}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600, color: '#475569' }}>
                      <Mail size={14} color="#94a3b8" /> {student.email}
                    </div>
                  </div>
                </td>
                <td style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a' }}>{student.attempts?.length || 0}</div>
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#cbd5e1', textTransform: 'uppercase' }}>Exams</span>
                  </div>
                </td>
                <td style={{ padding: '24px' }}>
                  {student.attempts?.[0] ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 16, fontWeight: 950, color: student.attempts[0].score >= 60 ? '#10b981' : '#ef4444' }}>
                          {student.attempts[0].score}%
                        </span>
                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#cbd5e1' }} />
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Latest</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{student.attempts[0].exam.title}</div>
                    </div>
                  ) : (
                    <span style={{ color: '#cbd5e1', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Inactive</span>
                  )}
                </td>
                <td style={{ padding: '24px', textAlign: 'center' }}>
                  <button 
                    onClick={() => router.push(`/admin/students/${student.id}`)}
                    style={{ 
                      display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', 
                      borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#fff', 
                      fontSize: 12, fontWeight: 800, cursor: 'pointer', color: '#6366f1',
                      transition: 'all 0.2s', boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.background = 'rgba(99, 102, 241, 0.02)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#fff'; }}
                  >
                    <History size={14} /> Full History
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

