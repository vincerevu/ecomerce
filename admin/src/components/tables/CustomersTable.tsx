import { useEffect, useMemo, useState } from "react";
import type { CustomerRecord } from "../../api/customerApi";
import { customerApi } from "../../api/customerApi";
import { useAuth } from "../../context/AuthContext";
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
  formatDate,
  getCustomerInitials,
  getCustomerTierLabel,
  type CustomerSegment,
  type CustomerSortPreset,
} from "./customerTable.utils";

const PAGE_SIZE = 10;

interface CustomersTableProps {
  onCreate?: () => void;
  onView?: (customerId: string) => void;
}

const STATUS_OPTIONS: Option[] = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "ACTIVE", label: "Đang hoạt động" },
  { value: "BLOCKED", label: "Đã khóa" },
];

const CUSTOMER_SORT_OPTIONS: SortDropdownOption[] = [
  { value: "recent", label: "Mới tham gia" },
  { value: "spent", label: "Chi tiêu cao" },
  { value: "points", label: "Điểm cao" },
  { value: "nameAsc", label: "Tên A đến Z" },
  { value: "nameDesc", label: "Tên Z đến A" },
];

const DEFAULT_TIER_LABELS = ["Thành viên mới", "Silver", "Gold", "VIP", "Diamond"];
const escapeFilterValue = (value: string) => value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

const buildCustomerFilter = ({
  searchTerm,
  tierFilter,
  statusFilter,
  segment,
}: {
  searchTerm: string;
  tierFilter: string;
  statusFilter: string;
  segment: CustomerSegment;
}) => {
  const filters: string[] = [];

  if (searchTerm.trim()) {
    const safeSearch = escapeFilterValue(searchTerm.trim());
    filters.push(`(name~'*${safeSearch}*' or phone~'*${safeSearch}*' or email~'*${safeSearch}*')`);
  }

  if (tierFilter) {
    if (tierFilter === "Thành viên mới") {
      filters.push("(membershipTier is null or membershipTier.tierName:'Thành viên mới')");
    } else {
      filters.push(`membershipTier.tierName:'${escapeFilterValue(tierFilter)}'`);
    }
  }

  if (statusFilter) {
    filters.push(statusFilter === "ACTIVE" ? "active:true" : "active:false");
  }

  if (segment === "blocked") {
    filters.push("active:false");
  }

  return filters.join(" and ");
};

const tierBadgeColor = (tierName: string) => {
  const normalizedTier = tierName.toLowerCase();
  if (normalizedTier.includes("vip") || normalizedTier.includes("diamond")) return "warning";
  if (normalizedTier.includes("gold")) return "primary";
  if (normalizedTier.includes("silver")) return "info";
  return "light";
};

