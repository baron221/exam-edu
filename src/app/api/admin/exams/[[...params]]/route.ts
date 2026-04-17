import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

async function guard() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'teacher') return null;
  return session;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ params?: string[] }> }) {
  if (!await guard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  
  const p = await params;
  const slug = p.params || [];
  
  // Case: GET /api/admin/exams/list or /api/admin/exams
  if (slug.length === 0 || slug[0] === 'list') {
    const exams = await prisma.exam.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        course: { select: { title: true } },
        _count: { select: { questions: true, attempts: true } },
      },
    });
    return NextResponse.json(exams);
  }

  // Case: GET /api/admin/exams/ID
  const examId = slug[0];
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      course: true,
      questions: { orderBy: { order: 'asc' }, include: { options: true } },
      attempts: {
        where: { submittedAt: { not: null } },
        include: { user: { select: { name: true, email: true } } },
        orderBy: { submittedAt: 'desc' },
      },
    },
  });
  if (!exam) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(exam);
}

export async function POST(req: Request, { params }: { params: Promise<{ params?: string[] }> }) {
  if (!await guard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  
  const p = await params;
  const slug = p.params || [];

  // Case: POST /api/admin/exams/list (create new)
  if (slug.length === 0 || slug[0] === 'list') {
    const { title, description, courseId, type, timeLimit, passingScore } = await req.json();
    if (!title || !courseId) return NextResponse.json({ error: 'title and courseId required' }, { status: 400 });
    const exam = await prisma.exam.create({
      data: {
        title,
        description: description || '',
        courseId,
        type: type || 'MIDTERM',
        timeLimit: timeLimit || 60,
        passingScore: passingScore || 60,
      },
      include: { course: { select: { title: true } } },
    });
    return NextResponse.json(exam);
  }

  // Case: POST /api/admin/exams/ID/bulk
  if (slug.length === 2 && slug[1] === 'bulk') {
    const examId = slug[0];
    const { questions } = await req.json();
    if (!Array.isArray(questions)) return NextResponse.json({ error: 'Questions array required' }, { status: 400 });

    const count = await prisma.examQuestion.count({ where: { examId } });
    
    const createdQuestions = await prisma.$transaction(
      questions.map((q, idx) => 
        prisma.examQuestion.create({
          data: {
            examId,
            text: q.text,
            type: q.type || 'MCQ',
            points: q.points || 1,
            explanation: q.explanation || '',
            starterCode: q.starterCode || '',
            language: q.language || 'cpp',
            order: count + idx,
            options: {
              create: q.options?.map((o: any) => ({ text: o.text, isCorrect: o.isCorrect })) || [],
            },
          },
          include: { options: true },
        })
      )
    );
    return NextResponse.json(createdQuestions);
  }

  // Case: POST /api/admin/exams/ID/questions
  if (slug.length === 2 && slug[1] === 'questions') {
    const examId = slug[0];
    const { text, type, points, explanation, options, starterCode, language } = await req.json();
    const count = await prisma.examQuestion.count({ where: { examId } });
    const question = await prisma.examQuestion.create({
      data: {
        examId,
        text,
        type,
        points: points || 1,
        explanation: explanation || '',
        starterCode: starterCode || '',
        language: language || '',
        order: count,
        options: {
          create: options.map((o: any) => ({ text: o.text, isCorrect: o.isCorrect })),
        },
      },
      include: { options: true },
    });
    return NextResponse.json(question);
  }

  return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ params?: string[] }> }) {
  if (!await guard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const p = await params;
  const examId = p.params?.[0];
  if (!examId) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  const data = await req.json();
  const exam = await prisma.exam.update({
    where: { id: examId },
    data: {
      title: data.title,
      description: data.description,
      timeLimit: data.timeLimit,
      passingScore: data.passingScore,
      type: data.type,
    },
  });
  return NextResponse.json(exam);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ params?: string[] }> }) {
  if (!await guard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const p = await params;
  const examId = p.params?.[0];
  if (!examId) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  await prisma.exam.delete({ where: { id: examId } });
  return NextResponse.json({ ok: true });
}
