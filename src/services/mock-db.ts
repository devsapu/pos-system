import { InventoryItem, InventoryItemInput } from "@/types/inventory";
import { SaleInput, SaleRecord } from "@/types/sales";

const lowStockThreshold = 10;

let items: InventoryItem[] = [
  {
    id: "ITM-1001",
    name: "4T Engine Oil 1L",
    brand: "Bajaj Genuine",
    category: "Engine Oil",
    purchasePrice: 2450,
    sellingPrice: 2850,
    quantity: 22,
  },
  {
    id: "ITM-1002",
    name: "Front Brake Pad Set",
    brand: "Bajaj",
    category: "Brake System",
    purchasePrice: 1350,
    sellingPrice: 1750,
    quantity: 9,
  },
  {
    id: "ITM-1003",
    name: "Air Filter",
    brand: "TVS",
    category: "Filters",
    purchasePrice: 780,
    sellingPrice: 1050,
    quantity: 14,
  },
  {
    id: "ITM-1004",
    name: "Tubeless Tyre 90/90-12",
    brand: "MRF",
    category: "Tyres",
    purchasePrice: 6900,
    sellingPrice: 7900,
    quantity: 4,
  },
];

let sales: SaleRecord[] = [];

const sleep = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

const createItemId = (): string => `ITM-${Math.floor(1000 + Math.random() * 9000)}`;
const createTransactionId = (): string => `TXN-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

export const inventoryMockDb = {
  async listItems(): Promise<InventoryItem[]> {
    await sleep();
    return [...items];
  },
  async createItem(payload: InventoryItemInput): Promise<InventoryItem> {
    await sleep();
    const item: InventoryItem = { id: createItemId(), ...payload };
    items = [item, ...items];
    return item;
  },
  async updateItem(id: string, payload: InventoryItemInput): Promise<InventoryItem> {
    await sleep();
    const index = items.findIndex((item) => item.id === id);
    if (index < 0) {
      throw new Error("Item not found");
    }
    const updated = { ...items[index], ...payload };
    items[index] = updated;
    return updated;
  },
  async deleteItem(id: string): Promise<void> {
    await sleep();
    items = items.filter((item) => item.id !== id);
  },
  isLowStock(quantity: number): boolean {
    return quantity <= lowStockThreshold;
  },
  async createSale(lines: SaleInput[]): Promise<{ transactionId: string; total: number; totalProfit: number }> {
    await sleep();
    if (lines.length === 0) {
      throw new Error("Cart is empty");
    }

    const currentItems = [...items];
    const newSales: SaleRecord[] = [];
    let total = 0;
    let totalProfit = 0;
    const transactionId = createTransactionId();

    for (const line of lines) {
      const itemIndex = currentItems.findIndex((item) => item.id === line.itemId);
      if (itemIndex < 0) {
        throw new Error("Item not found");
      }

      const item = currentItems[itemIndex];
      if (line.quantity <= 0) {
        throw new Error("Quantity must be more than zero");
      }
      if (item.quantity < line.quantity) {
        throw new Error(`Insufficient stock for ${item.name}`);
      }

      const profit = (item.sellingPrice - item.purchasePrice) * line.quantity;
      total += item.sellingPrice * line.quantity;
      totalProfit += profit;
      currentItems[itemIndex] = { ...item, quantity: item.quantity - line.quantity };

      newSales.push({
        transactionId,
        itemId: item.id,
        itemName: item.name,
        quantity: line.quantity,
        sellingPrice: item.sellingPrice,
        purchasePrice: item.purchasePrice,
        profit,
        createdAt: new Date().toISOString(),
      });
    }

    items = currentItems;
    sales = [...newSales, ...sales];
    return { transactionId, total, totalProfit };
  },
  async listSales(): Promise<SaleRecord[]> {
    await sleep();
    return [...sales];
  },
};
