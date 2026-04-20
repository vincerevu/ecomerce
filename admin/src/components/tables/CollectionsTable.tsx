import { useEffect, useState } from "react";
import { collectionApi, type CollectionRecord } from "../../api/collectionApi";
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

interface CollectionsTableProps {
  onView?: (collection: CollectionRecord) => void;
  onCreate?: () => void;
}

const PAGE_SIZE = 8;
const STATUS_OPTIONS: Option[] = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "true", label: "Đang hiển thị" },
  { value: "false", label: "Tạm ẩn" },
];

type SortPreset = "" | "newest" | "recentlyUpdated" | "sortOrderAsc" | "sortOrderDesc";

const SORT_OPTIONS: SortDropdownOption[] = [
  { value: "newest", label: "Mới nhất" },
  { value: "recentlyUpdated", label: "Cập nhật gần đây" },
  { value: "sortOrderAsc", label: "Ưu tiên tăng dần" },
  { value: "sortOrderDesc", label: "Ưu tiên giảm dần" },
];

const escapeFilterValue = (value: string) => value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

const buildCollectionFilter = ({
  searchTerm,
  statusFilter,
}: {
  searchTerm: string;
  statusFilter: string;
}) => {
  const filters: string[] = [];

  if (searchTerm.trim()) {
    const safeSearch = escapeFilterValue(searchTerm.trim());
    filters.push(
      `(name~'*${safeSearch}*' or slug~'*${safeSearch}*' or seoTitle~'*${safeSearch}*' or sourceUrl~'*${safeSearch}*')`,
    );
  }

  if (statusFilter) {
    filters.push(`status:${statusFilter}`);
  }

  return filters.join(" and ");
};

