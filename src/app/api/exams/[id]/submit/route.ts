import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { evaluateCode } from "@/lib/judge";
import { evaluateCodeWithAI } from "@/lib/ai";

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

    // Determine which questions to evaluate: Variant questions or Global questions
    let questionsToEvaluate = attempt.exam.questions;
    if (attempt.variantId) {
      const variant = await prisma.examVariant.findUnique({
        where: { id: attempt.variantId },
        include: {
          questions: {
            include: { question: { include: { options: true } } }
          }
        }
      });
      if (variant) {
        questionsToEvaluate = variant.questions.map(vq => vq.question) as any;
      }
    }

    for (const q of questionsToEvaluate) {
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
        const sourceCode = String(userAnswer || "");
        
        try {
          if (testCases && testCases.length > 0) {
            // 1. Evaluate via Judge0 (Unit Tests)
            const evalResult = await evaluateCode(sourceCode, testCases);
            const judgeScoreRatio = evalResult.score / evalResult.total; // 0 to 1
            
            // 2. Evaluate via AI (Logic & Quality)
            const testSummary = evalResult.results.map(r => 
              `Input: ${r.input}, Expected: ${r.expected}, Actual: ${r.actual}, Status: ${r.status}`
            ).join("\n");
            
            const aiResult = await evaluateCodeWithAI(sourceCode, q.text, testSummary);
            const aiScoreRatio = aiResult.score / 100; // 0 to 1
            
            // 3. Weighted Score: 70% Unit Tests, 30% AI Logic
            const combinedRatio = (judgeScoreRatio * 0.7) + (aiScoreRatio * 0.3);
            
            pointsEarned = combinedRatio * q.points;
            isCorrect = combinedRatio >= 0.6;
            feedback = `[UNIT TESTS]: ${evalResult.score}/${evalResult.total} o'tdi.\n[AI XULOSA]: ${aiResult.feedback}`;
          } else {
            // FALLBACK: If no test cases, rely 100% on AI Logic Analysis
            const aiResult = await evaluateCodeWithAI(sourceCode, q.text, "No test cases provided.");
            const aiScoreRatio = aiResult.score / 100;
            
            pointsEarned = aiScoreRatio * q.points;
            isCorrect = aiScoreRatio >= 0.6;
            feedback = `[UNIT TESTS]: Mavjud emas.\n[AI XULOSA]: ${aiResult.feedback}`;
          }
        } catch (err: any) {
          console.error(`[EVAL_FAIL] Q:${q.id}`, err);
          feedback = "Evaluation engine error.";
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
      prisma.examResponse.deleteMany({ where: { attemptId: attempt.id } }),
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
