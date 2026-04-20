import type {
  PaymentMethod,
  PaymentProvider,
  PaymentRecord,
  PaymentStatus,
  PaymentTransactionType,
} from "../../api/paymentApi";

export type PaymentSegment = "all" | "paid" | "pending" | "failed" | "refunded";
export type PaymentSortPreset =
  | ""
  | "recent"
  | "amountDesc"
  | "amountAsc"
  | "providerAsc"
  | "providerDesc";

export const PAYMENT_STATUS_OPTIONS: Array<{ value: PaymentStatus; label: string }> = [
  { value: "UNPAID", label: "Chưa thanh toán" },
  { value: "PENDING", label: "Chờ xử lý" },
  { value: "PARTIALLY_PAID", label: "Thanh toán một phần" },
  { value: "PAID", label: "Đã thanh toán" },
  { value: "FAILED", label: "Thất bại" },
  { value: "REFUNDED", label: "Đã hoàn tiền" },
];

export const PAYMENT_PROVIDER_OPTIONS: Array<{ value: PaymentProvider; label: string }> = [
  { value: "MOMO", label: "MoMo" },
  { value: "VNPAY", label: "VNPay" },
  { value: "STRIPE", label: "Stripe" },
  { value: "ZALOPAY", label: "ZaloPay" },
  { value: "MANUAL", label: "Thủ công" },
];

export const PAYMENT_METHOD_OPTIONS: Array<{ value: PaymentMethod; label: string }> = [
  { value: "BANK_TRANSFER", label: "Chuyển khoản" },
  { value: "CARD", label: "Thẻ" },
  { value: "E_WALLET", label: "Ví điện tử" },
  { value: "COD", label: "COD" },
];

export const PAYMENT_TRANSACTION_TYPE_OPTIONS: Array<{
  value: PaymentTransactionType;
  label: string;
}> = [
  { value: "CHARGE", label: "Thu tiền" },
  { value: "REFUND", label: "Hoàn tiền" },
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

export const getPaymentStatusMeta = (status: PaymentStatus) => {
  switch (status) {
    case "PAID":
      return { label: "Đã thanh toán", color: "success" as const };
    case "PENDING":
      return { label: "Chờ xử lý", color: "warning" as const };
    case "PARTIALLY_PAID":
      return { label: "Một phần", color: "primary" as const };
    case "REFUNDED":
      return { label: "Đã hoàn tiền", color: "info" as const };
    case "FAILED":
      return { label: "Thất bại", color: "error" as const };
    case "UNPAID":
    default:
      return { label: "Chưa thanh toán", color: "light" as const };
  }
};

export const getProviderLabel = (provider: PaymentProvider) =>
  PAYMENT_PROVIDER_OPTIONS.find((option) => option.value === provider)?.label || provider;

export const getMethodLabel = (method: PaymentMethod) =>
  PAYMENT_METHOD_OPTIONS.find((option) => option.value === method)?.label || method;

export const getTransactionTypeLabel = (type: PaymentTransactionType) =>
  PAYMENT_TRANSACTION_TYPE_OPTIONS.find((option) => option.value === type)?.label || type;

export const buildPaymentSummary = (payments: PaymentRecord[]) => ({
  total: payments.length,
  paid: payments.filter((payment) => payment.status === "PAID").length,
  pending: payments.filter((payment) => payment.status === "PENDING").length,
  failed: payments.filter((payment) => payment.status === "FAILED").length,
  refunded: payments.filter((payment) => payment.status === "REFUNDED").length,
  volume: payments.reduce((sum, payment) => sum + (payment.amount || 0), 0),
});

export const matchesPaymentSegment = (
  payment: PaymentRecord,
  segment: PaymentSegment,
) => {
  switch (segment) {
    case "paid":
      return payment.status === "PAID";
    case "pending":
      return payment.status === "PENDING";
    case "failed":
      return payment.status === "FAILED";
    case "refunded":
      return payment.status === "REFUNDED";
    case "all":
    default:
      return true;
  }
};

export const filterPayments = ({
  payments,
  searchTerm,
  statusFilter,
  providerFilter,
  typeFilter,
  segment,
}: {
  payments: PaymentRecord[];
  searchTerm: string;
  statusFilter: string;
  providerFilter: string;
  typeFilter: string;
  segment: PaymentSegment;
}) => {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  return payments.filter((payment) => {
    const matchesSearch =
      !normalizedSearch ||
      payment.transactionCode.toLowerCase().includes(normalizedSearch) ||
      payment.orderCode.toLowerCase().includes(normalizedSearch) ||
      payment.customerName.toLowerCase().includes(normalizedSearch) ||
      (payment.providerReference || "").toLowerCase().includes(normalizedSearch);

    const matchesStatus = !statusFilter || payment.status === statusFilter;
    const matchesProvider = !providerFilter || payment.provider === providerFilter;
    const matchesType = !typeFilter || payment.transactionType === typeFilter;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesProvider &&
      matchesType &&
      matchesPaymentSegment(payment, segment)
    );
  });
};

export const sortPayments = (
  payments: PaymentRecord[],
  sortPreset: PaymentSortPreset,
) =>
  [...payments].sort((left, right) => {
    switch (sortPreset) {
      case "":
        return 0;
      case "amountDesc":
        return (right.amount || 0) - (left.amount || 0);
      case "amountAsc":
        return (left.amount || 0) - (right.amount || 0);
      case "providerAsc":
        return getProviderLabel(left.provider).localeCompare(getProviderLabel(right.provider), "vi");
      case "providerDesc":
        return getProviderLabel(right.provider).localeCompare(getProviderLabel(left.provider), "vi");
      case "recent":
      default:
        return (
          new Date(right.processedAt || right.createdAt || 0).getTime() -
          new Date(left.processedAt || left.createdAt || 0).getTime()
        );
    }
  });
