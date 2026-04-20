import type {
  OrderRecord,
  OrderStatus,
  PaymentStatus,
} from "../../api/orderApi";

export type OrderSegment = "all" | "attention" | "shipping" | "done" | "cancelled";
export type OrderSortPreset =
  | ""
  | "recent"
  | "valueDesc"
  | "valueAsc"
  | "customerAsc"
  | "customerDesc";

export const ORDER_STATUS_OPTIONS: Array<{ value: OrderStatus; label: string }> = [
  { value: "PENDING", label: "Chờ xác nhận" },
  { value: "CONFIRMED", label: "Đã xác nhận" },
  { value: "PACKING", label: "Đang đóng gói" },
  { value: "SHIPPING", label: "Đang giao" },
  { value: "DELIVERED", label: "Hoàn tất" },
  { value: "CANCELLED", label: "Đã hủy" },
];

export const PAYMENT_STATUS_OPTIONS: Array<{ value: PaymentStatus; label: string }> = [
  { value: "UNPAID", label: "Chưa thanh toán" },
  { value: "PENDING", label: "Chờ thanh toán" },
  { value: "PARTIALLY_PAID", label: "Thanh toán một phần" },
  { value: "PAID", label: "Đã thanh toán" },
  { value: "REFUNDED", label: "Đã hoàn tiền" },
  { value: "FAILED", label: "Thanh toán lỗi" },
];

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

export const formatCompactCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

export const formatDateTime = (value?: string) => {
  if (!value) return "Chưa có";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

export const getOrderStatusMeta = (status: OrderStatus) => {
  switch (status) {
    case "PENDING":
      return { label: "Chờ xác nhận", color: "warning" as const };
    case "CONFIRMED":
      return { label: "Đã xác nhận", color: "info" as const };
    case "PACKING":
      return { label: "Đang đóng gói", color: "primary" as const };
    case "SHIPPING":
      return { label: "Đang giao", color: "primary" as const };
    case "DELIVERED":
      return { label: "Hoàn tất", color: "success" as const };
    case "CANCELLED":
    default:
      return { label: "Đã hủy", color: "error" as const };
  }
};

export const getPaymentStatusMeta = (status: PaymentStatus) => {
  switch (status) {
    case "PAID":
      return { label: "Đã thanh toán", color: "success" as const };
    case "PENDING":
      return { label: "Chờ thanh toán", color: "warning" as const };
    case "PARTIALLY_PAID":
      return { label: "Thanh toán một phần", color: "primary" as const };
    case "REFUNDED":
      return { label: "Đã hoàn tiền", color: "info" as const };
    case "FAILED":
      return { label: "Lỗi thanh toán", color: "error" as const };
    case "UNPAID":
    default:
      return { label: "Chưa thanh toán", color: "light" as const };
  }
};

export const getOrderPreviewImage = (order: OrderRecord) =>
  order.items.find((item) => item.imageUrl)?.imageUrl || "";

export const buildOrderSummary = (orders: OrderRecord[]) => ({
  total: orders.length,
  attention: orders.filter((order) =>
    ["PENDING", "CONFIRMED", "PACKING"].includes(order.status),
  ).length,
  shipping: orders.filter((order) => order.status === "SHIPPING").length,
  done: orders.filter((order) => order.status === "DELIVERED").length,
  revenue: orders
    .filter((order) => order.status === "DELIVERED")
    .reduce((sum, order) => sum + (order.totalAmount || 0), 0),
});

export const matchesOrderSegment = (
  order: OrderRecord,
  segment: OrderSegment,
) => {
  switch (segment) {
    case "attention":
      return ["PENDING", "CONFIRMED", "PACKING"].includes(order.status);
    case "shipping":
      return order.status === "SHIPPING";
    case "done":
      return order.status === "DELIVERED";
    case "cancelled":
      return order.status === "CANCELLED";
    case "all":
    default:
      return true;
  }
};

export const filterOrders = ({
  orders,
  searchTerm,
  statusFilter,
  paymentFilter,
  segment,
}: {
  orders: OrderRecord[];
  searchTerm: string;
  statusFilter: string;
  paymentFilter: string;
  segment: OrderSegment;
}) => {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  return orders.filter((order) => {
    const matchesSearch =
      !normalizedSearch ||
      order.orderCode.toLowerCase().includes(normalizedSearch) ||
      order.customerName.toLowerCase().includes(normalizedSearch) ||
      order.customerPhone.toLowerCase().includes(normalizedSearch) ||
      (order.customerEmail || "").toLowerCase().includes(normalizedSearch);

    const matchesStatus = !statusFilter || order.status === statusFilter;
    const matchesPayment = !paymentFilter || order.paymentStatus === paymentFilter;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesPayment &&
      matchesOrderSegment(order, segment)
    );
  });
};

export const sortOrders = (
  orders: OrderRecord[],
  sortPreset: OrderSortPreset,
) =>
  [...orders].sort((left, right) => {
    switch (sortPreset) {
      case "":
        return 0;
      case "valueDesc":
        return (right.totalAmount || 0) - (left.totalAmount || 0);
      case "valueAsc":
        return (left.totalAmount || 0) - (right.totalAmount || 0);
      case "customerAsc":
        return left.customerName.localeCompare(right.customerName, "vi");
      case "customerDesc":
        return right.customerName.localeCompare(left.customerName, "vi");
      case "recent":
      default:
        return (
          new Date(right.createdAt || 0).getTime() -
          new Date(left.createdAt || 0).getTime()
        );
    }
  });
