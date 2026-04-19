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

    const p = await params;
    const attemptId = p.id;
    const { message } = await request.json();

    if (!message) {
        return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const attempt = await prisma.examAttempt.update({
        where: { id: attemptId },
        data: {
            isAppealed: true,
            appealMessage: message,
            appealStatus: 'PENDING'
        }
    });

    return NextResponse.json({ success: true, attempt });
  } catch (error) {
    console.error("[APPEAL_ERROR]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
