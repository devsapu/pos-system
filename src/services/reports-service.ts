import { getDailyReport, getMonthlyReport, hasApiUrl } from "@/services/api";
import { salesService } from "@/services/sales-service";
import { ReportsData, ReportSummary } from "@/types/reports";
import { SaleRecord } from "@/types/sales";

const emptySummary: ReportSummary = {
  totalTransactions: 0,
  totalItemsSold: 0,
  totalRevenue: 0,
  totalProfit: 0,
};

const formatDateParts = (date: Date) => ({
  day: date.toISOString().slice(0, 10),
  month: date.toISOString().slice(0, 7),
});

const buildSummary = (sales: SaleRecord[]): ReportSummary => {
  const transactionIds = new Set(sales.map((sale) => sale.transactionId));
  return sales.reduce(
    (acc, sale) => {
      acc.totalItemsSold += sale.quantity;
      acc.totalRevenue += sale.sellingPrice * sale.quantity;
      acc.totalProfit += sale.profit;
      return acc;
    },
    { ...emptySummary, totalTransactions: transactionIds.size },
  );
};

export const reportsService = {
  async getReportsData(): Promise<ReportsData> {
    if (hasApiUrl()) {
      try {
        const [daily, monthly] = await Promise.all([getDailyReport(), getMonthlyReport()]);
        return {
          daily,
          monthly,
          fastMoving: [],
          slowMoving: [],
        };
      } catch {
        // Fall back to mock-computed analytics below.
      }
    }

    const sales = await salesService.listSales();
    if (sales.length === 0) {
      return {
        daily: emptySummary,
        monthly: emptySummary,
        fastMoving: [],
        slowMoving: [],
      };
    }

    const now = formatDateParts(new Date());
    const dailySales = sales.filter((sale) => sale.createdAt.slice(0, 10) === now.day);
    const monthlySales = sales.filter((sale) => sale.createdAt.slice(0, 7) === now.month);

    const quantityByItem = new Map<string, { itemId: string; itemName: string; quantitySold: number }>();
    for (const sale of monthlySales) {
      const current = quantityByItem.get(sale.itemId);
      if (current) {
        current.quantitySold += sale.quantity;
      } else {
        quantityByItem.set(sale.itemId, {
          itemId: sale.itemId,
          itemName: sale.itemName,
          quantitySold: sale.quantity,
        });
      }
    }

    const rankedItems = [...quantityByItem.values()].sort((a, b) => b.quantitySold - a.quantitySold);

    return {
      daily: buildSummary(dailySales),
      monthly: buildSummary(monthlySales),
      fastMoving: rankedItems.slice(0, 5),
      slowMoving: rankedItems.slice(-5).reverse(),
    };
  },
};
