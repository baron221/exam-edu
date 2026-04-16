import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { source_code, language_id = 54, stdin = "" } = await request.json();

    if (!process.env.JUDGE0_API_KEY) {
      return NextResponse.json({ 
        error: "Judge0 API Key missing.",
        status: { id: 6, description: "Compilation Error" } 
      }, { status: 500 });
    }

    const response = await fetch("https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true", {
      method: "POST",
      headers: {
        "x-rapidapi-key": process.env.JUDGE0_API_KEY,
        "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ source_code, language_id, stdin }),
    });

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[JUDGE0_ERROR]", error);
    return NextResponse.json({ error: "Code execution failed" }, { status: 500 });
  }
}
