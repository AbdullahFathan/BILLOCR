# Split Bill OCR

Web app that turns a restaurant receipt photo into a fair bill split. Upload a receipt, extract items via OCR, assign portions to diners, and copy a formatted recap to share in your group chat.

Draft state lives in the browser (`localStorage`, 2-hour TTL). OCR runs server-side through the Mistral OCR API, with rate limiting at the Edge.

## Features

- **Receipt upload** — drag-and-drop or camera capture; image is compressed in-browser before OCR
- **Server-side OCR** — Mistral OCR (`mistral-ocr-latest`) via `/api/ocr`
- **Rate limiting** — 5 uploads per IP per 24 hours (Upstash Redis, Edge middleware)
- **Receipt parsing** — regex engine for Indonesian/English restaurant receipts (items, PB1/tax, service charge)
- **Interactive split** — add diners, allocate quantities, share items evenly
- **Proportional fees** — tax and service charged by each person's food subtotal
- **Local drafts** — Zustand + `localStorage` persist; auto-clears after 2 hours or on new upload
- **Copy recap** — formatted text summary for messaging apps

## Tech Stack

| Layer | Tech |
| :--- | :--- |
| Framework | Next.js 16 (App Router) + TypeScript |
| UI | Tailwind CSS v4, Shadcn UI, Lucide icons |
| State | Zustand (`persist` → `localStorage`) |
| OCR | Mistral OCR API |
| Rate limit | Upstash Redis (`@upstash/ratelimit`) |
| Deploy | Vercel |

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) 1.0+
- A [Mistral API](https://console.mistral.ai/) key
- An [Upstash Redis](https://upstash.com/) database (REST URL + token)

### Setup

```bash
bun install
```

Create `.env.local` in the project root:

```env
MISTRAL_API_KEY=your_mistral_key
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token
```

Never commit these values. They are read only on the server / Edge — never exposed to the client bundle.

### Run

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command | Description |
| :--- | :--- |
| `bun run dev` | Development server |
| `bun run build` | Production build |
| `bun run start` | Serve production build |
| `bun run lint` | ESLint |

## How It Works

1. User selects a receipt image (compressed with Canvas API).
2. Client POSTs base64 to `/api/ocr`.
3. Edge middleware checks the IP against Upstash (5 / 24h); blocked requests return `429`.
4. Route handler calls Mistral OCR and returns raw text.
5. Client parser builds structured items + fees.
6. User assigns items to diners; totals update live.
7. Draft syncs to `localStorage`. User copies the recap when done.

Uploading a new receipt clears the previous draft automatically. There is no manual reset button.

## Project Structure

```
src/
├── app/
│   ├── api/ocr/route.ts   # OCR Route Handler
│   ├── page.tsx           # Main upload + split UI
│   └── globals.css        # Theme tokens (Aura Split)
├── components/
│   ├── custom/            # App components (uploader, scanner, rows, summary)
│   └── ui/                # Shadcn primitives
├── hooks/                 # Zustand receipt store
├── lib/                   # Mistral helper, parser, utilities
└── types/                 # Shared TypeScript types
middleware.ts              # Upstash rate limit (Edge)
context/                   # Product & architecture docs for agents
```

## Privacy & Limits

- Receipt images are sent only to the OCR API for text extraction; bill math and drafts stay on the device.
- Draft data expires after **2 hours**.
- OCR uploads are limited to **5 per IP per 24 hours**.

## Deploy on Vercel

1. Push the repo and import it in [Vercel](https://vercel.com/new).
2. Set the same env vars as `.env.local` in the project settings.
3. Deploy.

## License

Private — all rights reserved.
