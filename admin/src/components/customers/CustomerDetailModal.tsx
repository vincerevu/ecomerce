import { useEffect, useMemo, useState } from "react";
import type { CustomerRecord } from "../../api/customerApi";
import { orderApi, type OrderRecord } from "../../api/orderApi";
import { paymentApi, type PaymentRecord } from "../../api/paymentApi";
import Loader from "../common/Loader";
import Pagination from "../common/Pagination";
import Badge from "../ui/badge/Badge";
import { Modal } from "../ui/modal";
import {
  formatCompactCurrency,
  formatDate,
  getCustomerInitials,
  getCustomerTierLabel,
} from "../tables/customerTable.utils";

interface CustomerDetailModalProps {
  isOpen: boolean;
  customer: CustomerRecord | null;
  onClose: () => void;
  embedded?: boolean;
}

type CustomerHistoryTab = "overview" | "orders" | "payments";

const HISTORY_PAGE_SIZE = 5;

const HISTORY_TABS: Array<{ key: CustomerHistoryTab; label: string; hint: string }> = [
  { key: "overview", label: "Tổng quan", hint: "Hồ sơ và chỉ số" },
  { key: "orders", label: "Lịch sử mua hàng", hint: "Đơn khách đã đặt" },
  { key: "payments", label: "Lịch sử thanh toán", hint: "Giao dịch liên quan" },
];

const tierBadgeColor = (tierName: string) => {
  const normalizedTier = tierName.toLowerCase();
  if (normalizedTier.includes("vip") || normalizedTier.includes("diamond")) return "warning";
  if (normalizedTier.includes("gold")) return "primary";
  if (normalizedTier.includes("silver")) return "info";
  return "light";
};

