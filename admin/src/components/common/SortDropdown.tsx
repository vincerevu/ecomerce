import { useEffect, useMemo, useRef, useState } from "react";

export interface SortDropdownOption {
  value: string;
  label: string;
}

interface SortDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: SortDropdownOption[];
  defaultLabel?: string;
  className?: string;
}

export default function SortDropdown({
  value,
  onChange,
  options,
  defaultLabel = "Sắp xếp",
  className = "",
}: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = useMemo(
    () => options.find((option) => option.value === value)?.label || defaultLabel,
    [defaultLabel, options, value],
  );

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className={`inline-flex h-10 w-full items-center justify-between gap-3 rounded-lg border px-4 text-sm font-semibold transition-all ${
          value
            ? "border-brand-500 bg-brand-500 text-white shadow-[0_10px_24px_rgba(70,95,255,0.22)] dark:border-brand-400/60 dark:bg-brand-500/90 dark:shadow-[0_14px_30px_rgba(70,95,255,0.2)]"
            : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:border-white/[0.08] dark:bg-[#162033] dark:text-gray-200 dark:hover:border-brand-400/30 dark:hover:bg-[#1b2740]"
        }`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <svg
            className={`h-4 w-4 shrink-0 ${value ? "text-white" : "text-gray-500 dark:text-gray-400"}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M7 7h10M7 12h7M7 17h4"
            />
          </svg>
          <span className="truncate whitespace-nowrap">{selectedLabel}</span>
        </span>

        <svg
          className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          } ${value ? "text-white" : "text-gray-500 dark:text-gray-400"}`}
          fill="none"
          viewBox="0 0 20 20"
          stroke="currentColor"
        >
          <path
            d="M5 7.5L10 12.5L15 7.5"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen ? (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-full min-w-[220px] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-white/[0.08] dark:bg-[#111b2d] dark:shadow-[0_18px_40px_rgba(2,6,23,0.45)]">
          <ul className="py-1">
            <li>
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setIsOpen(false);
                }}
                className={`flex w-full items-center px-4 py-2.5 text-left text-sm transition-colors ${
                  !value
                    ? "bg-brand-50 font-medium text-brand-600 dark:bg-[#1b2740] dark:text-white"
                    : "text-gray-700 hover:bg-brand-50 hover:text-brand-600 dark:text-gray-300 dark:hover:bg-[#19253a] dark:hover:text-white"
                }`}
              >
                {defaultLabel}
              </button>
            </li>
            {options.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center px-4 py-2.5 text-left text-sm transition-colors ${
                    value === option.value
                      ? "bg-brand-50 font-medium text-brand-600 dark:bg-[#1b2740] dark:text-white"
                      : "text-gray-700 hover:bg-brand-50 hover:text-brand-600 dark:text-gray-300 dark:hover:bg-[#19253a] dark:hover:text-white"
                  }`}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
