import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: examId } = await params;
    const userId = (session.user as any).id;

    // Check for existing attempt and responses
    const existingAttempt = await prisma.examAttempt.findUnique({
      where: { userId_examId: { userId, examId } },
      include: { responses: true, user: { select: { language: true } } }
    });

    const attempt = await prisma.examAttempt.upsert({
      where: { userId_examId: { userId, examId } },
      update: {
        status: "IN_PROGRESS",
        startTime: existingAttempt?.status === "IN_PROGRESS" ? existingAttempt.startTime : new Date(),
      },
      create: {
        userId,
        examId,
        status: "IN_PROGRESS",
        startTime: new Date(),
      },
      include: { user: { select: { language: true } } }
    });

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questions: {
          include: { options: true },
        },
      },
    });

    if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

    let selectedQuestions = exam.questions;

    // Only randomize if this is a fresh start (no responses yet)
    if (existingAttempt?.responses.length === 0 || !existingAttempt) {
      if (exam.shuffleQuestions) {
        // Fisher-Yates Shuffle
        for (let i = selectedQuestions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [selectedQuestions[i], selectedQuestions[j]] = [selectedQuestions[j], selectedQuestions[i]];
        }
      }

      if (exam.questionLimit && exam.questionLimit > 0) {
        selectedQuestions = selectedQuestions.slice(0, exam.questionLimit);
      }

      // Lock in the question set by creating empty responses
      await prisma.examResponse.createMany({
        data: selectedQuestions.map(q => ({
          attemptId: attempt.id,
          questionId: q.id,
          answer: "",
        }))
      });
    } else {
      // Return existing question set based on created responses
      const responseQuestionIds = existingAttempt.responses.map(r => r.questionId);
      selectedQuestions = exam.questions.filter(q => responseQuestionIds.includes(q.id));
      
      // Sort to match the order of created responses to maintain the same sequence for the student
      selectedQuestions.sort((a, b) => {
        return responseQuestionIds.indexOf(a.id) - responseQuestionIds.indexOf(b.id);
      });
    }

    return NextResponse.json({ 
        ...exam, 
        questions: selectedQuestions, 
        attempts: [attempt],
        userLanguage: attempt.user?.language || 'uz'
    });
  } catch (error) {
    console.error("[EXAM_START]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
