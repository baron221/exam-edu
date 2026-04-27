import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const exams = await prisma.exam.findMany({
      orderBy: { createdAt: 'desc' },
      include: { 
        course: true,
        attempts: {
          where: { userId }
        }
      },
    });
    return NextResponse.json(exams);
  } catch (error) {
    console.error('Error fetching exams:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
