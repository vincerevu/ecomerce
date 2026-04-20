"use client";

import { lookupPhone, normalizePhone } from "@/libs/auth-api";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

type AuthEntryModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const AuthEntryModal = ({ isOpen, onClose }: AuthEntryModalProps) => {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setPhone("");
      setLoading(false);
    }
  }, [isOpen]);

  const isSubmitDisabled = useMemo(
    () => loading || phone.length !== 10,
    [loading, phone],
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (phone.length !== 10) {
      toast.error("Vui lòng nhập số điện thoại hợp lệ");
      return;
    }

    try {
      setLoading(true);
      const result = await lookupPhone(phone);
      const normalizedPhone = normalizePhone(phone);
      onClose();
      router.push(
        result.existed
          ? `/signin?phone=${encodeURIComponent(normalizedPhone)}`
          : `/signup?phone=${encodeURIComponent(normalizedPhone)}`,
      );
    } catch (error: any) {
      toast.error(
        error.message || "Không thể kiểm tra số điện thoại, vui lòng thử lại!",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-dark/60 px-4">
      <div className="relative w-full max-w-[430px] rounded-[28px] bg-white px-6 py-7 shadow-2xl sm:px-8">
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-gray-1 text-dark-4 transition-colors duration-200 hover:text-dark"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M13.5 4.5L4.5 13.5M4.5 4.5L13.5 13.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="mb-7 pr-12">
          <h3 className="text-2xl font-semibold text-dark">Chào mừng bạn</h3>
          <p className="mt-2 text-sm leading-6 text-dark-4">
            Nhập số điện thoại để tiếp tục. Hệ thống sẽ tự chuyển bạn tới
            bước đăng nhập hoặc đăng ký phù hợp.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="auth-entry-phone" className="mb-2.5 block text-sm font-medium text-dark">
              Số điện thoại
            </label>
            <input
              id="auth-entry-phone"
              type="tel"
              inputMode="numeric"
              autoFocus
              placeholder="Nhập số điện thoại 10 chữ số"
              value={phone}
              onChange={(event) => setPhone(normalizePhone(event.target.value))}
              className="h-13 w-full rounded-full border border-gray-3 bg-gray-1 px-5 outline-none transition duration-200 focus:border-transparent focus:ring-2 focus:ring-blue/20"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="flex h-13 w-full items-center justify-center rounded-full bg-blue px-5 text-base font-medium text-dark transition duration-200 hover:bg-blue-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Đang kiểm tra..." : "Tiếp tục"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthEntryModal;
