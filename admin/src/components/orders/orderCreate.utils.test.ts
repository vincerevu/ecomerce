import {
  buildCreateOrderPayload,
  buildCreateShipmentPayload,
  buildShippingAddressText,
  derivePackageDimension,
  findMatchingLocation,
  flattenProductVariants,
} from "./orderCreate.utils";

describe("orderCreate.utils", () => {
  it("flattens product variants for order selection", () => {
    const variants = flattenProductVariants([
      {
        id: "product-1",
        name: "Áo khoác bomber",
        slug: "ao-khoac-bomber",
        colors: [
          {
            colorName: "Đen",
            images: [{ imageUrl: "https://img.test/1.jpg", main: true }],
            variants: [
              {
                id: "variant-1",
                sizeName: "L",
                salePrice: 490000,
                originalPrice: 590000,
                stockQuantity: 12,
              },
            ],
          },
        ],
      },
    ]);

    expect(variants).toHaveLength(1);
    expect(variants[0]).toMatchObject({
      variantId: "variant-1",
      productId: "product-1",
      productName: "Áo khoác bomber",
      colorName: "Đen",
      sizeName: "L",
      salePrice: 490000,
    });
  });

  it("matches saved address names to shipping locations without accents", () => {
    const matched = findMatchingLocation(
      [
        { code: "201", name: "Hà Nội" },
        { code: "2021", name: "Thanh Xuân" },
        { code: "1A", name: "Khương Đình" },
      ],
      "Khuong Dinh",
    );

    expect(matched?.name).toBe("Khương Đình");
  });

  it("builds a readable shipping address string", () => {
    expect(
      buildShippingAddressText({
        detail: "7 Khương Hạ",
        wardName: "Khương Đình",
        districtName: "Thanh Xuân",
        provinceName: "Hà Nội",
      }),
    ).toBe("7 Khương Hạ, Khương Đình, Thanh Xuân, Hà Nội");
  });

  it("derives package dimensions from items", () => {
    const result = derivePackageDimension(
      [
        { id: "1", variantId: "variant-1", quantity: 2 },
        { id: "2", variantId: "variant-2", quantity: 1 },
      ],
      [
        {
          variantId: "variant-1",
          productId: "product-1",
          productName: "Áo",
          colorName: "Đen",
          sizeName: "M",
          salePrice: 390000,
          stockQuantity: 10,
        },
        {
          variantId: "variant-2",
          productId: "product-2",
          productName: "Túi",
          colorName: "Nâu",
          sizeName: "F",
          salePrice: 690000,
          stockQuantity: 4,
        },
      ],
    );

    expect(result.weight).toBeGreaterThan(0);
    expect(result.length).toBeGreaterThan(0);
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
  });

  it("builds order payload with variant snapshots", () => {
    const payload = buildCreateOrderPayload({
      userId: "user-1",
      customerName: "Nguyễn Văn A",
      customerPhone: "0900000001",
      customerEmail: "a@test.vn",
      shippingAddress: "7 Khương Hạ, Khương Đình, Thanh Xuân, Hà Nội",
      notes: "Giao giờ hành chính",
      shippingFee: 25000,
      discountAmount: 10000,
      paymentStatus: "UNPAID",
      status: "PENDING",
      items: [{ id: "1", variantId: "variant-1", quantity: 2 }],
      variants: [
        {
          variantId: "variant-1",
          productId: "product-1",
          productName: "Áo khoác bomber",
          productSlug: "ao-khoac-bomber",
          colorName: "Đen",
          sizeName: "L",
          salePrice: 490000,
          stockQuantity: 12,
          imageUrl: "https://img.test/1.jpg",
        },
      ],
    });

    expect(payload.items[0]).toMatchObject({
      productId: "product-1",
      productVariantId: "variant-1",
      quantity: 2,
      unitPrice: 490000,
    });
  });

  it("builds shipment payload from normalized order data", () => {
    const payload = buildCreateShipmentPayload({
      orderId: "order-1",
      serviceId: 53321,
      requiredNote: "CHOTHUHANG",
      codAmount: 1000000,
      insuranceValue: 1000000,
      packageDimension: {
        weight: 700,
        length: 28,
        width: 20,
        height: 10,
      },
      toName: "Nguyễn Văn A",
      toPhone: "0900000001",
      toAddress: "7 Khương Hạ",
      toProvinceName: "Hà Nội",
      toDistrictName: "Thanh Xuân",
      toWardName: "Khương Đình",
      toDistrictId: 2021,
      toWardCode: "1A",
      note: "Gọi trước khi giao",
    });

    expect(payload).toMatchObject({
      orderId: "order-1",
      serviceId: 53321,
      toDistrictId: 2021,
      toWardCode: "1A",
      requiredNote: "CHOTHUHANG",
    });
  });
});
