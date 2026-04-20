import { expect, test } from "@playwright/test";

const productDetailResponse = {
  code: 1000,
  message: "Success",
  result: {
    id: "product-1",
    name: "Ao khoac gio basic",
    slug: "ao-khoac-gio-basic",
    description: "Ao khoac gio basic",
    shortDescription: "Ao khoac gio basic",
    material: "Poly",
    createdAt: "2026-03-21T10:00:00",
    updatedAt: "2026-03-21T10:00:00",
    status: "ACTIVE",
    category: {
      id: "cat-1",
      name: "Ao khoac",
      slug: "ao-khoac",
      description: "Ao khoac",
      iconUrl: "/images/arrivals/arrivals-03.png",
      sortOrder: 1,
    },
    colors: [
      {
        id: "color-1",
        colorName: "Den",
        hexCode: "#111111",
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
        ],
      },
    ],
    tags: [],
  },
};

test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/products/slug/ao-khoac-gio-basic", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(productDetailResponse),
    });
  });
});

test("guest cart flow adds, updates, and removes a cart item", async ({ page }) => {
  await page.goto("/shop-details/ao-khoac-gio-basic");

  await expect(page.locator("h2", { hasText: "Ao khoac gio basic" })).toBeVisible();
  await page.getByRole("button", { name: "Thêm vào giỏ" }).first().click();
  await page.goto("/cart");

  await expect(
    page.locator("h3", { hasText: "Ao khoac gio basic" }).first()
  ).toBeVisible();
  await expect(page.getByText("399.000₫").first()).toBeVisible();

  await page.getByRole("button", { name: "Tăng số lượng" }).first().click();
  await expect(page.getByText("798.000₫").first()).toBeVisible();

  await page.getByRole("button", { name: /xóa sản phẩm/i }).first().click();
  await expect(page.getByText("Giỏ hàng của bạn đang trống")).toBeVisible();
});
