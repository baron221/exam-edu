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
        const attempt = await prisma.examAttempt.findUnique({
            where: { userId_examId: { userId, examId } },
            include: { 
                exam: true,
                responses: {
                    include: {
                        question: true
                    }
                }
            }
        });

        if (!attempt) {
            return new NextResponse('Not Found', { status: 404 });
        }

        return NextResponse.json(attempt);
    } catch (error) {
        console.error('Error fetching result:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