export default function CustomersTable({ onCreate, onView }: CustomersTableProps) {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [segment, setSegment] = useState<CustomerSegment>("all");
  const [statusFilter, setStatusFilter] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [sortPreset, setSortPreset] = useState<CustomerSortPreset>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<CustomerRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canCreate = hasAnyPermission(user, "USER:CREATE");
  const canDelete = hasAnyPermission(user, "USER:DELETE");

  const loadCustomers = async (page: number) => {
    setIsLoading(true);
    try {
      const filter = buildCustomerFilter({
        searchTerm: debouncedSearchTerm,
        tierFilter,
        statusFilter,
        segment,
      });
      const sort =
        sortPreset === "spent"
          ? "totalSpent,desc"
          : sortPreset === "points"
            ? "totalPoints,desc"
            : sortPreset === "nameAsc"
              ? "name,asc"
              : sortPreset === "nameDesc"
                ? "name,desc"
                : "createdAt,desc";
      const response = await customerApi.getCustomers({
        page: Math.max(0, page - 1),
        size: PAGE_SIZE,
        sort,
        ...(filter ? { filter } : {}),
      });
      if (response.code === 1000) {
        setCustomers(response.result.data || []);
        setTotalPages(Math.max(1, response.result.totalPages || 1));
        setTotalElements(response.result.totalElements || 0);
      }
    } catch (error) {
      console.error("Failed to load customers", error);
      showError("Không thể tải danh sách khách hàng.");
      setCustomers([]);
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

  const tierOptions = useMemo<Option[]>(() => {
    const tiers = Array.from(
      new Set([...DEFAULT_TIER_LABELS, ...customers.map((customer) => getCustomerTierLabel(customer))]),
    ).sort((left, right) => left.localeCompare(right, "vi"));

    return [
      { value: "", label: "Tất cả hạng thành viên" },
      ...tiers.map((tier) => ({ value: tier, label: tier })),
    ];
  }, [customers]);

  const safePage = Math.min(currentPage, totalPages);
  const hasFilters = Boolean(searchTerm || statusFilter || tierFilter || segment !== "all");

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, tierFilter, statusFilter, sortPreset, segment]);

  useEffect(() => {
    void loadCustomers(currentPage);
  }, [currentPage, debouncedSearchTerm, tierFilter, statusFilter, sortPreset, segment]);

  const handleDeleteCustomer = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await customerApi.delete(deleteTarget.id);
      showSuccess("Đã xóa khách hàng.");
      setDeleteTarget(null);
      if (customers.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      } else {
        await loadCustomers(currentPage);
      }
    } catch (error) {
      console.error("Failed to delete customer", error);
      showError("Không thể xóa khách hàng.");
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
                  placeholder="Tìm theo tên, SĐT hoặc email..."
                  className="h-10 w-full rounded-lg border border-gray-200 bg-transparent pl-9 pr-4 text-sm outline-none transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-white/[0.08] dark:bg-[#162033] dark:text-white/90 dark:placeholder:text-gray-500 dark:focus:border-brand-400/50 dark:focus:ring-brand-500/15"
                />
              </div>
              {canCreate && onCreate ? (
                <Button size="sm" startIcon={<PlusIcon />} onClick={onCreate} className="shrink-0 self-start lg:self-auto">
                  Thêm khách hàng
                </Button>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <SortDropdown
                value={sortPreset}
                onChange={(value) => setSortPreset(value as CustomerSortPreset)}
                options={CUSTOMER_SORT_OPTIONS}
                defaultLabel="Sắp xếp"
                className="min-w-[180px] sm:w-auto"
              />
              <Select value={tierFilter} onChange={setTierFilter} options={tierOptions} placeholder="Hạng thành viên" className="min-w-[180px]" />
              <Select value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} placeholder="Trạng thái" className="min-w-[160px]" />
              {hasFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setSegment("all");
                    setTierFilter("");
                    setStatusFilter("");
                  }}
                  className="h-10 rounded-lg px-4 text-sm font-semibold text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  Xóa lọc
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#111b2d] dark:shadow-[0_20px_46px_rgba(2,6,23,0.32)]">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Khách hàng</TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Hạng</TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Chi tiêu</TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Điểm</TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Tham gia</TableCell>
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
                      <span className="text-sm">Đang tải danh sách khách hàng...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-16 text-center text-sm text-gray-400">
                    Không tìm thấy khách hàng phù hợp.
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => {
                  const tierLabel = getCustomerTierLabel(customer);
                  return (
                    <TableRow key={customer.id} className="transition-colors hover:bg-gray-50/60 dark:hover:bg-white/[0.02]">
                      <TableCell className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-sm font-bold text-white shadow-sm dark:shadow-[0_10px_24px_rgba(124,58,237,0.28)]">
                            {getCustomerInitials(customer.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-800 dark:text-white/90">{customer.name}</p>
                            <p className="truncate text-xs text-gray-500 dark:text-gray-400">{customer.phone}</p>
                            <p className="truncate text-xs text-gray-500 dark:text-gray-400">{customer.email || "Chưa có email"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3.5">
                        <Badge size="sm" color={tierBadgeColor(tierLabel)} variant="light">
                          {tierLabel}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-sm font-semibold text-gray-800 dark:text-white/90">
                        {formatCurrency(customer.totalSpent || 0)}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-sm font-semibold text-gray-800 dark:text-white/90">
                        {customer.totalPoints?.toLocaleString("vi-VN") || 0}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(customer.createdAt)}
                      </TableCell>
                      <TableCell className="px-4 py-3.5">
                        <Badge size="sm" color={customer.active ? "success" : "error"} variant="light">
                          {customer.active ? "Đang hoạt động" : "Đã khóa"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {onView ? (
                            <button
                              type="button"
                              onClick={() => onView(customer.id)}
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 dark:border-gray-700 dark:hover:bg-brand-500/10"
                              title="Xem khách hàng"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                          ) : null}
                          {canDelete ? (
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(customer)}
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-all hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-gray-700 dark:hover:bg-red-500/10"
                              title="Xóa khách hàng"
                            >
                              <TrashBinIcon className="h-4 w-4" />
                            </button>
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
                )} trong ${totalElements} khách hàng`
              : "Không có kết quả"
          }
        />
      </div>

      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteCustomer}
        loading={isDeleting}
        variant="danger"
        title="Xóa khách hàng"
        message="Khách hàng sẽ bị xóa khỏi hệ thống quản trị. Hành động này không thể hoàn tác."
        confirmText="Xóa khách hàng"
      />
    </div>
  );
}
