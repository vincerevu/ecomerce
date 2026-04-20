import type {
  InventoryStockRecord,
  StockImportReceiptRecord,
} from "../../api/inventoryApi";

export type InventorySortPreset =
  | ""
  | "lowStock"
  | "recentImport"
  | "valueDesc"
  | "nameAsc";

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value || 0);

export const formatDateTime = (value?: string) => {
  if (!value) return "Chưa có";
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
};

export const filterStocks = ({
  stocks,
  searchTerm,
  stockFilter,
}: {
  stocks: InventoryStockRecord[];
  searchTerm: string;
  stockFilter: string;
}) => {
  const normalizedSearch = searchTerm.trim().toLowerCase();
  return stocks.filter((stock) => {
    const matchesSearch =
      !normalizedSearch ||
      [stock.productName, stock.productSlug, stock.colorName, stock.sizeName]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(normalizedSearch));

    const matchesStock =
      !stockFilter ||
      (stockFilter === "low" && stock.stockQuantity > 0 && stock.stockQuantity < 10) ||
      (stockFilter === "out" && stock.stockQuantity === 0) ||
      (stockFilter === "healthy" && stock.stockQuantity >= 10);

    return matchesSearch && matchesStock;
  });
};

export const sortStocks = (
  stocks: InventoryStockRecord[],
  preset: InventorySortPreset,
) => {
  return [...stocks].sort((left, right) => {
    switch (preset) {
      case "":
        return 0;
      case "recentImport":
        return (
          new Date(right.latestImportedAt || 0).getTime() -
          new Date(left.latestImportedAt || 0).getTime()
        );
      case "valueDesc":
        return (right.salePrice || 0) - (left.salePrice || 0);
      case "nameAsc":
        return left.productName.localeCompare(right.productName, "vi");
      case "lowStock":
      default:
        return left.stockQuantity - right.stockQuantity;
    }
  });
};

export const buildInventorySummary = (
  stocks: InventoryStockRecord[],
  receipts: StockImportReceiptRecord[],
) => {
  const totalStock = stocks.reduce((total, item) => total + (item.stockQuantity || 0), 0);
  const lowStockCount = stocks.filter(
    (item) => item.stockQuantity > 0 && item.stockQuantity < 10,
  ).length;
  const outOfStockCount = stocks.filter((item) => item.stockQuantity === 0).length;
  const receiptVolume = receipts.reduce(
    (total, receipt) => total + (receipt.totalAmount || 0),
    0,
  );

  return {
    totalVariants: stocks.length,
    totalStock,
    lowStockCount,
    outOfStockCount,
    receiptCount: receipts.length,
    receiptVolume,
  };
};

export const getStockMeta = (stockQuantity: number) => {
  if (stockQuantity === 0) {
    return { label: "Hết hàng", color: "error" as const };
  }
  if (stockQuantity < 10) {
    return { label: "Sắp hết", color: "warning" as const };
  }
  return { label: "Ổn định", color: "success" as const };
};
