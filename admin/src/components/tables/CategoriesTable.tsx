import { useEffect, useMemo, useState } from "react";
import { categoryApi } from "../../api/categoryApi";
import { useAuth } from "../../context/AuthContext";
import { EyeIcon, TrashBinIcon } from "../../icons";
import { showError, showSuccess } from "../../utils/toast";
import PermissionGuard, { hasAnyPermission } from "../auth/PermissionGuard";
import Loader from "../common/Loader";
import Pagination from "../common/Pagination";
import SortDropdown, { type SortDropdownOption } from "../common/SortDropdown";
import Select, { Option } from "../form/Select";
import Badge from "../ui/badge/Badge";
import Button from "../ui/button/Button";
import ConfirmationModal from "../ui/modal/ConfirmationModal";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import { PlusIcon } from "../../icons";

interface CategoryRow {
    id: string;
    name: string;
    slug: string;
    description?: string;
    iconUrl?: string;
    sortOrder: number;
    parent?: { id: string; name: string };
}

interface CategoriesTableProps {
    onView?: (category: CategoryRow) => void;
    onCreate?: () => void;
}

const PAGE_SIZE = 10;
type SortPreset = "" | "sortOrderAsc" | "sortOrderDesc" | "nameAsc" | "nameDesc";
type StructureFilter = "all" | "root" | "child";

const CATEGORY_SORT_OPTIONS: SortDropdownOption[] = [
    { value: "sortOrderAsc", label: "Ưu tiên tăng dần" },
    { value: "sortOrderDesc", label: "Ưu tiên giảm dần" },
    { value: "nameAsc", label: "Tên A đến Z" },
    { value: "nameDesc", label: "Tên Z đến A" },
];

const escapeFilterValue = (value: string) => value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

const buildCategoryFilter = ({
    searchTerm,
    structureFilter,
    parentFilter,
}: {
    searchTerm: string;
    structureFilter: StructureFilter;
    parentFilter: string;
}) => {
    const filters: string[] = [];

    if (searchTerm.trim()) {
        const safeSearch = escapeFilterValue(searchTerm.trim());
        filters.push(
            `(name~'*${safeSearch}*' or slug~'*${safeSearch}*' or parent.name~'*${safeSearch}*')`,
        );
    }

    if (structureFilter === "root") {
        filters.push("parent is null");
    }

    if (structureFilter === "child") {
        filters.push("parent is not null");
    }

    if (parentFilter) {
        filters.push(`parent.id:'${escapeFilterValue(parentFilter)}'`);
    }

    return filters.join(" and ");
};

