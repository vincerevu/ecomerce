import React from "react";

type SectionLoaderProps = {
  title?: string;
  columns?: 4 | 3 | 2;
  rows?: number;
  compact?: boolean;
};

const gridClassMap = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
};

const SectionLoader = ({
  title = "Đang tải dữ liệu",
  columns = 4,
  rows = 1,
  compact = false,
}: SectionLoaderProps) => {
  const itemCount = columns * rows;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`rounded-2xl border border-gray-3 bg-white ${
        compact ? "p-5" : "p-6"
      }`}
    >
      <div className="mb-5 flex items-center gap-3 text-dark">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue border-t-transparent" />
        <span className="font-medium">{title}</span>
      </div>

      <div className={`grid gap-6 ${gridClassMap[columns]}`}>
        {Array.from({ length: itemCount }).map((_, index) => (
          <div
            key={index}
            className="animate-pulse overflow-hidden rounded-2xl border border-gray-3 bg-gray-1"
          >
            <div className="h-64 bg-gray-2" />
            <div className="space-y-3 p-5">
              <div className="h-4 w-24 rounded-full bg-gray-2" />
              <div className="h-5 w-3/4 rounded-full bg-gray-2" />
              <div className="h-4 w-1/2 rounded-full bg-gray-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SectionLoader;
