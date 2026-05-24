# Digital Note Card

A mobile-friendly Progressive Web App for capturing handwritten reading
notecards, converting them to digital text with OCR, organising them by book,
searching across them, and exporting to PDF, Markdown, or CSV.

A companion to physical notecards — not a replacement.

> Made by [North Chapter](https://northchapter.co). _Read with direction._

## Features

- **Library** — your books in a grid with covers, sorted by most recently
  updated.
- **Capture flow** — photograph the front (and optionally back) of a notecard,
  run OCR, auto-detect card type from the header, and review/edit the extracted
  text into structured fields before saving.
- **Six card types** — Chapter Tracker, Quote Tracker, Character Tracker,
  Vocabulary Tracker, Reading Notes, and General Notes. Each type has its own
  set of structured fields; reading notes and general notes support rich text.
- **Book detail** — cards grouped by type with section headers, with the
  original photo retained for every card.
- **Search** — full-text search across all your notes with filters by book,
  tag, and card type.
- **Export** — branded PDF, Markdown, or CSV (vocabulary only).
- **PWA** — installable to your home screen with a manual service worker.

Extras layered on top of the spec: book tags, AI-generated book summaries
(Claude Haiku), flashcards review mode, OCR cleanup pass, write-a-note flow.

## Tech stack

- **Next.js 16** with Turbopack and the App Router
- **React 19** + **TypeScript**
- **Tailwind CSS v4** — brand colours defined in `@theme` (no `tailwind.config.ts`)
- **Supabase** — auth, Postgres with RLS, and Storage for images
- **Google Cloud Vision** (with **Tesseract.js** fallback) for OCR
- **Anthropic Claude Haiku** (optional) for OCR cleanup and book summaries
- **TipTap** for the rich-text editor
- **jsPDF** for PDF export

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Supabase

Create a [Supabase](https://supabase.com) project, then:

1. In the SQL editor, run each file in `supabase/migrations/` in order
   (`001_initial.sql`, `002_add_tags.sql`, `003_add_book_tags.sql`).
2. In Storage, create two **public** buckets: `book-covers` and `card-images`.
3. Apply the storage policies that are commented at the bottom of
   `001_initial.sql`.

### 3. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in:

| Key | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Supabase anon key |
| `GOOGLE_CLOUD_VISION_API_KEY` | no | Better handwriting OCR — falls back to Tesseract.js if unset |
| `ANTHROPIC_API_KEY` | no | Enables Claude OCR cleanup and AI book summaries |

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app redirects to
`/login` if you're not signed in.

## Project structure

```
src/
├── app/
│   ├── (app)/         — authenticated routes (library, books, cards, search, settings)
│   ├── (auth)/        — login, signup, password reset
│   ├── api/           — books, cards, OCR, OCR cleanup, book summary
│   ├── layout.tsx
│   └── page.tsx       — redirects to /library
├── components/
│   ├── books/         — book card, grid, form
│   ├── cards/
│   │   ├── capture/   — multi-step capture flow (camera → type → OCR review)
│   │   └── editors/   — one editor per card_type
│   ├── export/        — export modal
│   ├── layout/        — BottomNav, ServiceWorkerInit
│   └── ui/            — primitives (Button, Input, Modal, RichTextEditor, etc.)
├── lib/
│   ├── export/        — pdf.ts, markdown.ts, csv.ts
│   ├── ocr/           — abstraction layer over GCV + Tesseract
│   └── supabase/      — client/server/api helpers
├── proxy.ts           — Next.js 16 middleware (note: must be named `proxy`, not `middleware`)
└── types/             — CardType, content schemas, DB types
```

## Notes for development

- **Next.js 16 middleware** is now in `src/proxy.ts` and the exported function
  must be named `proxy` (not `middleware`).
- **Turbopack is default** — avoid webpack-based plugins like `next-pwa`. The
  PWA uses a manual service worker at `public/sw.js` registered by
  `components/layout/ServiceWorkerInit.tsx`.
- **Tailwind v4** — brand colours live in `src/app/globals.css` inside the
  `@theme` block (e.g. `--color-nc-green: #2f4638`). There is no
  `tailwind.config.ts`.
- **OCR provider** is decided server-side: if `GOOGLE_CLOUD_VISION_API_KEY` is
  set, `/api/ocr` uses GCV. Otherwise the client falls back to Tesseract.js.
- **Card content** is stored as `JSONB`. Schema varies by `card_type` — see
  `src/types/cards.ts` for the per-type interfaces and
  `parseOcrIntoContent()` for the OCR → structured-field mapping.

## Branding

- Charcoal `#1c1c1c` for text
- Warm white `#fffff0` for backgrounds
- Dark green `#2f4638` for accents and headers
- Soft gold `#d1b217` for sparing highlights
- Light grey `#cfcfcf` for borders and dividers
- Surface `#f5f3ed` for card backgrounds
- Typography: Inter

## License

Private — © North Chapter.
