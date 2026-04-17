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
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = (session.user as any).id;

    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        questions: {
          include: { options: true },
        },
        attempts: {
          where: { userId },
          include: { responses: true },
          orderBy: { startTime: "desc" },
          take: 1
        }
      },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    const currentAttempt = exam.attempts?.[0];
    let filteredQuestions = exam.questions;

    // Consistency check: If attempt exists and has locked-in questions (responses), use them
    if (currentAttempt && currentAttempt.responses.length > 0) {
        const responseQuestionIds = currentAttempt.responses.map(r => r.questionId);
        filteredQuestions = exam.questions.filter(q => responseQuestionIds.includes(q.id));
        
        // Match the sequence stored in the responses
        filteredQuestions.sort((a, b) => {
            return responseQuestionIds.indexOf(a.id) - responseQuestionIds.indexOf(b.id);
        });
    } else {
        // If not started, hide questions or provide only count
        const { questions, ...rest } = exam;
        return NextResponse.json({ ...rest, questionsCount: questions.length });
    }

    return NextResponse.json({
        ...exam,
        questions: filteredQuestions
    });
  } catch (error) {
    console.error("[EXAM_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
