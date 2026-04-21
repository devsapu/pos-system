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
  const url = new URL(ensureApiUrl());
  url.searchParams.set("action", action);

  const response = await fetch(url.toString(), {
    method: body ? "POST" : "GET",
    // Avoid JSON content-type to prevent Apps Script CORS preflight failures.
    // Apps Script can still parse JSON from e.postData.contents.
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
  return requestJson<InventoryItem[]>("getItems");
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
