import type { AddressRecord } from "../../api/addressApi";
import type {
  CreateOrderPayload,
  OrderStatus,
  PaymentStatus,
} from "../../api/orderApi";
import type { CreateShipmentPayload } from "../../api/shipmentApi";

export interface ProductVariantOption {
  variantId: string;
  productId: string;
  productName: string;
  productSlug?: string;
  colorName: string;
  sizeName: string;
  salePrice: number;
  originalPrice?: number;
  stockQuantity: number;
  imageUrl?: string;
}

export interface ProductRecordForOrder {
  id: string;
  name: string;
  slug?: string;
  colors?: Array<{
    colorName: string;
    images?: Array<{ imageUrl?: string; main?: boolean; sortOrder?: number }>;
    variants?: Array<{
      id: string;
      sizeName: string;
      salePrice: number;
      originalPrice?: number;
      stockQuantity: number;
    }>;
  }>;
}

export interface DraftOrderItem {
  id: string;
  variantId: string;
  quantity: number;
}

export interface ShippingLocationOption {
  code: string;
  name: string;
  parentCode?: string;
}

export interface PackageDimension {
  weight: number;
  length: number;
  width: number;
  height: number;
}

export const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

export const flattenProductVariants = (
  products: ProductRecordForOrder[],
): ProductVariantOption[] =>
  products.flatMap((product) =>
    (product.colors ?? []).flatMap((color) => {
      const primaryImage = (color.images ?? [])
        .slice()
        .sort((left, right) => {
          const leftScore = left.main ? 0 : 1;
          const rightScore = right.main ? 0 : 1;
          if (leftScore !== rightScore) return leftScore - rightScore;
          return (left.sortOrder ?? Number.MAX_SAFE_INTEGER) - (right.sortOrder ?? Number.MAX_SAFE_INTEGER);
        })[0]?.imageUrl;

      return (color.variants ?? []).map((variant) => ({
        variantId: variant.id,
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        colorName: color.colorName,
        sizeName: variant.sizeName,
        salePrice: Number(variant.salePrice ?? 0),
        originalPrice: Number(variant.originalPrice ?? 0),
        stockQuantity: variant.stockQuantity ?? 0,
        imageUrl: primaryImage,
      }));
    }),
  );

export const findMatchingLocation = (
  options: ShippingLocationOption[],
  rawValue: string,
) => {
  const normalizedRaw = normalizeText(rawValue);
  return (
    options.find((option) => normalizeText(option.name) === normalizedRaw) ??
    options.find((option) => normalizeText(option.name).includes(normalizedRaw)) ??
    options.find((option) => normalizedRaw.includes(normalizeText(option.name))) ??
    null
  );
};

export const formatAddressLabel = (address: AddressRecord) =>
  `${address.receiverName} • ${address.receiverPhone} • ${[
    address.detail,
    address.ward,
    address.district,
    address.province,
  ]
    .filter(Boolean)
    .join(", ")}`;

export const buildShippingAddressText = (params: {
  detail: string;
  wardName: string;
  districtName: string;
  provinceName: string;
}) =>
  [params.detail, params.wardName, params.districtName, params.provinceName]
    .filter(Boolean)
    .join(", ");

export const derivePackageDimension = (
  items: DraftOrderItem[],
  variants: ProductVariantOption[],
): PackageDimension => {
  const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalValue = items.reduce((sum, item) => {
    const variant = variants.find((candidate) => candidate.variantId === item.variantId);
    return sum + (variant?.salePrice ?? 0) * item.quantity;
  }, 0);

  return {
    weight: Math.max(200, totalQuantity * 350),
    length: totalValue > 3000000 ? 32 : 28,
    width: totalQuantity > 3 ? 24 : 20,
    height: Math.max(8, Math.min(24, totalQuantity * 3)),
  };
};

export const buildCreateOrderPayload = (params: {
  userId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: string;
  shippingDetail?: string;
  shippingProvinceName?: string;
  shippingProvinceCode?: string;
  shippingDistrictName?: string;
  shippingDistrictCode?: string;
  shippingWardName?: string;
  shippingWardCode?: string;
  notes?: string;
  shippingFee: number;
  discountAmount: number;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  items: DraftOrderItem[];
  variants: ProductVariantOption[];
}): CreateOrderPayload => ({
  userId: params.userId,
  customerName: params.customerName,
  customerPhone: params.customerPhone,
  customerEmail: params.customerEmail,
  shippingAddress: params.shippingAddress,
  shippingDetail: params.shippingDetail,
  shippingProvinceName: params.shippingProvinceName,
  shippingProvinceCode: params.shippingProvinceCode,
  shippingDistrictName: params.shippingDistrictName,
  shippingDistrictCode: params.shippingDistrictCode,
  shippingWardName: params.shippingWardName,
  shippingWardCode: params.shippingWardCode,
  notes: params.notes,
  shippingFee: params.shippingFee,
  discountAmount: params.discountAmount,
  paymentStatus: params.paymentStatus,
  status: params.status,
  items: params.items
    .map((item) => {
      const variant = params.variants.find(
        (candidate) => candidate.variantId === item.variantId,
      );
      if (!variant) return null;
      return {
        productId: variant.productId,
        productVariantId: variant.variantId,
        quantity: item.quantity,
        unitPrice: variant.salePrice,
        productName: variant.productName,
        productSlug: variant.productSlug,
        colorName: variant.colorName,
        sizeName: variant.sizeName,
        imageUrl: variant.imageUrl,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item)),
});

export const buildCreateShipmentPayload = (params: {
  orderId: string;
  fromDistrictId?: number;
  serviceId?: number;
  serviceTypeId?: number;
  requiredNote?: string;
  codAmount: number;
  insuranceValue: number;
  packageDimension: PackageDimension;
  toName: string;
  toPhone: string;
  toAddress: string;
  toProvinceName: string;
  toDistrictName: string;
  toWardName: string;
  toDistrictId: number;
  toWardCode: string;
  note?: string;
}): CreateShipmentPayload => ({
  orderId: params.orderId,
  fromDistrictId: params.fromDistrictId,
  serviceId: params.serviceId,
  serviceTypeId: params.serviceTypeId,
  paymentTypeId: 1,
  requiredNote: params.requiredNote,
  codAmount: params.codAmount,
  insuranceValue: params.insuranceValue,
  weight: params.packageDimension.weight,
  length: params.packageDimension.length,
  width: params.packageDimension.width,
  height: params.packageDimension.height,
  toName: params.toName,
  toPhone: params.toPhone,
  toAddress: params.toAddress,
  toProvinceName: params.toProvinceName,
  toDistrictName: params.toDistrictName,
  toWardName: params.toWardName,
  toDistrictId: params.toDistrictId,
  toWardCode: params.toWardCode,
  note: params.note,
});
