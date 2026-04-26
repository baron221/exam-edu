'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { useTranslation } from '@/context/LanguageContext';

export default function ExamResultPage() {
    const { t } = useTranslation();
    const { status } = useSession();
    const router = useRouter();
    const params = useParams();
    const examId = params.id as string;
    
    const [attempt, setAttempt] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    
    // Appeal State
    const [showAppeal, setShowAppeal] = useState(false);
    const [appealMessage, setAppealMessage] = useState('');
    const [submittingAppeal, setSubmittingAppeal] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/login');
        if (status === 'authenticated') {
            fetch(`/api/exams/${examId}/result`)
                .then(r => r.json())
                .then(d => { setAttempt(d); setLoading(false); });
        }
    }, [status, examId, router]);

    if (loading) return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#f0f4ff 0%,#fafbff 50%,#f4f0ff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', fontWeight: 900, fontSize: 20, fontFamily: 'inherit' }}>
            {t('authenticating')}
        </div>
    );

    if (!attempt) return null;

    const submitAppeal = async () => {
        if (!appealMessage.trim()) return;
        setSubmittingAppeal(true);
        try {
            const res = await fetch(`/api/attempts/${attempt.id}/appeal`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: appealMessage })
            });
            if (res.ok) {
                setAttempt({ ...attempt, isAppealed: true, appealStatus: 'PENDING', appealMessage });
                setShowAppeal(false);
            }
        } catch (e) {
            console.error(e);
        }
        setSubmittingAppeal(false);
    };

    const pct = attempt.score;

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg,#f0f4ff 0%,#fafbff 50%,#f4f0ff 100%)',
            backgroundAttachment: 'fixed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24, fontFamily: 'var(--font-inter), Inter, system-ui, sans-serif',
        }}>
            {/* Ambient blobs */}
            <div style={{ position: 'fixed', top: '-10%', right: '-5%', width: '35vw', height: '35vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'fixed', bottom: '-10%', left: '-5%', width: '30vw', height: '30vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

            <div style={{
                background: '#fff',
                border: '1.5px solid rgba(99,102,241,0.12)',
                boxShadow: '0 4px 6px rgba(0,0,0,0.03), 0 24px 60px rgba(99,102,241,0.12)',
                borderRadius: 28, padding: '52px 44px',
                width: '100%', maxWidth: 480, textAlign: 'center',
                position: 'relative', overflow: 'hidden', zIndex: 10,
            }}>
                {/* Top accent */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #6366f1, #3b82f6, #6366f1)' }} />

                {/* Logo */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                    <Image src="/logo_npuu.png" alt="NPUU Logo" width={72} height={72}
                        style={{ objectFit: 'contain', filter: 'drop-shadow(0 4px 16px rgba(99,102,241,0.25))' }} />
                </div>

                {/* Status badge */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 999, marginBottom: 20 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                        {t('exam_submission_finalized')}
                    </span>
                </div>

                <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', margin: '0 0 16px', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
                    Jarayon yakunlandi!
                </h1>
                <p style={{ fontSize: 18, color: '#6366f1', fontWeight: 700, margin: '0 0 32px', lineHeight: 1.5 }}>
                    Final Exam ga yaxshilab tayyorlaning, siz eng zo'risiz! 🚀
                </p>

                <div style={{
                    background: 'linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%)',
                    border: '1.5px solid rgba(99,102,241,0.15)',
                    borderRadius: 24, padding: '40px 28px', marginBottom: 32,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16
                }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                        <CheckCircle2 size={32} />
                    </div>
                    <div style={{ fontSize: 14, color: '#64748b', fontWeight: 600 }}>
                        Sizning javoblaringiz muvaffaqiyatli qabul qilindi va tekshirish uchun yuborildi.
                    </div>
                </div>

                {/* Appeals Section Hidden or Modified if needed, but keeping Dashboard button */}
                
                {/* CTA */}
                <Link href="/" style={{
                    display: 'block', padding: '15px 24px', borderRadius: 14,
                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none',
                    boxShadow: '0 8px 24px rgba(99,102,241,0.35)', marginBottom: 20,
                }}>
                    Asosiy sahifaga qaytish
                </Link>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.2em', margin: 0 }}>
                    {t('protocol_verified')}
                </p>
            </div>

            {/* Appeal Modal */}
            {showAppeal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
                    <div style={{ background: '#fff', borderRadius: 24, padding: 32, width: '100%', maxWidth: 400, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 16px 0' }}>Appelyatsiya yuborish</h3>
                        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20, lineHeight: 1.5 }}>Agar baholashda nohaqlik yoki xatolik bor dеsangiz, asosli sababingizni yozib koldiring. O'qituvchi ishingizni qayta korib chiqadi.</p>
                        <textarea 
                            value={appealMessage} 
                            onChange={e => setAppealMessage(e.target.value)}
                            placeholder="Sababni yozing..."
                            rows={4}
                            style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1.5px solid #e2e8f0', marginBottom: 20, fontFamily: 'inherit', fontSize: 14 }}
                        />
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button onClick={() => setShowAppeal(false)} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 700, cursor: 'pointer' }}>Bekor qilish</button>
                            <button onClick={submitAppeal} disabled={submittingAppeal} style={{ flex: 1, padding: '12px', borderRadius: 12, background: '#6366f1', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                                {submittingAppeal ? 'Yuborilmoqda...' : 'Yuborish'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
