'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

const StatCard = ({ label, value, color, icon }: any) => (
  <div style={{
    background: '#fff', borderRadius: 18, padding: '28px 24px',
    border: '1.5px solid #e2e8f0',
    boxShadow: '0 2px 12px rgba(99,102,241,0.07)',
    display: 'flex', flexDirection: 'column', gap: 8,
  }}>
    <div style={{ fontSize: 28 }}>{icon}</div>
    <div style={{ fontSize: 36, fontWeight: 900, color, letterSpacing: '-1px', lineHeight: 1 }}>{value ?? '…'}</div>
    <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>{label}</div>
  </div>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.json()).then(setStats);
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px', margin: 0, marginBottom: 6 }}>Dashboard</h1>
        <p style={{ fontSize: 15, color: '#64748b', margin: 0 }}>Welcome back. Here's what's happening on the platform.</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 20, marginBottom: 40 }}>
        <StatCard icon="📝" label="Total Exams"      value={stats?.totalExams}    color="#6366f1" />
        <StatCard icon="👥" label="Students"          value={stats?.totalStudents} color="#3b82f6" />
        <StatCard icon="✅" label="Completed Attempts" value={stats?.totalAttempts} color="#10b981" />
      </div>

      {/* Recent Submissions */}
      <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #e2e8f0', boxShadow: '0 2px 12px rgba(99,102,241,0.07)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0 }}>Recent Submissions</h2>
          <Link href="/admin/students" style={{ fontSize: 13, fontWeight: 600, color: '#6366f1', textDecoration: 'none' }}>View all →</Link>
        </div>
        {!stats?.recentAttempts?.length ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>No submissions yet.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Student', 'Exam', 'Score', 'Date'].map(h => (
                  <th key={h} style={{ padding: '12px 24px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.recentAttempts.map((a: any) => (
                <tr key={a.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 24px', fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{a.user.name}</td>
                  <td style={{ padding: '14px 24px', fontSize: 14, color: '#64748b' }}>{a.exam.title}</td>
                  <td style={{ padding: '14px 24px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 8, background: 'rgba(99,102,241,0.08)', color: '#6366f1', fontWeight: 800, fontSize: 13 }}>{a.score} pts</span>
                  </td>
                  <td style={{ padding: '14px 24px', fontSize: 13, color: '#94a3b8' }}>{new Date(a.submittedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: 16, marginTop: 32 }}>
        <Link href="/admin/exams" style={{ padding: '12px 22px', borderRadius: 12, background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none', boxShadow: '0 4px 14px rgba(99,102,241,0.3)' }}>
          + New Exam
        </Link>
        <Link href="/admin/courses" style={{ padding: '12px 22px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#fff', color: '#334155', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
          Manage Courses
        </Link>
      </div>
    </div>
  );
}
