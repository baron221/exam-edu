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
    const body = await request.json().catch(() => ({}));
    const { variantId } = body;

    // Check for existing attempt and responses
    const existingAttempt = await prisma.examAttempt.findUnique({
      where: { userId_examId: { userId, examId } },
      include: { 
        responses: true, 
        user: { select: { language: true } },
        variant: {
          include: {
            questions: {
              include: { question: { include: { options: true } } },
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    });

    // PREVENTION: Do not allow re-entry if already submitted
    if (existingAttempt && existingAttempt.status === "SUBMITTED") {
      return NextResponse.json({ 
        error: "Siz ushbu imtihonni topshirib bo'lgansiz. Qayta topshirish taqiqlanadi.",
        alreadySubmitted: true 
      }, { status: 403 });
    }

    // LOCK: If responses already exist, student cannot change variant
    const isLocked = existingAttempt && existingAttempt.responses.length > 0;
    const finalVariantId = isLocked ? existingAttempt.variantId : (variantId || existingAttempt?.variantId);

    // If already in progress and has a variant, return that
    if (existingAttempt && existingAttempt.status === "IN_PROGRESS") {
      if (finalVariantId) {
        // Fetch the variant with questions if not already in existingAttempt
        let variantData = existingAttempt.variant;
        if (!variantData || variantData.id !== finalVariantId) {
           variantData = await prisma.examVariant.findUnique({
             where: { id: finalVariantId as string },
             include: {
               questions: {
                 include: { question: { include: { options: true } } },
                 orderBy: { order: 'asc' }
               }
             }
           }) as any;
        }

        if (variantData) {
          const variantQuestions = variantData.questions.map(vq => vq.question);
          return NextResponse.json({
            ...(await prisma.exam.findUnique({ where: { id: examId } })),
            questions: variantQuestions,
            attempts: [existingAttempt],
            userLanguage: existingAttempt.user?.language || 'uz',
            selectedVariant: variantData
          });
        }
      }
    }

    const attempt = await prisma.examAttempt.upsert({
      where: { userId_examId: { userId, examId } },
      update: {
        status: "IN_PROGRESS",
        variantId: finalVariantId,
        startTime: existingAttempt?.status === "IN_PROGRESS" ? existingAttempt.startTime : new Date(),
      },
      create: {
        userId,
        examId,
        variantId,
        status: "IN_PROGRESS",
        startTime: new Date(),
      },
      include: { 
        user: { select: { language: true } },
        responses: true,
        variant: true
      }
    });

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questions: {
          include: { options: true },
        },
        variants: {
          include: {
            questions: {
              include: { question: { include: { options: true } } },
              orderBy: { order: 'asc' }
            }
          }
        }
      },
    });

    if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

    // If student hasn't selected a variant but variants exist, return them so the UI can show a selector
    if (!variantId && !attempt.variantId && exam.variants.length > 0) {
      return NextResponse.json({
        ...exam,
        requiresVariant: true,
        variants: exam.variants.map(v => ({ id: v.id, name: v.name, questionCount: v.questions.length })),
        attempts: [attempt]
      });
    }

    let selectedQuestions = exam.questions;

    // Use variant questions if a variant is selected
    if (attempt.variantId) {
      const selectedVariant = exam.variants.find(v => v.id === attempt.variantId);
      if (selectedVariant) {
        selectedQuestions = selectedVariant.questions.map(vq => vq.question);
      }
    }

    // Only randomize if this is a fresh start (no responses yet) and NOT a variant-based exam
    // (Variants have their own order)
    if (existingAttempt?.responses.length === 0 || !existingAttempt) {
      if (!attempt.variantId && exam.shuffleQuestions) {
        // Fisher-Yates Shuffle
        for (let i = selectedQuestions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [selectedQuestions[i], selectedQuestions[j]] = [selectedQuestions[j], selectedQuestions[i]];
        }
      }

      if (!attempt.variantId && exam.questionLimit && exam.questionLimit > 0) {
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
      // If we have a variant, strictly use the variant's questions regardless of existing responses
      if (attempt.variantId) {
        const selectedVariant = exam.variants.find(v => v.id === attempt.variantId);
        if (selectedVariant) {
          selectedQuestions = selectedVariant.questions.map(vq => vq.question);
        }
      } else {
        // Return existing question set based on created responses (fallback for non-variant exams)
        const responseQuestionIds = existingAttempt.responses.map(r => r.questionId);
        selectedQuestions = exam.questions.filter(q => responseQuestionIds.includes(q.id));
        
        // Sort to match the order of created responses to maintain the same sequence for the student
        selectedQuestions.sort((a, b) => {
          return responseQuestionIds.indexOf(a.id) - responseQuestionIds.indexOf(b.id);
        });
      }
    }

    return NextResponse.json({ 
        ...exam, 
        questions: selectedQuestions, 
        attempts: [attempt],
        userLanguage: attempt.user?.language || 'uz',
        selectedVariant: attempt.variant
    });
  } catch (error) {
    console.error("[EXAM_START]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
