import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  noStore();
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    console.log('PUBLIC_API: Fetching fresh exam:', id);

    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { order: "asc" },
          include: { options: true },
        },
        attempts: session?.user ? {
          where: { userId: (session.user as any).id },
          orderBy: { startTime: "desc" },
          take: 1
        } : false
      },
    });

    if (!exam) {
      console.log('PUBLIC_API: Exam not found');
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    console.log('PUBLIC_API: Found questions:', exam.questions.length);
    const currentAttempt = exam.attempts?.[0];
    
    // Safety check: if there is no session, we return 401
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only hide questions if explicitly READY (hasn't clicked Start)
    if (currentAttempt?.status === "READY") {
      const { questions, ...rest } = exam;
      return NextResponse.json({ ...rest, questionsCount: questions.length });
    }

    return NextResponse.json(exam);
  } catch (error) {
    console.error("[EXAM_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
