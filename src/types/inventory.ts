export type ItemCategory = "General" | "Beverages" | "Snacks" | "Household" | "Personal Care";

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
