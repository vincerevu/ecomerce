"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

export type DropdownOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

type CustomDropdownProps = {
  value?: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  optionClassName?: string;
  disabled?: boolean;
  searchable?: boolean;
  menuPlacement?: "top" | "bottom";
};

const normalizeSearchValue = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();

const CustomDropdown = ({
  value,
  onChange,
  options,
  placeholder = "Chọn một mục",
  searchPlaceholder = "Gõ để tìm...",
  className = "",
  buttonClassName = "",
  menuClassName = "",
  optionClassName = "",
  disabled = false,
  searchable = false,
  menuPlacement = "bottom",
}: CustomDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    if (!searchable || !searchTerm.trim()) {
      return options;
    }

    const normalizedTerm = normalizeSearchValue(searchTerm);
    return options.filter((option) =>
      normalizeSearchValue(option.label).includes(normalizedTerm)
    );
  }, [options, searchable, searchTerm]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    if (isOpen && searchable) {
      const timeout = window.setTimeout(() => searchInputRef.current?.focus(), 0);
      return () => window.clearTimeout(timeout);
    }

    if (!isOpen) {
      setSearchTerm("");
    }
  }, [isOpen, searchable]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((current) => !current)}
        className={`flex w-full items-center justify-between gap-3 rounded-full border border-gray-3 bg-white px-4 py-2.5 text-left text-sm text-dark outline-none transition duration-200 hover:border-gray-4 disabled:cursor-not-allowed disabled:opacity-60 ${buttonClassName}`}
      >
        <span className="line-clamp-1">
          {selectedOption?.label || placeholder}
        </span>

        <svg
          className={`h-4 w-4 flex-shrink-0 text-dark transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2.41469 5.03569L2.41467 5.03571L2.41749 5.03846L7.76749 10.2635L8.0015 10.492L8.23442 10.2623L13.5844 4.98735L13.5844 4.98735L13.5861 4.98569C13.6809 4.89086 13.8199 4.89087 13.9147 4.98569C14.0092 5.08024 14.0095 5.21864 13.9155 5.31345C13.9152 5.31373 13.915 5.31401 13.9147 5.31429L8.16676 10.9622L8.16676 10.9622L8.16469 10.9643C8.06838 11.0606 8.02352 11.0667 8.00039 11.0667C7.94147 11.0667 7.89042 11.0522 7.82064 10.9991L2.08526 5.36345C1.99127 5.26865 1.99154 5.13024 2.08609 5.03569C2.18092 4.94086 2.31986 4.94086 2.41469 5.03569Z"
            fill="currentColor"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          className={`component-scrollbar absolute left-0 z-40 max-h-72 w-full overflow-y-auto rounded-[28px] border border-gray-3 bg-white p-2 shadow-lg ${
            menuPlacement === "top" ? "bottom-[calc(100%+8px)]" : "top-[calc(100%+8px)]"
          } ${menuClassName}`}
        >
          {searchable && (
            <div className="sticky top-0 z-10 bg-white px-1 pb-2">
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-full border border-gray-3 bg-gray-1 px-4 py-2.5 text-sm text-dark outline-none transition focus:border-blue"
              />
            </div>
          )}

          {filteredOptions.length === 0 && (
            <div className="px-4 py-3 text-sm text-dark-4">Không có kết quả phù hợp.</div>
          )}

          {filteredOptions.map((option) => {
            const isSelected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                disabled={option.disabled}
                onClick={() => {
                  if (option.disabled) {
                    return;
                  }

                  onChange(option.value);
                  setIsOpen(false);
                  setSearchTerm("");
                }}
                className={`flex w-full items-center rounded-full px-4 py-2.5 text-left text-sm transition duration-150 ${
                  isSelected
                    ? "bg-blue text-white"
                    : "text-dark hover:bg-gray-1"
                } ${option.disabled ? "cursor-not-allowed opacity-50" : ""} ${optionClassName}`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;
