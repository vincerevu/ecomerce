import {
  formatPrice,
  getPriceRange,
  getPrimaryImageUrl,
  getTotalStock,
  type ProductRow,
} from "./productTable.utils";

const buildProduct = (overrides: Partial<ProductRow> = {}): ProductRow => ({
  id: "product-1",
  name: "Ao khoac",
  slug: "ao-khoac",
  status: "ACTIVE",
  colors: [],
  ...overrides,
});

describe("productTable utils", () => {
  it("computes total stock across all colors and variants", () => {
    const product = buildProduct({
      colors: [
        { variants: [{ stockQuantity: 2 }, { stockQuantity: 3 }] },
        { variants: [{ stockQuantity: 5 }] },
      ],
    });

    expect(getTotalStock(product)).toBe(10);
  });

  it("returns the min and max sale price from all variants", () => {
    const product = buildProduct({
      colors: [
        { variants: [{ salePrice: 420000 }, { salePrice: 390000 }] },
        { variants: [{ salePrice: 510000 }] },
      ],
    });

    expect(getPriceRange(product)).toEqual({ min: 390000, max: 510000 });
  });

  it("returns zero range when product has no valid prices", () => {
    const product = buildProduct({
      colors: [{ variants: [{ salePrice: 0 }, {}] }, {}],
    });

    expect(getPriceRange(product)).toEqual({ min: 0, max: 0 });
  });

  it("returns the first available image url across colors", () => {
    const product = buildProduct({
      colors: [
        { images: [] },
        { images: [{ url: "https://cdn.example.com/ao-khoac-1.webp" }] },
      ],
    });

    expect(getPrimaryImageUrl(product)).toBe(
      "https://cdn.example.com/ao-khoac-1.webp",
    );
  });

  it("formats price in VND", () => {
    expect(formatPrice(150000)).toBe("150.000 ₫");
  });
});
