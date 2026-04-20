import { test, expect } from "@playwright/test";

const productsResponse = {
  code: 1000,
  message: "Success",
  result: {
    currentPage: 0,
    totalPages: 1,
    pageSize: 12,
    totalElements: 2,
    last: true,
    data: [
      {
        id: "product-1",
        name: "Váy midi đỏ",
        slug: "vay-midi-do",
        description: "Váy dự tiệc nổi bật",
        shortDescription: "Phom midi mềm mại",
        material: "Lụa",
        createdAt: "2026-03-21T10:00:00",
        updatedAt: "2026-03-21T10:00:00",
        status: "ACTIVE",
        category: {
          id: "cat-1",
          name: "Đầm nữ",
          slug: "dam-nu",
          description: "Đầm nữ",
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
            ],
          },
        ],
        tags: [],
      },
      {
        id: "product-2",
        name: "Áo blazer kem",
        slug: "ao-blazer-kem",
        description: "Blazer mặc hằng ngày",
        shortDescription: "Blazer nhẹ",
        material: "Cotton pha",
        createdAt: "2026-03-19T10:00:00",
        updatedAt: "2026-03-19T10:00:00",
        status: "ACTIVE",
        category: {
          id: "cat-2",
          name: "Áo khoác",
          slug: "ao-khoac",
          description: "Áo khoác",
          iconUrl: "/images/arrivals/arrivals-03.png",
          sortOrder: 2,
        },
        colors: [
          {
            id: "color-2",
            colorName: "Kem",
            hexCode: "#EEE3CB",
            images: [
              {
                id: "img-2",
                url: "/images/arrivals/arrivals-04.png",
                isMain: true,
              },
            ],
            variants: [
              {
                id: "variant-2",
                sizeName: "S",
                originalPrice: 690000,
                salePrice: 590000,
                stockQuantity: 4,
              },
            ],
          },
        ],
        tags: [],
      },
    ],
  },
};

const categoriesResponse = {
  code: 1000,
  message: "Success",
  result: [
    {
      id: "cat-1",
      name: "Đầm nữ",
      slug: "dam-nu",
      description: "Đầm nữ",
      iconUrl: "/images/arrivals/arrivals-02.png",
      sortOrder: 1,
    },
    {
      id: "cat-2",
      name: "Áo khoác",
      slug: "ao-khoac",
      description: "Áo khoác",
      iconUrl: "/images/arrivals/arrivals-03.png",
      sortOrder: 2,
    },
  ],
};

const homeContentResponse = {
  code: 1000,
  message: "Success",
  result: {
    heroSlides: [
      {
        id: "hero-slide-1",
        title: "Bộ sưu tập thời trang mùa hè 2026",
        eyebrow: "30%",
        accentText: "Giảm giá 30%",
        description:
          "Khám phá bộ sưu tập thời trang mới nhất với phong cách hiện đại và trẻ trung, phù hợp cho mọi hoạt động.",
        ctaText: "Mua ngay",
        ctaUrl: "/shop-with-sidebar",
        imageUrl: "/images/hero/hero-01.png",
        backgroundColor: "#FFFFFF",
        accentColor: "#FFC954",
        sortOrder: 1,
      },
    ],
    heroCards: [
      {
        id: "hero-card-1",
        title: "Bộ sưu tập Hè 2026",
        eyebrow: "Ưu đãi có hạn",
        priceText: "699.000₫",
        compareAtText: "999.000₫",
        ctaUrl: "/shop-with-sidebar",
        imageUrl: "/images/arrivals/arrivals-01.png",
        backgroundColor: "#FFFFFF",
        accentColor: "#EF4444",
        sortOrder: 1,
      },
    ],
    featuredPromo: {
      id: "featured-promo-1",
      title: "GIẢM TỚI 30%",
      eyebrow: "Bộ sưu tập Hè 2026",
      description:
        "Khám phá các mẫu thiết kế mới nhất với chất liệu thoáng mát, màu sắc rực rỡ, mang lại sự năng động cho mùa hè của bạn.",
      ctaText: "Mua ngay",
      ctaUrl: "/shop-with-sidebar",
      imageUrl: "/images/hero/hero-01.png",
      backgroundColor: "#F5F5F7",
      accentColor: "#FFC954",
      sortOrder: 1,
    },
    promoCards: [
      {
        id: "promo-card-1",
        title: "Tập luyện tại nhà",
        eyebrow: "Giày thể thao năng động",
        accentText: "Giảm ngay 20%",
        ctaText: "Săn ngay",
        ctaUrl: "/shop-with-sidebar",
        imageUrl: "/images/arrivals/arrivals-02.png",
        backgroundColor: "#DBF4F3",
        accentColor: "#12B0B6",
        sortOrder: 1,
      },
    ],
    countdown: {
      id: "countdown-1",
      title: "Bộ sưu tập thời trang đặc biệt",
      eyebrow: "Đừng bỏ lỡ!!",
      accentText: "Giảm giá đến 50%",
      description: "Ưu đãi giới hạn cho các thiết kế mới nhất.",
      ctaText: "Xem ngay!",
      ctaUrl: "/shop-with-sidebar",
      imageUrl: "/images/countdown/countdown-01.png",
      backgroundColor: "#D0E9F3",
      accentColor: "#3B82F6",
      endAt: "2026-04-01T12:00:00",
      sortOrder: 1,
    },
  },
};

test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/home/content", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(homeContentResponse),
    });
  });

  await page.route("**/api/v1/categories", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(categoriesResponse),
    });
  });

  await page.route("**/api/v1/products/slug/vay-midi-do", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        code: 1000,
        message: "Success",
        result: productsResponse.result.data[0],
      }),
    });
  });

  await page.route("**/api/v1/products**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(productsResponse),
    });
  });
});

test("shop page shows loading state and renders products from api", async ({ page }) => {
  await page.goto("/shop-with-sidebar");

  await expect(page.getByText("Váy midi đỏ")).toBeVisible();
  await expect(page.getByText("Áo blazer kem")).toBeVisible();
  await expect(page.getByText("2 sản phẩm")).toBeVisible();
});

test("product detail page renders api-backed content", async ({ page }) => {
  await page.goto("/shop-details/vay-midi-do");

  await expect(page.getByRole("heading", { name: "Váy midi đỏ" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Thêm vào giỏ" }).first()
  ).toBeVisible();
});

test("home page renders api-backed hero, promo, and countdown content", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Bộ sưu tập thời trang mùa hè 2026" })
  ).toBeVisible();
  await expect(page.getByText("GIẢM TỚI 30%")).toBeVisible();
  await expect(page.getByText("Bộ sưu tập thời trang đặc biệt")).toBeVisible();
});
