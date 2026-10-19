"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, RotateCcw, XCircle } from "lucide-react";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

// Renders MCQ and short-answer questions. MCQs are interactive: click an answer
// to see whether you were right, with a running score.
export default function QuestionList({ mcqs = [], shortAnswers = [] }) {
  const [answers, setAnswers] = useState({}); // mcqIndex -> chosen option
  const [revealed, setRevealed] = useState({}); // shortIndex -> true

  const answeredCount = Object.keys(answers).length;
  const correctCount = useMemo(
    () => mcqs.reduce((total, q, i) => total + (answers[i] === q.correctIndex ? 1 : 0), 0),
    [answers, mcqs]
  );

  function choose(qIndex, optIndex) {
    // Lock the answer once chosen so the score stays meaningful.
    setAnswers((prev) => (prev[qIndex] === undefined ? { ...prev, [qIndex]: optIndex } : prev));
  }

  function reset() {
    setAnswers({});
    setRevealed({});
  }

  return (
    <div className="space-y-8">
      {mcqs.length > 0 && (
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">
              Multiple-choice questions
            </h2>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-slate-500">
                Score:{" "}
                <strong className="text-slate-900">
                  {correctCount}/{mcqs.length}
                </strong>{" "}
                ({answeredCount} answered)
              </span>
              {(answeredCount > 0 || Object.keys(revealed).length > 0) && (
                <button onClick={reset} className="btn-ghost px-2 py-1 text-xs">
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset
                </button>
              )}
            </div>
          </div>

          <ol className="space-y-4">
            {mcqs.map((q, qIndex) => {
              const chosen = answers[qIndex];
              const isAnswered = chosen !== undefined;
              return (
                <li key={qIndex} className="card p-5">
                  <p className="font-medium text-slate-900">
                    <span className="mr-2 text-indigo-600">{qIndex + 1}.</span>
                    {q.question}
                  </p>

                  <div className="mt-3 space-y-2">
                    {(q.options || []).map((opt, optIndex) => {
                      const isCorrect = optIndex === q.correctIndex;
                      const isChosen = chosen === optIndex;

                      let style = "border-slate-200 hover:border-indigo-300";
                      if (isAnswered && isCorrect) style = "border-emerald-400 bg-emerald-50";
                      else if (isAnswered && isChosen) style = "border-rose-400 bg-rose-50";

                      return (
                        <button
                          key={optIndex}
                          onClick={() => choose(qIndex, optIndex)}
                          disabled={isAnswered}
                          className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm transition disabled:cursor-default ${style}`}
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-300 text-xs font-semibold text-slate-600">
                            {LETTERS[optIndex]}
                          </span>
                          <span className="flex-1 text-slate-700">{opt}</span>
                          {isAnswered && isCorrect && (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          )}
                          {isAnswered && isChosen && !isCorrect && (
                            <XCircle className="h-4 w-4 text-rose-500" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {isAnswered && q.explanation && (
                    <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                      <strong className="text-slate-800">Why: </strong>
                      {q.explanation}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {shortAnswers.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Short-answer questions</h2>
          <ol className="space-y-4">
            {shortAnswers.map((q, index) => (
              <li key={index} className="card p-5">
                <p className="font-medium text-slate-900">
                  <span className="mr-2 text-emerald-600">{index + 1}.</span>
                  {q.question}
                </p>
                <div className="mt-3">
                  {revealed[index] ? (
                    <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">
                      {q.answer}
                    </p>
                  ) : (
                    <button
                      onClick={() => setRevealed((prev) => ({ ...prev, [index]: true }))}
                      className="btn-secondary text-xs"
                    >
                      Show answer
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
