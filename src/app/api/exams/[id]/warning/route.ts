import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(
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
        const attempt = await prisma.examAttempt.update({
            where: { userId_examId: { userId, examId } },
            data: { 
                warningCount: { increment: 1 }
            }
        });

        return NextResponse.json({ warningCount: attempt.warningCount });
    } catch (error) {
        console.error('Error updating warning count:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
