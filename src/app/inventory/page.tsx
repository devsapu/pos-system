"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { inventoryService } from "@/services/inventory-service";
import { InventoryItem, InventoryItemInput, ItemCategory } from "@/types/inventory";

const categories: ItemCategory[] = ["General", "Beverages", "Snacks", "Household", "Personal Care"];

const initialForm: InventoryItemInput = {
  name: "",
  brand: "",
  category: "General",
  purchasePrice: 0,
  sellingPrice: 0,
  quantity: 0,
};

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<InventoryItemInput>(initialForm);

  useEffect(() => {
    const load = async () => {
      const data = await inventoryService.listItems();
      setItems(data);
      setLoading(false);
    };
    void load();
  }, []);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      [item.name, item.brand, item.category, item.id].join(" ").toLowerCase().includes(q),
    );
  }, [items, search]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.brand.trim()) {
      return;
    }

    if (editingId) {
      const updated = await inventoryService.updateItem(editingId, form);
      setItems((prev) => prev.map((item) => (item.id === editingId ? updated : item)));
    } else {
      const created = await inventoryService.createItem(form);
      setItems((prev) => [created, ...prev]);
    }
    resetForm();
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      brand: item.brand,
      category: item.category,
      purchasePrice: item.purchasePrice,
      sellingPrice: item.sellingPrice,
      quantity: item.quantity,
      vendorId: item.vendorId,
    });
  };

  const handleDelete = async (id: string) => {
    await inventoryService.deleteItem(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (editingId === id) {
      resetForm();
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Inventory Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
            <Input
              placeholder="Item name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
            <Input
              placeholder="Brand"
              value={form.brand}
              onChange={(e) => setForm((prev) => ({ ...prev, brand: e.target.value }))}
            />
            <select
              className="h-9 rounded-md border border-zinc-300 bg-white px-3 text-sm"
              value={form.category}
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value as ItemCategory }))}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <Input
              type="number"
              min={0}
              placeholder="Purchase price"
              value={form.purchasePrice}
              onChange={(e) => setForm((prev) => ({ ...prev, purchasePrice: Number(e.target.value) }))}
            />
            <Input
              type="number"
              min={0}
              placeholder="Selling price"
              value={form.sellingPrice}
              onChange={(e) => setForm((prev) => ({ ...prev, sellingPrice: Number(e.target.value) }))}
            />
            <Input
              type="number"
              min={0}
              placeholder="Quantity"
              value={form.quantity}
              onChange={(e) => setForm((prev) => ({ ...prev, quantity: Number(e.target.value) }))}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void handleSubmit()}>{editingId ? "Update Item" : "Add Item"}</Button>
            <Button variant="outline" onClick={resetForm}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stock List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute left-2 top-2 h-5 w-5 text-zinc-400" />
            <Input
              className="pl-9"
              placeholder="Search by id, name, brand or category"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left">
                  <th className="py-2">ID</th>
                  <th className="py-2">Name</th>
                  <th className="py-2">Brand</th>
                  <th className="py-2">Category</th>
                  <th className="py-2">Buy</th>
                  <th className="py-2">Sell</th>
                  <th className="py-2">Qty</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="py-3 text-zinc-500" colSpan={9}>
                      Loading...
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td className="py-3 text-zinc-500" colSpan={9}>
                      No items found.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="border-b border-zinc-100">
                      <td className="py-2">{item.id}</td>
                      <td className="py-2">{item.name}</td>
                      <td className="py-2">{item.brand}</td>
                      <td className="py-2">{item.category}</td>
                      <td className="py-2">{item.purchasePrice.toFixed(2)}</td>
                      <td className="py-2">{item.sellingPrice.toFixed(2)}</td>
                      <td className="py-2">{item.quantity}</td>
                      <td className="py-2">
                        {inventoryService.isLowStock(item.quantity) ? (
                          <Badge className="bg-red-100 text-red-700">Low stock</Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-700">Healthy</Badge>
                        )}
                      </td>
                      <td className="py-2">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>
                            Edit
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => void handleDelete(item.id)}>
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
