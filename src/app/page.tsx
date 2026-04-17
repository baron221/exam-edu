'use client';

import React from 'react';
import { useSession } from "next-auth/react";
import Link from "next/link";
import { redirect } from "next/navigation";
import Image from "next/image";
import { useTranslation } from '@/context/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const { t } = useTranslation();
  const [exams, setExams] = useState<any[]>([]);
  const [loadingExams, setLoadingExams] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') redirect("/login");
    if (status === 'authenticated') {
      fetch('/api/exams').then(r => r.json()).then(d => { setExams(d); setLoadingExams(false); });
    }
  }, [status]);

  if (status === 'loading' || loadingExams) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f0f4ff 0%, #fafbff 50%, #f4f0ff 100%)', color: '#6366f1', fontWeight: 900, fontSize: 20 }}>
        {t('authenticating')}
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f4ff 0%, #fafbff 50%, #f4f0ff 100%)', backgroundAttachment: 'fixed', fontFamily: 'var(--font-inter), Inter, system-ui, sans-serif' }}>

      {/* ── NAV ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(99,102,241,0.12)',
        boxShadow: '0 2px 20px rgba(99,102,241,0.08)',
        padding: '14px 40px',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Image src="/logo_npuu.png" alt="NPUU" width={38} height={38} style={{ objectFit: 'contain' }} />
            <div>
              <div style={{ fontSize: 17, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.3px', lineHeight: 1 }}>NPUU</div>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: 2 }}>
                {t('terminal_title')}
              </div>
            </div>
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{session?.user?.name}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t('verified_session')}</div>
            </div>
            <LanguageSwitcher />
            <Link href="/api/auth/signout" style={{
              padding: '8px 18px', borderRadius: 10,
              border: '1.5px solid #e2e8f0', background: '#fff',
              fontSize: 13, fontWeight: 600, color: '#64748b',
              textDecoration: 'none', whiteSpace: 'nowrap',
            }}>
              {t('sign_out')}
            </Link>
          </div>
        </div>
      </nav>

      {/* ── MAIN ── */}
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 40px', width: '100%', boxSizing: 'border-box' }}>

        {/* Header */}
        <header style={{ marginBottom: 48 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 999, marginBottom: 16 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#6366f1', display: 'inline-block' }} />
            <span style={{ fontSize: 10, fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.2em' }}>NPUU Digital Registry</span>
          </div>
          <h1 style={{ fontSize: 'clamp(32px, 4vw, 56px)', fontWeight: 900, color: '#0f172a', margin: '0 0 12px 0', letterSpacing: '-1px', lineHeight: 1.05 }}>
            <span style={{ background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {t('scheduled_exams')}
            </span>
          </h1>
          <p style={{ fontSize: 16, color: '#64748b', fontWeight: 500, maxWidth: 560, lineHeight: 1.6, margin: 0 }}>
            {t('dashboard_desc')}
          </p>
        </header>

        {/* Section label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <div style={{ height: 1, width: 32, background: '#e2e8f0' }} />
          <span style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.3em', whiteSpace: 'nowrap' }}>{t('assigned_portals')}</span>
          <div style={{ height: 1, flex: 1, background: '#e2e8f0' }} />
        </div>

        {/* Exam Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
          {exams.length === 0 ? (
            <div style={{ gridColumn: '1/-1', padding: '80px 40px', background: '#fff', borderRadius: 24, border: '1.5px solid #e2e8f0', textAlign: 'center', boxShadow: '0 4px 20px rgba(99,102,241,0.06)' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📂</div>
              <h3 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>{t('no_exams_title')}</h3>
              <p style={{ fontSize: 14, color: '#94a3b8', fontWeight: 500, margin: 0 }}>{t('no_exams_desc')}</p>
            </div>
          ) : exams.map(exam => (
            <div key={exam.id} style={{
              background: '#fff', borderRadius: 20,
              border: '1.5px solid #e2e8f0',
              boxShadow: '0 2px 12px rgba(99,102,241,0.07)',
              padding: '28px 28px 24px',
              display: 'flex', flexDirection: 'column',
              transition: 'all 0.25s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px rgba(99,102,241,0.16)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(99,102,241,0.3)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(99,102,241,0.07)'; (e.currentTarget as HTMLDivElement).style.borderColor = '#e2e8f0'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <span style={{ padding: '4px 12px', background: 'rgba(99,102,241,0.08)', color: '#6366f1', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', borderRadius: 8, border: '1px solid rgba(99,102,241,0.2)' }}>
                  {exam.type}
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>⏱ {exam.timeLimit} {t('minutes')}</span>
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0', lineHeight: 1.2 }}>{exam.title}</h3>
              <p style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, margin: '0 0 auto 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{exam.course?.title}</p>
              <div style={{ borderTop: '1px solid #f1f5f9', marginTop: 20, paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 800, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 3 }}>Status</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#10b981', textTransform: 'uppercase' }}>{t('status_ready')}</div>
                </div>
                <Link href={`/exams/${exam.id}`} style={{
                  padding: '10px 20px', borderRadius: 12, background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                }}>
                  {t('enter_portal')}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 40px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Image src="/logo_npuu.png" alt="NPUU" width={28} height={28} style={{ objectFit: 'contain', opacity: 0.5 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>NPUU Examination System</span>
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          {['Digital Code', 'Privacy', 'Support'].map(l => (
            <Link key={l} href="#" style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textDecoration: 'none' }}>{l}</Link>
          ))}
        </div>
      </footer>
    </div>
  );
}
