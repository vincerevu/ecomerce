import React, { useState, useRef, useEffect, useMemo } from "react";

export interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  options: Option[];
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
  defaultValue?: string;
  value?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
}

const Select: React.FC<SelectProps> = ({
  options,
  placeholder = "Select an option",
  onChange,
  className = "",
  defaultValue = "",
  value,
  searchable = false,
  searchPlaceholder = "Gõ để tìm nhanh",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedValue, setSelectedValue] = useState<string>(value || defaultValue);

  useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value);
    }
  }, [value]);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
    }
  }, [isOpen]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (value: string) => {
    setSelectedValue(value);
    onChange(value);
    setIsOpen(false);
  };

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(normalizedQuery),
    );
  }, [options, query]);

  const selectedLabel = options.find((opt) => opt.value === selectedValue)?.label || placeholder;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-10 w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm shadow-theme-xs transition-colors focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-white/[0.08] dark:bg-[#162033] dark:shadow-none dark:focus:border-brand-400/50 dark:focus:ring-brand-500/15 ${selectedValue ? "text-gray-800 dark:text-white/90" : "text-gray-500 dark:text-gray-400"
          }`}
      >
        <span className="truncate">{selectedLabel}</span>
        <svg
          className={`shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180 text-brand-500" : "text-gray-500 dark:text-gray-400"}`}
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full origin-top scale-100 transform overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl transition-all duration-200 opacity-100 dark:border-white/[0.08] dark:bg-[#111b2d] dark:shadow-[0_18px_40px_rgba(2,6,23,0.45)]">
          {searchable ? (
            <div className="border-b border-gray-100 px-3 py-2 dark:border-white/[0.08]">
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchPlaceholder}
                className="h-9 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-white/[0.08] dark:bg-[#162033] dark:text-white/90 dark:placeholder:text-gray-500 dark:focus:border-brand-400/50 dark:focus:ring-brand-500/15"
                autoFocus
              />
            </div>
          ) : null}
          <ul className="max-h-60 overflow-y-auto outline-hidden no-scrollbar py-1">
            {filteredOptions.length === 0 ? (
              <li className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                Chưa có dữ liệu
              </li>
            ) : (
              filteredOptions.map((option) => (
                <li
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={`cursor-pointer px-4 py-2.5 text-sm transition-colors hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-[#19253a] dark:hover:text-white ${selectedValue === option.value
                    ? "bg-brand-50 text-brand-600 font-medium dark:bg-[#1b2740] dark:text-white"
                    : "text-gray-700 dark:text-gray-300"
                    }`}
                >
                  {option.label}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Select;
