import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

async function guard() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'teacher') return null;
  return session;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await guard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  
  const { id: examId } = await params;

  const variants = await prisma.examVariant.findMany({
    where: { examId },
    include: {
      questions: {
        include: {
          question: true
        },
        orderBy: {
          order: 'asc'
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  return NextResponse.json(variants);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await guard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  
  const { id: examId } = await params;
  const { name, questionIds } = await req.json();

  if (!name || !Array.isArray(questionIds)) {
    return NextResponse.json({ error: 'Name and questionIds required' }, { status: 400 });
  }

  const variant = await prisma.examVariant.create({
    data: {
      examId,
      name,
      questions: {
        create: questionIds.map((qId: string, idx: number) => ({
          questionId: qId,
          order: idx
        }))
      }
    },
    include: {
      questions: {
        include: {
          question: true
        }
      }
    }
  });

  return NextResponse.json(variant);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string, variantId?: string }> }
) {
  // We might need a separate route for DELETE if we want to follow REST strictly, 
  // but let's check if we can pass variantId in query or params.
  // Actually, I'll create a separate route for DELETE variant: /api/admin/exams/[id]/variants/[variantId]
  return NextResponse.json({ error: 'Use specific variant ID route' }, { status: 400 });
}
