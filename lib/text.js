// Small text helpers used by the summarizer and the PDF route.

// Rough character budget for a single AI request. Gemini 2.5 Flash has a large
// context window, but splitting keeps requests fast and predictable.
export const CHUNK_SIZE = 12000;
export const MAX_INPUT_CHARS = 120000;

// Splits long text into chunks on paragraph / sentence boundaries so we do not
// cut sentences in half. `overlap` repeats a little text to keep context.
export function chunkText(text, size = CHUNK_SIZE, overlap = 500) {
  const clean = String(text || "").trim();
  if (clean.length <= size) return [clean];

  const chunks = [];
  let start = 0;

  while (start < clean.length) {
    let end = Math.min(start + size, clean.length);

    // Try to end on a paragraph or sentence boundary.
    if (end < clean.length) {
      const slice = clean.slice(start, end);
      const breakAt = Math.max(slice.lastIndexOf("\n\n"), slice.lastIndexOf(". "));
      if (breakAt > size * 0.5) {
        end = start + breakAt + 1;
      }
    }

    chunks.push(clean.slice(start, end).trim());
    if (end >= clean.length) break;
    start = Math.max(end - overlap, end); // move forward, keeping a small overlap
  }

  return chunks.filter(Boolean);
}

// Collapses repeated blank lines and trims odd whitespace from extracted PDFs.
export function tidyText(text) {
  return String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// First ~120 characters, used for note previews.
export function makePreview(text, length = 140) {
  const flat = String(text || "").replace(/\s+/g, " ").trim();
  return flat.length > length ? flat.slice(0, length) + "..." : flat;
}
