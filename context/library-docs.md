# Library Documentation & Guidelines

This document details integration patterns and rules for third-party libraries installed or planned in the workspace.

## 1. Mistral OCR (Server-Side)

All OCR is now processed server-side via the Mistral OCR API using model `mistral-ocr-latest`.
The helper is located at `src/lib/mistralOCR.ts`.

### Key Rules
- **Server-only**: `extractTextFromImage` must only be called from server-side code (Route Handler or Server Action). Never call the Mistral SDK from a Client Component.
- **API Key**: Always reads from `process.env.MISTRAL_API_KEY`. Never hardcode or expose the key.
- **Output format**: Mistral returns a `pages` array. Always join them with `\n` to produce one raw text block for the parser.

### Pattern (`src/lib/mistralOCR.ts`)

```typescript
import { Mistral } from '@mistralai/mistralai';

export async function extractTextFromImage(
  base64: string,
  mimeType: string
): Promise<string> {
  const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY! });
  const response = await client.ocr.process({
    model: 'mistral-ocr-latest',
    document: {
      type: 'image_url',
      imageUrl: `data:${mimeType};base64,${base64}`,
    },
  });
  return response.pages.map(p => p.markdown).join('\n');
}
```

---

## 2. Upstash Redis Rate Limiting (OCR Route Handlers)

Rate limiting is enforced in the **Node.js Route Handlers** using `@upstash/ratelimit`.
It blocks users who exceed **5 OCR uploads per 24 hours**, identified by IP address.

Consume (`limit`) and peek (`getRemaining`) must share the same runtime and `clientIp()` so the Redis key matches after refresh.

### Key Rules
- **Consume in POST /api/ocr**: Call `ratelimit.limit(ip)` in `src/app/api/ocr/route.ts` before Mistral. Return `remainingUploads` + `reset` from that result — never invent a fallback like `4`.
- **Quota peek in GET /api/ocr/quota**: Call `ratelimit.getRemaining(ip)` — reads Redis without spending a scan.
- **Shared helper**: Instantiation lives in `src/lib/ratelimit.ts` only. Do not call `limit()` from Client Components.
- **Algorithm**: Use `Ratelimit.slidingWindow(5, '24 h')` — more accurate than fixed window at period boundaries.
- **Prefix**: Always use `'billocr:ocr_upload'` as the key prefix to namespace keys in Redis.
- **No Edge consume**: Do not call `limit()` from middleware — Edge vs Node IP headers can diverge and break the Scan counter after refresh.

### Pattern (`src/lib/ratelimit.ts` + route handlers)

```typescript
import { clientIp, ratelimit } from '@/lib/ratelimit';

// POST /api/ocr — consume one token
const ip = clientIp(request);
const { success, limit, remaining, reset } = await ratelimit.limit(ip);

if (!success) {
  return NextResponse.json(
    { success: false, error: 'RATE_LIMIT_EXCEEDED', reset, remaining: 0 },
    { status: 429 },
  );
}

// success body includes the real remaining from Redis
return NextResponse.json({
  success: true,
  data: { text, remainingUploads: remaining, reset },
});
```

```typescript
// GET /api/ocr/quota — peek only
const { remaining, reset, limit } = await ratelimit.getRemaining(ip);
return NextResponse.json({
  success: true,
  data: { remainingUploads: remaining, reset, limit },
});
```

### Client persistence
After each successful OCR, 429, and `API_ERROR` (token already consumed), the client stores `{ remaining, reset }` in `localStorage` (`aura_split_scan_quota`) via a shared `applyQuota` helper. Mount peek from `GET /api/ocr/quota` is race-safe: a `quotaEpoch` bumps on OCR-driven writes so stale peeks are ignored; peeks also skip while a scan is in flight and re-run when scanning ends. On local reset expiry, clear cache and re-peek Redis — never assume remaining is back to 5.
---

## 3. Upstash Redis Environment Variables

Required in `.env.local` (and Vercel Environment Variables for production):

```
MISTRAL_API_KEY=your_mistral_key
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token
```

`Redis.fromEnv()` automatically reads `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.

---

## 2. Zustand State Store (with 2-Hour TTL Local Storage Persist)

We persist state to `localStorage` with a custom 2-hour Time-to-Live (TTL). When the store hydrates, it checks the timestamp. If the data is older than 2 hours, it resets. 

### Hydration & Expiration Pattern (`src/hooks/useReceiptStore.ts`)

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ReceiptState {
  rawText: string;
  items: Array<{ id: string; name: string; qty: number; price: number }>;
  diners: string[];
  assignments: Record<string, Record<string, number>>; // itemId -> { dinerName -> quantity }
  savedAt: number | null; // Timestamp of save
  
  // Actions
  setRawText: (text: string) => void;
  setItems: (items: any[]) => void;
  addDiner: (name: string) => void;
  removeDiner: (name: string) => void;
  assignItem: (itemId: string, dinerName: string, qty: number) => void;
  resetStore: () => void;
  checkExpiration: () => void;
}

const TTL_MS = 2 * 60 * 60 * 1000; // 2 Hours

export const useReceiptStore = create<ReceiptState>()(
  persist(
    (set, get) => ({
      rawText: '',
      items: [],
      diners: [],
      assignments: {},
      savedAt: null,
      
      setRawText: (text) => set({ rawText: text, savedAt: Date.now() }),
      setItems: (items) => set({ items, savedAt: Date.now() }),
      addDiner: (name) => set((state) => ({ diners: [...state.diners, name], savedAt: Date.now() })),
      removeDiner: (name) => set((state) => ({ diners: state.diners.filter(d => d !== name), savedAt: Date.now() })),
      assignItem: (itemId, dinerName, qty) => set((state) => ({
        assignments: {
          ...state.assignments,
          [itemId]: {
            ...(state.assignments[itemId] || {}),
            [dinerName]: qty
          }
        },
        savedAt: Date.now()
      })),
      resetStore: () => set({ rawText: '', items: [], diners: [], assignments: {}, savedAt: null }),
      checkExpiration: () => {
        const { savedAt } = get();
        if (savedAt && Date.now() - savedAt > TTL_MS) {
          get().resetStore();
        }
      }
    }),
    {
      name: 'split-bill-ocr-store',
      onRehydrateStorage: () => (state) => {
        // Run expiration check automatically after loading from localStorage
        if (state) {
          state.checkExpiration();
        }
      }
    }
  )
);
```

### Upload Image Reset Rule
When a user uploads a new image, the store must clear all previous diner names, receipt items, and assignments before loading the newly parsed items:

```typescript
// Example image upload handler in FileUploader component
const handleNewImageUpload = async (imageFile: File) => {
  const store = useReceiptStore.getState();
  
  // Rule 2: Uploading a new image clears all existing local storage data
  store.resetStore();
  
  // Proceed with Canvas compression and Tesseract parsing...
};
```

---

## 3. Lucide React (Icons)

- Always import icons directly from `lucide-react` (e.g. `import { Camera, Plus, Minus, Copy, RefreshCw } from 'lucide-react'`).
- Use standard sizing attributes: `<Camera className="w-5 h-5" />` (usually `w-4 h-4` or `w-5 h-5`).
