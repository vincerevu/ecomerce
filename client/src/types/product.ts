export type ProductImageSet = {
  thumbnails: string[];
  previews: string[];
};

export type ProductVariant = {
  id: string;
  sizeName: string;
  originalPrice: number;
  salePrice: number;
  stockQuantity: number;
};

export type ProductColor = {
  id: string;
  name: string;
  hexCode: string;
  images: string[];
  variants: ProductVariant[];
  sizes: string[];
};

export type Product = {
  id: string;
  title: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  material: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  reviews: number;
  price: number;
  discountedPrice: number;
  imgs: ProductImageSet;
  colors: ProductColor[];
  sizes: string[];
  totalStock: number;
  inStock: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type ProductCartPayload = {
  id: string;
  productId: string;
  productSlug: string;
  title: string;
  price: number;
  discountedPrice: number;
  quantity: number;
  imgs?: ProductImageSet;
  variantId?: string;
  colorId?: string;
  colorName?: string;
  sizeName?: string;
  imageUrl?: string;
};

export type ProductImageResponse = {
  id: string;
  url: string;
  isMain: boolean;
};

export type ProductVariantResponse = {
  id: string;
  sizeName: string;
  originalPrice: number | string;
  salePrice: number | string;
  stockQuantity: number;
};

export type ProductColorResponse = {
  id: string;
  colorName: string;
  hexCode: string;
  images?: ProductImageResponse[];
  variants?: ProductVariantResponse[];
};

export type ProductCategoryResponse = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  iconUrl?: string;
  sortOrder?: number;
};

export type ProductColorSummaryResponse = {
  id: string;
  colorName: string;
  hexCode: string;
};

export type ProductResponse = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  material?: string;
  createdAt?: string;
  updatedAt?: string;
  category?: ProductCategoryResponse | null;
  categoryId?: string;
  categoryName?: string;
  categorySlug?: string;
  thumbnailUrl?: string;
  minOriginalPrice?: number | string;
  minSalePrice?: number | string;
  displayPrice?: number | string;
  displayOriginalPrice?: number | string;
  totalStock?: number;
  variantCount?: number;
  colors?: ProductColorResponse[];
  tags?: Array<{ id: string; name: string }>;
  status?: string;
  gender?: string;
  style?: string;
};

const PRODUCT_PLACEHOLDER = "/images/arrivals/arrivals-01.png";
const ALLOWED_REMOTE_HOSTS = new Set([
  "images.unsplash.com",
  "plus.unsplash.com",
  "res.cloudinary.com",
  "buggy.yodycdn.com",
  "localhost",
  "127.0.0.1",
]);