const formatGender = (gender?: string) => {
  if (gender === "MALE") return "Nam";
  if (gender === "FEMALE") return "Nữ";
  if (gender === "OTHER") return "Khác";
  return "Chưa cập nhật";
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

const formatDateTime = (value?: string) => {
  if (!value) return "Chưa có";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const getOrderStatusMeta = (status: OrderRecord["status"]) => {
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

const getPaymentStatusMeta = (status: PaymentRecord["status"]) => {
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

const getProviderLabel = (provider: PaymentRecord["provider"]) => {
  switch (provider) {
    case "MOMO":
      return "MoMo";
    case "VNPAY":
      return "VNPay";
    case "ZALOPAY":
      return "ZaloPay";
    case "STRIPE":
      return "Stripe";
    case "MANUAL":
    default:
      return "Thủ công";
  }
};

const getMethodLabel = (method: PaymentRecord["paymentMethod"]) => {
  switch (method) {
    case "BANK_TRANSFER":
      return "Chuyển khoản";
    case "CARD":
      return "Thẻ";
    case "E_WALLET":
      return "Ví điện tử";
    case "COD":
    default:
      return "COD";
  }
};

export default function CustomerDetailModal({
  isOpen,
  customer,
  onClose,
  embedded = false,
}: CustomerDetailModalProps) {
  const [activeTab, setActiveTab] = useState<CustomerHistoryTab>("overview");
  const [orderPage, setOrderPage] = useState(1);
  const [paymentPage, setPaymentPage] = useState(1);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState("");

  useEffect(() => {
    if (!isOpen || !customer) return;

    setActiveTab("overview");
    setOrderPage(1);
    setPaymentPage(1);
    setIsLoadingHistory(true);
    setHistoryError("");

    const loadHistory = async () => {
      try {
        const [ordersResponse, paymentsResponse] = await Promise.all([
          orderApi.getOrders({ page: 0, size: 200, sort: "createdAt,desc" }),
          paymentApi.getPayments({ page: 0, size: 200, sort: "createdAt,desc" }),
        ]);

        const orderList = (ordersResponse.result.data || []).filter(
          (order) =>
            order.userId === customer.id ||
            order.customerPhone === customer.phone ||
            (customer.email && order.customerEmail === customer.email),
        );

        const orderIds = new Set(orderList.map((order) => order.id));
        const paymentList = (paymentsResponse.result.data || []).filter((payment) =>
          orderIds.has(payment.orderId),
        );

        setOrders(orderList);
        setPayments(paymentList);
      } catch (error) {
        console.error("Failed to load customer history", error);
        setHistoryError("Không thể tải lịch sử mua hàng và thanh toán.");
      } finally {
        setIsLoadingHistory(false);
      }
    };

    void loadHistory();
  }, [isOpen, customer]);

  useEffect(() => {
    if (activeTab === "orders") {
      setOrderPage(1);
    }

    if (activeTab === "payments") {
      setPaymentPage(1);
    }
  }, [activeTab]);

  const tierLabel = useMemo(
    () => (customer ? getCustomerTierLabel(customer) : ""),
    [customer],
  );

  const orderSummary = useMemo(
    () => ({
      total: orders.length,
      completed: orders.filter((order) => order.status === "DELIVERED").length,
      pending: orders.filter((order) =>
        ["PENDING", "CONFIRMED", "PACKING", "SHIPPING"].includes(order.status),
      ).length,
      totalSpent: orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
    }),
    [orders],
  );

  const paymentSummary = useMemo(
    () => ({
      total: payments.length,
      paid: payments.filter((payment) => payment.status === "PAID").length,
      pending: payments.filter((payment) => payment.status === "PENDING").length,
      volume: payments.reduce((sum, payment) => sum + (payment.amount || 0), 0),
    }),
    [payments],
  );

  const orderTotalPages = Math.max(1, Math.ceil(orders.length / HISTORY_PAGE_SIZE));
  const safeOrderPage = Math.min(orderPage, orderTotalPages);
  const pagedOrders = orders.slice(
    (safeOrderPage - 1) * HISTORY_PAGE_SIZE,
    safeOrderPage * HISTORY_PAGE_SIZE,
  );

  const paymentTotalPages = Math.max(1, Math.ceil(payments.length / HISTORY_PAGE_SIZE));
  const safePaymentPage = Math.min(paymentPage, paymentTotalPages);
  const pagedPayments = payments.slice(
    (safePaymentPage - 1) * HISTORY_PAGE_SIZE,
    safePaymentPage * HISTORY_PAGE_SIZE,
  );

  if (!customer || (!isOpen && !embedded)) return null;

  const content = (
    <div className={`${embedded ? "overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#0f1728]" : ""}`}>
      <div className="border-b border-gray-200 bg-gradient-to-br from-slate-900 via-[#101a2c] to-slate-900 px-5 py-5 pr-20 dark:border-white/[0.06] sm:px-6 sm:py-6 sm:pr-24">
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-lg font-bold text-white shadow-[0_14px_36px_rgba(124,58,237,0.32)] sm:h-16 sm:w-16 sm:text-xl">
              {getCustomerInitials(customer.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-200/80">
                Hồ sơ khách hàng
              </p>
              <h3 className="mt-1 truncate pr-1 text-xl font-semibold text-white sm:text-2xl">{customer.name}</h3>
              <p className="mt-1 break-all text-sm text-slate-300 sm:break-normal">
                {customer.phone}
                {customer.email ? ` • ${customer.email}` : ""}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 pr-1 sm:pr-0">
            <Badge size="sm" color={tierBadgeColor(tierLabel)} variant="light">
              {tierLabel}
            </Badge>
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                customer.active
                  ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/20"
                  : "bg-red-500/15 text-red-300 ring-1 ring-red-400/20"
              }`}
            >
              {customer.active ? "Đang hoạt động" : "Đã khóa"}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-6 bg-white px-6 py-6 dark:bg-[#0f1728]">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
              Tổng chi tiêu
            </p>
            <p className="mt-3 text-2xl font-semibold text-gray-900 dark:text-white">
              {formatCompactCurrency(customer.totalSpent || 0)}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Giá trị mua hàng đã ghi nhận
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
              Điểm thưởng
            </p>
            <p className="mt-3 text-2xl font-semibold text-gray-900 dark:text-white">
              {(customer.totalPoints || 0).toLocaleString("vi-VN")}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Số điểm tích lũy hiện tại
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
              Ngày tham gia
            </p>
            <p className="mt-3 text-lg font-semibold text-gray-900 dark:text-white">
              {formatDate(customer.createdAt)}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Thời điểm tài khoản được tạo
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {HISTORY_TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                  active
                    ? "border-brand-500 bg-brand-500 text-white shadow-[0_12px_28px_rgba(99,102,241,0.22)]"
                    : "border-gray-200 bg-gray-50 text-gray-700 hover:border-brand-200 hover:bg-brand-50 dark:border-white/[0.08] dark:bg-[#111b2d] dark:text-gray-200 dark:hover:border-brand-400/30 dark:hover:bg-[#162033]"
                }`}
              >
                <p className="text-sm font-semibold">{tab.label}</p>
                <p className={`mt-1 text-xs ${active ? "text-white/80" : "text-gray-500 dark:text-gray-400"}`}>
                  {tab.hint}
                </p>
              </button>
            );
          })}
        </div>

        {isLoadingHistory ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white dark:border-white/[0.06] dark:bg-[#111b2d]">
            <Loader size="md" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Đang tải lịch sử mua hàng và thanh toán...
            </p>
          </div>
        ) : historyError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
            {historyError}
          </div>
        ) : activeTab === "overview" ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-gray-200 bg-white px-5 py-5 dark:border-white/[0.06] dark:bg-[#111b2d]">
              <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                Thông tin cơ bản
              </h4>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Họ và tên</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{customer.name}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Số điện thoại</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{customer.phone}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Email</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                    {customer.email || "Chưa cập nhật"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Giới tính</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                    {formatGender(customer.gender)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Ngày sinh</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                    {formatDate(customer.dateOfBirth)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Loại tài khoản</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{customer.type}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white px-5 py-5 dark:border-white/[0.06] dark:bg-[#111b2d]">
              <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                Tóm tắt hành vi
              </h4>
              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-white/[0.06] dark:bg-white/[0.03]">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Đơn hàng</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                    {orderSummary.total.toLocaleString("vi-VN")} đơn
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {orderSummary.completed.toLocaleString("vi-VN")} đơn hoàn tất, {orderSummary.pending.toLocaleString("vi-VN")} đơn đang xử lý
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-white/[0.06] dark:bg-white/[0.03]">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Thanh toán</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                    {paymentSummary.total.toLocaleString("vi-VN")} giao dịch
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {paymentSummary.paid.toLocaleString("vi-VN")} giao dịch thành công, {paymentSummary.pending.toLocaleString("vi-VN")} đang chờ xử lý
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === "orders" ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4 dark:border-white/[0.06] dark:bg-[#111b2d]">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">Tổng đơn</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{orderSummary.total}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4 dark:border-white/[0.06] dark:bg-[#111b2d]">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">Hoàn tất</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{orderSummary.completed}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4 dark:border-white/[0.06] dark:bg-[#111b2d]">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">Đang xử lý</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{orderSummary.pending}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4 dark:border-white/[0.06] dark:bg-[#111b2d]">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">Giá trị đơn</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{formatCompactCurrency(orderSummary.totalSpent)}</p>
              </div>
            </div>

            <div className="space-y-3">
              {orders.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-5 py-10 text-center text-sm text-gray-500 dark:border-white/[0.08] dark:bg-[#111b2d] dark:text-gray-400">
                  Khách hàng này chưa có đơn hàng nào.
                </div>
              ) : (
                pagedOrders.map((order) => {
                  const statusMeta = getOrderStatusMeta(order.status);
                  const paymentMeta = getPaymentStatusMeta(order.paymentStatus);
                  const firstItem = order.items[0];
                  return (
                    <div
                      key={order.id}
                      className="rounded-2xl border border-gray-200 bg-white px-5 py-4 dark:border-white/[0.06] dark:bg-[#111b2d]"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-start gap-3 sm:gap-4">
                          <div className="h-14 w-14 overflow-hidden rounded-2xl bg-gray-100 dark:bg-white/[0.05]">
                            {firstItem?.imageUrl ? (
                              <img
                                src={firstItem.imageUrl}
                                alt={firstItem.productName}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-gray-400">
                                {order.itemCount} món
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{order.orderCode}</p>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                              {order.itemCount} sản phẩm
                              {firstItem ? ` • ${firstItem.productName}` : ""}
                            </p>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              {formatDateTime(order.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge size="sm" color={statusMeta.color} variant="light">
                            {statusMeta.label}
                          </Badge>
                          <Badge size="sm" color={paymentMeta.color} variant="light">
                            {paymentMeta.label}
                          </Badge>
                          <span className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 dark:border-white/[0.08] dark:text-gray-200">
                            {formatCurrency(order.totalAmount || 0)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-gray-600 dark:text-gray-300 md:grid-cols-3">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-[0.14em] text-gray-400">Giao đến</p>
                          <p className="mt-1">{order.shippingAddress || "Chưa có địa chỉ"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase tracking-[0.14em] text-gray-400">Tạm tính</p>
                          <p className="mt-1">{formatCurrency(order.subtotal || 0)}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase tracking-[0.14em] text-gray-400">Ghi chú</p>
                          <p className="mt-1">{order.notes || "Không có ghi chú"}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {orders.length > HISTORY_PAGE_SIZE ? (
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/[0.06] dark:bg-[#111b2d]">
                <Pagination
                  currentPage={safeOrderPage}
                  totalPages={orderTotalPages}
                  onPageChange={setOrderPage}
                  summary={`Hiển thị ${(safeOrderPage - 1) * HISTORY_PAGE_SIZE + 1}-${Math.min(
                    safeOrderPage * HISTORY_PAGE_SIZE,
                    orders.length,
                  )} trong ${orders.length} đơn hàng`}
                />
              </div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4 dark:border-white/[0.06] dark:bg-[#111b2d]">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">Giao dịch</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{paymentSummary.total}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4 dark:border-white/[0.06] dark:bg-[#111b2d]">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">Đã thu</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{paymentSummary.paid}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4 dark:border-white/[0.06] dark:bg-[#111b2d]">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">Tổng giá trị</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{formatCompactCurrency(paymentSummary.volume)}</p>
              </div>
            </div>

            <div className="space-y-3">
              {payments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-5 py-10 text-center text-sm text-gray-500 dark:border-white/[0.08] dark:bg-[#111b2d] dark:text-gray-400">
                  Chưa có giao dịch thanh toán nào gắn với khách hàng này.
                </div>
              ) : (
                pagedPayments.map((payment) => {
                  const statusMeta = getPaymentStatusMeta(payment.status);
                  return (
                    <div
                      key={payment.id}
                      className="rounded-2xl border border-gray-200 bg-white px-5 py-4 dark:border-white/[0.06] dark:bg-[#111b2d]"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{payment.transactionCode}</p>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {getProviderLabel(payment.provider)} • {getMethodLabel(payment.paymentMethod)} • {payment.orderCode}
                          </p>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {formatDateTime(payment.processedAt || payment.createdAt)}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge size="sm" color={statusMeta.color} variant="light">
                            {statusMeta.label}
                          </Badge>
                          <span className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 dark:border-white/[0.08] dark:text-gray-200">
                            {formatCurrency(payment.amount || 0)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-gray-600 dark:text-gray-300 md:grid-cols-3">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-[0.14em] text-gray-400">Mã tham chiếu</p>
                          <p className="mt-1">{payment.providerReference || "Chưa có"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase tracking-[0.14em] text-gray-400">Loại giao dịch</p>
                          <p className="mt-1">{payment.transactionType === "REFUND" ? "Hoàn tiền" : "Thu tiền"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase tracking-[0.14em] text-gray-400">Ghi chú</p>
                          <p className="mt-1">{payment.notes || payment.failureReason || "Không có ghi chú"}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {payments.length > HISTORY_PAGE_SIZE ? (
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/[0.06] dark:bg-[#111b2d]">
                <Pagination
                  currentPage={safePaymentPage}
                  totalPages={paymentTotalPages}
                  onPageChange={setPaymentPage}
                  summary={`Hiển thị ${(safePaymentPage - 1) * HISTORY_PAGE_SIZE + 1}-${Math.min(
                    safePaymentPage * HISTORY_PAGE_SIZE,
                    payments.length,
                  )} trong ${payments.length} giao dịch`}
                />
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="w-full max-w-[900px] overflow-hidden p-0"
    >
      {content}
    </Modal>
  );
}
