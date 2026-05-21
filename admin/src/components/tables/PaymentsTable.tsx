import { useEffect, useState } from "react";
import type { PaymentRecord } from "../../api/paymentApi";
import { paymentApi } from "../../api/paymentApi";
import { useAuth } from "../../context/AuthContext";
import { useStoredPageSize } from "../../hooks/useStoredPageSize";
import { EyeIcon, PlusIcon, TrashBinIcon } from "../../icons";
import { showError, showSuccess } from "../../utils/toast";
import { hasAnyPermission } from "../auth/PermissionGuard";
import Loader from "../common/Loader";
import Pagination from "../common/Pagination";
import SortDropdown, { type SortDropdownOption } from "../common/SortDropdown";
import Select, { type Option } from "../form/Select";
import Badge from "../ui/badge/Badge";
import Button from "../ui/button/Button";
import ConfirmationModal from "../ui/modal/ConfirmationModal";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import {
  formatCurrency,
  formatDateTime,
  getMethodLabel,
  getPaymentStatusMeta,
  getProviderLabel,
  getTransactionTypeLabel,
  PAYMENT_PROVIDER_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  PAYMENT_TRANSACTION_TYPE_OPTIONS,
  type PaymentSortPreset,
} from "./paymentTable.utils";

const DEFAULT_PAGE_SIZE = 8;

interface PaymentsTableProps {
  onCreate?: () => void;
  onView?: (paymentId: string) => void;
}

const STATUS_FILTER_OPTIONS: Option[] = [
  { value: "", label: "Tất cả trạng thái" },
  ...PAYMENT_STATUS_OPTIONS,
];

const PROVIDER_FILTER_OPTIONS: Option[] = [
  { value: "", label: "Tất cả cổng" },
  ...PAYMENT_PROVIDER_OPTIONS,
];

const TYPE_FILTER_OPTIONS: Option[] = [
  { value: "", label: "Tất cả loại giao dịch" },
  ...PAYMENT_TRANSACTION_TYPE_OPTIONS,
];

const PAYMENT_SORT_OPTIONS: SortDropdownOption[] = [
  { value: "recent", label: "Mới nhất" },
  { value: "amountDesc", label: "Giá trị giảm dần" },
  { value: "amountAsc", label: "Giá trị tăng dần" },
  { value: "providerAsc", label: "Cổng A đến Z" },
  { value: "providerDesc", label: "Cổng Z đến A" },
];

const escapeFilterValue = (value: string) => value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

const buildPaymentFilter = ({
  searchTerm,
  statusFilter,
  providerFilter,
  typeFilter,
}: {
  searchTerm: string;
  statusFilter: string;
  providerFilter: string;
  typeFilter: string;
}) => {
  const filters: string[] = [];

  if (searchTerm.trim()) {
    const safeSearch = escapeFilterValue(searchTerm.trim());
    filters.push(
      `(transactionCode~'*${safeSearch}*' or orderCode~'*${safeSearch}*' or customerName~'*${safeSearch}*' or providerReference~'*${safeSearch}*')`,
    );
  }

  if (statusFilter) {
    filters.push(`status:'${escapeFilterValue(statusFilter)}'`);
  }

  if (providerFilter) {
    filters.push(`provider:'${escapeFilterValue(providerFilter)}'`);
  }

  if (typeFilter) {
    filters.push(`transactionType:'${escapeFilterValue(typeFilter)}'`);
  }

  return filters.join(" and ");
};

