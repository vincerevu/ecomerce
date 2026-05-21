import { useEffect, useState } from "react";
import { reviewApi, ProductReviewRecord } from "../api/reviewApi";
import PermissionGuard, { hasAnyPermission } from "../components/auth/PermissionGuard";
import Loader from "../components/common/Loader";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Pagination from "../components/common/Pagination";
import Select, { type Option } from "../components/form/Select";
import Badge from "../components/ui/badge/Badge";
import ConfirmationModal from "../components/ui/modal/ConfirmationModal";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../components/ui/table";
import { useAuth } from "../context/AuthContext";
import { useStoredPageSize } from "../hooks/useStoredPageSize";
import { EyeCloseIcon, EyeIcon, TrashBinIcon } from "../icons";
import { showError, showSuccess } from "../utils/toast";

const DEFAULT_PAGE_SIZE = 8;

const APPROVAL_OPTIONS: Option[] = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "true", label: "Đang hiển thị" },
  { value: "false", label: "Đang ẩn" },
];

const escapeFilterValue = (value: string) => value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

const buildReviewFilter = ({
  searchTerm,
  approvalFilter,
}: {
  searchTerm: string;
  approvalFilter: string;
}) => {
  const filters: string[] = [];

  if (searchTerm.trim()) {
    const safeSearch = escapeFilterValue(searchTerm.trim());
    filters.push(
      `(product.name~'*${safeSearch}*' or user.name~'*${safeSearch}*' or order.orderCode~'*${safeSearch}*' or comment~'*${safeSearch}*')`,
    );
  }

  if (approvalFilter) {
    filters.push(`approved:${approvalFilter}`);
  }

  return filters.join(" and ");
};

const formatDateTime = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString("vi-VN");
};

const RatingStars = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <span
        key={star}
        className={star <= rating ? "text-warning-500" : "text-gray-300 dark:text-gray-600"}
      >
        ★
      </span>
    ))}
  </div>
);

