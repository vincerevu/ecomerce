import type { Category } from "../../api/categoryApi";
import type { CustomerRecord } from "../../api/customerApi";
import type { OrderRecord } from "../../api/orderApi";
import type { PaymentProvider, PaymentRecord } from "../../api/paymentApi";

type ProductColorLike = {
  variants?: Array<{ stockQuantity?: number; salePrice?: number }>;
};

export type RawProductLike = {
  id: string;
  name: string;
  status?: string;
  createdAt?: string;
  colors?: ProductColorLike[];
};

export type DashboardProduct = {
  id: string;
  name: string;
  status: string;
  createdAt?: string;
  colors: ProductColorLike[];
  totalStock: number;
  totalVariants: number;
};

export type DashboardMetrics = {
  totalOrders: number;
  processingOrders: number;
  deliveredRevenue: number;
  totalPayments: number;
  paidPayments: number;
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  totalCustomers: number;
  activeCustomers: number;
  totalCategories: number;
  rootCategories: number;
};

export function normalizeProducts(products: RawProductLike[]): DashboardProduct[] {
  return products.map((product) => {
    const colors = product.colors || [];
    const variants = colors.flatMap((color) => color.variants || []);
    const totalStock = variants.reduce((sum, variant) => sum + (variant.stockQuantity || 0), 0);

    return {
      id: product.id,
      name: product.name,
      status: product.status || "INACTIVE",
      createdAt: product.createdAt,
      colors,
      totalStock,
      totalVariants: variants.length,
    };
  });
}

export function buildDashboardMetrics({
  orders,
  payments,
  products,
  customers,
  categories,
}: {
  orders: OrderRecord[];
  payments: PaymentRecord[];
  products: DashboardProduct[];
  customers: CustomerRecord[];
  categories: Category[];
}): DashboardMetrics {
  return {
    totalOrders: orders.length,
    processingOrders: orders.filter((order) =>
      ["PENDING", "CONFIRMED", "PACKING", "SHIPPING"].includes(order.status),
    ).length,
    deliveredRevenue: orders
      .filter((order) => order.status === "DELIVERED")
      .reduce((sum, order) => sum + (order.totalAmount || 0), 0),
    totalPayments: payments.length,
    paidPayments: payments.filter((payment) => payment.status === "PAID").length,
    totalProducts: products.length,
    activeProducts: products.filter((product) => product.status === "ACTIVE").length,
    lowStockProducts: products.filter((product) => product.totalStock > 0 && product.totalStock < 10)
      .length,
    totalCustomers: customers.length,
    activeCustomers: customers.filter((customer) => customer.active).length,
    totalCategories: categories.length,
    rootCategories: categories.filter((category) => !category.parent).length,
  };
}

export function buildRevenueTrend(orders: OrderRecord[]) {
  const dayFormatter = new Intl.DateTimeFormat("vi-VN", { weekday: "short" });
  const baseDates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    return date;
  });

  const totals = new Map<string, number>();
  for (const order of orders) {
    if (order.status !== "DELIVERED" || !order.createdAt) continue;
    const date = new Date(order.createdAt);
    date.setHours(0, 0, 0, 0);
    const key = date.toISOString();
    totals.set(key, (totals.get(key) || 0) + (order.totalAmount || 0));
  }

  return baseDates.map((date) => ({
    label: dayFormatter.format(date),
    value: totals.get(date.toISOString()) || 0,
  }));
}

export function buildOrderStatusRows(orders: OrderRecord[]) {
  const total = Math.max(orders.length, 1);
  const rows = [
    {
      label: "Chờ xác nhận",
      count: orders.filter((order) => order.status === "PENDING").length,
      barClass: "bg-amber-400",
    },
    {
      label: "Đóng gói / xác nhận",
      count: orders.filter((order) => ["CONFIRMED", "PACKING"].includes(order.status)).length,
      barClass: "bg-sky-400",
    },
    {
      label: "Đang giao",
      count: orders.filter((order) => order.status === "SHIPPING").length,
      barClass: "bg-indigo-400",
    },
    {
      label: "Hoàn tất",
      count: orders.filter((order) => order.status === "DELIVERED").length,
      barClass: "bg-emerald-400",
    },
    {
      label: "Đã hủy",
      count: orders.filter((order) => order.status === "CANCELLED").length,
      barClass: "bg-rose-400",
    },
  ];

  return rows.map((row) => ({
    ...row,
    percent: Math.max(6, Math.round((row.count / total) * 100)),
  }));
}

const PAYMENT_PROVIDER_LABELS: Record<PaymentProvider, string> = {
  MANUAL: "Thủ công",
  MOMO: "MoMo",
  VNPAY: "VNPay",
  ZALOPAY: "ZaloPay",
  STRIPE: "Stripe",
};

const PAYMENT_PROVIDER_COLORS: Record<PaymentProvider, string> = {
  MANUAL: "bg-slate-400",
  MOMO: "bg-fuchsia-400",
  VNPAY: "bg-sky-400",
  ZALOPAY: "bg-emerald-400",
  STRIPE: "bg-violet-400",
};

export function buildPaymentChannelRows(payments: PaymentRecord[]) {
  const total = Math.max(payments.length, 1);

  return (Object.keys(PAYMENT_PROVIDER_LABELS) as PaymentProvider[])
    .map((provider) => {
      const items = payments.filter((payment) => payment.provider === provider);
      const amount = items.reduce((sum, item) => sum + (item.amount || 0), 0);
      return {
        label: PAYMENT_PROVIDER_LABELS[provider],
        count: items.length,
        amount,
        percent: Math.round((items.length / total) * 100),
        barClass: PAYMENT_PROVIDER_COLORS[provider],
      };
    })
    .filter((item) => item.count > 0)
    .sort((left, right) => right.amount - left.amount);
}

export function getRecentOrders(orders: OrderRecord[], limit = 5) {
  return [...orders]
    .sort(
      (left, right) =>
        new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime(),
    )
    .slice(0, limit);
}

export function getStockAlerts(products: DashboardProduct[], limit = 5) {
  return [...products]
    .filter((product) => product.totalStock > 0 && product.totalStock < 10)
    .sort((left, right) => left.totalStock - right.totalStock)
    .slice(0, limit);
}
