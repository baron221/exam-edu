import Link from 'next/link';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Image from 'next/image';

export default async function ExamResultPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session) redirect('/login');

    const { id: examId } = await params;
    const userId = (session.user as any).id;

    const attempt = await prisma.examAttempt.findUnique({
        where: { userId_examId: { userId, examId } },
        include: { exam: true }
    });

    if (!attempt || attempt.status === 'IN_PROGRESS') {
        redirect(`/exams/${examId}`);
    }

    return (
        <div className="min-h-screen mesh-gradient flex items-center justify-center p-6">
            <div className="w-full max-w-[640px] premium-blur-card rounded-[3rem] p-16 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-npuu-primary/5 rounded-full -mr-16 -mt-16" />
                
                <div className="relative w-24 h-24 mx-auto mb-10 drop-shadow-xl animate-float">
                    <Image src="/logo_npuu.png" alt="NPUU Logo" fill className="object-contain" />
                </div>

                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full mb-6 border border-emerald-100">
                    <span className="text-xs font-black uppercase tracking-widest">Assessment Finalized</span>
                </div>
                
                <h1 className="text-5xl font-display font-black text-slate-900 tracking-tighter mb-4">
                     Examination <span className="premium-gradient-text">Complete</span>
                </h1>
                <p className="text-lg text-slate-500 font-medium mb-12">
                    {attempt.exam.title}
                </p>
                
                <div className="bg-slate-50/50 rounded-[2rem] p-10 border border-slate-100 mb-12 shadow-inner">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Performance Score</div>
                    <div className="text-[84px] font-display font-black leading-none flex items-baseline justify-center gap-2 text-slate-900 tracking-tighter">
                        {attempt.score}
                        <span className="text-2xl font-bold text-slate-400 uppercase tracking-tight">Points</span>
                    </div>
                    <div className="mt-8 pt-6 border-t border-slate-200/50 flex items-center justify-center gap-8">
                        <div className="text-center">
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</div>
                            <div className="text-xs font-bold text-npuu-teal">VERIFIED</div>
                        </div>
                        <div className="w-px h-8 bg-slate-200" />
                        <div className="text-center">
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Method</div>
                            <div className="text-xs font-bold text-slate-600">AUTOMATED</div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <Link href="/" className="premium-button py-4 rounded-2xl text-base shadow-lg hover:shadow-2xl transition-all">
                        Return to Official Dashboard
                    </Link>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-6">
                        System Protocol: Secure Session Terminated
                    </p>
                </div>
            </div>
        </div>
    );
}
