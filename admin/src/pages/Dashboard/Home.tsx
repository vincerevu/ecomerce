import { useEffect, useMemo, useState } from "react";
import { dashboardApi, type DashboardMetrics, type DashboardSummary } from "../../api/dashboardApi";
import Loader from "../../components/common/Loader";
import PageMeta from "../../components/common/PageMeta";
import Badge from "../../components/ui/badge/Badge";
import {
  BoxCubeIcon,
  DollarLineIcon,
  GroupIcon,
  PieChartIcon,
  TimeIcon,
} from "../../icons";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatDateTime(value?: string) {
  if (!value) return "Chưa có";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getOrderStatusMeta(status: string) {
  switch (status) {
    case "DELIVERED":
      return { label: "Hoàn tất", color: "success" as const };
    case "SHIPPING":
      return { label: "Đang giao", color: "primary" as const };
    case "PACKING":
      return { label: "Đóng gói", color: "info" as const };
    case "CONFIRMED":
      return { label: "Đã xác nhận", color: "info" as const };
    case "PENDING":
      return { label: "Chờ xác nhận", color: "warning" as const };
    case "CANCELLED":
    default:
      return { label: "Đã hủy", color: "error" as const };
    }
}

const EMPTY_METRICS: DashboardMetrics = {
  totalOrders: 0,
  processingOrders: 0,
  deliveredRevenue: 0,
  totalPayments: 0,
  paidPayments: 0,
  totalProducts: 0,
  activeProducts: 0,
  lowStockProducts: 0,
  totalCustomers: 0,
  activeCustomers: 0,
  totalCategories: 0,
  rootCategories: 0,
};

const INITIAL_SUMMARY: DashboardSummary = {
  metrics: EMPTY_METRICS,
  revenueTrend: [],
  orderStatuses: [],
  paymentChannels: [],
  recentOrders: [],
  stockAlerts: [],
};

export default function Home() {
  const [summary, setSummary] = useState<DashboardSummary>(INITIAL_SUMMARY);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true);
      setLoadError("");

      try {
        const response = await dashboardApi.getSummary();
        if (response.code === 1000) {
          setSummary(response.result || INITIAL_SUMMARY);
        } else {
          setSummary(INITIAL_SUMMARY);
        }
      } catch (error) {
        console.error("Failed to load dashboard", error);
        setLoadError("Không thể tải dữ liệu tổng quan. Vui lòng thử lại.");
        setSummary(INITIAL_SUMMARY);
      } finally {
        setIsLoading(false);
      }
    };

    void loadDashboard();
  }, []);

  const metrics = useMemo(() => summary.metrics || EMPTY_METRICS, [summary.metrics]);
  const revenueTrend = useMemo(() => summary.revenueTrend || [], [summary.revenueTrend]);
  const statusRows = useMemo(() => summary.orderStatuses || [], [summary.orderStatuses]);
  const paymentChannels = useMemo(() => summary.paymentChannels || [], [summary.paymentChannels]);
  const recentOrders = useMemo(() => summary.recentOrders || [], [summary.recentOrders]);
  const stockAlerts = useMemo(() => summary.stockAlerts || [], [summary.stockAlerts]);

  const maxRevenuePoint = Math.max(...revenueTrend.map((point) => point.value), 1);

  return (
    <>
      <PageMeta
        title="Tổng quan | Hệ thống Admin"
        description="Bảng điều phối tổng quan cho đơn hàng, thanh toán, khách hàng và tồn kho."
      />

      <div className="space-y-6">
        <section className="overflow-hidden rounded-[28px] border border-gray-200 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.08),_transparent_30%),linear-gradient(135deg,#ffffff_0%,#f8fafc_48%,#eef2ff_100%)] px-6 py-6 shadow-[0_22px_54px_rgba(15,23,42,0.08)] dark:border-white/[0.06] dark:bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.16),_transparent_28%),linear-gradient(135deg,#0f172a_0%,#111b2d_48%,#0b1220_100%)] dark:shadow-[0_24px_64px_rgba(2,6,23,0.42)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
           

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[440px]">
              {[
                {
                  label: "Doanh thu giao thành công",
                  value: formatCompactCurrency(metrics.deliveredRevenue),
                  icon: <DollarLineIcon className="h-5 w-5" />,
                  tone:
                    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/18 dark:bg-[#10333a] dark:text-emerald-200",
                },
                {
                  label: "Đơn đang xử lý",
                  value: metrics.processingOrders.toLocaleString("vi-VN"),
                  icon: <TimeIcon className="h-5 w-5" />,
                  tone:
                    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/18 dark:bg-[#3a2d1a] dark:text-amber-200",
                },
                {
                  label: "Khách hàng hoạt động",
                  value: metrics.activeCustomers.toLocaleString("vi-VN"),
                  icon: <GroupIcon className="h-5 w-5" />,
                  tone:
                    "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-400/18 dark:bg-[#122f45] dark:text-sky-200",
                },
                {
                  label: "Sản phẩm sắp hết",
                  value: metrics.lowStockProducts.toLocaleString("vi-VN"),
                  icon: <BoxCubeIcon className="h-5 w-5" />,
                  tone:
                    "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-400/18 dark:bg-[#2a1f48] dark:text-violet-200",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`rounded-2xl border px-4 py-4 ${item.tone}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-current/80">
                      {item.label}
                    </p>
                    <span className="text-current/80">{item.icon}</span>
                  </div>
                  <p className="mt-4 text-2xl font-semibold text-current">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {isLoading ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-3xl border border-gray-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.08)] dark:border-white/[0.06] dark:bg-[#111b2d]">
            <Loader size="lg" />
            <p className="text-sm text-slate-500 dark:text-slate-300">Đang tải dữ liệu tổng quan...</p>
          </div>
        ) : loadError ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200">
            {loadError}
          </div>
        ) : (
          <>
            <section className="grid grid-cols-1 gap-4 xl:grid-cols-4">
              {[
                {
                  title: "Tổng đơn hàng",
                  value: metrics.totalOrders.toLocaleString("vi-VN"),
                  caption: "Toàn bộ đơn trong hệ thống",
                  accent:
                    "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/18 dark:bg-violet-500/8 dark:text-violet-200",
                },
                {
                  title: "Thanh toán thành công",
                  value: metrics.paidPayments.toLocaleString("vi-VN"),
                  caption: `${metrics.totalPayments.toLocaleString("vi-VN")} giao dịch đã ghi nhận`,
                  accent:
                    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/18 dark:bg-emerald-500/8 dark:text-emerald-200",
                },
                {
                  title: "Danh mục đang dùng",
                  value: metrics.totalCategories.toLocaleString("vi-VN"),
                  caption: `${metrics.rootCategories.toLocaleString("vi-VN")} danh mục gốc`,
                  accent:
                    "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/18 dark:bg-sky-500/8 dark:text-sky-200",
                },
                {
                  title: "Sản phẩm đang bán",
                  value: metrics.activeProducts.toLocaleString("vi-VN"),
                  caption: `${metrics.totalProducts.toLocaleString("vi-VN")} sản phẩm toàn kho`,
                  accent:
                    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/18 dark:bg-amber-500/8 dark:text-amber-200",
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="rounded-3xl border border-gray-200 bg-white px-5 py-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] dark:border-white/[0.06] dark:bg-[#111b2d] dark:shadow-[0_18px_40px_rgba(2,6,23,0.34)]"
                >
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${card.accent}`}>
                    {card.title}
                  </span>
                  <p className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">{card.value}</p>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{card.caption}</p>
                </div>
              ))}
            </section>

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr_0.7fr]">
              <div className="rounded-3xl border border-gray-200 bg-white px-5 py-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] dark:border-white/[0.06] dark:bg-[#111b2d] dark:shadow-[0_18px_40px_rgba(2,6,23,0.34)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      Doanh thu 7 ngày
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
                      Biểu đồ doanh thu giao thành công theo ngày
                    </h2>
                  </div>
                  <Badge size="sm" color="success" variant="light">
                    {formatCurrency(metrics.deliveredRevenue)}
                  </Badge>
                </div>

                <div className="mt-6 grid grid-cols-7 gap-3">
                  {revenueTrend.map((point) => (
                    <div key={point.label} className="flex flex-col items-center gap-3">
                      <div className="flex h-44 w-full items-end rounded-2xl bg-slate-100 px-2 pb-2 pt-4 dark:bg-white/[0.03]">
                        <div
                          className={`w-full rounded-xl ${
                            point.value === maxRevenuePoint
                              ? "bg-brand-500 shadow-[0_12px_24px_rgba(99,102,241,0.28)]"
                              : "bg-brand-400/80 shadow-[0_10px_20px_rgba(99,102,241,0.18)]"
                          }`}
                          style={{
                            height: `${Math.max(14, (point.value / maxRevenuePoint) * 100)}%`,
                          }}
                        />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-semibold text-slate-700 dark:text-white/80">{point.label}</p>
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                          {point.value > 0 ? formatCompactCurrency(point.value) : "0 đ"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-gray-200 bg-white px-5 py-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] dark:border-white/[0.06] dark:bg-[#111b2d] dark:shadow-[0_18px_40px_rgba(2,6,23,0.34)]">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-brand-500/10 p-3 text-brand-500 dark:text-brand-300">
                    <PieChartIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      Thống kê đơn hàng
                    </p>
                    <h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">
                      Trạng thái hiện tại
                    </h2>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {statusRows.map((row) => (
                    <div key={row.label}>
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <span className="text-sm text-slate-700 dark:text-slate-300">{row.label}</span>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                          {row.count.toLocaleString("vi-VN")}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200 dark:bg-white/[0.06]">
                        <div
                          className={`h-2 rounded-full ${row.barClass}`}
                          style={{ width: `${row.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-3xl border border-gray-200 bg-white px-5 py-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] dark:border-white/[0.06] dark:bg-[#111b2d] dark:shadow-[0_18px_40px_rgba(2,6,23,0.34)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      Đơn mới nhất
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
                      Những đơn cần bạn quan sát trước
                    </h2>
                  </div>
                  <Badge size="sm" color="info" variant="light">
                    {recentOrders.length} đơn
                  </Badge>
                </div>

                <div className="mt-5 space-y-3">
                  {recentOrders.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500 dark:border-white/[0.12] dark:bg-white/[0.02] dark:text-slate-400">
                      Chưa có đơn hàng để hiển thị.
                    </div>
                  ) : (
                    recentOrders.map((order) => {
                      const statusMeta = getOrderStatusMeta(order.status);
                      return (
                        <div
                          key={order.id}
                          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-white/[0.06] dark:bg-white/[0.02]"
                        >
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">{order.orderCode}</p>
                              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                {order.customerName} • {order.itemCount} sản phẩm
                              </p>
                              <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                                {formatDateTime(order.createdAt)}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge size="sm" color={statusMeta.color} variant="light">
                                {statusMeta.label}
                              </Badge>
                              <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-white/[0.08] dark:text-white/85">
                                {formatCurrency(order.totalAmount || 0)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-3xl border border-gray-200 bg-white px-5 py-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] dark:border-white/[0.06] dark:bg-[#111b2d] dark:shadow-[0_18px_40px_rgba(2,6,23,0.34)]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                        Cảnh báo tồn kho
                      </p>
                      <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
                        Sản phẩm cần nhập thêm
                      </h2>
                    </div>
                    <Badge size="sm" color="warning" variant="light">
                      {stockAlerts.length} mục
                    </Badge>
                  </div>

                  <div className="mt-5 space-y-3">
                    {stockAlerts.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500 dark:border-white/[0.12] dark:bg-white/[0.02] dark:text-slate-400">
                        Chưa có cảnh báo tồn kho thấp.
                      </div>
                    ) : (
                      stockAlerts.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/[0.06] dark:bg-white/[0.02]"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{product.name}</p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              {product.totalVariants} biến thể
                            </p>
                          </div>
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:border-amber-400/25 dark:bg-amber-500/10 dark:text-amber-200">
                            Còn {product.totalStock}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-3xl border border-gray-200 bg-white px-5 py-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] dark:border-white/[0.06] dark:bg-[#111b2d] dark:shadow-[0_18px_40px_rgba(2,6,23,0.34)]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                        Kênh thanh toán
                      </p>
                      <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
                        Phân bổ giao dịch theo cổng
                      </h2>
                    </div>
                    <Badge size="sm" color="success" variant="light">
                      {metrics.totalPayments} giao dịch
                    </Badge>
                  </div>

                  <div className="mt-5 space-y-3">
                    {paymentChannels.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500 dark:border-white/[0.12] dark:bg-white/[0.02] dark:text-slate-400">
                        Chưa có dữ liệu thanh toán.
                      </div>
                    ) : (
                      paymentChannels.map((channel) => (
                        <div key={channel.label}>
                          <div className="mb-1 flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">{channel.label}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {channel.count.toLocaleString("vi-VN")} giao dịch • {formatCompactCurrency(channel.amount)}
                              </p>
                            </div>
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                              {channel.percent}%
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-200 dark:bg-white/[0.06]">
                            <div
                              className={`h-2 rounded-full ${channel.barClass}`}
                              style={{ width: `${channel.percent}%` }}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </>
  );
}
