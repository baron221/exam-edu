import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

async function guard() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'teacher') return null;
  return session;
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ qId: string }> }) {
  if (!await guard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { qId } = await params;
  await prisma.examQuestion.delete({ where: { id: qId } });
  return NextResponse.json({ ok: true });
}
