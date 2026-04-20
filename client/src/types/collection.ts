import { Product } from "./product";

type CollectionShowcaseProductVariantResponse = {
  id: string;
  sizeName: string;
  originalPrice: number | string;
  salePrice: number | string;
  stockQuantity: number;
};

type CollectionShowcaseProductImageResponse = {
  id: string;
  url: string;
  isMain: boolean;
};

type CollectionShowcaseProductColorResponse = {
  id: string;
  colorName: string;
  hexCode: string;
  images?: CollectionShowcaseProductImageResponse[];
  variants?: CollectionShowcaseProductVariantResponse[];
};

type CollectionShowcaseProductResponse = {
  id: string;
  name: string;
  slug: string;
  createdAt?: string;
  status?: string;
  colors?: CollectionShowcaseProductColorResponse[];
};

export type CollectionShowcaseResponse = {
  id: string;
  name: string;
  slug: string;
  seoTitle?: string;
  seoDescription?: string;
  sourceUrl?: string;
  coverMediaUrl?: string;
  coverMediaType?: string;
  productCount?: number;
  linkedProductCount?: number;
  previewPageCount?: number;
  products?: CollectionShowcaseProductResponse[];
};

export type CollectionShowcase = {
  id: string;
  name: string;
  slug: string;
  seoTitle: string;
  seoDescription: string;
  sourceUrl: string;
  coverMediaUrl: string;
  coverMediaType: string;
  productCount: number;
  linkedProductCount: number;
  previewPageCount: number;
  products: Product[];
};

const COLLECTION_PLACEHOLDER = "/images/hero/hero-bg.png";

export const normalizeCollectionShowcase = (
  collection: CollectionShowcaseResponse
): CollectionShowcase => ({
  id: collection.id,
  name: collection.name,
  slug: collection.slug,
  seoTitle: collection.seoTitle || collection.name,
  seoDescription: collection.seoDescription || "",
  sourceUrl: collection.sourceUrl || "",
  coverMediaUrl: collection.coverMediaUrl || COLLECTION_PLACEHOLDER,
  coverMediaType: collection.coverMediaType || "IMAGE",
  productCount: collection.productCount || 0,
  linkedProductCount: collection.linkedProductCount || 0,
  previewPageCount: collection.previewPageCount || 1,
  products: (collection.products || []).map(normalizeCollectionProduct),
});

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

const normalizeCollectionProduct = (
  product: CollectionShowcaseProductResponse
): Product => {
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
  const salePrices = allVariants
    .map((variant) => variant.salePrice || variant.originalPrice)
    .filter((price) => price > 0);
  const originalPrices = allVariants
    .map((variant) => variant.originalPrice || variant.salePrice)
    .filter((price) => price > 0);

  const discountedPrice =
    salePrices.length > 0 ? Math.min(...salePrices) : 0;
  const price =
    originalPrices.length > 0
      ? Math.max(...originalPrices)
      : discountedPrice;
  const totalStock = allVariants.reduce(
    (sum, variant) => sum + (variant.stockQuantity || 0),
    0
  );
  const imageSet =
    allImages.length > 0 ? allImages : [PRODUCT_PLACEHOLDER];

  return {
    id: product.id,
    title: product.name,
    name: product.name,
    slug: product.slug,
    description: "",
    shortDescription: "",
    material: "",
    categoryId: "",
    categoryName: "Chưa phân loại",
    categorySlug: "",
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
    updatedAt: "",
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
