import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { evaluateCode } from "@/lib/judge";

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
    const { answers } = await request.json();

    const attempt = await prisma.examAttempt.findUnique({
      where: { userId_examId: { userId, examId } },
      include: {
        exam: {
          include: {
            questions: {
              include: { options: true }
            }
          }
        }
      }
    });

    if (!attempt || attempt.status !== "IN_PROGRESS") {
      return NextResponse.json({ error: "No active attempt" }, { status: 400 });
    }

    let totalScore = 0;
    const responses = [];

    for (const q of attempt.exam.questions) {
      const userAnswer = answers[q.id];
      let isCorrect = false;
      let pointsEarned = 0;
      let feedback = "";

      if (q.type === "MCQ") {
        const correctOpt = q.options.find(o => o.isCorrect);
        if (correctOpt && userAnswer === correctOpt.id) {
          isCorrect = true;
          pointsEarned = q.points;
        }
      } else if (q.type === "CODING") {
        const testCases = q.testCases as any[];
        if (testCases && testCases.length > 0) {
          try {
            const evalResult = await evaluateCode(String(userAnswer || ""), testCases);
            pointsEarned = (evalResult.score / evalResult.total) * q.points;
            isCorrect = evalResult.passed;
            feedback = `Passed ${evalResult.score}/${evalResult.total} test cases.`;
          } catch (err: any) {
            console.error(`[EVAL_FAIL] Q:${q.id}`, err);
            feedback = "Evaluation engine error.";
          }
        } else {
          // No test cases defined, default to 0 or manual review needed
          feedback = "No test cases defined for this unit.";
        }
      }

      totalScore += pointsEarned;
      responses.push({
        attemptId: attempt.id,
        questionId: q.id,
        answer: String(userAnswer || ""),
        isCorrect,
        pointsEarned,
        feedback
      });
    }

    await prisma.$transaction([
      prisma.examResponse.createMany({ data: responses }),
      prisma.examAttempt.update({
        where: { id: attempt.id },
        data: {
          status: "SUBMITTED",
          submittedAt: new Date(),
          score: totalScore
        }
      })
    ]);

    return NextResponse.json({ success: true, score: totalScore });
  } catch (error) {
    console.error("[EXAM_SUBMIT]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
