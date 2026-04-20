"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { pointsApi, type PointHistoryRecord } from "@/libs/points-api";
import { useAuth } from "@/app/context/AuthContext";

const tabs = ["Tất cả", "Nhận", "Dùng/hết hạn"];

const extractOrderCode = (reason?: string | null) => {
  if (!reason) return null;

  const matched = reason.match(/ORD-\d+/i);
  return matched ? matched[0].toUpperCase() : null;
};

const PointsHistoryPage = () => {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("Tất cả");
  const [items, setItems] = useState<PointHistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.replace("/signin");
    }
  }, [isAuthLoading, router, user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const loadHistory = async () => {
      try {
        setIsLoading(true);
        const response = await pointsApi.getHistory();
        setItems(response.result || []);
      } catch {
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadHistory();
  }, [user]);

  const filteredItems = useMemo(() => {
    if (activeTab === "Nhận") {
      return items.filter((item) => item.points > 0);
    }

    if (activeTab === "Dùng/hết hạn") {
      return items.filter((item) => item.points < 0);
    }

    return items;
  }, [activeTab, items]);

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
            Lịch sử điểm
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-[1170px] px-4 py-8">
        <div className="mx-auto flex w-full max-w-[700px] rounded-full bg-[#F1F2F6] p-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-full px-4 py-3 text-lg transition ${
                activeTab === tab
                  ? "bg-white font-medium text-dark shadow-sm"
                  : "text-dark-4"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="py-24 text-center text-base text-dark-4">
            Đang tải lịch sử điểm...
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="mx-auto mt-8 max-w-[700px] space-y-4">
            {filteredItems.map((item) => {
              const isGain = item.points > 0;
              const orderCode = extractOrderCode(item.reason);
              const canOpenOrder = Boolean(item.orderId);

              return (
                <article
                  key={item.id}
                  role={canOpenOrder ? "button" : undefined}
                  tabIndex={canOpenOrder ? 0 : undefined}
                  onClick={canOpenOrder ? () => router.push(`/my-account/orders/${item.orderId}`) : undefined}
                  onKeyDown={
                    canOpenOrder
                      ? (event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            router.push(`/my-account/orders/${item.orderId}`);
                          }
                        }
                      : undefined
                  }
                  className={`rounded-[24px] border border-gray-3 bg-white px-5 py-4 shadow-1 ${
                    canOpenOrder ? "cursor-pointer" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-base font-medium text-dark">
                        {item.reason || (isGain ? "Nhận điểm thưởng" : "Điểm đã sử dụng")}
                      </p>
                      <p className="mt-1 text-sm text-dark-4">
                        {new Date(item.createdDate).toLocaleString("vi-VN")}
                      </p>
                      {orderCode ? (
                        <p className="mt-1 text-sm text-dark-4">
                          Đơn hàng {orderCode}
                        </p>
                      ) : null}
                    </div>

                    <span
                      className={`text-lg font-semibold ${
                        isGain ? "text-[#0DAA6A]" : "text-[#E24A4A]"
                      }`}
                    >
                      {isGain ? "+" : ""}
                      {item.points.toLocaleString("vi-VN")}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-[90px] leading-none">🧺</div>
            <p className="mt-4 text-[32px] leading-none text-[#4C47B5]">?</p>
            <p className="mt-6 text-[18px] text-dark">Bạn chưa có lịch sử điểm nào.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default PointsHistoryPage;
