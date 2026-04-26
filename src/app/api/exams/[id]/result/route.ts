import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    const { id: examId } = await params;

    if (!session) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const userId = (session.user as any).id;

    try {
        // Step 1: Get attempt without responses first
        const attempt = await prisma.examAttempt.findUnique({
            where: { userId_examId: { userId, examId } },
            include: { exam: true }
        });

        if (!attempt) {
            return new NextResponse('Not Found', { status: 404 });
        }

        // Step 2: Determine which question IDs to fetch responses for
        let questionIdsFilter: string[] | null = null;
        if (attempt.variantId) {
            const variant = await prisma.examVariant.findUnique({
                where: { id: attempt.variantId },
                include: { questions: { orderBy: { order: 'asc' }, select: { questionId: true } } }
            });
            if (variant && variant.questions.length > 0) {
                questionIdsFilter = variant.questions.map(vq => vq.questionId);
            }
        }

        // Step 3: Fetch ONLY the relevant responses at DB level
        const responses = await prisma.examResponse.findMany({
            where: {
                attemptId: attempt.id,
                ...(questionIdsFilter ? { questionId: { in: questionIdsFilter } } : {})
            },
            include: { question: true },
            // Sort by variant order if we have a filter
            orderBy: { id: 'asc' }
        });

        // Sort responses to match variant question order
        let sortedResponses = responses;
        if (questionIdsFilter) {
            sortedResponses = [...responses].sort((a, b) => {
                return questionIdsFilter!.indexOf(a.questionId) - questionIdsFilter!.indexOf(b.questionId);
            });
        }

        return NextResponse.json({ ...attempt, responses: sortedResponses });
    } catch (error) {
        console.error('Error fetching result:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