export default function PaymentsTable({ onCreate, onView }: PaymentsTableProps) {
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<PaymentRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [providerFilter, setProviderFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sortPreset, setSortPreset] = useState<PaymentSortPreset>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useStoredPageSize("admin.payments.pageSize", DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const canCreate = hasAnyPermission(user, "PAYMENT:CREATE");
  const canDelete = hasAnyPermission(user, "PAYMENT:DELETE");

  const loadPayments = async (page: number) => {
    setIsLoading(true);
    try {
      const filter = buildPaymentFilter({
        searchTerm: debouncedSearchTerm,
        statusFilter,
        providerFilter,
        typeFilter,
      });
      const sort =
        sortPreset === "amountDesc"
          ? "amount,desc"
          : sortPreset === "amountAsc"
            ? "amount,asc"
            : sortPreset === "providerAsc"
              ? "provider,asc"
              : sortPreset === "providerDesc"
                ? "provider,desc"
                : "createdAt,desc";
      const paymentResponse = await paymentApi.getPayments({
        page: Math.max(0, page - 1),
        size: pageSize,
        sort,
        ...(filter ? { filter } : {}),
      });

      if (paymentResponse.code === 1000) {
        setPayments(paymentResponse.result.data || []);
        setTotalPages(Math.max(1, paymentResponse.result.totalPages || 1));
        setTotalElements(paymentResponse.result.totalElements || 0);
      }
    } catch (error) {
      console.error("Failed to load payments", error);
      showError("Không thể tải danh sách giao dịch.");
      setPayments([]);
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

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, statusFilter, providerFilter, typeFilter, sortPreset, pageSize]);

  useEffect(() => {
    void loadPayments(currentPage);
  }, [currentPage, debouncedSearchTerm, statusFilter, providerFilter, typeFilter, sortPreset, pageSize]);

  const safePage = Math.min(currentPage, totalPages);
  const hasFilters = Boolean(searchTerm || statusFilter || providerFilter || typeFilter);

  const handleDeletePayment = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      await paymentApi.delete(deleteTarget.id);
      showSuccess("Đã xóa giao dịch.");
      setDeleteTarget(null);
      if (payments.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      } else {
        await loadPayments(currentPage);
      }
    } catch (error) {
      console.error("Failed to delete payment", error);
      showError("Không thể xóa giao dịch.");
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
                  placeholder="Tìm theo mã giao dịch, mã đơn, khách hàng hoặc mã đối soát..."
                  className="h-10 w-full rounded-lg border border-gray-200 bg-transparent pl-9 pr-4 text-sm outline-none transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-white/[0.08] dark:bg-[#162033] dark:text-white/90 dark:placeholder:text-gray-500 dark:focus:border-brand-400/50 dark:focus:ring-brand-500/15"
                />
              </div>

              {canCreate && onCreate ? (
                <Button size="sm" startIcon={<PlusIcon />} onClick={onCreate} className="shrink-0 self-start lg:self-auto">
                  Thêm giao dịch
                </Button>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <SortDropdown
                value={sortPreset}
                onChange={(value) => setSortPreset(value as PaymentSortPreset)}
                options={PAYMENT_SORT_OPTIONS}
                defaultLabel="Sắp xếp"
                className="min-w-[180px] sm:w-auto"
              />
              <Select value={statusFilter} onChange={setStatusFilter} options={STATUS_FILTER_OPTIONS} className="min-w-[180px] flex-1 sm:flex-none" />
              <Select value={providerFilter} onChange={setProviderFilter} options={PROVIDER_FILTER_OPTIONS} className="min-w-[170px] flex-1 sm:flex-none" />
              <Select value={typeFilter} onChange={setTypeFilter} options={TYPE_FILTER_OPTIONS} className="min-w-[180px] flex-1 sm:flex-none" />
              {hasFilters ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("");
                    setProviderFilter("");
                    setTypeFilter("");
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
                <TableCell isHeader className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Giao dịch</TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Đơn hàng</TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Kênh</TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Loại</TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Số tiền</TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Trạng thái</TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Hành động</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-16">
                    <div className="flex flex-col items-center justify-center gap-3 text-gray-400">
                      <Loader size="md" />
                      <span className="text-sm">Đang tải danh sách giao dịch...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-16 text-center text-sm text-gray-400">
                    Chưa có giao dịch phù hợp với bộ lọc hiện tại.
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => {
                  const statusMeta = getPaymentStatusMeta(payment.status);

                  return (
                    <TableRow key={payment.id} className="transition-colors hover:bg-gray-50/60 dark:hover:bg-white/[0.02]">
                      <TableCell className="px-5 py-3.5">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-800 dark:text-white/90">
                            {payment.transactionCode}
                          </p>
                          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                            {formatDateTime(payment.processedAt || payment.createdAt)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3.5">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-800 dark:text-white/90">
                            {payment.orderCode}
                          </p>
                          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                            {payment.customerName}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3.5">
                        <div>
                          <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                            {getProviderLabel(payment.provider)}
                          </p>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {getMethodLabel(payment.paymentMethod)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3.5">
                        <div>
                          <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                            {getTransactionTypeLabel(payment.transactionType)}
                          </p>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {payment.providerReference || "Chưa có mã đối soát"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3.5">
                        <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                          {formatCurrency(payment.amount || 0)}
                        </p>
                      </TableCell>
                      <TableCell className="px-4 py-3.5">
                        <Badge size="sm" color={statusMeta.color} variant="light">
                          {statusMeta.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {onView ? (
                            <button
                              type="button"
                              onClick={() => onView(payment.id)}
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 dark:border-gray-700 dark:hover:bg-brand-500/10"
                              title="Xem giao dịch"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                          ) : null}
                          {canDelete ? (
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(payment)}
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-all hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-gray-700 dark:hover:bg-red-500/10"
                              title="Xóa giao dịch"
                            >
                              <TrashBinIcon className="h-4 w-4" />
                            </button>
                          ) : null}
                          {!onView && !canDelete ? (
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
          pageSize={pageSize}
          onPageSizeChange={(nextPageSize) => {
            setPageSize(nextPageSize);
            setCurrentPage(1);
          }}
          summary={
            totalElements > 0
              ? `Hiển thị ${(safePage - 1) * pageSize + 1}-${Math.min(
                  safePage * pageSize,
                  totalElements,
                )} trong ${totalElements} giao dịch`
              : "Không có kết quả"
          }
        />
      </div>

      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeletePayment}
        loading={isDeleting}
        variant="danger"
        title="Xóa giao dịch"
        message="Giao dịch sẽ bị ẩn khỏi danh sách quản trị. Hành động này không thể hoàn tác."
        confirmText="Xóa giao dịch"
      />
    </div>
  );
}
