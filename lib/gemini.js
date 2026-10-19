import "server-only";

import { GoogleGenAI } from "@google/genai";

// The Gemini API key must only ever live on the server.
// Read it from the GEMINI_API_KEY environment variable and never send it to
// the browser.

let cachedClient = null;

export function isGeminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

function getModel() {
  return process.env.GEMINI_MODEL || "gemini-3.5-flash";
}

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const err = new Error(
      "The Gemini API key is missing. Add GEMINI_API_KEY to your .env.local file."
    );
    err.code = "NO_API_KEY";
    throw err;
  }
  if (!cachedClient) {
    cachedClient = new GoogleGenAI({ apiKey });
  }
  return cachedClient;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Calls Gemini and retries a couple of times on transient/rate-limit errors.
async function callModel({ contents, config, retries = 3 }) {
  const ai = getClient();
  let lastError;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await ai.models.generateContent({
        model: getModel(),
        contents,
        config,
      });
    } catch (error) {
      lastError = error;
      const status = error?.status || error?.code;
      const retryable = status === 429 || (typeof status === "number" && status >= 500);
      if (!retryable || attempt === retries - 1) break;
      // Exponential backoff: 1s, 2s, 4s...
      await sleep(1000 * 2 ** attempt);
    }
  }

  throw lastError;
}

// Turns SDK errors into short, user-friendly messages.
export function friendlyAiError(error) {
  const status = error?.status || error?.code;
  const message = String(error?.message || "");

  if (error?.code === "NO_API_KEY") {
    return { status: 500, message: error.message };
  }
  if (status === 429 || /quota|rate limit|resource_exhausted/i.test(message)) {
    return {
      status: 429,
      message: "The AI service is busy or out of quota right now. Please try again shortly.",
    };
  }
  if (status === 400 || /api key not valid|invalid api key|permission/i.test(message)) {
    return {
      status: 502,
      message: "The AI service rejected the request. Check that GEMINI_API_KEY is valid.",
    };
  }
  if (status === 403) {
    return { status: 502, message: "Your Gemini API key does not have permission for this model." };
  }
  return {
    status: 502,
    message: "The AI service could not generate a response. Please try again.",
  };
}

// Generates plain text (used for summaries; the model returns Markdown).
export async function generateSummary({ systemInstruction, prompt }) {
  const response = await callModel({
    contents: prompt,
    config: {
      systemInstruction,
      temperature: 0.4,
    },
  });

  const text = response.text;
  if (!text || !text.trim()) {
    const blocked = response.promptFeedback?.blockReason;
    throw new Error(
      blocked
        ? `The request was blocked by the AI safety filter (${blocked}).`
        : "The AI returned an empty response."
    );
  }
  return text.trim();
}

// Generates structured JSON (used for quizzes).
export async function generateStructured({ systemInstruction, prompt, schema }) {
  const response = await callModel({
    contents: prompt,
    config: {
      systemInstruction,
      temperature: 0.4,
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });

  const text = response.text;
  if (!text || !text.trim()) {
    const blocked = response.promptFeedback?.blockReason;
    throw new Error(
      blocked
        ? `The request was blocked by the AI safety filter (${blocked}).`
        : "The AI returned an empty response."
    );
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("The AI returned data that could not be read. Please try again.");
  }
}
