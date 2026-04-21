import { InventoryItem, InventoryItemInput } from "@/types/inventory";
import { ReportSummary } from "@/types/reports";
import { SaleInput } from "@/types/sales";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.trim();

const ensureApiUrl = (): string => {
  if (!API_URL) {
    throw new Error("Missing NEXT_PUBLIC_API_URL.");
  }
  return API_URL;
};

async function requestJson<T>(action: string, body?: unknown): Promise<T> {
  ensureApiUrl();
  const url = `/api/gas?action=${encodeURIComponent(action)}`;

  const response = await fetch(url, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify({ action, ...body }) : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`API request failed (${response.status})`);
  }

  return (await response.json()) as T;
}

export function hasApiUrl(): boolean {
  return Boolean(API_URL);
}

export async function getItems(): Promise<InventoryItem[]> {
  const response = await requestJson<InventoryItem[] | { data?: InventoryItem[]; [key: string]: unknown }>("getItems");

  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response.data)) {
    return response.data;
  }

  // Backward compatibility for legacy Apps Script shape:
  // { "0": {...}, "1": {...}, "statusCode": 200 }
  const indexedRows = Object.keys(response)
    .filter((key) => /^\d+$/.test(key))
    .sort((a, b) => Number(a) - Number(b))
    .map((key) => response[key] as InventoryItem);

  return indexedRows;
}

export async function createItem(payload: InventoryItemInput): Promise<InventoryItem> {
  const response = await requestJson<{ ok: boolean; item: InventoryItem; message?: string }>("createItem", payload);
  if (!response.ok) throw new Error(response.message || "Failed to create item");
  return response.item;
}

export async function updateItem(id: string, payload: InventoryItemInput): Promise<InventoryItem> {
  const response = await requestJson<{ ok: boolean; item: InventoryItem; message?: string }>("updateItem", {
    id,
    ...payload,
  });
  if (!response.ok) throw new Error(response.message || "Failed to update item");
  return response.item;
}

export async function deleteItem(id: string): Promise<void> {
  const response = await requestJson<{ ok: boolean; message?: string }>("deleteItem", { id });
  if (!response.ok) throw new Error(response.message || "Failed to delete item");
}

export async function createSale(lines: SaleInput[]): Promise<{ transactionId: string; total: number; totalProfit: number }> {
  const response = await requestJson<{
    ok: boolean;
    transactionId: string;
    total: number;
    totalProfit: number;
    message?: string;
  }>("createSale", { lines });
  if (!response.ok) throw new Error(response.message || "Failed to create sale");
  return {
    transactionId: response.transactionId,
    total: response.total,
    totalProfit: response.totalProfit,
  };
}

export async function getDailyReport(): Promise<ReportSummary> {
  return requestJson<ReportSummary>("getDailyReport");
}

export async function getMonthlyReport(): Promise<ReportSummary> {
  return requestJson<ReportSummary>("getMonthlyReport");
}
