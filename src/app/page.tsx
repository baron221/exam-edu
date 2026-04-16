import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import Image from "next/image";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const exams = await prisma.exam.findMany({
    orderBy: { createdAt: "desc" },
    include: { course: true }
  });

  return (
    <div className="min-h-screen mesh-gradient">
      {/* Premium Multi-layer Navigation */}
      <nav className="sticky top-0 z-50 bg-white/60 backdrop-blur-3xl border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-5 transition-transform hover:scale-105 duration-300">
            <div className="relative w-11 h-11 drop-shadow-lg">
              <Image src="/logo_npuu.png" alt="NPUU Logo" fill className="object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-black premium-gradient-text tracking-tighter leading-none">NPUU</h1>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-npuu-teal rounded-full animate-pulse" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Exam Terminal</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-sm font-black text-slate-800">{session.user?.name}</span>
              <span className="text-[10px] text-npuu-teal font-black uppercase tracking-tighter">Verified Official Session</span>
            </div>
            <Link 
              href="/api/auth/signout" 
              className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all duration-300 shadow-sm"
            >
              Sign Out
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 py-16">
        <header className="mb-20 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-100 rounded-full shadow-sm mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-npuu-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-npuu-primary"></span>
            </span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Academic Year 2024/2025</span>
          </div>
          <h2 className="text-6xl font-display font-black text-slate-900 tracking-tighter mb-6 leading-[0.9]">
            Digital <span className="premium-gradient-text">Assessments</span>
          </h2>
          <p className="text-lg text-slate-500 font-medium max-w-2xl leading-relaxed">
            Welcome to the National Pedagogical University of Uzbekistan's advanced examination platform. Please select your assigned assessment below to begin.
          </p>
        </header>

        <section>
          <div className="flex items-center gap-4 mb-10">
             <div className="h-px flex-1 bg-slate-200" />
             <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Currently Scheduled</h3>
             <div className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {exams.length === 0 ? (
              <div className="col-span-full py-32 premium-blur-card rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8 text-4xl shadow-inner">📄</div>
                <h4 className="text-2xl font-display font-black text-slate-800">Queue is Empty</h4>
                <p className="text-slate-500 mt-4 max-w-xs font-medium">There are no examinations currently assigned to your profile by the registrar.</p>
              </div>
            ) : (
              exams.map(exam => (
                <div key={exam.id} className="premium-blur-card rounded-[2.5rem] overflow-hidden group hover:ring-2 ring-npuu-primary/20 transition-all duration-500">
                  <div className="p-10">
                    <div className="flex justify-between items-start mb-10">
                      <div className="px-4 py-1.5 bg-npuu-primary/5 text-npuu-primary text-[10px] font-black uppercase tracking-widest rounded-full border border-npuu-primary/10">
                        {exam.type}
                      </div>
                      <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                        <span className="text-xs">⏱️</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{exam.timeLimit}m</span>
                      </div>
                    </div>
                    
                    <h4 className="text-2xl font-display font-black text-slate-900 mb-4 group-hover:text-npuu-primary transition-colors duration-300">
                      {exam.title}
                    </h4>
                    <p className="text-sm text-slate-400 font-bold uppercase tracking-tight mb-10 line-clamp-2">
                       {exam.course.title}
                    </p>

                    <div className="pt-8 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Status</span>
                        <span className="text-[11px] font-black text-emerald-500 uppercase">Live Access</span>
                      </div>
                      <Link 
                        href={`/exams/${exam.id}`} 
                        className="premium-button px-8 py-3 rounded-2xl text-xs"
                      >
                        Enter Room
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      <footer className="max-w-7xl mx-auto px-8 py-20 mt-20 border-t border-slate-200/40">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-12">
          <div className="flex items-center gap-5 opacity-40 hover:opacity-100 transition-opacity duration-500 group">
            <div className="relative w-10 h-10 grayscale group-hover:grayscale-0 transition-all">
              <Image src="/logo_npuu.png" alt="NPUU Logo" fill className="object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-slate-900 tracking-tighter">NPUU Digital</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Institutional Systems</span>
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-10 text-[11px] font-black text-slate-400 uppercase tracking-widest">
              <Link href="#" className="hover:text-npuu-primary transition-colors">Digital Ethics</Link>
              <Link href="#" className="hover:text-npuu-primary transition-colors">Data Privacy</Link>
              <Link href="#" className="hover:text-npuu-primary transition-colors">Help Terminal</Link>
            </div>
            <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">
              Encryption standard: AES-256-GCM — Verified Connection
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
