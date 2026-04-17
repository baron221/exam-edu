'use client';

import React, { useEffect, useState } from 'react';

export default function AdminStudentsPage() {
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
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div style={{ color: '#6366f1', fontWeight: 700 }}>Fetching student records…</div>;

  return (
    <div style={{ maxWidth: '1100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', margin: 0 }}>Students</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>Monitor performance and exam outcomes.</p>
        </div>
        <div style={{ position: 'relative' }}>
          <input 
            type="text" 
            placeholder="Search student..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '12px 16px 12px 40px', borderRadius: 12, border: '1.5px solid #e2e8f0', width: 280, outline: 'none' }}
          />
          <span style={{ position: 'absolute', left: 14, top: 12, fontSize: 16 }}>🔍</span>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 24, border: '1.5px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Student Name</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Email / ID</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Completed Exams</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Latest Score</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No students found.</td></tr>
            ) : filtered.map(student => (
              <tr key={student.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '20px 24px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{student.name}</td>
                <td style={{ padding: '20px 24px', fontSize: 13, color: '#64748b' }}>{student.email}</td>
                <td style={{ padding: '20px 24px', fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                  {student.attempts?.length || 0}
                </td>
                <td style={{ padding: '20px 24px' }}>
                  {student.attempts?.[0] ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#10b981' }}>{student.attempts[0].score} Pts</span>
                      <span style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase' }}>{student.attempts[0].exam.title}</span>
                    </div>
                  ) : (
                    <span style={{ color: '#cbd5e1', fontSize: 12 }}>None</span>
                  )}
                </td>
                <td style={{ padding: '20px 24px' }}>
                  <button style={{ padding: '8px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#6366f1' }}>View History</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
