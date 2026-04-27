import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

async function guard() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'teacher') return null;
  return session;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await guard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;

  const student = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      studentId: true,
      groupName: true,
      attempts: {
        include: {
          exam: {
            select: {
              title: true,
              type: true,
              passingScore: true,
            }
          },
          variant: {
            include: {
              questions: {
                select: { questionId: true }
              }
            }
          },
          responses: {
            include: {
              question: {
                select: {
                  text: true,
                  points: true,
                  type: true
                }
              }
            }
          }
        },
        orderBy: {
          startTime: 'desc'
        }
      }
    }
  });

  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

  const studentData = JSON.parse(JSON.stringify(student));

  // Filter responses for each attempt based on variant questions
  const processedAttempts = studentData.attempts.map((attempt: any) => {
    if (attempt.variantId && attempt.variant && attempt.variant.questions) {
      const variantQuestionIds = attempt.variant.questions.map((vq: any) => vq.questionId);
      
      const filteredResponses = attempt.responses.filter((r: any) => 
        variantQuestionIds.includes(r.questionId)
      );
      
      // Sort responses to match variant order
      filteredResponses.sort((a: any, b: any) => {
        return variantQuestionIds.indexOf(a.questionId) - variantQuestionIds.indexOf(b.questionId);
      });

      return { ...attempt, responses: filteredResponses };
    }
    return attempt;
  });

  return NextResponse.json({
    ...studentData,
    attempts: processedAttempts
  });
}
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await guard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;

  try {
    await prisma.user.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 });
  }
}
