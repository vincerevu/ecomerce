import { useEffect, useState } from "react";
import { couponApi, CouponPayload, CouponPaymentMethod, CouponRecord, CouponScope, DiscountType } from "../api/couponApi";
import { customerApi, CustomerRecord } from "../api/customerApi";
import { membershipTierApi, MembershipTierRecord } from "../api/membershipTierApi";
import Loader from "../components/common/Loader";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Pagination from "../components/common/Pagination";
import DatePicker from "../components/form/date-picker";
import Select from "../components/form/Select";
import Switch from "../components/form/switch/Switch";
import Badge from "../components/ui/badge/Badge";
import Button from "../components/ui/button/Button";
import { Modal } from "../components/ui/modal";
import ConfirmationModal from "../components/ui/modal/ConfirmationModal";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../components/ui/table";
import { useStoredPageSize } from "../hooks/useStoredPageSize";
import { PencilIcon, PlusIcon, TrashBinIcon } from "../icons";
import { showError, showSuccess } from "../utils/toast";

const DEFAULT_PAGE_SIZE = 8;

const emptyForm: CouponPayload = {
  code: "",
  name: "",
  discountType: "PERCENT",
  discountValue: 10,
  minOrderAmount: undefined,
  maxDiscountAmount: undefined,
  usageLimit: undefined,
  startsAt: undefined,
  endsAt: undefined,
  active: true,
  scope: "ALL",
  paymentMethod: "ALL",
  targetMembershipTierId: undefined,
  targetUserId: undefined,
};

const inputClassName = "h-11 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100 dark:border-white/[0.08] dark:bg-[#162033] dark:text-white dark:focus:border-sky-400/60 dark:focus:ring-sky-500/15";

const discountTypeOptions = [
  { value: "PERCENT", label: "Giảm theo phần trăm" },
  { value: "FIXED", label: "Giảm tiền cố định" },
];

const statusOptions = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "true", label: "Đang bật" },
  { value: "false", label: "Đã tắt" },
];

const scopeOptions = [
  { value: "ALL", label: "Tất cả khách hàng" },
  { value: "MEMBERSHIP_TIER", label: "Theo hạng thành viên" },
  { value: "CUSTOMER", label: "Khách hàng cụ thể" },
];

const paymentMethodOptions = [
  { value: "ALL", label: "Mọi phương thức" },
  { value: "COD", label: "COD / thanh toán khi nhận" },
  { value: "SEPAY", label: "SePay / chuyển khoản" },
];

const formatCurrency = (value?: number) => `${(value || 0).toLocaleString("vi-VN")}đ`;
const formatDate = (value?: string) => {
  if (!value) return "Không giới hạn";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Không giới hạn" : date.toLocaleDateString("vi-VN");
};
const toDatePickerValue = (value?: string) => value?.slice(0, 10) || undefined;
const toStartOfDay = (date: string) => `${date}T00:00:00`;
const toEndOfDay = (date: string) => `${date}T23:59:59`;
const escapeFilterValue = (value: string) => value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

const buildCouponFilter = ({
  searchTerm,
  statusFilter,
}: {
  searchTerm: string;
  statusFilter: string;
}) => {
  const filters: string[] = [];
  if (searchTerm.trim()) {
    const safeSearch = escapeFilterValue(searchTerm.trim());
    filters.push(`(code~'*${safeSearch}*' or name~'*${safeSearch}*')`);
  }
  if (statusFilter) {
    filters.push(`active:${statusFilter}`);
  }
  return filters.join(" and ");
};

