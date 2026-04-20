import { AngleLeftIcon, AngleRightIcon } from "../../icons";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  summary?: string;
}

function getVisiblePages(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, -1, totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [1, -1, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, -1, currentPage - 1, currentPage, currentPage + 1, -1, totalPages];
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  summary,
}: PaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const safePage = Math.min(Math.max(1, currentPage), safeTotalPages);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 px-5 py-4 dark:border-white/[0.05] sm:flex-row">
      <p className="text-sm text-gray-500 dark:text-gray-400">{summary || "Không có kết quả"}</p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, safePage - 1))}
          disabled={safePage === 1}
          aria-label="Trang trước"
        >
          <AngleLeftIcon className="h-4 w-4" />
        </button>
        {getVisiblePages(safePage, safeTotalPages).map((pageNumber, index) =>
          pageNumber === -1 ? (
            <span
              key={`ellipsis-${index}`}
              className="flex h-8 w-8 items-center justify-center text-sm font-medium text-gray-300 dark:text-gray-600"
            >
              ...
            </span>
          ) : (
            <button
              key={pageNumber}
              type="button"
              onClick={() => onPageChange(pageNumber)}
              className={`h-8 min-w-8 rounded-lg border px-2 text-sm font-medium transition-colors ${
                pageNumber === safePage
                  ? "border-brand-500 bg-brand-500 text-white"
                  : "border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/[0.03]"
              }`}
              aria-current={pageNumber === safePage ? "page" : undefined}
            >
              {pageNumber}
            </button>
          ),
        )}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(safeTotalPages, safePage + 1))}
          disabled={safePage === safeTotalPages}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 disabled:cursor-default disabled:opacity-40 dark:border-gray-700 dark:hover:bg-white/[0.03]"
          aria-label="Trang sau"
        >
          <AngleRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
