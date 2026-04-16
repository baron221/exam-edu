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

    const attempt = await prisma.examAttempt.upsert({
      where: { userId_examId: { userId, examId } },
      update: {
        status: "IN_PROGRESS",
        startTime: new Date(),
      },
      create: {
        userId,
        examId,
        status: "IN_PROGRESS",
        startTime: new Date(),
      },
    });

    return NextResponse.json(attempt);
  } catch (error) {
    console.error("[EXAM_START]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
