"use client";

import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { orderApi, type CustomerOrder } from "@/libs/order-api";
import { useAuth } from "@/app/context/AuthContext";
import { getOrderStatusLabel } from "@/libs/sepay";

const statusTabs: Array<{
  label: string;
  value?: CustomerOrder["status"];
}> = [
  { label: "Tất cả" },
  { label: "Chờ xác nhận", value: "PENDING" },
  { label: "Chuẩn bị hàng", value: "PACKING" },
  { label: "Đang giao hàng", value: "SHIPPING" },
  { label: "Đã giao", value: "DELIVERED" },
  { label: "Đã hủy", value: "CANCELLED" },
];

const OrderHistoryPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [activeStatus, setActiveStatus] = useState<CustomerOrder["status"] | undefined>();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const created = searchParams.get("created");
    if (created !== "1") {
      return;
    }

    const orderCode = searchParams.get("orderCode");
    toast.success(
      orderCode
        ? `Đặt hàng thành công. Đơn ${orderCode} đã được lưu trong lịch sử mua hàng.`
        : "Đặt hàng thành công. Đơn hàng đã được lưu trong lịch sử mua hàng."
    );

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("created");
    nextParams.delete("orderCode");
    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `/my-account/orders?${nextQuery}` : "/my-account/orders");
  }, [router, searchParams]);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.replace("/signin");
    }
  }, [isAuthLoading, router, user]);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const loadOrders = async () => {
      try {
        setIsLoading(true);
        const response = await orderApi.getMine({
          userId: user.id,
          status: activeStatus,
          size: 20,
        });
        setOrders(response.result.data || []);
      } catch {
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadOrders();
  }, [activeStatus, user?.id]);

  const hasOrders = useMemo(() => orders.length > 0, [orders]);

  if (isAuthLoading) {
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold text-dark sm:text-2xl">Lịch sử mua hàng</h1>
        </div>
      </div>

      <div className="mx-auto max-w-[1170px] px-4 py-6">
        <div className="overflow-x-auto border-b border-gray-3">
          <div className="flex min-w-max items-center gap-8">
          {statusTabs.map((tab) => {
            const isActive = tab.value === activeStatus || (!tab.value && !activeStatus);
            return (
              <button
                key={tab.label}
                type="button"
                onClick={() => setActiveStatus(tab.value)}
                className={`relative whitespace-nowrap pb-4 pt-1 text-lg transition ${
                  isActive
                    ? "font-semibold text-[#D39A00]"
                    : "text-dark-4 hover:text-dark"
                }`}
              >
                {tab.label}
                <span
                  className={`absolute inset-x-0 bottom-0 h-[3px] rounded-full transition ${
                    isActive ? "bg-[#FFC84B]" : "bg-transparent"
                  }`}
                />
              </button>
            );
          })}
        </div>
        </div>

        {isLoading ? (
          <div className="py-24 text-center text-base text-dark-4">Đang tải đơn hàng...</div>
        ) : hasOrders ? (
          <div className="mt-6 space-y-4">
            {orders.map((order) => (
              <article
                key={order.id}
                className="rounded-[24px] border border-gray-3 bg-white p-5 shadow-1"
                onClick={() => router.push(`/my-account/orders/${order.id}`)}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-dark">{order.orderCode}</p>
                    <p className="mt-1 text-sm text-dark-4">{new Date(order.createdAt).toLocaleString("vi-VN")}</p>
                  </div>

                  <span className="rounded-full bg-[#FFF3D7] px-4 py-2 text-sm font-medium text-[#C98700]">
                    {getOrderStatusLabel(order)}
                  </span>
                </div>

                <div className="mt-4 space-y-3 border-t border-gray-3 pt-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[18px] bg-[#F6F7FB]">
                          {item.imageUrl ? (
                            <Image
                              src={item.imageUrl}
                              alt={item.productName}
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                        <p className="truncate text-base font-medium text-dark">{item.productName}</p>
                        <p className="mt-1 text-sm text-dark-4">
                          {[item.colorName, item.sizeName].filter(Boolean).join(" • ")} • x{item.quantity}
                        </p>
                        </div>
                      </div>

                      <span className="shrink-0 text-base font-medium text-dark">{item.unitPrice.toLocaleString("vi-VN")}đ</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-gray-3 pt-4">
                  <span className="text-sm text-dark-4">{order.paymentStatus === "PAID" ? "Đã thanh toán" : "Chưa thanh toán"}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-[#C98700]">Xem chi tiết</span>
                    <span className="text-lg font-semibold text-dark">{order.totalAmount.toLocaleString("vi-VN")}đ</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-[90px] leading-none">🧺</div>
            <p className="mt-4 text-[32px] leading-none text-[#4C47B5]">?</p>
            <p className="mt-6 text-[18px] text-dark">Bạn chưa có đơn hàng nào.</p>
            <button
              type="button"
              onClick={() => router.push("/products")}
              className="mt-5 rounded-full bg-[#FFC84B] px-8 py-3 text-lg font-medium text-dark"
            >
              Mua sắm ngay
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default OrderHistoryPage;
