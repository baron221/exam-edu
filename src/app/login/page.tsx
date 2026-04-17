'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useTranslation } from '@/context/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export default function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  
  // Tabs: 'student' | 'teacher'
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  
  // Student Fields
  const [name, setName] = useState('');
  const [idCode, setIdCode] = useState('');
  
  // Teacher Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (role === 'student') {
      const result = await signIn('dev-id', { redirect: false, name, idCode });
      if (result?.error) alert(result.error);
      else router.push('/');
    } else {
      const result = await signIn('credentials', { redirect: false, email, password });
      if (result?.error) {
        if (result.error === 'CredentialsSignin') alert('Invalid email or password');
        else alert(result.error);
      } else {
        router.push('/admin');
      }
    }
    
    setLoading(false);
  };

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      display: 'flex',
      background: 'linear-gradient(135deg, #f0f4ff 0%, #fafbff 40%, #f4f0ff 100%)',
      fontFamily: 'var(--font-inter), Inter, system-ui, sans-serif',
      position: 'relative',
    }}>
      {/* Decorative ambient blobs */}
      <div style={{
        position: 'absolute', top: '-10%', left: '-5%',
        width: '40vw', height: '40vw', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-10%', right: '48%',
        width: '30vw', height: '30vw', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* ── LEFT PANEL ── */}
      <div style={{
        flex: '0 0 50%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(24px, 4vw, 64px)',
        boxSizing: 'border-box',
        position: 'relative',
        zIndex: 10,
      }}>
        {/* White Card */}
        <div style={{
          background: '#ffffff',
          border: '1px solid rgba(99,102,241,0.1)',
          boxShadow: '0 4px 6px rgba(0,0,0,0.03), 0 24px 60px rgba(99,102,241,0.1), 0 0 0 1px rgba(255,255,255,0.8)',
          borderRadius: 24,
          padding: 'clamp(28px, 3.5vw, 48px)',
          width: '100%',
          maxWidth: 420,
          boxSizing: 'border-box',
        }}>
          {/* Tab Switcher */}
          <div style={{
            display: 'flex',
            background: '#f1f5f9',
            padding: 6,
            borderRadius: 14,
            marginBottom: 28,
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)',
          }}>
            <button
              onClick={() => setRole('student')}
              style={{
                flex: 1, padding: '10px', borderRadius: 10, border: 'none',
                background: role === 'student' ? '#fff' : 'transparent',
                color: role === 'student' ? '#6366f1' : '#94a3b8',
                fontWeight: 800, fontSize: 13, cursor: 'pointer',
                boxShadow: role === 'student' ? '0 4px 6px rgba(0,0,0,0.05)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              {t('student_login')}
            </button>
            <button
              onClick={() => setRole('teacher')}
              style={{
                flex: 1, padding: '10px', borderRadius: 10, border: 'none',
                background: role === 'teacher' ? '#fff' : 'transparent',
                color: role === 'teacher' ? '#6366f1' : '#94a3b8',
                fontWeight: 800, fontSize: 13, cursor: 'pointer',
                boxShadow: role === 'teacher' ? '0 4px 6px rgba(0,0,0,0.05)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              {t('teacher_login')}
            </button>
          </div>

          {/* Heading */}
          <h1 style={{
            fontSize: 'clamp(24px, 2.5vw, 36px)',
            fontWeight: 900,
            color: '#0f172a',
            margin: '0 0 clamp(20px, 2.5vw, 28px) 0',
            letterSpacing: '-0.5px',
            lineHeight: 1.1,
          }}>
            {role === 'student' ? t('login_title') : 'Portal Access'}
          </h1>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px, 1.5vw, 18px)' }}>
            {role === 'student' ? (
              <>
                {/* Full Name */}
                <div>
                  <label style={{ display: 'block', fontSize: 'clamp(9px, 0.75vw, 10px)', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
                    {t('full_name')}
                  </label>
                  <input
                    type="text" required value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder={t('name_placeholder')}
                    style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#f8fafc', fontSize: '15px', fontWeight: 500, boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>

                {/* Student ID */}
                <div>
                  <label style={{ display: 'block', fontSize: 'clamp(9px, 0.75vw, 10px)', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
                    {t('student_id')}
                  </label>
                  <input
                    type="text" required value={idCode}
                    onChange={e => setIdCode(e.target.value)}
                    placeholder={t('id_placeholder')}
                    style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#f8fafc', fontSize: '15px', fontWeight: 500, boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>
              </>
            ) : (
              <>
                {/* Email Address */}
                <div>
                  <label style={{ display: 'block', fontSize: 'clamp(9px, 0.75vw, 10px)', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
                    {t('email_label')}
                  </label>
                  <input
                    type="email" required value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={t('email_placeholder')}
                    style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#f8fafc', fontSize: '15px', fontWeight: 500, boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>

                {/* Password */}
                <div>
                  <label style={{ display: 'block', fontSize: 'clamp(9px, 0.75vw, 10px)', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
                    {t('password_label')}
                  </label>
                  <input
                    type="password" required value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={t('password_placeholder')}
                    style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#f8fafc', fontSize: '15px', fontWeight: 500, boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>
              </>
            )}

            {/* Forgot password */}
            <div style={{ textAlign: 'right', marginTop: -4 }}>
              <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', fontWeight: 600, color: '#6366f1' }}>
                {t('forgot_password')}
              </button>
            </div>

            {/* Sign In Button */}
            <button type="submit" disabled={loading} style={{
              width: '100%',
              padding: '16px',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: '#fff',
              fontSize: '15px',
              fontWeight: 700,
              cursor: loading ? 'wait' : 'pointer',
              fontFamily: 'inherit',
              boxShadow: '0 8px 24px -4px rgba(99,102,241,0.45)',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.2s',
            }}>
              {loading ? t('authenticating') : t('sign_in_btn')}
            </button>
          </form>

          {/* Footer Watermark only for mobile/small views inside card */}
          <p style={{ textAlign: 'center', fontSize: '12px', color: '#cbd5e1', fontWeight: 600, marginTop: 24 }}>
            SECURED BY NPUU PROTOCOL
          </p>
        </div>
      </div>

      {/* Subtle vertical divider */}
      <div style={{
        position: 'absolute', left: '50%', top: '8%', height: '84%', width: 1,
        background: 'linear-gradient(to bottom, transparent, rgba(99,102,241,0.15) 30%, rgba(99,102,241,0.15) 70%, transparent)',
        pointerEvents: 'none',
      }} />

      {/* ── RIGHT PANEL: Logo + Language ── */}
      <div style={{
        flex: '0 0 50%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        gap: 'clamp(28px, 3.5vw, 52px)',
      }}>
        {/* Glow behind logo */}
        <div style={{
          position: 'absolute',
          width: '50%', height: '60%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <Image
            src="/logo_npuu.png"
            alt="NPUU Logo"
            width={200}
            height={200}
            priority
            style={{
              objectFit: 'contain',
              filter: 'drop-shadow(0 8px 32px rgba(99,102,241,0.25)) drop-shadow(0 2px 8px rgba(0,0,0,0.08))',
              width: 'clamp(120px, 15vw, 200px)',
              height: 'auto',
            }}
          />
        </div>

        {/* Premium Language Switcher */}
        <div style={{
          position: 'relative', zIndex: 2,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.25em', textTransform: 'uppercase' }}>
            Language
          </span>
          <div style={{
            background: '#ffffff',
            border: '1.5px solid rgba(99,102,241,0.15)',
            borderRadius: 16,
            padding: 5,
            boxShadow: '0 4px 20px rgba(99,102,241,0.1), 0 1px 3px rgba(0,0,0,0.04)',
          }}>
            <LanguageSwitcher />
          </div>
        </div>

        {/* Watermark */}
        <p style={{
          position: 'absolute', bottom: 28,
          fontSize: 'clamp(8px, 0.6vw, 10px)',
          fontWeight: 700, color: '#cbd5e1',
          letterSpacing: '0.3em', textTransform: 'uppercase', margin: 0,
        }}>
          NPUU · Administrative Terminal
        </p>
      </div>
    </div>
  );
}
