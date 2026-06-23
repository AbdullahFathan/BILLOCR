export interface ReceiptItem {
  id: string;
  name: string;
  qty: number;
  price: number;
}

export interface ReceiptState {
  rawText: string;
  items: ReceiptItem[];
  diners: string[];
  assignments: Record<string, Record<string, number>>; // itemId -> { dinerName -> quantity }
  tax: number;
  serviceCharge: number;
  savedAt: number | null; // Timestamp of save
  
  // Actions
  setRawText: (text: string) => void;
  setItems: (items: ReceiptItem[]) => void;
  updateItem: (id: string, updates: Partial<Omit<ReceiptItem, "id">>) => void;
  addItem: (item: Omit<ReceiptItem, "id">) => void;
  deleteItem: (id: string) => void;
  addDiner: (name: string) => void;
  removeDiner: (name: string) => void;
  assignItem: (itemId: string, dinerName: string, qty: number) => void;
  setTax: (tax: number) => void;
  setServiceCharge: (charge: number) => void;
  resetStore: () => void;
  checkExpiration: () => void;
}
