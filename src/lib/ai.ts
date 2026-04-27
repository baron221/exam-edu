import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export interface AIReviewResult {
  score: number; // 0 to 100 percentage based on logic
  feedback: string; // Summary in Uzbek
}

export async function evaluateCodeWithAI(
  sourceCode: string,
  questionText: string,
  testCaseResults: string
): Promise<AIReviewResult> {
  if (!apiKey) {
    return { score: 0, feedback: "AI API Key is missing. Manual review required." };
  }

  if (!sourceCode || !sourceCode.trim()) {
    return { score: 0, feedback: "Javob yozilmagan." };
  }

  const prompt = `
    Siz dasturlash bo'yicha ekspert va imtihon tekshiruvchisisiz. 
    Talaba quyidagi masalani ishladi:
    
    MASALA: "${questionText}"
    
    TALABA YOZGAN KOD:
    \`\`\`cpp
    ${sourceCode}
    \`\`\`
    
    TEST NATIJALARI (Unit Tests):
    ${testCaseResults}
    
    Sizning vazifangiz:
    1. Kodning mantiqiy to'g'riligini tekshiring (hatto testlar xato bo'lsa ham, mantiq to'g'ri bo'lishi mumkin).
    2. Kod sifatini (o'zgaruvchilar nomi, ortiqcha kodlar yo'qligi) baholang.
    3. Kodga 0 dan 100 gacha bo'lgan foizda (score) baho bering.
    4. O'zbek tilida qisqa va lo'nda xulosa (feedback) yozing.
    
    FAQAT quyidagi formatdagi JSON qaytaring:
    {
      "score": number,
      "feedback": "string"
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    console.log("[AI_RAW_RESPONSE]", text);

    // Extract JSON from the response (Gemini often adds markdown blocks like ```json ... ```)
    let jsonStr = text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    try {
      const parsed = JSON.parse(jsonStr);
      return {
        score: typeof parsed.score === 'number' ? parsed.score : 0,
        feedback: (parsed.feedback || "Tahlil yakunlandi.").replace(/[`*#]/g, '').trim()
      };
    } catch (parseError) {
      console.error("[AI_PARSE_ERROR]", parseError, "Raw text:", text);
      return { score: 0, feedback: "AI tahlilida format xatoligi yuz berdi. Iltimos qayta urinib ko'ring." };
    }
  } catch (error) {
    console.error("[AI_EVAL_ERROR]", error);
    return { score: 0, feedback: "AI tahlilida xatolik yuz berdi. (Network or API error)" };
  }
}
