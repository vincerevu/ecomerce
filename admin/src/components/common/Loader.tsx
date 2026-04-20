import React from "react";

interface LoaderProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  fullPage?: boolean;
}

const Loader: React.FC<LoaderProps> = ({ className = "", size = "md", fullPage = false }) => {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  };

  const loaderContent = (
    <div className={`relative flex items-center justify-center ${sizeClasses[size]} ${className}`}>
      <div className="absolute h-full w-full animate-spin rounded-full border-4 border-brand-500/20 border-t-brand-500" />
      <div
        className={`rounded-full bg-brand-500 animate-pulse ${
          size === "sm" ? "h-2 w-2" : size === "md" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-10 w-10"
        }`}
      />
      <div className="absolute h-[80%] w-[80%] animate-[spin_3s_linear_infinite] rounded-full border-2 border-dashed border-brand-400/40" />
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-999999 flex flex-col items-center justify-center bg-gray-50/50 backdrop-blur-sm dark:bg-gray-900/50">
        {loaderContent}
        <p className="mt-4 animate-pulse text-theme-sm font-medium text-gray-600 dark:text-gray-400">
          Đang tải dữ liệu...
        </p>
      </div>
    );
  }

  return loaderContent;
};

export default Loader;
