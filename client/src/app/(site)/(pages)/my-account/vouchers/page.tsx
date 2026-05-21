"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { couponApi, type CouponRecord } from "@/libs/coupon-api";
import toast from "react-hot-toast";

const formatCurrency = (value?: number) => `${Math.max(value || 0, 0).toLocaleString("vi-VN")}đ`;

const formatDate = (value?: string) => {
  if (!value) return "Không giới hạn";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Không giới hạn" : date.toLocaleDateString("vi-VN");
};

const formatDiscount = (coupon: CouponRecord) =>
  coupon.discountType === "PERCENT"
    ? `Giảm ${coupon.discountValue}%`
    : `Giảm ${formatCurrency(coupon.discountValue)}`;

const formatPaymentMethod = (value?: CouponRecord["paymentMethod"]) => {
  if (value === "COD") return "COD";
  if (value === "SEPAY") return "SePay";
  return "Mọi phương thức";
};

const VouchersPage = () => {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [vouchers, setVouchers] = React.useState<CouponRecord[]>([]);
  const [isLoadingVouchers, setIsLoadingVouchers] = React.useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/signin");
    }
  }, [isLoading, router, user]);

  useEffect(() => {
    if (!user) return;

    const loadVouchers = async () => {
      try {
        setIsLoadingVouchers(true);
        const response = await couponApi.getPublic();
        setVouchers(response.result || []);
      } catch (error) {
        console.error(error);
        setVouchers([]);
      } finally {
        setIsLoadingVouchers(false);
      }
    };

    void loadVouchers();
  }, [user]);

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
        {isLoadingVouchers ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-[156px] animate-pulse rounded-[22px] border border-gray-3 bg-gray-1" />
            ))}
          </div>
        ) : vouchers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#FFF4D8] text-3xl text-[#D28500]">
              %
            </div>
            <p className="mt-6 text-[18px] text-dark-4">Hiện chưa có voucher nào</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-dark">Mã giảm giá hiện có</h2>
              <p className="mt-1 text-sm text-dark-4">
                Chọn mã phù hợp và dùng tại bước thanh toán.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {vouchers.map((coupon) => (
                <div
                  key={coupon.id}
                  className="overflow-hidden rounded-[22px] border border-gray-3 bg-white shadow-1"
                >
                  <div className="flex min-h-[150px]">
                    <div className="flex w-[96px] shrink-0 items-center justify-center bg-[#FFF1C9] px-4 text-center">
                      <div>
                        <p className="text-[26px] font-semibold leading-tight text-[#D28500]">%</p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[#9A6A00]">
                          Voucher
                        </p>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-lg font-semibold text-dark">{formatDiscount(coupon)}</p>
                          <p className="mt-1 line-clamp-1 text-sm text-dark-4">{coupon.name}</p>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            await navigator.clipboard?.writeText(coupon.code);
                            toast.success(`Đã sao chép ${coupon.code}.`);
                          }}
                          className="rounded-full bg-[#FFC84B] px-3 py-1.5 text-sm font-semibold text-dark transition hover:bg-[#F5BC2E]"
                        >
                          Lưu mã
                        </button>
                      </div>

                      <div className="mt-4 rounded-2xl border border-dashed border-[#F4D88B] bg-[#FFFBF0] px-3 py-2">
                        <p className="text-sm font-semibold tracking-wide text-dark">{coupon.code}</p>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-dark-4">
                        <span>Đơn từ {formatCurrency(coupon.minOrderAmount)}</span>
                        <span>Tối đa {coupon.maxDiscountAmount ? formatCurrency(coupon.maxDiscountAmount) : "không giới hạn"}</span>
                        <span>{formatPaymentMethod(coupon.paymentMethod)}</span>
                        <span>HSD: {formatDate(coupon.endsAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default VouchersPage;
