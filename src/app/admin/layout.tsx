'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useTranslation } from '@/context/LanguageContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const NAV = [
    { href: '/admin',          label: t('dashboard'),  icon: '📊' },
    { href: '/admin/exams',    label: t('exams'),       icon: '📝' },
    { href: '/admin/courses',  label: t('courses'),     icon: '📚' },
    { href: '/admin/students', label: t('students'),    icon: '👥' },
  ];

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated' && (session?.user as any)?.role !== 'teacher') {
      router.push('/');
    }
  }, [status, session, router]);

  if (status === 'loading') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#f0f4ff,#fafbff)', color: '#6366f1', fontWeight: 900, fontSize: 20 }}>
      Loading…
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg,#f0f4ff 0%,#fafbff 50%,#f4f0ff 100%)', fontFamily: 'var(--font-inter), Inter, system-ui, sans-serif' }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: 240, flexShrink: 0,
        background: '#fff',
        borderRight: '1px solid rgba(99,102,241,0.1)',
        boxShadow: '4px 0 24px rgba(99,102,241,0.06)',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh',
      }}>
        {/* Brand */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Image src="/logo_npuu.png" alt="NPUU" width={36} height={36} style={{ objectFit: 'contain' }} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.3px' }}>NPUU</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.18em' }}>Teacher Panel</div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', background: '#f8fafc', padding: '6px', borderRadius: '10px' }}>
            <LanguageSwitcher />
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV.map(item => {
            const isActive = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px', borderRadius: 12,
                background: isActive ? 'rgba(99,102,241,0.08)' : 'transparent',
                color: isActive ? '#6366f1' : '#64748b',
                fontWeight: isActive ? 700 : 500,
                fontSize: 14,
                textDecoration: 'none',
                border: isActive ? '1px solid rgba(99,102,241,0.15)' : '1px solid transparent',
                transition: 'all 0.15s',
              }}>
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User + Sign out */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{session?.user?.name}</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 12 }}>{session?.user?.email}</div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            style={{ width: '100%', padding: '9px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main style={{ flex: 1, padding: '40px 40px', overflowY: 'auto', minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  );
}
