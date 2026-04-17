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
  const courses = await prisma.course.findMany({ orderBy: { createdAt: 'desc' }, include: { _count: { select: { exams: true } } } });
  return NextResponse.json(courses);
}

export async function POST(req: Request) {
  if (!await guard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { title, slug, category } = await req.json();
  if (!title || !slug) return NextResponse.json({ error: 'title and slug required' }, { status: 400 });
  const course = await prisma.course.create({ data: { title, slug, category: category || 'General' } });
  return NextResponse.json(course);
}

export async function DELETE(req: Request) {
  if (!await guard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await req.json();
  await prisma.course.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
