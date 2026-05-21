import { useEffect, useState } from "react";
import { inventoryApi, type InventoryStockRecord, type StockImportReceiptRecord } from "../../api/inventoryApi";
import { useAuth } from "../../context/AuthContext";
import { PlusIcon } from "../../icons";
import { useStoredPageSize } from "../../hooks/useStoredPageSize";
import { showError, showSuccess } from "../../utils/toast";
import { hasAnyPermission } from "../auth/PermissionGuard";
import Loader from "../common/Loader";
import Pagination from "../common/Pagination";
import SortDropdown, { type SortDropdownOption } from "../common/SortDropdown";
import Select, { type Option } from "../form/Select";
import StockImportModal from "../inventory/StockImportModal";
import Badge from "../ui/badge/Badge";
import Button from "../ui/button/Button";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import {
  formatCurrency,
  formatDateTime,
  getStockMeta,
  type InventorySortPreset,
} from "./inventoryTable.utils";

const DEFAULT_PAGE_SIZE = 10;

const STOCK_FILTER_OPTIONS: Option[] = [
  { value: "", label: "Tất cả tồn kho" },
  { value: "out", label: "Hết hàng" },
  { value: "low", label: "Sắp hết" },
  { value: "healthy", label: "Ổn định" },
];

const INVENTORY_SORT_OPTIONS: SortDropdownOption[] = [
  { value: "lowStock", label: "Tồn thấp nhất" },
  { value: "recentImport", label: "Nhập gần nhất" },
  { value: "valueDesc", label: "Giá bán cao nhất" },
  { value: "nameAsc", label: "Tên A đến Z" },
];

const escapeFilterValue = (value: string) => value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

const buildInventoryFilter = ({
  searchTerm,
  stockFilter,
}: {
  searchTerm: string;
  stockFilter: string;
}) => {
  const filters: string[] = [];

  if (searchTerm.trim()) {
    const safeSearch = escapeFilterValue(searchTerm.trim());
    filters.push(
      `(productColor.product.name~'*${safeSearch}*' or productColor.product.slug~'*${safeSearch}*' or productColor.colorName~'*${safeSearch}*' or sizeName~'*${safeSearch}*')`,
    );
  }

  if (stockFilter === "out") {
    filters.push("stockQuantity:0");
  } else if (stockFilter === "low") {
    filters.push("(stockQuantity>0 and stockQuantity<10)");
  } else if (stockFilter === "healthy") {
    filters.push("stockQuantity>=10");
  }

  return filters.join(" and ");
};

