import { errorResponse, json, readJson, requireUser } from "@/lib/api";
import { generateSummary, friendlyAiError, isGeminiConfigured } from "@/lib/gemini";
import {
  buildCombinePrompt,
  buildSummaryPrompt,
  COMBINE_SYSTEM_INSTRUCTION,
  SUMMARY_SYSTEM_INSTRUCTION,
} from "@/lib/prompts";
import { chunkText, tidyText } from "@/lib/text";
import { formatZodError, summarizeSchema } from "@/lib/validation";

export const runtime = "nodejs";

// POST /api/summarize
// Body: { title, sourceText, style, length }
export async function POST(request) {
  const auth = await requireUser(request, { key: "summarize", limit: 15, windowMs: 60_000 });
  if (auth.error) return auth.error;

  if (!isGeminiConfigured()) {
    return errorResponse(
      "The AI is not configured. Add GEMINI_API_KEY to your .env.local file (see README).",
      503
    );
  }

  const body = await readJson(request);
  const parsed = summarizeSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(formatZodError(parsed.error), 400);
  }

  const { title, style, length } = parsed.data;
  const text = tidyText(parsed.data.sourceText);

  try {
    const chunks = chunkText(text);

    // Short documents: a single request.
    if (chunks.length === 1) {
      const summary = await generateSummary({
        systemInstruction: SUMMARY_SYSTEM_INSTRUCTION,
        prompt: buildSummaryPrompt({ title, style, length, text: chunks[0] }),
      });
      return json({ summary, meta: { mode: "single", chunks: 1, characters: text.length } });
    }

    // Long documents: summarise each part, then merge them into one summary.
    const partials = [];
    for (const chunk of chunks) {
      const part = await generateSummary({
        systemInstruction: SUMMARY_SYSTEM_INSTRUCTION,
        prompt: buildSummaryPrompt({ title, style, length: "short", text: chunk }),
      });
      partials.push(part);
    }

    const summary = await generateSummary({
      systemInstruction: COMBINE_SYSTEM_INSTRUCTION,
      prompt: buildCombinePrompt({ title, style, partials }),
    });

    return json({
      summary,
      meta: { mode: "chunked", chunks: chunks.length, characters: text.length },
    });
  } catch (error) {
    const friendly = friendlyAiError(error);
    return errorResponse(friendly.message, friendly.status);
  }
}
