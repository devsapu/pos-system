import { createItem, deleteItem, getItems, hasApiUrl, updateItem } from "@/services/api";
import { inventoryMockDb } from "@/services/mock-db";
import { InventoryItem, InventoryItemInput } from "@/types/inventory";

const withFallback = async <T>(liveCall: () => Promise<T>, mockCall: () => Promise<T>): Promise<T> => {
  if (!hasApiUrl()) return mockCall();
  try {
    return await liveCall();
  } catch {
    return mockCall();
  }
};

export const inventoryService = {
  listItems(): Promise<InventoryItem[]> {
    return withFallback(() => getItems(), () => inventoryMockDb.listItems());
  },
  createItem(payload: InventoryItemInput): Promise<InventoryItem> {
    return withFallback(() => createItem(payload), () => inventoryMockDb.createItem(payload));
  },
  updateItem(id: string, payload: InventoryItemInput): Promise<InventoryItem> {
    return withFallback(() => updateItem(id, payload), () => inventoryMockDb.updateItem(id, payload));
  },
  deleteItem(id: string): Promise<void> {
    return withFallback(() => deleteItem(id), () => inventoryMockDb.deleteItem(id));
  },
  isLowStock(quantity: number): boolean {
    return inventoryMockDb.isLowStock(quantity);
  },
};
