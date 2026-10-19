# StudySpark AI — AI Student Summarizer

StudySpark AI is a study assistant for university and college students. Upload a
lecture PDF or paste your notes, and it generates clear summaries, key concepts,
definitions, exam revision notes, multiple-choice questions and short-answer
questions — then saves everything to your account.

## Features

- **AI summaries** in four styles (Simple English, Detailed Notes, Exam
  Revision, Bullet Points) and three lengths (Short, Medium, Detailed).
- **PDF upload** with server-side validation, text extraction and automatic
  chunking for long documents.
- **Exam question generator** with MCQs (four options, correct answer and
  explanation), short-answer questions, difficulty levels and an interactive
  quiz mode with scoring.
- **Accounts** with Supabase Auth (email + password), protected pages and
  sessions.
- **Saved notes** stored in Supabase PostgreSQL, with search, type filters,
  title editing and delete confirmation.
- **Polished, responsive UI** with a sidebar, mobile navigation, loading states,
  empty states and toast notifications.

## Tech stack

| Layer      | Technology                                  |
| ---------- | ------------------------------------------- |
| Framework  | Next.js 16 (App Router) + React 19          |
| Language   | JavaScript (no TypeScript)                  |
| Styling    | Tailwind CSS v4                             |
| AI         | Google Gemini via `@google/genai`           |
| Database   | Supabase PostgreSQL (Row Level Security)    |
| Auth       | Supabase Auth (`@supabase/ssr`)             |
| PDF        | `pdf-parse`                                 |
| Deployment | Vercel-compatible                            |

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Create your environment file

Copy `.env.example` to `.env.local` and fill it in:

```bash
cp .env.example .env.local
```

```env
GEMINI_API_KEY=your_gemini_key
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

- **Gemini key:** https://aistudio.google.com/app/apikey
- **Supabase keys:** Dashboard → Project Settings → API. If your project shows a
  **publishable** key instead of **anon**, use
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — the app supports both names.

> The app still boots without keys and shows a friendly setup screen, but AI
> features and login only work once the keys are present.

### 3. Set up the database

In the Supabase **SQL Editor**, run the contents of
[`supabase/schema.sql`](./supabase/schema.sql). This creates the `notes` table,
the Row Level Security policies and an `updated_at` trigger.

### 4. (Optional) Turn off email confirmation for local testing

Supabase → Authentication → Providers → Email. Disable "Confirm email" if you
want to log in immediately after sign-up.

### 5. Run the app

```bash
npm run dev
```

Open http://localhost:3000.

## Project structure

```
app/
  page.jsx                 Landing page
  layout.jsx               Root layout (fonts, toasts)
  (auth)/                  Login and sign-up pages
  (app)/                   Protected area (sidebar shell)
    dashboard/             Overview + recent notes
    create/                Summary workflow
    questions/             Question generator + quiz
    notes/                 Saved notes list and detail
    settings/              Account + setup guide
  api/                     Route Handlers (summarize, questions, extract-pdf, notes)
  auth/                    Sign-out and email-callback routes
components/                Reusable UI (AppShell, Markdown, QuestionList, toasts…)
lib/                       Server logic (gemini, prompts, pdf, validation, api helpers)
utils/supabase/            Supabase browser/server clients + session refresh
proxy.js                   Session refresh + route protection (Next 16 "proxy")
supabase/schema.sql        Database schema + RLS policies
```

## API endpoints

| Method            | Path                 | Purpose                              |
| ----------------- | -------------------- | ------------------------------------ |
| `POST`            | `/api/summarize`     | Generate a summary                   |
| `POST`            | `/api/questions`     | Generate MCQs + short answers        |
| `POST`            | `/api/extract-pdf`   | Extract text from an uploaded PDF    |
| `GET` / `POST`    | `/api/notes`         | List / create saved notes            |
| `GET`/`PATCH`/`DELETE` | `/api/notes/:id` | Read / edit / delete a note          |

All endpoints require a valid session, validate input on the server, and derive
the user id from the verified session (never from the browser).

## Security notes

- The Gemini API key is **server-only**. It is never sent to the browser.
- Supabase Row Level Security guarantees students can only access their own rows.
- Uploads are validated by type, size and the `%PDF` file signature.
- A small in-memory rate limiter protects the AI endpoints (replace with a shared
  store such as Upstash for multi-instance production).

## Known limitations

- **Scanned/image-only PDFs are not supported** — there is no OCR. The app detects
  this and shows a clear message. Use a text-based PDF or paste your notes.
- Very long documents are summarised in parts and then merged, so a small amount
  of detail can be lost.
- The in-memory rate limiter resets on restart and is per-instance.

## Deploying to Vercel

1. Push the project to GitHub and import it into Vercel.
2. Add the same environment variables in Vercel → Project → Settings →
   Environment Variables.
3. Add your Vercel domain to Supabase → Authentication → URL Configuration
   (Site URL and Redirect URLs, e.g. `https://your-app.vercel.app/auth/callback`).
4. Deploy.
