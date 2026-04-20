"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";

const VouchersPage = () => {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/signin");
    }
  }, [isLoading, router, user]);

  if (isLoading) {
    return <section className="min-h-screen bg-white pb-12 pt-20 text-center text-base text-dark-4">Đang kiểm tra phiên đăng nhập...</section>;
  }

  return (
    <section className="min-h-screen bg-white pb-12 pt-20">
      <div className="sticky top-0 z-20 border-b border-gray-3 bg-white">
        <div className="relative mx-auto flex h-14 max-w-[1170px] items-center justify-center px-4">
          <button
            type="button"
            onClick={() => router.push("/my-account")}
            aria-label="Quay lại"
            className="absolute left-4 flex h-10 w-10 items-center justify-center rounded-full text-dark transition hover:bg-gray-1"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 18L9 12L15 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <h1 className="text-xl font-semibold text-dark sm:text-2xl">
            Vouchers
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-[1170px] px-4 py-8">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-[90px] leading-none">🏷️</div>
          <p className="mt-6 text-[18px] text-dark-4">Hiện chưa có voucher nào</p>
        </div>
      </div>
    </section>
  );
};

export default VouchersPage;
