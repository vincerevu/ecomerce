import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import type { OrderRecord } from "../../api/orderApi";
import { orderApi } from "../../api/orderApi";
import { useAuth } from "../../context/AuthContext";
import {
  EyeIcon,
  PlusIcon,
  TrashBinIcon,
} from "../../icons";
import { showError, showSuccess } from "../../utils/toast";
import { hasAnyPermission } from "../auth/PermissionGuard";
import Loader from "../common/Loader";
import Pagination from "../common/Pagination";
import SortDropdown, { type SortDropdownOption } from "../common/SortDropdown";
import Select, { type Option } from "../form/Select";
import Button from "../ui/button/Button";
import OrderCreateModal from "../orders/OrderCreateModal";
import Badge from "../ui/badge/Badge";
import ConfirmationModal from "../ui/modal/ConfirmationModal";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import {
  ORDER_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  formatCurrency,
  formatDateTime,
  getOrderPreviewImage,
  getOrderStatusMeta,
  getPaymentStatusMeta,
  type OrderSortPreset,
} from "./orderTable.utils";

const PAGE_SIZE = 8;


const STATUS_FILTER_OPTIONS: Option[] = [
  { value: "", label: "Tất cả trạng thái đơn" },
  ...ORDER_STATUS_OPTIONS,
];

const PAYMENT_FILTER_OPTIONS: Option[] = [
  { value: "", label: "Tất cả thanh toán" },
  ...PAYMENT_STATUS_OPTIONS,
];

const ORDER_SORT_OPTIONS: SortDropdownOption[] = [
  { value: "recent", label: "Mới nhất" },
  { value: "valueDesc", label: "Giá trị cao đến thấp" },
  { value: "valueAsc", label: "Giá trị thấp đến cao" },
  { value: "customerAsc", label: "Khách A đến Z" },
  { value: "customerDesc", label: "Khách Z đến A" },
];

const escapeFilterValue = (value: string) => value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

const buildOrderFilter = ({
  searchTerm,
  statusFilter,
  paymentFilter,
}: {
  searchTerm: string;
  statusFilter: string;
  paymentFilter: string;
}) => {
  const filters: string[] = [];

  if (searchTerm.trim()) {
    const safeSearch = escapeFilterValue(searchTerm.trim());
    filters.push(
      `(orderCode~'*${safeSearch}*' or customerName~'*${safeSearch}*' or customerPhone~'*${safeSearch}*' or customerEmail~'*${safeSearch}*')`,
    );
  }

  if (statusFilter) {
    filters.push(`status:'${escapeFilterValue(statusFilter)}'`);
  }

  if (paymentFilter) {
    filters.push(`paymentStatus:'${escapeFilterValue(paymentFilter)}'`);
  }

  return filters.join(" and ");
};

