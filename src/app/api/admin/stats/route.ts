import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

async function guard() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'teacher') return null;
  return session;
}

export async function GET() {
  if (!await guard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const [totalExams, totalStudents, totalAttempts, recentAttempts] = await Promise.all([
    prisma.exam.count(),
    prisma.user.count({ where: { role: 'student' } }),
    prisma.examAttempt.count({ where: { submittedAt: { not: null } } }),
    prisma.examAttempt.findMany({
      where: { submittedAt: { not: null } },
      orderBy: { submittedAt: 'desc' },
      take: 5,
      include: { user: { select: { name: true } }, exam: { select: { title: true } } },
    }),
  ]);

  return NextResponse.json({ totalExams, totalStudents, totalAttempts, recentAttempts });
}
