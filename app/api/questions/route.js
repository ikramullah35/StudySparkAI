import { Type } from "@google/genai";
import { errorResponse, json, readJson, requireUser } from "@/lib/api";
import { friendlyAiError, generateStructured, isGeminiConfigured } from "@/lib/gemini";
import { buildQuestionsPrompt, QUESTIONS_SYSTEM_INSTRUCTION } from "@/lib/prompts";
import { tidyText } from "@/lib/text";
import { formatZodError, questionsSchema } from "@/lib/validation";

export const runtime = "nodejs";

// Shape of the JSON we ask Gemini to return.
const responseSchema = {
  type: Type.OBJECT,
  properties: {
    mcqs: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          correctIndex: { type: Type.INTEGER },
          explanation: { type: Type.STRING },
        },
        required: ["question", "options", "correctIndex", "explanation"],
      },
    },
    shortAnswers: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          answer: { type: Type.STRING },
        },
        required: ["question", "answer"],
      },
    },
  },
  required: ["mcqs", "shortAnswers"],
};

// POST /api/questions
// Body: { title, sourceText, difficulty, mcqCount, shortAnswerCount }
export async function POST(request) {
  const auth = await requireUser(request, { key: "questions", limit: 15, windowMs: 60_000 });
  if (auth.error) return auth.error;

  if (!isGeminiConfigured()) {
    return errorResponse(
      "The AI is not configured. Add GEMINI_API_KEY to your .env.local file (see README).",
      503
    );
  }

  const body = await readJson(request);
  const parsed = questionsSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(formatZodError(parsed.error), 400);
  }

  const { title, difficulty, mcqCount, shortAnswerCount } = parsed.data;
  const text = tidyText(parsed.data.sourceText);

  // Keep requests within a safe size; questions do not need the whole document.
  const limited = text.slice(0, 40000);

  try {
    const data = await generateStructured({
      systemInstruction: QUESTIONS_SYSTEM_INSTRUCTION,
      prompt: buildQuestionsPrompt({
        title,
        difficulty,
        mcqCount,
        shortAnswerCount,
        text: limited,
      }),
      schema: responseSchema,
    });

    // Light validation so the UI can trust the shape.
    const mcqs = Array.isArray(data.mcqs) ? data.mcqs : [];
    const shortAnswers = Array.isArray(data.shortAnswers) ? data.shortAnswers : [];

    if (mcqs.length === 0 && shortAnswers.length === 0) {
      return errorResponse(
        "The AI could not create questions from this material. Try adding more detail.",
        422
      );
    }

    return json({ questions: { mcqs, shortAnswers }, meta: { difficulty } });
  } catch (error) {
    const friendly = friendlyAiError(error);
    return errorResponse(friendly.message, friendly.status);
  }
}