export default function CollectionsTable({ onView, onCreate }: CollectionsTableProps) {
  const { user } = useAuth();
  const [collections, setCollections] = useState<CollectionRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortPreset, setSortPreset] = useState<SortPreset>("sortOrderAsc");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const canCreate = hasAnyPermission(user, "COLLECTION:CREATE");
  const canDelete = hasAnyPermission(user, "COLLECTION:DELETE");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [searchTerm]);

  useEffect(() => {
    const loadCollections = async () => {
      setIsLoading(true);
      try {
        const filter = buildCollectionFilter({ searchTerm: debouncedSearchTerm, statusFilter });
        const sort =
          sortPreset === "recentlyUpdated"
            ? "updatedAt,desc"
            : sortPreset === "sortOrderDesc"
              ? "sortOrder,desc"
              : sortPreset === "sortOrderAsc"
                ? "sortOrder,asc"
                : "createdAt,desc";

        const response = await collectionApi.getPage({
          page: Math.max(0, currentPage - 1),
          size: PAGE_SIZE,
          sort,
          ...(filter ? { filter } : {}),
        });

        if (response.code === 1000) {
          setCollections(response.result.data || []);
          setTotalPages(Math.max(1, response.result.totalPages || 1));
          setTotalElements(response.result.totalElements || 0);
        }
      } catch (error) {
        console.error("Failed to load collections", error);
        showError("Không thể tải danh sách bộ sưu tập.");
        setCollections([]);
        setTotalPages(1);
        setTotalElements(0);
      } finally {
        setIsLoading(false);
      }
    };

    void loadCollections();
  }, [currentPage, debouncedSearchTerm, reloadKey, sortPreset, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await collectionApi.delete(deleteId);
      showSuccess("Đã xóa bộ sưu tập.");
      if (collections.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      } else {
        setReloadKey((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Failed to delete collection", error);
      showError("Không thể xóa bộ sưu tập.");
    } finally {
      setDeleteId(null);
      setIsDeleting(false);
    }
  };

  const safePage = Math.min(currentPage, totalPages);
  const clearFilters = Boolean(searchTerm || statusFilter);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/[0.06] dark:bg-[#111b2d] dark:shadow-[0_22px_48px_rgba(2,6,23,0.34)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative min-w-0 flex-1 lg:max-w-sm">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Tìm theo tên, slug, SEO title..."
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setCurrentPage(1);
              }}
              className="h-10 w-full rounded-lg border border-gray-200 bg-transparent pl-9 pr-4 text-sm outline-none transition-all focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:border-white/[0.08] dark:bg-[#162033] dark:text-white/90"
            />
          </div>
          {canCreate && onCreate ? (
            <Button size="sm" startIcon={<PlusIcon />} onClick={onCreate} className="shrink-0 self-start lg:self-auto">
              Thêm bộ sưu tập
            </Button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SortDropdown
            value={sortPreset}
            onChange={(value) => {
              setSortPreset(value as SortPreset);
              setCurrentPage(1);
            }}
            options={SORT_OPTIONS}
            defaultLabel="Sắp xếp"
            className="min-w-[180px] sm:w-auto"
          />
          <Select
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}
            options={STATUS_OPTIONS}
            className="min-w-[170px]"
          />
          {clearFilters ? (
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("");
                setCurrentPage(1);
              }}
              className="h-10 rounded-lg px-4 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
            >
              Xóa lọc
            </button>
          ) : null}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#111b2d] dark:shadow-[0_20px_46px_rgba(2,6,23,0.32)]">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Bộ sưu tập</TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Liên kết</TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Nguồn</TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Thứ tự</TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Trạng thái</TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Thao tác</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-16">
                    <div className="flex flex-col items-center justify-center gap-3 text-gray-400">
                      <Loader size="md" />
                      <span className="text-sm">Đang tải dữ liệu...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : collections.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-16 text-center text-sm text-gray-400">
                    Không có bộ sưu tập nào
                  </TableCell>
                </TableRow>
              ) : (
                collections.map((collection) => (
                  <TableRow key={collection.id} className="transition-colors hover:bg-gray-50/60 dark:hover:bg-white/[0.02]">
                    <TableCell className="px-5 py-3.5">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="h-12 w-12 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                          {collection.coverMediaUrl ? (
                            <img src={collection.coverMediaUrl} alt={collection.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-400">Không ảnh</div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="max-w-[220px] truncate text-sm font-semibold leading-tight text-gray-800 dark:text-white/90">{collection.name}</p>
                          <p className="mt-0.5 max-w-[220px] truncate font-mono text-xs text-gray-400">{collection.slug}</p>
                          {collection.seoTitle ? (
                            <p className="mt-1 max-w-[240px] truncate text-[11px] text-gray-400">{collection.seoTitle}</p>
                          ) : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3.5">
                      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                        <p>{(collection.linkedProductCount || 0).toLocaleString("vi-VN")} sản phẩm liên kết</p>
                        <p className="text-xs text-gray-400">Hiển thị {(collection.productCount || 0).toLocaleString("vi-VN")} sản phẩm</p>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3.5">
                      <p className="max-w-[180px] truncate text-sm text-gray-600 dark:text-gray-300">
                        {collection.sourceUrl || "Không có"}
                      </p>
                    </TableCell>
                    <TableCell className="px-4 py-3.5 text-sm text-gray-600 dark:text-gray-300">
                      {(collection.sortOrder || 0).toLocaleString("vi-VN")}
                    </TableCell>
                    <TableCell className="px-4 py-3.5">
                      <Badge size="sm" color={collection.status === false ? "light" : "success"} variant="light">
                        {collection.status === false ? "Tạm ẩn" : "Đang hiển thị"}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {onView ? (
                          <button
                            onClick={() => onView(collection)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-all hover:border-violet-400 hover:bg-violet-50 hover:text-violet-600"
                            title="Xem bộ sưu tập"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                        ) : null}
                        {canDelete ? (
                          <button
                            onClick={() => setDeleteId(collection.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-all hover:border-red-400 hover:bg-red-50 hover:text-red-600"
                            title="Xóa bộ sưu tập"
                          >
                            <TrashBinIcon className="h-4 w-4" />
                          </button>
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
          summary={
            totalElements > 0
              ? `Hiển thị ${(safePage - 1) * PAGE_SIZE + 1}-${Math.min(safePage * PAGE_SIZE, totalElements)} trong ${totalElements} bộ sưu tập`
              : "Không có kết quả"
          }
        />
      </div>

      <ConfirmationModal
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={isDeleting}
        title="Xóa bộ sưu tập"
        message="Bạn có chắc muốn xóa bộ sưu tập này? Các liên kết sản phẩm sẽ bị gỡ khỏi bộ sưu tập."
        confirmText="Xóa ngay"
      />
    </div>
  );
}
