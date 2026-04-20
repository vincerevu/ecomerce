import apiClient from "./apiClient";

export interface InventoryStockRecord {
  productId: string;
  productVariantId: string;
  productName: string;
  productSlug: string;
  colorName: string;
  hexCode?: string;
  sizeName: string;
  imageUrl?: string;
  originalPrice?: number;
  salePrice: number;
  stockQuantity: number;
  latestUnitCost?: number;
  latestImportedAt?: string;
}

export interface StockImportItemRecord {
  id: string;
  productVariantId: string;
  productId: string;
  productName: string;
  colorName: string;
  sizeName: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
}

export interface StockImportReceiptRecord {
  id: string;
  receiptCode: string;
  supplierName?: string;
  note?: string;
  importedAt?: string;
  totalAmount: number;
  totalQuantity: number;
  totalLines: number;
  createdAt?: string;
  items: StockImportItemRecord[];
}

export interface CreateStockImportItemPayload {
  productVariantId: string;
  quantity: number;
  unitCost: number;
}

export interface CreateStockImportReceiptPayload {
  receiptCode?: string;
  supplierName?: string;
  note?: string;
  importedAt?: string;
  items: CreateStockImportItemPayload[];
}

interface PaginatedResult<T> {
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  data: T[];
}

interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

export const inventoryApi = {
  getStocks: async (params?: Record<string, string | number>) => {
    const response = await apiClient.get<ApiResponse<PaginatedResult<InventoryStockRecord>>>(
      "/inventory/stocks",
      { params },
    );
    return response.data;
  },
  getReceipts: async (params?: Record<string, string | number>) => {
    const response = await apiClient.get<ApiResponse<PaginatedResult<StockImportReceiptRecord>>>(
      "/inventory/receipts",
      { params },
    );
    return response.data;
  },
  createReceipt: async (payload: CreateStockImportReceiptPayload) => {
    const response = await apiClient.post<ApiResponse<StockImportReceiptRecord>>(
      "/inventory/receipts",
      payload,
    );
    return response.data;
  },
};
