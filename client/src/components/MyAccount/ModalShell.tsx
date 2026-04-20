"use client";

import React, { useEffect } from "react";

type ModalShellProps = {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

const ModalShell = ({ title, isOpen, onClose, children }: ModalShellProps) => {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-start justify-center overflow-y-auto overscroll-contain bg-dark/40 px-4 pb-6 pt-24 sm:items-center sm:py-6">
      <div className="my-auto flex max-h-[calc(100vh-120px)] w-full max-w-[540px] flex-col overflow-hidden rounded-[28px] bg-white shadow-3 sm:max-h-[calc(100vh-48px)]">
        <div className="flex items-center justify-between border-b border-gray-3 px-5 py-5 sm:px-6">
          <h3 className="text-[28px] font-semibold leading-tight text-dark">
            {title}
          </h3>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-3 text-dark transition hover:border-dark-4"
          >
            <span className="text-[28px] leading-none">×</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </div>
  );
};

export default ModalShell;
