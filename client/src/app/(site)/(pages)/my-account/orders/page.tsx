"use client";

import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { orderApi, type CustomerOrder } from "@/libs/order-api";
import { useAuth } from "@/app/context/AuthContext";
import { getOrderStatusLabel } from "@/libs/sepay";
import CustomDropdown from "@/components/Common/CustomDropdown";
import { PAGE_SIZE_OPTIONS, useStoredPageSize } from "@/hooks/useStoredPageSize";

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

const DEFAULT_PAGE_SIZE = 12;

const getPaginationItems = (currentPage: number, totalPages: number) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
};

const OrderHistoryPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [activeStatus, setActiveStatus] = useState<CustomerOrder["status"] | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useStoredPageSize("client.accountOrders.pageSize", DEFAULT_PAGE_SIZE);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
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
          page: currentPage - 1,
          size: pageSize,
        });
        setOrders(response.result.data || []);
        setTotalPages(Math.max(1, response.result.totalPages || 1));
        setTotalElements(response.result.totalElements || 0);
      } catch {
        setOrders([]);
        setTotalPages(1);
        setTotalElements(0);
      } finally {
        setIsLoading(false);
      }
    };

    void loadOrders();
  }, [activeStatus, currentPage, pageSize, user?.id]);

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
                onClick={() => {
                  setActiveStatus(tab.value);
                  setCurrentPage(1);
                }}
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
            {orders.map((order) => {
              const orderItems = order.items || [];
              return (
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
                  {orderItems.length > 0 ? orderItems.map((item) => (
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
                  )) : (
                    <div className="rounded-[18px] bg-[#F8FAFD] px-4 py-3 text-sm text-dark-4">
                      {order.itemCount > 0
                        ? `${order.itemCount} sản phẩm trong đơn hàng. Bấm để xem chi tiết.`
                        : "Bấm để xem chi tiết đơn hàng."}
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-gray-3 pt-4">
                  <span className="text-sm text-dark-4">{order.paymentStatus === "PAID" ? "Đã thanh toán" : "Chưa thanh toán"}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-[#C98700]">Xem chi tiết</span>
                    <span className="text-lg font-semibold text-dark">{order.totalAmount.toLocaleString("vi-VN")}đ</span>
                  </div>
                </div>
              </article>
              );
            })}
            <div className="flex flex-col items-center justify-between gap-4 rounded-[24px] border border-gray-3 bg-white px-4 py-4 shadow-1 sm:flex-row">
              <p className="text-sm text-dark-4">
                Hiển thị {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalElements)} trong {totalElements} đơn hàng
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <div className="flex items-center gap-2 text-sm text-dark-4">
                  <span>Hiển thị</span>
                  <CustomDropdown
                    value={String(pageSize)}
                    onChange={(nextValue) => {
                      setPageSize(Number(nextValue));
                      setCurrentPage(1);
                    }}
                    options={PAGE_SIZE_OPTIONS.map((option) => ({
                      label: `${option} đơn`,
                      value: String(option),
                    }))}
                    className="min-w-[108px]"
                    buttonClassName="rounded-full border-gray-3 px-4 py-2 text-sm"
                    menuClassName="rounded-2xl p-2"
                    menuPlacement="top"
                  />
                </div>

                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    className="rounded-full border border-gray-3 bg-white px-4 py-2 text-sm text-dark disabled:opacity-45"
                  >
                    Trước
                  </button>

                  {getPaginationItems(currentPage, totalPages).map((item, index) => (
                    <button
                      key={`${item}-${index}`}
                      type="button"
                      disabled={item === "..."}
                      onClick={() => {
                        if (typeof item === "number") {
                          setCurrentPage(item);
                        }
                      }}
                      className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                        item === "..."
                          ? "cursor-default text-dark-4"
                          : currentPage === item
                            ? "bg-[#FFC84B] text-dark"
                            : "border border-gray-3 bg-white text-dark hover:bg-[#FFF3D7]"
                      }`}
                    >
                      {item}
                    </button>
                  ))}

                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    className="rounded-full border border-gray-3 bg-white px-4 py-2 text-sm text-dark disabled:opacity-45"
                  >
                    Sau
                  </button>
                </div>
              </div>
            </div>
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
