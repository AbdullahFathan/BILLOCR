import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ReceiptState } from '@/types';

const TTL_MS = 2 * 60 * 60 * 1000; // 2 Hours in milliseconds

export const useReceiptStore = create<ReceiptState>()(
  persist(
    (set, get) => ({
      rawText: '',
      items: [],
      diners: [],
      assignments: {},
      tax: 0,
      serviceCharge: 0,
      savedAt: null,

      setRawText: (text) => set({ rawText: text, savedAt: Date.now() }),
      
      setItems: (items) => set({ items, savedAt: Date.now() }),

      updateItem: (id, updates) => set((state) => ({
        items: state.items.map((item) =>
          item.id === id ? { ...item, ...updates } : item
        ),
        savedAt: Date.now()
      })),

      addItem: (item) => set((state) => ({
        items: [
          ...state.items,
          {
            id: typeof crypto !== "undefined" && crypto.randomUUID
              ? crypto.randomUUID()
              : Math.random().toString(36).substring(2, 9),
            ...item
          }
        ],
        savedAt: Date.now()
      })),

      deleteItem: (id) => set((state) => {
        const updatedAssignments = { ...state.assignments };
        delete updatedAssignments[id];
        return {
          items: state.items.filter((item) => item.id !== id),
          assignments: updatedAssignments,
          savedAt: Date.now()
        };
      }),
      
      addDiner: (name) => set((state) => {
        // Prevent duplicate diner names
        if (state.diners.includes(name)) return {};
        return {
          diners: [...state.diners, name],
          savedAt: Date.now()
        };
      }),
      
      removeDiner: (name) => set((state) => {
        const updatedDiners = state.diners.filter((d) => d !== name);
        
        // Clean up assignments for the removed diner to avoid orphaned state
        const updatedAssignments = { ...state.assignments };
        for (const itemId in updatedAssignments) {
          if (updatedAssignments[itemId] && updatedAssignments[itemId][name] !== undefined) {
            const { [name]: _, ...remainingAssignments } = updatedAssignments[itemId];
            updatedAssignments[itemId] = remainingAssignments;
          }
        }
        
        return {
          diners: updatedDiners,
          assignments: updatedAssignments,
          savedAt: Date.now()
        };
      }),
      
      assignItem: (itemId, dinerName, qty) => set((state) => {
        const itemAssignments = { ...(state.assignments[itemId] || {}) };
        
        if (qty <= 0) {
          delete itemAssignments[dinerName];
        } else {
          itemAssignments[dinerName] = qty;
        }
        
        return {
          assignments: {
            ...state.assignments,
            [itemId]: itemAssignments
          },
          savedAt: Date.now()
        };
      }),
      
      setTax: (tax) => set({ tax, savedAt: Date.now() }),
      
      setServiceCharge: (serviceCharge) => set({ serviceCharge, savedAt: Date.now() }),
      
      resetStore: () => set({
        rawText: '',
        items: [],
        diners: [],
        assignments: {},
        tax: 0,
        serviceCharge: 0,
        savedAt: null
      }),
      
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
        if (state) {
          state.checkExpiration();
        }
      }
    }
  )
);