export default function InventoryTable() {
  const { user } = useAuth();
  const [stocks, setStocks] = useState<InventoryStockRecord[]>([]);
  const [receipts, setReceipts] = useState<StockImportReceiptRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [sortPreset, setSortPreset] = useState<InventorySortPreset>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useStoredPageSize("admin.inventory.pageSize", DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const canCreateImport = hasAnyPermission(user, "INVENTORY:CREATE");

  const loadReceipts = async () => {
    try {
      const receiptResponse = await inventoryApi.getReceipts({ page: 0, size: 50, sort: "importedAt,desc" });
      if (receiptResponse.code === 1000) {
        setReceipts(receiptResponse.result.data || []);
      }
    } catch (error) {
      console.error("Failed to load receipts", error);
      showError("Không thể tải phiếu nhập kho.");
    }
  };

  const loadStocks = async (page: number) => {
    setIsLoading(true);
    try {
      const filter = buildInventoryFilter({
        searchTerm: debouncedSearchTerm,
        stockFilter,
      });
      const sort =
        sortPreset === "valueDesc"
          ? "salePrice,desc"
          : sortPreset === "nameAsc"
            ? "productColor.product.name,asc"
            : sortPreset === "recentImport"
              ? "createdAt,desc"
              : "stockQuantity,asc";

      const stockResponse = await inventoryApi.getStocks({
        page: Math.max(0, page - 1),
        size: pageSize,
        sort,
        ...(filter ? { filter } : {}),
      });

      if (stockResponse.code === 1000) {
        setStocks(stockResponse.result.data || []);
        setTotalPages(Math.max(1, stockResponse.result.totalPages || 1));
        setTotalElements(stockResponse.result.totalElements || 0);
      }
    } catch (error) {
      console.error("Failed to load inventory", error);
      showError("Không thể tải dữ liệu kho.");
      setStocks([]);
      setTotalPages(1);
      setTotalElements(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadReceipts();
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, stockFilter, sortPreset, pageSize]);

  useEffect(() => {
    void loadStocks(currentPage);
  }, [currentPage, debouncedSearchTerm, stockFilter, sortPreset, pageSize]);

  const safePage = Math.min(currentPage, totalPages);
  const hasFilters = Boolean(searchTerm || stockFilter);

  const handleCreateReceipt = async (payload: Parameters<typeof inventoryApi.createReceipt>[0]) => {
    try {
      setIsSaving(true);
      const response = await inventoryApi.createReceipt(payload);
      setReceipts((prev) => [response.result, ...prev]);
      showSuccess("Đã tạo phiếu nhập kho.");
      setIsImportOpen(false);
      await loadStocks(currentPage);
      await loadReceipts();
    } catch (error) {
      console.error("Failed to create import receipt", error);
      showError("Không thể tạo phiếu nhập kho.");
    } finally {
      setIsSaving(false);
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
                placeholder="Tìm theo sản phẩm, slug, màu hoặc size..."
                className="h-10 w-full rounded-lg border border-gray-200 bg-transparent pl-9 pr-4 text-sm outline-none transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-white/[0.08] dark:bg-[#162033] dark:text-white/90 dark:placeholder:text-gray-500 dark:focus:border-brand-400/50 dark:focus:ring-brand-500/15"
              />
              </div>
              {canCreateImport ? (
                <Button size="sm" startIcon={<PlusIcon />} onClick={() => setIsImportOpen(true)} className="shrink-0 self-start lg:self-auto">
                  Tạo phiếu nhập
                </Button>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <SortDropdown
                value={sortPreset}
                onChange={(value) => setSortPreset(value as InventorySortPreset)}
                options={INVENTORY_SORT_OPTIONS}
                defaultLabel="Sắp xếp"
                className="min-w-[180px] sm:w-auto"
              />
              <Select
                value={stockFilter}
                onChange={setStockFilter}
                options={STOCK_FILTER_OPTIONS}
                className="min-w-[170px]"
              />
              {hasFilters ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setStockFilter("");
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
                <TableCell isHeader className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Biến thể</TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Giá gốc</TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Giá bán</TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Tồn hiện tại</TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Giá nhập gần nhất</TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Lần nhập gần nhất</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-16">
                    <div className="flex flex-col items-center justify-center gap-3 text-gray-400">
                      <Loader size="md" />
                      <span className="text-sm">Đang tải dữ liệu kho...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : stocks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-16 text-center text-sm text-gray-400">
                    Không có biến thể phù hợp với bộ lọc hiện tại.
                  </TableCell>
                </TableRow>
              ) : (
                stocks.map((stock) => {
                  const stockMeta = getStockMeta(stock.stockQuantity);
                  return (
                    <TableRow key={stock.productVariantId} className="transition-colors hover:bg-gray-50/60 dark:hover:bg-white/[0.02]">
                      <TableCell className="px-5 py-3.5">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="h-12 w-12 overflow-hidden rounded-lg border border-gray-100">
                            {stock.imageUrl ? (
                              <img src={stock.imageUrl} alt={stock.productName} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-gray-100 text-xs text-gray-400">
                                N/A
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-800 dark:text-white/90">
                              {stock.productName}
                            </p>
                            <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                              {stock.colorName} • Size {stock.sizeName}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-sm text-gray-700 dark:text-gray-300">
                        {formatCurrency(stock.originalPrice || 0)}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-sm font-semibold text-gray-800 dark:text-white/90">
                        {formatCurrency(stock.salePrice || 0)}
                      </TableCell>
                      <TableCell className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-800 dark:text-white/90">
                            {stock.stockQuantity}
                          </span>
                          <Badge size="sm" color={stockMeta.color} variant="light">
                            {stockMeta.label}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-sm text-gray-700 dark:text-gray-300">
                        {formatCurrency(stock.latestUnitCost || 0)}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-sm text-gray-500 dark:text-gray-400">
                        {formatDateTime(stock.latestImportedAt)}
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
                )} trong ${totalElements} biến thể`
              : "Không có kết quả"
          }
        />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/[0.06] dark:bg-[#111b2d] dark:shadow-[0_20px_46px_rgba(2,6,23,0.32)]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-500">
              Lịch sử nhập kho
            </p>
            <h4 className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
              Phiếu nhập gần đây
            </h4>
          </div>
          <Badge size="sm" color="info" variant="light">
            {receipts.length} phiếu
          </Badge>
        </div>
        <div className="space-y-3">
          {receipts.slice(0, 6).map((receipt) => (
            <div
              key={receipt.id}
              className="flex flex-col gap-2 rounded-2xl border border-gray-100 px-4 py-3 dark:border-white/[0.06] sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                  {receipt.receiptCode}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {receipt.supplierName || "Chưa khai báo nhà cung cấp"} • {formatDateTime(receipt.importedAt)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge size="sm" color="light" variant="light">
                  {receipt.totalQuantity} sản phẩm
                </Badge>
                <Badge size="sm" color="success" variant="light">
                  {formatCurrency(receipt.totalAmount || 0)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      <StockImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSave={handleCreateReceipt}
        stocks={stocks}
        isSaving={isSaving}
      />
    </div>
  );
}