export default function CategoriesTable({ onView, onCreate }: CategoriesTableProps) {
    const { user } = useAuth();
    const [categories, setCategories] = useState<CategoryRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
    const [sortPreset, setSortPreset] = useState<SortPreset>("");
    const [structureFilter, setStructureFilter] = useState<StructureFilter>("all");
    const [parentFilter, setParentFilter] = useState("");

    const canDelete = hasAnyPermission(user, "CATEGORY:DELETE");
    const canCreate = hasAnyPermission(user, "CATEGORY:CREATE");

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);

        return () => window.clearTimeout(timeout);
    }, [searchTerm]);

    const loadParentOptions = async () => {
        try {
            const response = await categoryApi.getAll();
            if (response.code === 1000) {
                setCategoryOptionsCache(response.result || []);
            }
        } catch (error) {
            console.error("Failed to load categories", error);
            showError("Không thể tải danh mục.");
        }
    };

    const [categoryOptionsCache, setCategoryOptionsCache] = useState<CategoryRow[]>([]);

    const loadPage = async (page: number) => {
        setLoading(true);
        try {
            const filter = buildCategoryFilter({
                searchTerm: debouncedSearchTerm,
                structureFilter,
                parentFilter,
            });
            const sort =
                sortPreset === "nameAsc"
                    ? "name,asc"
                    : sortPreset === "nameDesc"
                      ? "name,desc"
                      : sortPreset === "sortOrderDesc"
                        ? "sortOrder,desc"
                        : "sortOrder,asc";

            const response = await categoryApi.getPage({
                page: Math.max(0, page - 1),
                size: PAGE_SIZE,
                sort,
                ...(filter ? { filter } : {}),
            });

            if (response.code === 1000) {
                setCategories(response.result.data || []);
                setTotalPages(Math.max(1, response.result.totalPages || 1));
                setTotalElements(response.result.totalElements || 0);
            }
        } catch (error) {
            console.error("Failed to load categories", error);
            showError("Không thể tải danh mục.");
            setCategories([]);
            setTotalPages(1);
            setTotalElements(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadParentOptions();
    }, []);

    useEffect(() => {
        void loadPage(currentPage);
    }, [currentPage, debouncedSearchTerm, sortPreset, structureFilter, parentFilter]);

    const parentOptions = useMemo<Option[]>(() => {
        const roots = categoryOptionsCache
            .filter((category) => !category.parent)
            .sort((left, right) => left.name.localeCompare(right.name, "vi"));
        return [{ value: "", label: "Tất cả danh mục cha" }, ...roots.map((category) => ({ value: category.id, label: category.name }))];
    }, [categoryOptionsCache]);

    const safePage = Math.min(currentPage, totalPages);
    const clearFilters = Boolean(searchTerm || parentFilter || structureFilter !== "all");

    const handleDelete = async () => {
        if (!deleteId) return;
        setIsDeleting(true);
        try {
            await categoryApi.delete(deleteId);
            showSuccess("Đã xóa danh mục thành công.");
            if (categories.length === 1 && currentPage > 1) {
                setCurrentPage((prev) => prev - 1);
            } else {
                await loadPage(currentPage);
                await loadParentOptions();
            }
        } catch (error) {
            console.error("Failed to delete category", error);
            showError("Không thể xóa danh mục.");
        } finally {
            setDeleteId(null);
            setIsDeleting(false);
        }
    };

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
                            placeholder="Tìm theo tên, slug, danh mục cha..."
                            value={searchTerm}
                            onChange={(event) => {
                                setSearchTerm(event.target.value);
                                setCurrentPage(1);
                            }}
                            className="h-10 w-full rounded-lg border border-gray-200 bg-transparent pl-9 pr-4 text-sm outline-none transition-all focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:border-white/[0.08] dark:bg-[#162033] dark:text-white/90 dark:placeholder:text-gray-500 dark:focus:border-brand-400/50 dark:focus:ring-brand-500/15"
                        />
                    </div>
                    {canCreate && onCreate ? (
                        <Button size="sm" startIcon={<PlusIcon />} onClick={onCreate} className="shrink-0 self-start lg:self-auto">
                            Thêm danh mục
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
                        options={CATEGORY_SORT_OPTIONS}
                        defaultLabel="Sắp xếp"
                        className="min-w-[180px] sm:w-auto"
                    />
                    <Select
                        value={structureFilter}
                        onChange={(value) => {
                            setStructureFilter(value as StructureFilter);
                            setCurrentPage(1);
                            if (value === "root") setParentFilter("");
                        }}
                        options={[
                            { value: "all", label: "Tất cả cấu trúc" },
                            { value: "root", label: "Danh mục gốc" },
                            { value: "child", label: "Danh mục con" },
                        ]}
                        className="min-w-[170px]"
                    />
                    <Select
                        value={parentFilter}
                        onChange={(value) => {
                            setParentFilter(value);
                            setCurrentPage(1);
                            if (value) setStructureFilter("child");
                        }}
                        options={parentOptions}
                        className="min-w-[190px]"
                    />
                    {clearFilters && (
                        <button
                            onClick={() => {
                                setSearchTerm("");
                                setStructureFilter("all");
                                setParentFilter("");
                                setCurrentPage(1);
                            }}
                            className="h-10 rounded-lg px-4 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
                        >
                            Xóa lọc
                        </button>
                    )}
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#111b2d] dark:shadow-[0_20px_46px_rgba(2,6,23,0.32)]">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                            <TableRow>
                                <TableCell isHeader className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Danh mục</TableCell>
                                <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Slug</TableCell>
                                <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Danh mục cha</TableCell>
                                <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Thứ tự</TableCell>
                                <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Thao tác</TableCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-12">
                                        <div className="flex flex-col items-center justify-center gap-3 text-gray-400">
                                            <Loader size="md" />
                                            <span className="text-sm">Đang tải dữ liệu...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : categories.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="py-12 text-center text-sm text-gray-400">Không có danh mục nào</TableCell></TableRow>
                            ) : (
                                categories.map((category) => (
                                    <TableRow key={category.id} className="transition-colors hover:bg-gray-50/60 dark:hover:bg-white/[0.02]">
                                        <TableCell className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                                                    {category.iconUrl ? <img src={category.iconUrl} alt={category.name} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-400">Không ảnh</div>}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold leading-tight text-gray-800 dark:text-white/90">{category.name}</p>
                                                    {category.description && <p className="mt-0.5 max-w-[220px] truncate text-[11px] text-gray-400">{category.description}</p>}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-4 py-3.5 font-mono text-sm text-gray-500">{category.slug}</TableCell>
                                        <TableCell className="px-4 py-3.5">{category.parent ? <Badge size="sm" color="info" variant="light">{category.parent.name}</Badge> : <span className="text-xs text-gray-400">Danh mục gốc</span>}</TableCell>
                                        <TableCell className="px-4 py-3.5 text-sm text-gray-600">{category.sortOrder}</TableCell>
                                        <TableCell className="px-4 py-3.5">
                                            <div className="flex items-center gap-1.5">
                                                {onView ? (
                                                    <button onClick={() => onView?.(category)} className="rounded-lg border border-gray-100 p-1.5 text-gray-500 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-600" title="Xem danh mục"><EyeIcon className="h-4 w-4" /></button>
                                                ) : null}
                                                <PermissionGuard permission="CATEGORY:DELETE">
                                                    <button onClick={() => setDeleteId(category.id)} className="rounded-lg border border-gray-100 p-1.5 text-gray-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600" title="Xóa danh mục"><TrashBinIcon className="h-4 w-4" /></button>
                                                </PermissionGuard>
                                                {!onView && !canDelete && <span className="text-xs text-gray-400">Không có thao tác</span>}
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
                    summary={totalElements > 0 ? `Hiển thị ${(safePage - 1) * PAGE_SIZE + 1}-${Math.min(safePage * PAGE_SIZE, totalElements)} trong ${totalElements} danh mục` : "Không có kết quả"}
                />
            </div>

            <ConfirmationModal isOpen={Boolean(deleteId)} onClose={() => setDeleteId(null)} onConfirm={handleDelete} loading={isDeleting} title="Xóa danh mục" message="Bạn có chắc muốn xóa danh mục này? Các danh mục con có thể bị ảnh hưởng." confirmText="Xóa mục" />
        </div>
    );
}
