import {
  buildInventorySummary,
  filterStocks,
  getStockMeta,
  sortStocks,
} from "./inventoryTable.utils";
import type { InventoryStockRecord, StockImportReceiptRecord } from "../../api/inventoryApi";

const buildStock = (overrides: Partial<InventoryStockRecord> = {}): InventoryStockRecord => ({
  productId: "product-1",
  productVariantId: "variant-1",
  productName: "Áo khoác bomber",
  productSlug: "ao-khoac-bomber",
  colorName: "Đen",
  sizeName: "L",
  salePrice: 450000,
  stockQuantity: 8,
  ...overrides,
});

const buildReceipt = (
  overrides: Partial<StockImportReceiptRecord> = {},
): StockImportReceiptRecord => ({
  id: "receipt-1",
  receiptCode: "IMP-00001",
  totalAmount: 1200000,
  totalQuantity: 12,
  totalLines: 2,
  items: [],
  ...overrides,
});

describe("inventoryTable utils", () => {
  it("filters stock by keyword and stock level", () => {
    const result = filterStocks({
      stocks: [
        buildStock(),
        buildStock({ productVariantId: "variant-2", productName: "Sneaker urban", stockQuantity: 0 }),
      ],
      searchTerm: "sneaker",
      stockFilter: "out",
    });

    expect(result).toHaveLength(1);
    expect(result[0].productName).toBe("Sneaker urban");
  });

  it("sorts low stock first", () => {
    const result = sortStocks(
      [
        buildStock({ productVariantId: "variant-1", stockQuantity: 22 }),
        buildStock({ productVariantId: "variant-2", stockQuantity: 4 }),
      ],
      "lowStock",
    );

    expect(result[0].stockQuantity).toBe(4);
  });

  it("builds inventory summary correctly", () => {
    const summary = buildInventorySummary(
      [
        buildStock({ stockQuantity: 8 }),
        buildStock({ productVariantId: "variant-2", stockQuantity: 0 }),
        buildStock({ productVariantId: "variant-3", stockQuantity: 12 }),
      ],
      [buildReceipt(), buildReceipt({ id: "receipt-2", totalAmount: 800000 })],
    );

    expect(summary).toEqual({
      totalVariants: 3,
      totalStock: 20,
      lowStockCount: 1,
      outOfStockCount: 1,
      receiptCount: 2,
      receiptVolume: 2000000,
    });
  });

  it("returns warning state for low stock", () => {
    expect(getStockMeta(3)).toEqual({ label: "Sắp hết", color: "warning" });
  });

  it("returns success state for healthy stock", () => {
    expect(getStockMeta(18)).toEqual({ label: "Ổn định", color: "success" });
  });
});
