import { errorResponse, json, requireUser } from "@/lib/api";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_MB } from "@/lib/config";
import { extractPdfText } from "@/lib/pdf";

export const runtime = "nodejs";

// POST /api/extract-pdf  (multipart/form-data with a `file` field)
export async function POST(request) {
  const auth = await requireUser(request, { key: "extract", limit: 20, windowMs: 60_000 });
  if (auth.error) return auth.error;

  // Reject oversized uploads early using the Content-Length header.
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength && contentLength > MAX_UPLOAD_BYTES + 1_000_000) {
    return errorResponse(`That file is too large. The limit is ${MAX_UPLOAD_MB} MB.`, 413);
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse("We could not read the upload. Please try again.", 400);
  }

  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return errorResponse("No PDF file was uploaded.", 400);
  }

  const fileName = file.name || "upload.pdf";
  const looksLikePdf = file.type === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");
  if (!looksLikePdf) {
    return errorResponse("Only PDF files are supported.", 415);
  }

  if (file.size === 0) {
    return errorResponse("That file is empty.", 400);
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return errorResponse(`That file is too large. The limit is ${MAX_UPLOAD_MB} MB.`, 413);
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Verify the PDF signature ("%PDF") so renamed files are rejected.
  if (buffer.subarray(0, 5).toString("latin1") !== "%PDF-") {
    return errorResponse("That file is not a valid PDF.", 415);
  }

  try {
    const { text, pages, characters } = await extractPdfText(buffer);

    if (!text || characters < 20) {
      return errorResponse(
        "No selectable text was found. This looks like a scanned PDF — scanned documents are not supported yet. Try a text-based PDF or paste your notes instead.",
        422
      );
    }

    return json({
      text,
      pages,
      characters,
      fileName,
      note: "Scanned/image-only PDFs are not supported (no OCR).",
    });
  } catch (error) {
    return errorResponse(error.message || "We could not read this PDF.", 422);
  }
}
