# Library Documentation & Guidelines

This document details integration patterns and rules for third-party libraries installed or planned in the workspace.

## 1. Tesseract.js (Client-Side OCR)

To avoid slowing down initial page loads, load `tesseract.js` dynamically.

### Dynamic Worker Lifecycle Pattern
- Create the worker on demand when the user selects a receipt file.
- Always clean up the worker (`await worker.terminate()`) inside a `finally` block to prevent browser memory leaks.

```typescript
import { createWorker } from 'tesseract.js';

export async function processOCR(imageSrc: string, onProgress: (p: number) => void) {
  // Use createWorker from tesseract.js
  const worker = await createWorker('ind+eng'); // load Indonesian and English training data
  
  try {
    const { data: { text } } = await worker.recognize(imageSrc);
    return text;
  } finally {
    await worker.terminate();
  }
}
```

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