export default function Reviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ProductReviewRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [approvalFilter, setApprovalFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useStoredPageSize("admin.reviews.pageSize", DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<ProductReviewRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canUpdate = hasAnyPermission(user, "REVIEW:UPDATE");
  const canDelete = hasAnyPermission(user, "REVIEW:DELETE");

  const loadReviews = async (page: number) => {
    setIsLoading(true);
    try {
      const filter = buildReviewFilter({ searchTerm: debouncedSearchTerm, approvalFilter });
      const response = await reviewApi.getReviews({
        page: Math.max(0, page - 1),
        size: pageSize,
        sort: "createdAt,desc",
        ...(filter ? { filter } : {}),
      });
      setReviews(response.result.data || []);
      setTotalPages(Math.max(1, response.result.totalPages || 1));
      setTotalElements(response.result.totalElements || 0);
    } catch (error) {
      console.error(error);
      showError("Không thể tải đánh giá.");
      setReviews([]);
      setTotalPages(1);
      setTotalElements(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
    return () => window.clearTimeout(timeout);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, approvalFilter, pageSize]);

  useEffect(() => {
    void loadReviews(currentPage);
  }, [approvalFilter, currentPage, debouncedSearchTerm, pageSize]);

  const safePage = Math.min(currentPage, totalPages);
  const hasFilters = Boolean(searchTerm || approvalFilter);

  const toggleApproved = async (review: ProductReviewRecord) => {
    try {
      await reviewApi.update(review.id, {
        rating: review.rating,
        comment: review.comment,
        approved: !review.approved,
      });
      showSuccess(review.approved ? "Đã ẩn đánh giá." : "Đã hiển thị đánh giá.");
      await loadReviews(currentPage);
    } catch (error: any) {
      console.error(error);
      showError(error?.message || "Không thể cập nhật đánh giá.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await reviewApi.delete(deleteTarget.id);
      showSuccess("Đã xóa đánh giá.");
      setDeleteTarget(null);
      if (reviews.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      } else {
        await loadReviews(currentPage);
      }
    } catch (error: any) {
      console.error(error);
      showError(error?.message || "Không thể xóa đánh giá.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <PageMeta title="Đánh giá sản phẩm | Hệ thống Admin" description="Quản lý review sản phẩm" />
      <div className="mb-6">
        <PageBreadcrumb pageTitle="Đánh giá sản phẩm" />
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
                placeholder="Tìm theo sản phẩm, khách hàng, mã đơn hoặc nội dung..."
                className="h-10 w-full rounded-lg border border-gray-200 bg-transparent pl-9 pr-4 text-sm outline-none transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-white/[0.08] dark:bg-[#162033] dark:text-white/90 dark:placeholder:text-gray-500 dark:focus:border-brand-400/50 dark:focus:ring-brand-500/15"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={approvalFilter}
                onChange={setApprovalFilter}
                options={APPROVAL_OPTIONS}
                className="min-w-[180px]"
              />
              {hasFilters ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setApprovalFilter("");
                  }}
                  className="h-10 rounded-lg px-4 text-sm font-semibold text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  Xóa lọc
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#111b2d] dark:shadow-[0_20px_46px_rgba(2,6,23,0.32)]">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Sản phẩm</TableCell>
                  <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Khách hàng</TableCell>
                  <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Đánh giá</TableCell>
                  <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Nội dung</TableCell>
                  <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Trạng thái</TableCell>
                  <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Hành động</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-16">
                      <div className="flex flex-col items-center justify-center gap-3 text-gray-400">
                        <Loader size="md" />
                        <span className="text-sm">Đang tải danh sách đánh giá...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : reviews.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-16 text-center text-sm text-gray-400">
                      Chưa có đánh giá phù hợp với bộ lọc hiện tại.
                    </TableCell>
                  </TableRow>
                ) : (
                  reviews.map((review) => (
                    <TableRow
                      key={review.id}
                      className="transition-colors hover:bg-gray-50/60 dark:hover:bg-white/[0.02]"
                    >
                      <TableCell className="px-5 py-4">
                        <div className="min-w-[240px]">
                          <p className="line-clamp-2 text-sm font-semibold text-gray-800 dark:text-white/90">
                            {review.productName || "Sản phẩm"}
                          </p>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {review.orderCode || "Không có mã đơn"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <div className="min-w-[160px]">
                          <p className="truncate text-sm font-semibold text-gray-800 dark:text-white/90">
                            {review.userName || "Khách hàng"}
                          </p>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {formatDateTime(review.createdAt)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <div className="min-w-[120px]">
                          <RatingStars rating={review.rating} />
                          <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                            {review.rating}/5
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <p className="line-clamp-2 max-w-[360px] text-sm text-gray-600 dark:text-gray-300">
                          {review.comment || "Không có nội dung nhận xét."}
                        </p>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <Badge size="sm" color={review.approved ? "success" : "warning"} variant="light">
                          {review.approved ? "Đang hiển thị" : "Đang ẩn"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          <PermissionGuard permission="REVIEW:UPDATE">
                            <button
                              type="button"
                              onClick={() => void toggleApproved(review)}
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 dark:border-gray-700 dark:hover:bg-brand-500/10"
                              title={review.approved ? "Ẩn đánh giá" : "Hiện đánh giá"}
                            >
                              {review.approved ? <EyeCloseIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                            </button>
                          </PermissionGuard>
                          <PermissionGuard permission="REVIEW:DELETE">
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(review)}
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-all hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-gray-700 dark:hover:bg-red-500/10"
                              title="Xóa đánh giá"
                            >
                              <TrashBinIcon className="h-4 w-4" />
                            </button>
                          </PermissionGuard>
                          {!canUpdate && !canDelete ? (
                            <span className="text-xs text-gray-400">Chỉ xem</span>
                          ) : null}
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
                  )} trong ${totalElements} đánh giá`
                : "Không có kết quả"
            }
          />
        </div>
      </div>

      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={isDeleting}
        variant="danger"
        title="Xóa đánh giá"
        message="Đánh giá sẽ bị ẩn khỏi hệ thống quản trị và trang sản phẩm. Hành động này không thể hoàn tác."
        confirmText="Xóa đánh giá"
      />
    </>
  );
}