export default function OrdersTable() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [sortPreset, setSortPreset] = useState<OrderSortPreset>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<OrderRecord | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const canCreate = hasAnyPermission(user, "ORDER:CREATE");
  const canUpdate = hasAnyPermission(user, "ORDER:UPDATE");
  const canDelete = hasAnyPermission(user, "ORDER:DELETE");

  const loadOrders = async (page: number) => {
    setIsLoading(true);
    try {
      const filter = buildOrderFilter({
        searchTerm: debouncedSearchTerm,
        statusFilter,
        paymentFilter,
      });
      const sort =
        sortPreset === "valueDesc"
          ? "totalAmount,desc"
          : sortPreset === "valueAsc"
            ? "totalAmount,asc"
            : sortPreset === "customerAsc"
              ? "customerName,asc"
              : sortPreset === "customerDesc"
                ? "customerName,desc"
                : "createdAt,desc";
      const response = await orderApi.getOrders({
        page: Math.max(0, page - 1),
        size: PAGE_SIZE,
        sort,
        ...(filter ? { filter } : {}),
      });
      if (response.code === 1000) {
        setOrders(response.result.data || []);
        setTotalPages(Math.max(1, response.result.totalPages || 1));
        setTotalElements(response.result.totalElements || 0);
      }
    } catch (error) {
      console.error("Failed to load orders", error);
      showError("Không thể tải danh sách đơn hàng.");
      setOrders([]);
      setTotalPages(1);
      setTotalElements(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [searchTerm]);

  const safePage = Math.min(currentPage, totalPages);
  const hasFilters = Boolean(
searchTerm || statusFilter || paymentFilter);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, statusFilter, paymentFilter, sortPreset]);

  useEffect(() => {
    void loadOrders(currentPage);
  }, [currentPage, debouncedSearchTerm, statusFilter, paymentFilter, sortPreset]);

  const handleDeleteOrder = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      await orderApi.delete(deleteTarget.id);
      showSuccess("Đã xóa đơn hàng.");
      setDeleteTarget(null);
      if (orders.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      } else {
        await loadOrders(currentPage);
      }
    } catch (error) {
      console.error("Failed to delete order", error);
      showError("Không thể xóa đơn hàng.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/[0.06] dark:bg-[#111b2d] dark:shadow-[0_22px_48px_rgba(2,6,23,0.34)]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative min-w-0 flex-1 lg:max-w-xl">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Tìm theo mã đơn, tên khách, SĐT hoặc email..."
                  className="h-10 w-full rounded-lg border border-gray-200 bg-transparent pl-9 pr-4 text-sm outline-none transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-white/[0.08] dark:bg-[#162033] dark:text-white/90 dark:placeholder:text-gray-500 dark:focus:border-brand-400/50 dark:focus:ring-brand-500/15"
                />
              </div>
              {canCreate ? (
                <Button size="sm" startIcon={<PlusIcon />} className="shrink-0 self-start lg:self-auto" onClick={() => setIsCreateOpen(true)}>
                  Tạo đơn hàng
                </Button>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <SortDropdown
                value={sortPreset}
                onChange={(value) => setSortPreset(value as OrderSortPreset)}
                options={ORDER_SORT_OPTIONS}
                defaultLabel="Sắp xếp"
                className="min-w-[180px] sm:w-auto"
              />
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                options={STATUS_FILTER_OPTIONS}
                className="min-w-[190px]"
              />
              <Select
                value={paymentFilter}
                onChange={setPaymentFilter}
                options={PAYMENT_FILTER_OPTIONS}
                className="min-w-[190px]"
              />
              {hasFilters ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("");
                    setPaymentFilter("");
                  }}
                  className="h-10 rounded-lg px-4 text-sm font-semibold text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  Xóa lọc
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#111b2d] dark:shadow-[0_20px_46px_rgba(2,6,23,0.32)]">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Đơn hàng</TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Khách nhận</TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Sản phẩm</TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Thanh toán</TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Trạng thái</TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Tổng tiền</TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Hành động</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-16">
                    <div className="flex flex-col items-center justify-center gap-3 text-gray-400">
                      <Loader size="md" />
                      <span className="text-sm">?ang t?i danh s?ch ??n h?ng...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-16 text-center text-sm text-gray-400">
                    Chưa có đơn hàng phù hợp với bộ lọc hiện tại.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => {
                  const orderStatusMeta = getOrderStatusMeta(order.status);
                  const paymentMeta = getPaymentStatusMeta(order.paymentStatus);
                  const previewImage = getOrderPreviewImage(order);
                  return (
                    <TableRow
                      key={order.id}
                      className="transition-colors hover:bg-gray-50/60 dark:hover:bg-white/[0.02]"
                    >
                      <TableCell className="px-5 py-3.5">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-800 dark:text-white/90">
                            {order.orderCode}
                          </p>
                          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                            {formatDateTime(order.createdAt)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3.5">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-800 dark:text-white/90">
                            {order.customerName}
                          </p>
                          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                            {order.customerPhone}
                            {order.customerEmail ? ` • ${order.customerEmail}` : ""}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 overflow-hidden rounded-2xl bg-gray-100 dark:bg-white/[0.05]">
                            {previewImage ? (
                              <img src={previewImage} alt={order.orderCode} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-[10px] text-gray-400">
                                Không ảnh
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90">
                              {order.itemCount} sản phẩm
                            </p>
                            <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                              {order.items[0]?.productName || "Chưa có chi tiết"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3.5">
                        <Badge size="sm" color={paymentMeta.color} variant="light">
                          {paymentMeta.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3.5">
                        <Badge size="sm" color={orderStatusMeta.color} variant="light">
                          {orderStatusMeta.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3.5">
                        <div>
                          <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                            {formatCurrency(order.totalAmount || 0)}
                          </p>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Tạm tính {formatCurrency(order.subtotal || 0)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => navigate(`/orders/${order.id}`)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 dark:border-gray-700 dark:hover:bg-brand-500/10"
                            title="Xem chi tiết"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          {canDelete ? (
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(order)}
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-all hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-gray-700 dark:hover:bg-red-500/10"
                              title="Xóa đơn hàng"
                            >
                              <TrashBinIcon className="h-4 w-4" />
                            </button>
                          ) : null}
                          {!canUpdate && !canDelete ? (
                            <span className="text-xs text-gray-400">Chỉ xem</span>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <Pagination
          currentPage={safePage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          summary={
            totalElements > 0
              ? `Hiển thị ${(safePage - 1) * PAGE_SIZE + 1}-${Math.min(
                  safePage * PAGE_SIZE,
                  totalElements,
                )} trong ${totalElements} đơn hàng`
              : "Không có kết quả"
          }
        />
      </div>
      <OrderCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => {
          setIsCreateOpen(false);
          setCurrentPage(1);
          void loadOrders(1);
        }}
      />
      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteOrder}
        loading={isDeleting}
        variant="danger"
        title="Xóa đơn hàng"
        message="Đơn hàng sẽ bị ẩn khỏi danh sách quản trị. Hành động này không thể hoàn tác."
        confirmText="Xóa đơn"
      />
    </div>
  );
}