const toNumber = (value: number | string | null | undefined) => {
  if (typeof value === "number") {
    return value;
  }

  if (!value) {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const normalizeProduct = (product: ProductResponse): Product => {
  const colors = (product.colors ?? []).map((color) => {
    const variants = (color.variants ?? []).map((variant) => ({
      id: variant.id,
      sizeName: variant.sizeName,
      originalPrice: toNumber(variant.originalPrice),
      salePrice: toNumber(variant.salePrice),
      stockQuantity: variant.stockQuantity ?? 0,
    }));

    return {
      id: color.id,
      name: color.colorName,
      hexCode: color.hexCode || "#D1D5DB",
      images: (color.images ?? [])
        .map((image) => image.url)
        .map((imageUrl) => sanitizeProductImageUrl(imageUrl)),
      variants,
      sizes: Array.from(
        new Set(
          variants
            .map((variant) => variant.sizeName)
            .filter((sizeName) => sizeName?.trim())
        )
      ),
    };
  });

  const allImages = colors.flatMap((color) => color.images).filter(Boolean);
  const allVariants = colors.flatMap((color) => color.variants);
  const listDisplayPrice = toNumber(product.displayPrice ?? product.minSalePrice);
  const listOriginalPrice = toNumber(product.displayOriginalPrice ?? product.minOriginalPrice);
  const salePrices = allVariants
    .map((variant) => variant.salePrice || variant.originalPrice)
    .filter((price) => price > 0);
  const originalPrices = allVariants
    .map((variant) => variant.originalPrice || variant.salePrice)
    .filter((price) => price > 0);

  const discountedPrice =
    listDisplayPrice > 0
      ? listDisplayPrice
      : salePrices.length > 0
        ? Math.min(...salePrices)
        : 0;
  const price =
    listOriginalPrice > 0
      ? listOriginalPrice
      : originalPrices.length > 0
      ? Math.max(...originalPrices)
      : discountedPrice;
  const totalStock =
    product.totalStock ??
    allVariants.reduce(
      (sum, variant) => sum + (variant.stockQuantity || 0),
      0
    );
  const imageSet =
    allImages.length > 0
      ? allImages
      : [sanitizeProductImageUrl(product.thumbnailUrl)];

  return {
    id: product.id,
    title: product.name,
    name: product.name,
    slug: product.slug,
    description: product.description || "",
    shortDescription: product.shortDescription || "",
    material: product.material || "",
    categoryId: product.category?.id || product.categoryId || "",
    categoryName: product.category?.name || product.categoryName || "Chưa phân loại",
    categorySlug: product.category?.slug || product.categorySlug || "",
    reviews: 0,
    price,
    discountedPrice,
    imgs: {
      thumbnails: imageSet,
      previews: imageSet,
    },
    colors,
    sizes: Array.from(
      new Set(colors.flatMap((color) => color.sizes).filter(Boolean))
    ),
    totalStock,
    inStock: totalStock > 0,
    status: product.status || "ACTIVE",
    createdAt: product.createdAt || "",
    updatedAt: product.updatedAt || "",
  };
};

export const hasDiscount = (product: Pick<Product, "price" | "discountedPrice">) =>
  product.price > 0 && product.price > product.discountedPrice;

export const buildCartItemFromProduct = (
  product: Product,
  options?: {
    colorId?: string;
    sizeName?: string;
    quantity?: number;
  }
): ProductCartPayload => {
  const preferredColor =
    product.colors.find((color) => color.id === options?.colorId) || product.colors[0];
  const fallbackVariant =
    preferredColor?.variants.find((variant) => variant.stockQuantity > 0) ||
    preferredColor?.variants[0] ||
    product.colors.flatMap((color) => color.variants).find((variant) => variant.stockQuantity > 0) ||
    product.colors.flatMap((color) => color.variants)[0];
  const selectedVariant =
    preferredColor?.variants.find((variant) => variant.sizeName === options?.sizeName) ||
    fallbackVariant;
  const selectedColor =
    product.colors.find((color) => color.variants.some((variant) => variant.id === selectedVariant?.id)) ||
    preferredColor;
  const previewImages = selectedColor?.images.length
    ? selectedColor.images
    : product.imgs.previews;

  return {
    id: selectedVariant?.id || product.id,
    productId: product.id,
    productSlug: product.slug,
    title: product.title,
    price: selectedVariant?.originalPrice || product.price,
    discountedPrice: selectedVariant?.salePrice || selectedVariant?.originalPrice || product.discountedPrice,
    quantity: options?.quantity ?? 1,
    imgs: {
      thumbnails: previewImages,
      previews: previewImages,
    },
    variantId: selectedVariant?.id,
    colorId: selectedColor?.id,
    colorName: selectedColor?.name,
    sizeName: selectedVariant?.sizeName,
    imageUrl: previewImages[0] || product.imgs.previews[0],
  };
};

const sanitizeProductImageUrl = (imageUrl?: string) => {
  if (!imageUrl) {
    return PRODUCT_PLACEHOLDER;
  }

  if (imageUrl.startsWith("/")) {
    return imageUrl;
  }

  try {
    const parsedUrl = new URL(imageUrl);
    return isAllowedRemoteHost(parsedUrl.hostname)
      ? imageUrl
      : PRODUCT_PLACEHOLDER;
  } catch {
    return PRODUCT_PLACEHOLDER;
  }
};

const isAllowedRemoteHost = (hostname: string) => {
  return (
    ALLOWED_REMOTE_HOSTS.has(hostname) ||
    hostname === "yodycdn.com" ||
    hostname.endsWith(".yodycdn.com")
  );
};
