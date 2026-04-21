"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { inventoryService } from "@/services/inventory-service";
import { salesService } from "@/services/sales-service";
import { InventoryItem } from "@/types/inventory";

interface CartLine {
  itemId: string;
  itemName: string;
  sellingPrice: number;
  purchasePrice: number;
  quantity: number;
  maxQty: number;
}

export default function SalesPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      const data = await inventoryService.listItems();
      setItems(data);
      setLoading(false);
    };
    void load();
  }, []);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      [item.id, item.name, item.brand, item.category].join(" ").toLowerCase().includes(q),
    );
  }, [items, query]);

  const cartTotals = useMemo(
    () =>
      cart.reduce(
        (acc, line) => {
          acc.items += line.quantity;
          acc.total += line.sellingPrice * line.quantity;
          acc.profit += (line.sellingPrice - line.purchasePrice) * line.quantity;
          return acc;
        },
        { items: 0, total: 0, profit: 0 },
      ),
    [cart],
  );

  const addToCart = (item: InventoryItem) => {
    if (item.quantity < 1) return;
    setCart((prev) => {
      const existing = prev.find((line) => line.itemId === item.id);
      if (existing) {
        if (existing.quantity >= existing.maxQty) {
          return prev;
        }
        return prev.map((line) =>
          line.itemId === item.id ? { ...line, quantity: line.quantity + 1 } : line,
        );
      }
      return [
        ...prev,
        {
          itemId: item.id,
          itemName: item.name,
          sellingPrice: item.sellingPrice,
          purchasePrice: item.purchasePrice,
          quantity: 1,
          maxQty: item.quantity,
        },
      ];
    });
    setMessage("");
  };

  const updateQty = (itemId: string, nextQty: number) => {
    setCart((prev) =>
      prev
        .map((line) => {
          if (line.itemId !== itemId) return line;
          const safeQty = Math.max(0, Math.min(line.maxQty, nextQty));
          return { ...line, quantity: safeQty };
        })
        .filter((line) => line.quantity > 0),
    );
  };

  const removeLine = (itemId: string) => {
    setCart((prev) => prev.filter((line) => line.itemId !== itemId));
  };

  const refreshInventory = async () => {
    const data = await inventoryService.listItems();
    setItems(data);
  };

  const confirmSale = async () => {
    if (cart.length === 0) return;
    try {
      setSubmitting(true);
      const result = await salesService.createSale(
        cart.map((line) => ({ itemId: line.itemId, quantity: line.quantity })),
      );
      await refreshInventory();
      setCart([]);
      setMessage(
        `Sale confirmed (${result.transactionId}). Total ${result.total.toFixed(2)} | Profit ${result.totalProfit.toFixed(2)}`,
      );
      searchInputRef.current?.focus();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to confirm sale";
      setMessage(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Sales - Item Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute left-2 top-2 h-5 w-5 text-zinc-400" />
            <Input
              ref={searchInputRef}
              autoFocus
              className="pl-9"
              placeholder="Search item and press Enter to add first result"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && filteredItems[0]) {
                  addToCart(filteredItems[0]);
                }
              }}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left">
                  <th className="py-2">Item</th>
                  <th className="py-2">Brand</th>
                  <th className="py-2">Stock</th>
                  <th className="py-2">Price</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-2 text-zinc-500">
                      Loading items...
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-2 text-zinc-500">
                      No items found
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="border-b border-zinc-100">
                      <td className="py-2">{item.name}</td>
                      <td className="py-2">{item.brand}</td>
                      <td className="py-2">{item.quantity}</td>
                      <td className="py-2">{item.sellingPrice.toFixed(2)}</td>
                      <td className="py-2">
                        <Button
                          size="sm"
                          onClick={() => addToCart(item)}
                          disabled={item.quantity <= 0}
                          title={item.quantity <= 0 ? "Out of stock" : "Add to cart"}
                        >
                          Add
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing Cart</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            {cart.length === 0 ? (
              <p className="text-sm text-zinc-500">Cart is empty.</p>
            ) : (
              cart.map((line) => (
                <div key={line.itemId} className="rounded-md border border-zinc-200 p-2">
                  <div className="mb-1 flex items-center justify-between">
                    <p className="text-sm font-medium">{line.itemName}</p>
                    <Button size="sm" variant="ghost" onClick={() => removeLine(line.itemId)}>
                      Remove
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => updateQty(line.itemId, line.quantity - 1)}>
                      -
                    </Button>
                    <Input
                      type="number"
                      min={1}
                      max={line.maxQty}
                      value={line.quantity}
                      onChange={(e) => updateQty(line.itemId, Number(e.target.value))}
                      className="h-8 w-20 text-center"
                    />
                    <Button size="sm" variant="outline" onClick={() => updateQty(line.itemId, line.quantity + 1)}>
                      +
                    </Button>
                    <span className="ml-auto text-sm">{(line.sellingPrice * line.quantity).toFixed(2)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-1 rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm">
            <p>Total Items: {cartTotals.items}</p>
            <p>Total Amount: {cartTotals.total.toFixed(2)}</p>
            <p>Estimated Profit: {cartTotals.profit.toFixed(2)}</p>
          </div>

          <Button className="w-full" onClick={() => void confirmSale()} disabled={submitting || cart.length === 0}>
            {submitting ? "Processing..." : "Confirm Sale"}
          </Button>

          {message ? <p className="text-xs text-zinc-600">{message}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
