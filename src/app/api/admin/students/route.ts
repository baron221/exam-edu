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
  const students = await prisma.user.findMany({
    where: { role: 'student' },
    orderBy: { name: 'asc' },
    select: {
      id: true, name: true, email: true, groupName: true,
      attempts: {
        where: { submittedAt: { not: null } },
        select: { score: true, submittedAt: true, exam: { select: { title: true } } },
        orderBy: { submittedAt: 'desc' },
      },
    },
  });
  return NextResponse.json(students);
}
