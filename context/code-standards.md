# Code Standards & Conventions

To maintain a clean, readable, and highly maintainable codebase, all contributions must adhere to the following architectural and code quality guidelines.

## 1. Next.js 16 & React Guidelines

### Server vs Client Components
- **Client Components (`"use client"`)**: Use only for interactive UI components containing event handlers (e.g. inputs, sliders, click events) and state hooks (Zustand). Keep client components as small and presentation-focused as possible.
- **Server Components (Default)**: Keep page layouts, static elements, and data loaders as Server Components to minimize the javascript bundle sent to the browser.

### Next.js Server Actions (`"use server"`)
- Place all server-side functions (e.g., receipt parsing, database creation) in dedicated actions.
- Server Actions must return a structured API envelope rather than throwing raw errors to the client:
  ```typescript
  export type ActionResponse<T> =
    | { success: true; data: T }
    | { success: false; error: string };
  ```
- All Server Actions must implement robust validation and run within `try-catch` blocks.

---

## 2. TypeScript Type Safety

- **No Implicit `any`**: Explicitly type all variables, function arguments, state hooks, and component props.
- **Shared Domain Models**: Maintain domain interfaces in `src/types/index.ts` to ensure consistency between parser output, state management, and Prisma database models.
- **Prisma Generated Types**: Import types generated from the Prisma client (e.g. `Receipt`, `ReceiptItem` from `@prisma/client`) for database operations.

---

## 3. Zustand State Management

- Centralize UI client state (active diners, assigned items, receipt details, OCR status) inside a single Zustand store at `src/hooks/useReceiptStore.ts`.
- Mutate state strictly via predefined actions defined inside the store rather than manual state overrides inside components.
- Do not store database IDs in transient client state unless they are already persisted. Use temporary unique strings (e.g. via `crypto.randomUUID()`) for unsaved items.

---

## 4. Error Handling and Resiliency

- **Graceful OCR Fallback**: If the Regex engine fails to parse structural parameters of a receipt, output a helpful error toast but load the OCR text output into a manual editable raw textarea so users can adjust/input items manually.
- **Prisma Connection Safety**: Ensure database connections are recycled correctly using a single instance helper (`src/lib/db.ts`) to avoid connection exhaustion in a serverless ecosystem.
- **User Validation**: Ensure calculations check for overflow boundaries (e.g., you cannot assign a cumulative quantity of `1.5` to a receipt item that has a total quantity of `1.0`).
