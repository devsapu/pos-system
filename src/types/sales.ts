export interface SaleRecord {
  transactionId: string;
  itemId: string;
  itemName: string;
  quantity: number;
  sellingPrice: number;
  purchasePrice: number;
  profit: number;
  createdAt: string;
}

export interface SaleInput {
  itemId: string;
  quantity: number;
}
