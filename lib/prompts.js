// Prompt builders. These keep the model grounded in the student's own notes and
// stop it from inventing facts.

const STYLE_INSTRUCTIONS = {
  simple:
    "Write in simple, plain English that a first-year student can understand. Short sentences. Explain any unavoidable technical term.",
  detailed:
    "Write thorough, well-organised study notes with clear headings and sub-headings. Include definitions and, where helpful, examples.",
  exam:
    "Write focused exam-revision notes: the most important facts, definitions and formulas a student must memorise, arranged so they are easy to revise.",
  bullet:
    "Write the summary mainly as concise bullet points grouped under headings. Keep each bullet to one idea.",
};

const LENGTH_INSTRUCTIONS = {
  short: "Keep the whole summary under about 250 words.",
  medium: "Aim for roughly 400-600 words.",
  detailed: "Be comprehensive; use as much space as the material needs.",
};

export const SUMMARY_SYSTEM_INSTRUCTION = [
  "You are StudySpark AI, a careful university study assistant.",
  "You help students turn lecture material into clear study notes.",
  "Rules you must always follow:",
  "1. Only use facts that are present in the study material provided by the student.",
  "2. Never invent facts, statistics, dates, or citations.",
  "3. If the material is too short or does not contain enough information for a section, say so plainly instead of guessing.",
  "4. Use Markdown formatting with headings, bullet points and, when useful, a small table.",
  "5. Be encouraging and clear, but do not add filler or unrelated content.",
].join("\n");

export function buildSummaryPrompt({ title, style, length, text }) {
  const styleRule = STYLE_INSTRUCTIONS[style] || STYLE_INSTRUCTIONS.simple;
  const lengthRule = LENGTH_INSTRUCTIONS[length] || LENGTH_INSTRUCTIONS.medium;

  return [
    `Study material title: ${title || "Untitled lecture"}`,
    "",
    `Summary style: ${styleRule}`,
    `Summary length: ${lengthRule}`,
    "",
    "Produce the notes with these sections where the material supports them:",
    "- A short overview",
    "- Key concepts (with simple definitions)",
    "- Important points to remember",
    "- Definitions of key terms",
    "- A short 'before the exam' recap",
    "",
    "If a section has no supporting information in the material, briefly state that instead of inventing content.",
    "",
    "--- STUDY MATERIAL START ---",
    text,
    "--- STUDY MATERIAL END ---",
  ].join("\n");
}

export const QUESTIONS_SYSTEM_INSTRUCTION = [
  "You are StudySpark AI, an expert exam-question writer for university students.",
  "Rules you must always follow:",
  "1. Only create questions whose answers can be found in the study material provided.",
  "2. Never invent facts that are not in the material.",
  "3. Each multiple-choice question must have exactly four options and one correct answer.",
  "4. Keep the wording clear and free of trick questions.",
  "5. Match the requested difficulty level.",
].join("\n");

export function buildQuestionsPrompt({ title, difficulty, mcqCount, shortAnswerCount, text }) {
  return [
    `Study material title: ${title || "Untitled lecture"}`,
    `Difficulty: ${difficulty}`,
    `Multiple-choice questions to create: ${mcqCount}`,
    `Short-answer questions to create: ${shortAnswerCount}`,
    "",
    "Create the questions strictly from the study material below.",
    "For every multiple-choice question include a short explanation of why the answer is correct.",
    "For every short-answer question provide a concise model answer.",
    "",
    "--- STUDY MATERIAL START ---",
    text,
    "--- STUDY MATERIAL END ---",
  ].join("\n");
}

// Used when a long document is summarised in several parts and then combined.
export const COMBINE_SYSTEM_INSTRUCTION = [
  "You are StudySpark AI. You are given several partial summaries of one long document,",
  "in order. Merge them into a single coherent, well-structured summary in Markdown.",
  "Do not invent content. Remove duplication and keep the most important points.",
].join("\n");

export function buildCombinePrompt({ title, style, partials }) {
  const styleRule = STYLE_INSTRUCTIONS[style] || STYLE_INSTRUCTIONS.simple;
  return [
    `Document title: ${title || "Untitled lecture"}`,
    `Style: ${styleRule}`,
    "",
    "Here are the ordered partial summaries:",
    ...partials.map((p, i) => `\n### Part ${i + 1}\n${p}`),
    "",
    "Now produce one merged summary with clear headings.",
  ].join("\n");
}
