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

    // Sanitize stdin: Remove carriage returns and ensure clean UTF-8
    const cleanStdin = stdin.replace(/\r/g, '').trim();

    const b64_source = Buffer.from(source_code, 'utf8').toString('base64');
    const b64_stdin = Buffer.from(cleanStdin, 'utf8').toString('base64');

    const response = await fetch("https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=true&wait=true", {
      method: "POST",
      headers: {
        "x-rapidapi-key": process.env.JUDGE0_API_KEY,
        "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        source_code: b64_source, 
        language_id, 
        stdin: b64_stdin 
      }),
    });

    const result = await response.json();
    
    // Detailed logging for development
    console.log('JUDGE0_RESPONSE:', {
        status: result.status?.description,
        time: result.time,
        memory: result.memory
    });

    if (!response.ok) {
        return NextResponse.json({ 
            error: "Execution environment reached a critical error.",
            details: result.message || "Unknown API error"
        }, { status: response.status });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[JUDGE0_CRITICAL_FAIL]", error);
    return NextResponse.json({ 
        error: "Kernel execution failed.",
        message: error.message || "Network disruption occurred."
    }, { status: 500 });
  }
}

