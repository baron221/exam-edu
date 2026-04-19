import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'teacher') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const appeals = await prisma.examAttempt.findMany({
            where: { isAppealed: true },
            include: {
                user: { select: { name: true, studentId: true, groupName: true } },
                exam: { select: { title: true } }
            },
            orderBy: { submittedAt: 'desc' }
        });
        return NextResponse.json(appeals);
    } catch (e) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'teacher') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { attemptId, appealStatus, newScore, appealFeedback } = await req.json();
        const updated = await prisma.examAttempt.update({
            where: { id: attemptId },
            data: {
                appealStatus,
                score: newScore !== undefined ? newScore : undefined,
                appealFeedback
            }
        });
        return NextResponse.json(updated);
    } catch (e) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
