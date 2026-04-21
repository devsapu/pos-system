"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { reportsService } from "@/services/reports-service";
import { ReportsData } from "@/types/reports";

const currency = (value: number) => value.toFixed(2);

const emptyData: ReportsData = {
  daily: { totalTransactions: 0, totalItemsSold: 0, totalRevenue: 0, totalProfit: 0 },
  monthly: { totalTransactions: 0, totalItemsSold: 0, totalRevenue: 0, totalProfit: 0 },
  fastMoving: [],
  slowMoving: [],
};

export default function ReportsPage() {
  const [data, setData] = useState<ReportsData>(emptyData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const next = await reportsService.getReportsData();
      setData(next);
      setLoading(false);
    };
    void load();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-500">Loading reports...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Daily Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>Transactions: {data.daily.totalTransactions}</p>
            <p>Items Sold: {data.daily.totalItemsSold}</p>
            <p>Revenue: {currency(data.daily.totalRevenue)}</p>
            <p>Profit: {currency(data.daily.totalProfit)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Monthly Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>Transactions: {data.monthly.totalTransactions}</p>
            <p>Items Sold: {data.monthly.totalItemsSold}</p>
            <p>Revenue: {currency(data.monthly.totalRevenue)}</p>
            <p>Profit: {currency(data.monthly.totalProfit)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Fast Moving Items</CardTitle>
          </CardHeader>
          <CardContent>
            {data.fastMoving.length === 0 ? (
              <p className="text-sm text-zinc-500">No sales yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {data.fastMoving.map((item) => (
                  <li key={item.itemId} className="flex justify-between rounded border border-zinc-200 p-2">
                    <span>{item.itemName}</span>
                    <span>{item.quantitySold}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Slow Moving Items</CardTitle>
          </CardHeader>
          <CardContent>
            {data.slowMoving.length === 0 ? (
              <p className="text-sm text-zinc-500">No sales yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {data.slowMoving.map((item) => (
                  <li key={item.itemId} className="flex justify-between rounded border border-zinc-200 p-2">
                    <span>{item.itemName}</span>
                    <span>{item.quantitySold}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
