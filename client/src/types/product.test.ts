import { normalizeProduct } from "./product";

describe("normalizeProduct", () => {
  it("maps backend product dto to ui product shape", () => {
    const result = normalizeProduct({
      id: "product-1",
      name: "Váy midi đỏ",
      slug: "vay-midi-do",
      description: "Mô tả đầy đủ",
      shortDescription: "Mô tả ngắn",
      material: "Lụa",
      createdAt: "2026-03-20T10:00:00",
      updatedAt: "2026-03-21T10:00:00",
      status: "ACTIVE",
      category: {
        id: "cat-1",
        name: "Đầm nữ",
        slug: "dam-nu",
        description: "Danh mục đầm",
        iconUrl: "/images/arrivals/arrivals-02.png",
        sortOrder: 1,
      },
      colors: [
        {
          id: "color-1",
          colorName: "Đỏ ruby",
          hexCode: "#C1121F",
          images: [
            {
              id: "img-1",
              url: "/images/arrivals/arrivals-01.png",
              isMain: true,
            },
          ],
          variants: [
            {
              id: "variant-1",
              sizeName: "M",
              originalPrice: 550000,
              salePrice: 399000,
              stockQuantity: 8,
            },
            {
              id: "variant-2",
              sizeName: "L",
              originalPrice: 550000,
              salePrice: 429000,
              stockQuantity: 6,
            },
          ],
        },
      ],
      tags: [],
    });

    expect(result.id).toBe("product-1");
    expect(result.title).toBe("Váy midi đỏ");
    expect(result.slug).toBe("vay-midi-do");
    expect(result.categoryName).toBe("Đầm nữ");
    expect(result.discountedPrice).toBe(399000);
    expect(result.price).toBe(550000);
    expect(result.totalStock).toBe(14);
    expect(result.inStock).toBe(true);
    expect(result.sizes).toEqual(["M", "L"]);
    expect(result.colors[0].images[0]).toBe("/images/arrivals/arrivals-01.png");
  });

  it("falls back to placeholder for unconfigured remote hosts", () => {
    const result = normalizeProduct({
      id: "product-2",
      name: "Ao demo",
      slug: "ao-demo",
      status: "ACTIVE",
      category: {
        id: "cat-2",
        name: "Ao",
        slug: "ao",
      },
      colors: [
        {
          id: "color-2",
          colorName: "Xanh",
          hexCode: "#2563EB",
          images: [
            {
              id: "img-2",
              url: "https://example.com/a.jpg",
              isMain: true,
            },
          ],
          variants: [
            {
              id: "variant-3",
              sizeName: "L",
              originalPrice: 250000,
              salePrice: 199000,
              stockQuantity: 4,
            },
          ],
        },
      ],
      tags: [],
    });

    expect(result.imgs.previews[0]).toBe("/images/arrivals/arrivals-01.png");
    expect(result.colors[0].images[0]).toBe("/images/arrivals/arrivals-01.png");
  });
});
