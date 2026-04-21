export interface ReportSummary {
  totalTransactions: number;
  totalItemsSold: number;
  totalRevenue: number;
  totalProfit: number;
}

export interface MovingItem {
  itemId: string;
  itemName: string;
  quantitySold: number;
}

export interface ReportsData {
  daily: ReportSummary;
  monthly: ReportSummary;
  fastMoving: MovingItem[];
  slowMoving: MovingItem[];
}
