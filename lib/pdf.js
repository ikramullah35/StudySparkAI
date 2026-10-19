import "server-only";

import { PDFParse } from "pdf-parse";
import { tidyText } from "./text";

// Extracts text from a PDF. Works for TEXT-BASED PDFs.
//
// LIMITATION: scanned/image-only PDFs are not supported (no OCR). When a PDF
// has no selectable text the caller receives an empty string and should show a
// clear message to the student.
export async function extractPdfText(buffer) {
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    const text = tidyText(result?.text || "");
    return {
      text,
      pages: result?.total || result?.pages?.length || 0,
      characters: text.length,
    };
  } catch (error) {
    const name = error?.name || "";
    const message = String(error?.message || "");

    if (name === "PasswordException" || /password/i.test(message)) {
      const err = new Error(
        "This PDF is password-protected. Please remove the password and upload it again."
      );
      err.code = "PASSWORD";
      throw err;
    }
    if (name === "InvalidPDFException" || /invalid pdf/i.test(message)) {
      const err = new Error(
        "This file is not a valid PDF, or it is corrupted. Please upload a different PDF."
      );
      err.code = "INVALID";
      throw err;
    }

    const err = new Error(
      "We could not read this PDF. It may be corrupted or use an unsupported format."
    );
    err.code = "PARSE_FAILED";
    throw err;
  } finally {
    // Always free the PDF.js worker memory.
    await parser.destroy().catch(() => {});
  }
}
