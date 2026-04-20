"use client";

import React from "react";

type CheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  className?: string;
  labelClassName?: string;
  disabled?: boolean;
};

const Checkbox = ({
  checked,
  onChange,
  label,
  className = "",
  labelClassName = "",
  disabled = false,
}: CheckboxProps) => {
  return (
    <label
      className={`flex cursor-pointer select-none items-center ${disabled ? "opacity-60" : ""} ${labelClassName}`}
    >
      <div className={`relative ${className}`}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="sr-only"
          disabled={disabled}
        />
        <div className="mr-3 flex h-5 w-5 items-center justify-center">
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-[6px] border transition ${
              checked
                ? "border-[#FCAF17] bg-[#FCAF17] text-white"
                : "border-gray-3 bg-white text-transparent"
            }`}
          >
            <svg
              width="11"
              height="11"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2 6.2L4.6 8.8L10 3.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </div>

      {label ? <span className="text-dark">{label}</span> : null}
    </label>
  );
};

export default Checkbox;
