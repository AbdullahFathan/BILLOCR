# Architecture

## Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand (Client-side draft state with localStorage persist middleware)
- **OCR Engine**: Mistral OCR API (`mistral-ocr-latest`) — server-side via `/api/ocr` Route Handler
- **Rate Limiting**: Upstash Redis (`@upstash/ratelimit`) — 5 uploads per IP per 24 hours, enforced at Edge via `middleware.ts`
- **Deployment**: Vercel

---

## Folder Structure

```
├── .agents/               # Agent-specific skills and configs
├── context/               # Core project context (architecture, tokens, plan)
├── public/                # Static assets (tesseract language training data if offline)
├── src/
│   ├── app/               # Next.js App Router pages
│   │   ├── globals.css    # Tailwind v4 entry and global theme variables
│   │   ├── layout.tsx     # Root layout with font and metadata configuration
│   │   └── page.tsx       # Main OCR upload and Split Bill dashboard
│   ├── components/        # Reusable presentation and interactive UI components
│   │   ├── ui/            # Shadcn/primitive UI components
│   │   └── custom/        # Application-specific components (OCR scanner, bill cards)
│   ├── hooks/             # Custom React hooks (e.g., useReceiptStore)
│   ├── lib/               # Utility functions and parser helpers
│   │   └── parser.ts      # Regex parsing engine
│   └── types/             # Shared TypeScript interfaces
```

---

## System Boundaries

```mermaid
graph TD
    subgraph Client [Client-Side Browser]
        UI[User Interface / React]
        Canvas[Canvas API - Compress Image]
        State[Zustand Store - Bill & Splits State]
        LS[(Local Storage)]
    end

    subgraph Edge [Next.js Edge - middleware.ts]
        RL[Upstash Redis - Rate Limit 5/24h]
    end

    subgraph Server [Next.js Server - /api/ocr]
        Route[Route Handler]
    end

    subgraph External [External APIs]
        Mistral[Mistral OCR API]
        Upstash[(Upstash Redis)]
    end

    subgraph Parser [Parser Utilities]
        Regex[Regex Parser Engine]
    end

    UI -->|1. Load Image| Canvas
    Canvas -->|2. Convert to base64| Route
    Route -->|3. Check IP limit| RL
    RL -->|4. Allow / Block| Route
    RL <-->|Redis HTTP| Upstash
    Route -->|5. Send base64| Mistral
    Mistral -->|6. OCR Markdown text| Route
    Route -->|7. Raw text| Regex
    Regex -->|8. Structured JSON| State
    State <-->|9. Synchronize| LS
    State -->|10. Generate Recap| UI
```

---

## Invariants

Rules the AI agent must never violate:

- **API Key Security**: `MISTRAL_API_KEY`, `UPSTASH_REDIS_REST_URL`, and `UPSTASH_REDIS_REST_TOKEN` must never be committed to the repository or exposed to the client bundle. Always read from `process.env` on the server.
- **OCR is Server-Side**: Never call Mistral SDK or any external OCR API from a Client Component. OCR must go through `/api/ocr` (Route Handler).
- **Rate Limit at Edge**: The Upstash `Ratelimit` instance must live in `middleware.ts` only — not in the Route Handler.
- **100% Client-Side Calculations**: All bill computations, subtotal, and tax allocations must run entirely in browser state.
- **LocalStorage 2-Hour TTL**: Persisted draft state must expire and clear automatically if the saved timestamp is older than 2 hours.
- **Upload Reset Rule**: Uploading a new image must immediately clear all existing data in `localStorage` before parsing the new receipt.
- **UI Constraint**: Do not build a "Clear" or "Reset" button in the UI; the state is managed automatically via the expiration timer and new image uploads.
- **No raw color classes**: Do not use hardcoded hex values or raw Tailwind color classes (e.g. `bg-[#1e293b]`). Use custom-defined design tokens (mapped via Tailwind `@theme` to CSS variables defined in `globals.css` / `ui-tokens.md`).
