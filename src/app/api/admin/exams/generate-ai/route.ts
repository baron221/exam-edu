import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT = `
You are an expert exam creator for a university level computer science department. 
Your task is to generate exam questions in a strict JSON format based on the user's topic or context.

Rules:
1. Generate MCQ (Multiple Choice) or CODING questions.
2. For MCQ: Provide exactly 4 options. Specify which one is correct.
3. For CODING (CRITICAL): 
   - Provide a clear problem statement in "text".
   - Set "language" (default 'cpp').
   - Provide "starterCode" which MUST be a boilerplate skeleton ONLY (e.g. #include, main function and maybe variable declarations).
   - DO NOT EVER include the logic, algorithm, or solution in "starterCode".
   - Generate exactly 3 "testCases". Each test case must have an "input" (string) and "expected_output" (string).
4. Language support: You can generate questions in English, Russian, or Uzbek if requested.
5. Return ONLY a JSON object with this structure:
{
  "questions": [
    {
      "text": "The question content",
      "type": "MCQ",
      "points": 1,
      "options": [
        { "text": "Option A", "isCorrect": true },
        { "text": "Option B", "isCorrect": false },
        { "text": "Option C", "isCorrect": false },
        { "text": "Option D", "isCorrect": false }
      ]
    },
    {
      "text": "Problem description for coding",
      "type": "CODING",
      "points": 5,
      "language": "cpp",
      "starterCode": "#include <iostream>\nusing namespace std;\n\nint main() {\n  // Your code here\n  return 0;\n}",
      "testCases": [
        { "input": "input1", "expected_output": "output1" },
        { "input": "input2", "expected_output": "output2" }
      ]
    }
  ]
}
`;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'teacher') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { prompt, count = 3 } = await req.json();

    if (!process.env.GOOGLE_AI_API_KEY) {
      return NextResponse.json({ error: "Google AI API Key missing in environment." }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const fullPrompt = `${SYSTEM_PROMPT}\n\nUser Request: Generate ${count} questions about: ${prompt}\n\nPlease return strictly JSON.`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();
    
    // Hardened JSON extraction: handle ```json ... ``` blocks
    let jsonContent = text;
    if (text.includes("```json")) {
      jsonContent = text.split("```json")[1].split("```")[0];
    } else if (text.includes("```")) {
      jsonContent = text.split("```")[1].split("```")[0];
    }
    
    const startIdx = jsonContent.indexOf('{');
    const endIdx = jsonContent.lastIndexOf('}');
    
    if (startIdx === -1 || endIdx === -1) {
      console.error("[AI_PARSE_ERROR] No valid JSON found", text);
      return NextResponse.json({ error: "AI returned invalid format. Please try again." }, { status: 500 });
    }

    const finalJson = jsonContent.substring(startIdx, endIdx + 1);
    
    try {
      const data = JSON.parse(finalJson);
      return NextResponse.json(data);
    } catch (parseErr: any) {
      console.error("[AI_JSON_PARSE_FAILED]", parseErr.message, "Cleaned JSON:", finalJson);
      return NextResponse.json({ error: "Failed to parse AI output. Please try again." }, { status: 500 });
    }
  } catch (error: any) {
    console.error("[AI_GEN_ERROR]", error);
    return NextResponse.json({ error: "Critical AI Engine Failure", details: error.message }, { status: 500 });
  }
}
