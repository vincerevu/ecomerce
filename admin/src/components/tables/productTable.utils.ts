export interface ProductVariant {
  sizeName?: string;
  originalPrice?: number;
  salePrice?: number;
  stockQuantity?: number;
}

export interface ProductImage {
  url: string;
}

export interface ProductColor {
  id?: string;
  colorName?: string;
  hexCode?: string;
  variants?: ProductVariant[];
  images?: ProductImage[];
}

export interface ProductTag {
  id?: string;
  name?: string;
}

export interface ProductRow {
  id: string;
  name: string;
  slug: string;
  status: "ACTIVE" | "INACTIVE";
  gender?: string;
  style?: string;
  createdAt?: string;
  updatedAt?: string;
  category?: { id: string; name: string };
  tags?: Array<ProductTag | string>;
  colors: ProductColor[];
}

export const getTotalStock = (product: ProductRow) =>
  product.colors.reduce(
    (colorAcc, color) =>
      colorAcc +
      (color.variants?.reduce(
        (variantAcc, variant) => variantAcc + (variant.stockQuantity || 0),
        0,
      ) || 0),
    0,
  );

export const getPriceRange = (product: ProductRow) => {
  const prices = product.colors.flatMap(
    (color) => color.variants?.map((variant) => variant.salePrice || 0) || [],
  );
  const validPrices = prices.filter((price) => price > 0);
  if (validPrices.length === 0) {
    return { min: 0, max: 0 };
  }

  return {
    min: Math.min(...validPrices),
    max: Math.max(...validPrices),
  };
};

export const getPrimaryImageUrl = (product: ProductRow) =>
  product.colors.find((color) => color.images?.length)?.images?.[0]?.url;

export const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