export default function Coupons() {
  const [coupons, setCoupons] = useState<CouponRecord[]>([]);
  const [form, setForm] = useState<CouponPayload>(emptyForm);
  const [editingCoupon, setEditingCoupon] = useState<CouponRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CouponRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useStoredPageSize("admin.coupons.pageSize", DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [membershipTiers, setMembershipTiers] = useState<MembershipTierRecord[]>([]);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);

  const updateForm = (patch: Partial<CouponPayload>) => setForm((prev) => ({ ...prev, ...patch }));

  const loadCoupons = async (page: number) => {
    setIsLoading(true);
    try {
      const filter = buildCouponFilter({ searchTerm: debouncedSearchTerm, statusFilter });
      const response = await couponApi.getCoupons({
        page: Math.max(0, page - 1),
        size: pageSize,
        sort: "createdAt,desc",
        ...(filter ? { filter } : {}),
      });
      setCoupons(response.result.data || []);
      setTotalPages(Math.max(1, response.result.totalPages || 1));
      setTotalElements(response.result.totalElements || 0);
    } catch (error) {
      console.error(error);
      showError("Không thể tải mã giảm giá.");
      setCoupons([]);
      setTotalPages(1);
      setTotalElements(0);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCouponTargets = async () => {
    try {
      const [tierResponse, customerResponse] = await Promise.all([
        membershipTierApi.getAll(),
        customerApi.getCustomers({ page: 0, size: 200, sort: "createdAt,desc" }),
      ]);
      setMembershipTiers(tierResponse.result || []);
      setCustomers(customerResponse?.result?.data || []);
    } catch (error) {
      console.error(error);
      showError("Không thể tải hạng thành viên hoặc khách hàng.");
    }
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
    return () => window.clearTimeout(timeout);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, pageSize, statusFilter]);

  useEffect(() => {
    void loadCoupons(currentPage);
  }, [currentPage, debouncedSearchTerm, pageSize, statusFilter]);

  useEffect(() => {
    void loadCouponTargets();
  }, []);

  const safePage = Math.min(currentPage, totalPages);
  const hasFilters = Boolean(searchTerm || statusFilter);
  const tierOptions = membershipTiers.map((tier) => ({
    value: tier.id,
    label: tier.tierName,
  }));
  const customerOptions = customers.map((customer) => ({
    value: customer.id,
    label: `${customer.name || customer.phone}${customer.phone ? ` - ${customer.phone}` : ""}`,
  }));
  const formatScope = (coupon: CouponRecord) => {
    if ((coupon.scope || "ALL") === "MEMBERSHIP_TIER") {
      return coupon.targetMembershipTierName || "Chưa chọn hạng";
    }
    if (coupon.scope === "CUSTOMER") {
      return [coupon.targetUserName, coupon.targetUserPhone].filter(Boolean).join(" - ") || "Chưa chọn khách";
    }
    return "Tất cả khách hàng";
  };

  const openCreateModal = () => {
    setEditingCoupon(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (coupon: CouponRecord) => {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code,
      name: coupon.name,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount,
      maxDiscountAmount: coupon.maxDiscountAmount,
      usageLimit: coupon.usageLimit,
      startsAt: coupon.startsAt,
      endsAt: coupon.endsAt,
      active: coupon.active,
      scope: coupon.scope || "ALL",
      paymentMethod: coupon.paymentMethod || "ALL",
      targetMembershipTierId: coupon.targetMembershipTierId,
      targetUserId: coupon.targetUserId,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCoupon(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.code.trim() || !form.name.trim()) {
      showError("Vui lòng nhập mã và tên chương trình.");
      return;
    }
    if (form.scope === "MEMBERSHIP_TIER" && !form.targetMembershipTierId) {
      showError("Vui lòng chọn hạng thành viên áp dụng.");
      return;
    }
    if (form.scope === "CUSTOMER" && !form.targetUserId) {
      showError("Vui lòng chọn khách hàng áp dụng.");
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        ...form,
        code: form.code.trim().toUpperCase(),
        minOrderAmount: form.minOrderAmount || 0,
        targetMembershipTierId: form.scope === "MEMBERSHIP_TIER" ? form.targetMembershipTierId : undefined,
        targetUserId: form.scope === "CUSTOMER" ? form.targetUserId : undefined,
      };

      if (editingCoupon) {
        await couponApi.update(editingCoupon.id, payload);
        showSuccess("Đã cập nhật mã giảm giá.");
      } else {
        await couponApi.create(payload);
        showSuccess("Đã tạo mã giảm giá.");
        setCurrentPage(1);
      }

      closeModal();
      await loadCoupons(editingCoupon ? currentPage : 1);
    } catch (error: any) {
      console.error(error);
      showError(error?.message || "Không thể lưu mã giảm giá.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await couponApi.delete(deleteTarget.id);
      showSuccess("Đã xóa mã giảm giá.");
      setDeleteTarget(null);
      if (coupons.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      } else {
        await loadCoupons(currentPage);
      }
    } catch (error: any) {
      console.error(error);
      showError(error?.message || "Không thể xóa mã giảm giá.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <PageMeta title="Mã giảm giá | Hệ thống Admin" description="Quản lý coupon" />
      <div className="mb-6">
        <PageBreadcrumb pageTitle="Mã giảm giá" />
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/[0.06] dark:bg-[#111b2d] dark:shadow-[0_22px_48px_rgba(2,6,23,0.34)]">
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
                placeholder="Tìm theo mã hoặc tên chương trình..."
                className="h-10 w-full rounded-lg border border-gray-200 bg-transparent pl-9 pr-4 text-sm outline-none transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-white/[0.08] dark:bg-[#162033] dark:text-white/90 dark:placeholder:text-gray-500 dark:focus:border-brand-400/50 dark:focus:ring-brand-500/15"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                options={statusOptions}
                className="min-w-[170px]"
              />
              {hasFilters ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("");
                  }}
                  className="h-10 rounded-lg px-4 text-sm font-semibold text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  Xóa lọc
                </button>
              ) : null}
              <Button size="sm" startIcon={<PlusIcon />} onClick={openCreateModal}>
                Thêm mã
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#111b2d] dark:shadow-[0_20px_46px_rgba(2,6,23,0.32)]">
          <div className="w-full overflow-x-auto">
            <Table className="min-w-[1180px]">
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Mã giảm giá</TableCell>
                  <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Giá trị</TableCell>
                  <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Điều kiện</TableCell>
                  <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Áp dụng cho</TableCell>
                  <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Hiệu lực</TableCell>
                  <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Lượt dùng</TableCell>
                  <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Trạng thái</TableCell>
                  <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Hành động</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-16">
                      <div className="flex flex-col items-center justify-center gap-3 text-gray-400">
                        <Loader size="md" />
                        <span className="text-sm">Đang tải danh sách mã giảm giá...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : coupons.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-16 text-center text-sm text-gray-400">
                      Chưa có mã giảm giá phù hợp với bộ lọc hiện tại.
                    </TableCell>
                  </TableRow>
                ) : (
                  coupons.map((coupon) => (
                    <TableRow
                      key={coupon.id}
                      className="transition-colors hover:bg-gray-50/60 dark:hover:bg-white/[0.02]"
                    >
                      <TableCell className="px-5 py-4">
                        <div className="min-w-[190px]">
                          <p className="text-sm font-semibold uppercase tracking-wide text-gray-800 dark:text-white/90">
                            {coupon.code}
                          </p>
                          <p className="mt-1 line-clamp-1 text-xs text-gray-500 dark:text-gray-400">
                            {coupon.name}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <div className="min-w-[120px]">
                          <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                            {coupon.discountType === "PERCENT"
                              ? `${coupon.discountValue}%`
                              : formatCurrency(coupon.discountValue)}
                          </p>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {coupon.discountType === "PERCENT" ? "Theo phần trăm" : "Cố định"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <div className="min-w-[180px] text-sm text-gray-700 dark:text-gray-300">
                          <p>Đơn từ {formatCurrency(coupon.minOrderAmount)}</p>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Tối đa {coupon.maxDiscountAmount ? formatCurrency(coupon.maxDiscountAmount) : "không giới hạn"}
                          </p>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {(coupon.paymentMethod || "ALL") === "COD"
                              ? "COD"
                              : coupon.paymentMethod === "SEPAY"
                                ? "SePay"
                                : "Mọi phương thức"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <div className="min-w-[160px]">
                          <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                            {formatScope(coupon)}
                          </p>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {(coupon.scope || "ALL") === "MEMBERSHIP_TIER"
                              ? "Theo hạng"
                              : coupon.scope === "CUSTOMER"
                                ? "Riêng khách hàng"
                                : "Không giới hạn"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <div className="min-w-[170px] text-sm text-gray-700 dark:text-gray-300">
                          <p>{formatDate(coupon.startsAt)}</p>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            đến {formatDate(coupon.endsAt)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                          {coupon.usedCount}/{coupon.usageLimit || "Không giới hạn"}
                        </p>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <Badge size="sm" color={coupon.active ? "success" : "light"} variant="light">
                          {coupon.active ? "Đang bật" : "Đã tắt"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(coupon)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 dark:border-gray-700 dark:hover:bg-brand-500/10"
                            title="Sửa mã giảm giá"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(coupon)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-all hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-gray-700 dark:hover:bg-red-500/10"
                            title="Xóa mã giảm giá"
                          >
                            <TrashBinIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
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
                  )} trong ${totalElements} mã giảm giá`
                : "Không có kết quả"
            }
          />
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} className="max-w-[760px]">
        <form onSubmit={handleSubmit} className="p-6 sm:p-8">
          <div className="pr-12">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {editingCoupon ? "Cập nhật mã giảm giá" : "Thêm mã giảm giá"}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Thiết lập điều kiện sử dụng, giới hạn và thời gian hiệu lực.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Mã coupon
              <input
                value={form.code}
                onChange={(event) => updateForm({ code: event.target.value.toUpperCase() })}
                placeholder="VD: WELCOME10"
                className={`mt-1.5 ${inputClassName}`}
              />
            </label>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tên chương trình
              <input
                value={form.name}
                onChange={(event) => updateForm({ name: event.target.value })}
                placeholder="Giảm giá người mới"
                className={`mt-1.5 ${inputClassName}`}
              />
            </label>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Loại giảm giá
              <Select
                value={form.discountType}
                options={discountTypeOptions}
                onChange={(value) => updateForm({ discountType: value as DiscountType })}
                className="mt-1.5"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Phạm vi áp dụng
              <Select
                value={form.scope || "ALL"}
                options={scopeOptions}
                onChange={(value) =>
                  updateForm({
                    scope: value as CouponScope,
                    targetMembershipTierId: undefined,
                    targetUserId: undefined,
                  })
                }
                className="mt-1.5"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Phương thức thanh toán
              <Select
                value={form.paymentMethod || "ALL"}
                options={paymentMethodOptions}
                onChange={(value) => updateForm({ paymentMethod: value as CouponPaymentMethod })}
                className="mt-1.5"
              />
            </label>
            {form.scope === "MEMBERSHIP_TIER" ? (
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Chọn hạng thành viên
                <Select
                  value={form.targetMembershipTierId || ""}
                  options={tierOptions}
                  placeholder="Chọn hạng áp dụng"
                  onChange={(value) => updateForm({ targetMembershipTierId: value })}
                  className="mt-1.5"
                  searchable
                  menuPlacement="bottom"
                />
              </label>
            ) : null}
            {form.scope === "CUSTOMER" ? (
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Chọn khách hàng
                <Select
                  value={form.targetUserId || ""}
                  options={customerOptions}
                  placeholder="Chọn khách hàng áp dụng"
                  onChange={(value) => updateForm({ targetUserId: value })}
                  className="mt-1.5"
                  searchable
                  searchPlaceholder="Tìm tên hoặc số điện thoại"
                  menuPlacement="bottom"
                />
              </label>
            ) : null}
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Giá trị giảm {form.discountType === "PERCENT" ? "(%)" : "(VNĐ)"}
              <input
                type="number"
                value={form.discountValue}
                onChange={(event) => updateForm({ discountValue: Number(event.target.value) })}
                placeholder={form.discountType === "PERCENT" ? "Ví dụ: 10" : "Ví dụ: 50000"}
                className={`mt-1.5 ${inputClassName}`}
              />
            </label>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Giá trị đơn tối thiểu (VNĐ)
              <input
                type="number"
                value={form.minOrderAmount ?? ""}
                onChange={(event) => updateForm({ minOrderAmount: event.target.value ? Number(event.target.value) : undefined })}
                placeholder="Ví dụ: 300000"
                className={`mt-1.5 ${inputClassName}`}
              />
            </label>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Số tiền giảm tối đa (VNĐ)
              <input
                type="number"
                value={form.maxDiscountAmount || ""}
                onChange={(event) => updateForm({ maxDiscountAmount: event.target.value ? Number(event.target.value) : undefined })}
                placeholder="Bỏ trống nếu không giới hạn"
                className={`mt-1.5 ${inputClassName}`}
              />
            </label>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Giới hạn lượt dùng
              <input
                type="number"
                value={form.usageLimit || ""}
                onChange={(event) => updateForm({ usageLimit: event.target.value ? Number(event.target.value) : undefined })}
                placeholder="Bỏ trống nếu không giới hạn"
                className={`mt-1.5 ${inputClassName}`}
              />
            </label>
            <div className="flex items-end pb-2">
              <Switch
                checked={form.active}
                onChange={(checked) => updateForm({ active: checked })}
                label="Đang kích hoạt"
              />
            </div>
            <DatePicker
              key={`starts-${editingCoupon?.id || "new"}-${form.startsAt || "empty"}`}
              id="coupon-starts-at"
              label="Bắt đầu"
              placeholder="Chọn ngày bắt đầu"
              position="above"
              defaultDate={toDatePickerValue(form.startsAt)}
              onChange={(_, dateStr) => updateForm({ startsAt: dateStr ? toStartOfDay(dateStr) : undefined })}
            />
            <DatePicker
              key={`ends-${editingCoupon?.id || "new"}-${form.endsAt || "empty"}`}
              id="coupon-ends-at"
              label="Kết thúc"
              placeholder="Chọn ngày kết thúc"
              position="above"
              defaultDate={toDatePickerValue(form.endsAt)}
              onChange={(_, dateStr) => updateForm({ endsAt: dateStr ? toEndOfDay(dateStr) : undefined })}
            />
          </div>

          <div className="mt-8 flex justify-end gap-3 border-t border-gray-100 pt-5 dark:border-white/[0.06]">
            <Button variant="outline" onClick={closeModal} disabled={isSaving}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Đang lưu..." : editingCoupon ? "Cập nhật" : "Tạo mã"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={isDeleting}
        variant="danger"
        title="Xóa mã giảm giá"
        message="Mã giảm giá sẽ bị ẩn khỏi hệ thống quản trị và không thể áp dụng trong checkout."
        confirmText="Xóa mã"
      />
    </>
  );
}
