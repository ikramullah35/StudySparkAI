import { z } from "zod";
import { MAX_INPUT_CHARS } from "./text";

// All user input is validated on the server with these schemas.
// Never trust data coming from the browser.

const styleValues = ["simple", "detailed", "exam", "bullet"];
const lengthValues = ["short", "medium", "detailed"];
const difficultyValues = ["easy", "medium", "hard"];

const sourceText = z
  .string()
  .trim()
  .min(20, { message: "Please provide at least a short amount of study material (20+ characters)." })
  .max(MAX_INPUT_CHARS, { message: `Study material is too long. Please keep it under ${MAX_INPUT_CHARS} characters.` });

const title = z
  .string()
  .trim()
  .max(200, { message: "The title is too long (max 200 characters)." })
  .optional()
  .default("");

export const summarizeSchema = z.object({
  title,
  sourceText,
  style: z.enum(styleValues).default("simple"),
  length: z.enum(lengthValues).default("medium"),
});

export const questionsSchema = z.object({
  title,
  sourceText,
  difficulty: z.enum(difficultyValues).default("medium"),
  mcqCount: z.coerce.number().int().min(1).max(15).default(5),
  shortAnswerCount: z.coerce.number().int().min(0).max(10).default(3),
});

export const createNoteSchema = z.object({
  title: z.string().trim().min(1, { message: "A title is required." }).max(200),
  contentType: z.enum(["summary", "questions"]),
  sourceText: z.string().max(MAX_INPUT_CHARS).optional().default(""),
  content: z.string().min(1, { message: "There is nothing to save." }),
});

export const updateNoteSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
});

// Turns a Zod error into a single readable message for the UI.
export function formatZodError(error) {
  const first = error?.issues?.[0];
  return first?.message || "Some of the information you entered is not valid.";
}
