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
3. For CODING: Provide a clear problem statement, a language (usually 'cpp'), and starter code.
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
      "starterCode": "int main() { ... }"
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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const fullPrompt = `${SYSTEM_PROMPT}\n\nUser Request: Generate ${count} questions about: ${prompt}\n\nJSON Response:`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean up potential markdown formatting from AI
    const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const data = JSON.parse(jsonStr);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[AI_GEN_ERROR]", error);
    return NextResponse.json({ error: "Failed to generate questions.", details: error.message }, { status: 500 });
  }
}
