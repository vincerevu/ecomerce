import { useEffect, useState } from "react";
import { categoryApi } from "../../api/categoryApi";
import { productApi } from "../../api/productApi";
import { useAuth } from "../../context/AuthContext";
import { EyeIcon, PlusIcon, TrashBinIcon } from "../../icons";
import { showError, showSuccess } from "../../utils/toast";
import { hasAnyPermission } from "../auth/PermissionGuard";
import Loader from "../common/Loader";
import Pagination from "../common/Pagination";
import SortDropdown, { type SortDropdownOption } from "../common/SortDropdown";
import Select, { Option } from "../form/Select";
import Badge from "../ui/badge/Badge";
import Button from "../ui/button/Button";
import ConfirmationModal from "../ui/modal/ConfirmationModal";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import {
    formatPrice,
    getPriceRange,
    getPrimaryImageUrl,
    getTotalStock,
    type ProductRow,
} from "./productTable.utils";

interface ProductsTableProps { onView?: (product: ProductRow) => void; onCreate?: () => void; }

const PAGE_SIZE = 8;
const STATUS_OPTIONS: Option[] = [
    { value: "", label: "Tất cả trạng thái" },
    { value: "ACTIVE", label: "Đang bán" },
    { value: "INACTIVE", label: "Ngừng bán" },
];
type SortPreset = "newest" | "recentlyUpdated";
type ProductSortPreset = "" | SortPreset;

const PRODUCT_SORT_OPTIONS: SortDropdownOption[] = [
    { value: "newest", label: "Mới nhất" },
    { value: "recentlyUpdated", label: "Cập nhật gần đây" },
];

const escapeFilterValue = (value: string) => value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

const buildProductFilter = ({
    searchTerm,
    categoryFilter,
    statusFilter,
}: {
    searchTerm: string;
    categoryFilter: string;
    statusFilter: string;
}) => {
    const filters: string[] = [];

    if (searchTerm.trim()) {
        const safeSearch = escapeFilterValue(searchTerm.trim());
        filters.push(
            `(name~'*${safeSearch}*' or slug~'*${safeSearch}*' or category.name~'*${safeSearch}*' or gender~'*${safeSearch}*' or style~'*${safeSearch}*')`,
        );
    }

    if (categoryFilter) {
        filters.push(`category.id:'${escapeFilterValue(categoryFilter)}'`);
    }

    if (statusFilter) {
        filters.push(`status:'${escapeFilterValue(statusFilter)}'`);
    }

    return filters.join(" and ");
};

function StockBadge({ qty }: { qty: number }) {
    if (qty === 0) return <span className="inline-flex rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">Hết hàng</span>;
    if (qty < 10) return <span className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-600">Sắp hết: {qty}</span>;
    return <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">{qty}</span>;
}

