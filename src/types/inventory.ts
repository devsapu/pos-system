export type ItemCategory =
  | "Engine Oil"
  | "Brake System"
  | "Filters"
  | "Tyres"
  | "Electrical"
  | "General";

export interface InventoryItem {
  id: string;
  name: string;
  brand: string;
  category: ItemCategory;
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
  vendorId?: string;
}

export interface InventoryItemInput {
  name: string;
  brand: string;
  category: ItemCategory;
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
  vendorId?: string;
}
