import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { source_code, language_id = 105, stdin = "" } = await request.json();

    const isSelfHosted = process.env.JUDGE0_USE_SELF_HOSTED === "true";
    const selfHostedUrl = process.env.JUDGE0_URL;
    const apiKey = process.env.JUDGE0_API_KEY;

    const baseUrl = isSelfHosted 
      ? selfHostedUrl 
      : "https://judge0-ce.p.rapidapi.com";

    if (!isSelfHosted && !apiKey) {
      return NextResponse.json({ 
        error: "Judge0 API Key missing.",
        status: { id: 6, description: "Compilation Error" } 
      }, { status: 500 });
    }

    // Sanitize stdin: Remove carriage returns and enforce strict Unix newlines
    const cleanStdin = stdin.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    const b64_source = Buffer.from(source_code, 'utf8').toString('base64');
    const b64_stdin = Buffer.from(cleanStdin, 'utf8').toString('base64');

    const url = `${baseUrl}/submissions?base64_encoded=true&wait=true`;
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (!isSelfHosted) {
      headers["x-rapidapi-key"] = apiKey as string;
      headers["x-rapidapi-host"] = "judge0-ce.p.rapidapi.com";
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
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