export default function ProductsTable({ onView, onCreate }: ProductsTableProps) {
    const { user } = useAuth();
    const [products, setProducts] = useState<ProductRow[]>([]);
    const [categoryOptions, setCategoryOptions] = useState<Option[]>([{ value: "", label: "Tất cả danh mục" }]);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [sortPreset, setSortPreset] = useState<ProductSortPreset>("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const canCreate = hasAnyPermission(user, "PRODUCT:CREATE");
    const canUpdate = hasAnyPermission(user, "PRODUCT:UPDATE");
    const canDelete = hasAnyPermission(user, "PRODUCT:DELETE");

    const formatGender = (gender?: string) => {
        if (gender === "MALE") return "Nam";
        if (gender === "FEMALE") return "Nữ";
        if (gender === "UNISEX") return "Unisex";
        return gender || "";
    };

    const formatStyle = (style?: string) =>
        style
            ? style
                  .toLowerCase()
                  .split("_")
                  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                  .join(" ")
            : "";

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);

        return () => window.clearTimeout(timeout);
    }, [searchTerm]);

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const categoryResponse = await categoryApi.getAll();
                if (categoryResponse.code === 1000) {
                    setCategoryOptions([
                        { value: "", label: "Tất cả danh mục" },
                        ...categoryResponse.result.map((category: { id: string; name: string }) => ({
                            value: category.id,
                            label: category.name,
                        })),
                    ]);
                }
            } catch (error) {
                console.error("Failed to load categories", error);
                showError("Không thể tải danh mục.");
            }
        };

        void loadCategories();
    }, []);

    useEffect(() => {
        const loadProducts = async () => {
            setIsLoading(true);
            try {
                const filter = buildProductFilter({
                    searchTerm: debouncedSearchTerm,
                    categoryFilter,
                    statusFilter,
                });
                const sort =
                    sortPreset === "recentlyUpdated" ? "updatedAt,desc" : "createdAt,desc";
                const productResponse = await productApi.getAll<ProductRow>({
                    page: Math.max(0, currentPage - 1),
                    size: PAGE_SIZE,
                    sort,
                    ...(filter ? { filter } : {}),
                });

                if (productResponse.code === 1000) {
                    setProducts(productResponse.result.data || []);
                    setTotalPages(Math.max(1, productResponse.result.totalPages || 1));
                    setTotalElements(productResponse.result.totalElements || 0);
                }
            } catch (error) {
                console.error("Failed to load products", error);
                showError("Không thể tải danh sách sản phẩm.");
                setProducts([]);
                setTotalPages(1);
                setTotalElements(0);
            } finally {
                setIsLoading(false);
            }
        };

        void loadProducts();
    }, [categoryFilter, currentPage, debouncedSearchTerm, sortPreset, statusFilter]);

    const safePage = Math.min(currentPage, totalPages);
    const clearFilters = Boolean(searchTerm || categoryFilter || statusFilter);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const handleDelete = async () => {
        if (!deleteId) return;
        setIsDeleting(true);
        try {
            await productApi.delete(deleteId);
            showSuccess("Đã xóa sản phẩm thành công.");
            if (products.length === 1 && currentPage > 1) {
                setCurrentPage((prev) => prev - 1);
            } else {
                const filter = buildProductFilter({
                    searchTerm: debouncedSearchTerm,
                    categoryFilter,
                    statusFilter,
                });
                const sort =
                    sortPreset === "recentlyUpdated" ? "updatedAt,desc" : "createdAt,desc";
                const productResponse = await productApi.getAll<ProductRow>({
                    page: Math.max(0, currentPage - 1),
                    size: PAGE_SIZE,
                    sort,
                    ...(filter ? { filter } : {}),
                });
                if (productResponse.code === 1000) {
                    setProducts(productResponse.result.data || []);
                    setTotalPages(Math.max(1, productResponse.result.totalPages || 1));
                    setTotalElements(productResponse.result.totalElements || 0);
                }
            }
        } catch (error) {
            console.error("Failed to delete product", error);
            showError("Không thể xóa sản phẩm.");
        } finally {
            setDeleteId(null);
            setIsDeleting(false);
        }
    };
    const handleToggleStatus = async (product: ProductRow) => {
        const nextStatus = product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
        try {
            await productApi.updateStatus(product.id, nextStatus);
            setProducts((prev) => prev.map((item) => (item.id === product.id ? { ...item, status: nextStatus } : item)));
            showSuccess(nextStatus === "ACTIVE" ? "Đã kích hoạt sản phẩm." : "Đã tạm dừng sản phẩm.");
        } catch (error) {
            console.error("Failed to update product status", error);
            showError("Không thể cập nhật trạng thái sản phẩm.");
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/[0.06] dark:bg-[#111b2d] dark:shadow-[0_22px_48px_rgba(2,6,23,0.34)]">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="relative min-w-0 flex-1 lg:max-w-sm">
                        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </span>
                        <input
                            type="text"
                            placeholder="Tìm theo tên, slug, danh mục..."
                            value={searchTerm}
                            onChange={(event) => { setSearchTerm(event.target.value); setCurrentPage(1); }}
                            className="h-10 w-full rounded-lg border border-gray-200 bg-transparent pl-9 pr-4 text-sm outline-none transition-all focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:border-white/[0.08] dark:bg-[#162033] dark:text-white/90 dark:placeholder:text-gray-500 dark:focus:border-brand-400/50 dark:focus:ring-brand-500/15"
                        />
                    </div>
                    {canCreate && onCreate ? (
                        <Button size="sm" startIcon={<PlusIcon />} onClick={onCreate} className="shrink-0 self-start lg:self-auto">
                            Thêm sản phẩm
                        </Button>
                    ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <SortDropdown
                        value={sortPreset}
                        onChange={(value) => { setSortPreset(value as ProductSortPreset); setCurrentPage(1); }}
                        options={PRODUCT_SORT_OPTIONS}
                        defaultLabel="Sắp xếp"
                        className="min-w-[180px] sm:w-auto"
                    />
                    <Select value={categoryFilter} onChange={(value) => { setCategoryFilter(value); setCurrentPage(1); }} options={categoryOptions} placeholder="Danh mục" className="min-w-[160px]" />
                    <Select value={statusFilter} onChange={(value) => { setStatusFilter(value); setCurrentPage(1); }} options={STATUS_OPTIONS} placeholder="Trạng thái" className="min-w-[155px]" />
                            {clearFilters && <button onClick={() => { setSearchTerm(""); setCategoryFilter(""); setStatusFilter(""); setCurrentPage(1); }} className="h-10 rounded-lg px-4 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10">Xóa lọc</button>}
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#111b2d] dark:shadow-[0_20px_46px_rgba(2,6,23,0.32)]">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                            <TableRow>
                                <TableCell isHeader className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Sản phẩm</TableCell>
                                <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Danh mục</TableCell>
                                <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Biến thể</TableCell>
                                <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Giá</TableCell>
                                <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Tồn kho</TableCell>
                                <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Trạng thái</TableCell>
                                <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Thao tác</TableCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-16">
                                        <div className="flex flex-col items-center justify-center gap-3 text-gray-400">
                                            <Loader size="md" />
                                            <span className="text-sm">Đang tải dữ liệu...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : products.length === 0 ? (
                                <TableRow><TableCell colSpan={7} className="py-16 text-center text-sm text-gray-400">Không tìm thấy sản phẩm nào</TableCell></TableRow>
                            ) : (
                                products.map((product) => {
                                    const totalStock = getTotalStock(product);
                                    const priceRange = getPriceRange(product);
                                    const totalVariants = product.colors.flatMap((color) => color.variants || []).length;
                                    const thumb = getPrimaryImageUrl(product);
                                    return (
                                        <TableRow key={product.id} className="transition-colors hover:bg-gray-50/60 dark:hover:bg-white/[0.02]">
                                            <TableCell className="px-5 py-3.5">
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-gray-100">
                                                        {thumb ? <img src={thumb} alt={product.name} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center bg-gray-100 text-xs text-gray-400">Không ảnh</div>}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="max-w-[180px] truncate text-sm font-semibold leading-tight text-gray-800 dark:text-white/90">{product.name}</p>
                                                        <p className="mt-0.5 max-w-[180px] truncate font-mono text-xs text-gray-400">{product.slug}</p>
                                                        <div className="mt-1 flex flex-wrap gap-1">
                                                            {product.gender ? (
                                                                <span className="rounded border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-[10px] font-medium text-sky-600">
                                                                    {formatGender(product.gender)}
                                                                </span>
                                                            ) : null}
                                                            {product.style ? (
                                                                <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                                                                    {formatStyle(product.style)}
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                        <div className="mt-1 flex flex-wrap gap-1">
                                                            {product.tags?.slice(0, 2).map((tag) => <span key={typeof tag === "string" ? tag : tag.id} className="rounded border border-violet-200 bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-600">{typeof tag === "string" ? tag : tag.name}</span>)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-4 py-3.5"><Badge size="sm" color="info" variant="light">{product.category?.name || "N/A"}</Badge></TableCell>
                                            <TableCell className="px-4 py-3.5">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <div className="flex -space-x-1">
                                                        {product.colors.slice(0, 4).map((color) => <span key={color.id || color.colorName} title={color.colorName} className="h-4 w-4 flex-shrink-0 rounded-full border-2 border-white shadow-sm dark:border-gray-900" style={{ backgroundColor: color.hexCode || "#d1d5db" }} />)}
                                                        {product.colors.length > 4 && <span className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-gray-200 text-[8px] font-bold text-gray-500">+{product.colors.length - 4}</span>}
                                                    </div>
                                                    <span className="text-xs text-gray-500">{product.colors.length} màu · {totalVariants} size</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-4 py-3.5">
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-800 dark:text-white/80">
                                                        {priceRange.min === priceRange.max ? formatPrice(priceRange.min) : `${formatPrice(priceRange.min)} - ${formatPrice(priceRange.max)}`}
                                                    </p>
                                                    {(() => {
                                                        const originalPrices = product.colors
                                                            .flatMap((color) => color.variants?.map((variant) => variant.originalPrice || 0) || [])
                                                            .filter((price) => price > 0);

                                                        if (originalPrices.length === 0) {
                                                            return null;
                                                        }

                                                        const minOriginal = Math.min(...originalPrices);
                                                        const maxOriginal = Math.max(...originalPrices);
                                                        const hasDiscount = originalPrices.some((price) => price > priceRange.min);

                                                        if (!hasDiscount) {
                                                            return null;
                                                        }

                                                        return (
                                                            <p className="mt-1 text-xs text-gray-400 line-through">
                                                                {minOriginal === maxOriginal ? formatPrice(minOriginal) : `${formatPrice(minOriginal)} - ${formatPrice(maxOriginal)}`}
                                                            </p>
                                                        );
                                                    })()}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-4 py-3.5"><StockBadge qty={totalStock} /></TableCell>
                                            <TableCell className="px-4 py-3.5">
                                                {canUpdate ? (
                                                    <button onClick={() => handleToggleStatus(product)} className="group flex items-center gap-2">
                                                        <div className={`relative h-5 w-9 rounded-full transition-colors duration-200 ${product.status === "ACTIVE" ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"}`}>
                                                            <span className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${product.status === "ACTIVE" ? "translate-x-4" : "translate-x-0"}`} />
                                                        </div>
                                                        <span className={`text-xs font-medium ${product.status === "ACTIVE" ? "text-emerald-600" : "text-gray-400"}`}>{product.status === "ACTIVE" ? "Đang bán" : "Ngừng bán"}</span>
                                                    </button>
                                                ) : (
                                                    <Badge size="sm" color={product.status === "ACTIVE" ? "success" : "light"} variant="light">{product.status === "ACTIVE" ? "Đang bán" : "Ngừng bán"}</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="px-4 py-3.5">
                                                <div className="flex items-center gap-1.5">
                                                    {onView && <button onClick={() => onView?.(product)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-all hover:border-violet-400 hover:bg-violet-50 hover:text-violet-600 dark:border-gray-700 dark:hover:bg-violet-500/10" title="Xem sản phẩm"><EyeIcon className="h-4 w-4" /></button>}
                                                    {canDelete && <button onClick={() => setDeleteId(product.id)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-all hover:border-red-400 hover:bg-red-50 hover:text-red-600 dark:border-gray-700 dark:hover:bg-red-500/10" title="Xóa sản phẩm"><TrashBinIcon className="h-4 w-4" /></button>}
                                                    {!onView && !canDelete && <span className="text-xs text-gray-400">Không có thao tác</span>}
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
                    summary={totalElements > 0 ? `Hiển thị ${(safePage - 1) * PAGE_SIZE + 1}-${Math.min(safePage * PAGE_SIZE, totalElements)} trong ${totalElements} sản phẩm` : "Không có kết quả"}
                />
            </div>

            <ConfirmationModal isOpen={Boolean(deleteId)} onClose={() => setDeleteId(null)} onConfirm={handleDelete} loading={isDeleting} title="Xóa sản phẩm" message="Bạn có chắc muốn xóa sản phẩm này? Hành động này không thể hoàn tác." confirmText="Xóa ngay" />
        </div>
    );
}
