import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

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
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Hide questions if exam hasn't started yet and session exists
    if (session?.user && (!exam.attempts || exam.attempts.length === 0 || exam.attempts[0].status === "READY")) {
      const { questions, ...rest } = exam;
      return NextResponse.json({ ...rest, questionsCount: questions.length });
    }

    return NextResponse.json(exam);
  } catch (error) {
    console.error("[EXAM_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
