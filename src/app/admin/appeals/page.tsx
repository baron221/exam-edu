'use client';

import React, { useEffect, useState } from 'react';

export default function AdminAppealsPage() {
    const [appeals, setAppeals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedAppeal, setSelectedAppeal] = useState<any>(null);
    const [feedback, setFeedback] = useState('');
    const [newScore, setNewScore] = useState<number | ''>('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchAppeals();
    }, []);

    const fetchAppeals = async () => {
        const res = await fetch('/api/admin/appeals');
        const data = await res.json();
        setAppeals(data);
        setLoading(false);
    };

    const handleResolve = async (status: 'APPROVED' | 'REJECTED') => {
        setProcessing(true);
        const res = await fetch('/api/admin/appeals', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                attemptId: selectedAppeal.id,
                appealStatus: status,
                newScore: newScore !== '' ? Number(newScore) : undefined,
                appealFeedback: feedback
            })
        });
        if (res.ok) {
            setSelectedAppeal(null);
            fetchAppeals();
        }
        setProcessing(false);
    };

    if (loading) return <div style={{ color: '#6366f1', fontWeight: 700 }}>Appelyatsiyalar yuklanmoqda...</div>;

    return (
        <div style={{ maxWidth: '1000px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', margin: 0 }}>Appelyatsiyalar</h1>
                    <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>Talabalarning baholar ustuvorligi bo'yicha yuborgan so'rovlari.</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
                {appeals.length === 0 ? (
                    <div style={{ background: '#fff', padding: 40, borderRadius: 20, textAlign: 'center', gridColumn: '1 / -1' }}>
                         Bolim bombosh!
                    </div>
                ) : appeals.map(a => (
                    <div key={a.id} style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #e2e8f0', padding: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                            <span style={{ fontSize: 10, fontWeight: 800, color: a.appealStatus === 'PENDING' ? '#f59e0b' : '#64748b', background: 'rgba(245, 158, 11, 0.08)', padding: '4px 10px', borderRadius: 8, textTransform: 'uppercase' }}>
                                {a.appealStatus}
                            </span>
                            <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>{a.score} ball</span>
                        </div>
                        <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>{a.user.name || 'Noma\'lum'}</h3>
                        <p style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600, margin: '0 0 16px 0', textTransform: 'uppercase' }}>{a.exam.title} - {a.user.groupName || 'No Group'}</p>
                        
                        <div style={{ background: '#f8fafc', padding: 12, borderRadius: 12, marginBottom: 16 }}>
                            <p style={{ fontSize: 13, color: '#475569', margin: 0, fontStyle: 'italic' }}>"{a.appealMessage}"</p>
                        </div>
                        
                        <button 
                            onClick={() => { setSelectedAppeal(a); setFeedback(''); setNewScore(a.score); }}
                            style={{ display: 'block', width: '100%', padding: '10px', background: '#f1f5f9', color: '#475569', fontWeight: 700, borderRadius: 10, border: 'none', cursor: 'pointer' }}
                        >
                            Ko'rib chiqish
                        </button>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {selectedAppeal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 480, padding: 32, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', margin: '0 0 8px 0' }}>Appelyatsiya Qarori</h2>
                        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>{selectedAppeal.user.name} - {selectedAppeal.exam.title}</p>
                        
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Talaba Xabari</label>
                            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', color: '#0f172a', fontSize: 14 }}>
                                {selectedAppeal.appealMessage}
                            </div>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Yangi Baho (Ixtiyoriy)</label>
                            <input 
                                type="number" 
                                value={newScore} 
                                onChange={e => setNewScore(e.target.value === '' ? '' : Number(e.target.value))}
                                style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e2e8f0', boxSizing: 'border-box' }} 
                            />
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Javobingiz</label>
                            <textarea 
                                rows={3}
                                value={feedback} 
                                onChange={e => setFeedback(e.target.value)}
                                placeholder="Nima uchun o'zgargani yoki rad etilganini izohlang..."
                                style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e2e8f0', boxSizing: 'border-box', fontFamily: 'inherit' }} 
                            />
                        </div>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button onClick={() => setSelectedAppeal(null)} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#fff', fontWeight: 700, cursor: 'pointer' }}>Bekor qilish</button>
                            <button onClick={() => handleResolve('REJECTED')} disabled={processing} style={{ flex: 1, padding: '12px', borderRadius: 12, background: '#fee2e2', color: '#ef4444', fontWeight: 700, border: 'none', cursor: 'pointer' }}>Rad etish</button>
                            <button onClick={() => handleResolve('APPROVED')} disabled={processing} style={{ flex: 1, padding: '12px', borderRadius: 12, background: '#10b981', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer' }}>Tasdiqlash</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
