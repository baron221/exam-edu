'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [idCode, setIdCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await signIn('dev-id', {
      redirect: false,
      name,
      idCode,
    });

    if (result?.error) {
      alert(result.error);
    } else {
      router.push('/');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center mesh-gradient relative overflow-hidden px-6">
      {/* Dynamic Background Accents */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-npuu-primary/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-npuu-accent/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="w-full max-w-[480px] relative z-10">
        <div className="flex flex-col items-center mb-10 animate-float">
          <div className="relative w-28 h-28 mb-6 drop-shadow-2xl">
             <Image 
                src="/logo_npuu.png" 
                alt="NPUU Logo" 
                fill 
                className="object-contain"
                priority
             />
          </div>
          <h1 className="text-5xl font-display font-black premium-gradient-text tracking-tighter mb-2">NPUU</h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] text-center">
            National Pedagogical University of Uzbekistan
          </p>
        </div>

        <div className="premium-blur-card rounded-[2.5rem] p-12 relative">
          {/* Subtle Glow Effect */}
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-npuu-primary/20 blur-2xl opacity-50 rounded-full" />
          
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-display font-black text-slate-800 mb-2">Examination Terminal</h2>
            <p className="text-sm text-slate-500 font-medium">Authentication required for secure session access.</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Student Identity</label>
              <input 
                type="text" 
                required 
                className="premium-input w-full"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ivanov Ivan Ivanovich"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Code (250XXX)</label>
              <input 
                type="text" 
                required 
                maxLength={6}
                className="premium-input w-full font-mono tracking-widest"
                value={idCode}
                onChange={e => setIdCode(e.target.value)}
                placeholder="250001"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="premium-button w-full py-4 rounded-2xl text-base disabled:opacity-50 mt-4"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                  Securing Connection...
                </span>
              ) : (
                <>
                  <span>Begin Secure Session</span>
                  <span className="text-xl">→</span>
                </>
              )}
            </button>
          </form>

          <footer className="mt-10 pt-8 border-t border-slate-100 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol v4.2 Active</span>
            </div>
          </footer>
        </div>
        
        <p className="mt-10 text-center text-slate-400 text-[11px] font-bold uppercase tracking-tight">
          © {new Date().getFullYear()} NPUU Academic Systems • Advanced Terminal
        </p>
      </div>
    </div>
  );
}
