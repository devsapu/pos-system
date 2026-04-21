import { createSale, hasApiUrl } from "@/services/api";
import { inventoryMockDb } from "@/services/mock-db";
import { SaleInput, SaleRecord } from "@/types/sales";

const withFallback = async <T>(liveCall: () => Promise<T>, mockCall: () => Promise<T>): Promise<T> => {
  if (!hasApiUrl()) return mockCall();
  try {
    return await liveCall();
  } catch {
    return mockCall();
  }
};

export const salesService = {
  createSale(lines: SaleInput[]): Promise<{ transactionId: string; total: number; totalProfit: number }> {
    return withFallback(() => createSale(lines), () => inventoryMockDb.createSale(lines));
  },
  listSales(): Promise<SaleRecord[]> {
    return inventoryMockDb.listSales();
  },
};
