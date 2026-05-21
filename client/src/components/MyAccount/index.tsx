"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { userApi, type UserProfileResponse } from "@/libs/user-api";
import { addressApi, type AddressRecord } from "@/libs/address-api";
import { couponApi } from "@/libs/coupon-api";
import ProfileEditModal from "./ProfileEditModal";
import AddressBookModal from "./AddressBookModal";
import { useAuth } from "@/app/context/AuthContext";

const iconClassName = "h-5 w-5 text-dark sm:h-6 sm:w-6";

const MyAccount = () => {
  const router = useRouter();
  const { user, isLoading, logout, updateUser } = useAuth();
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [addresses, setAddresses] = useState<AddressRecord[]>([]);
  const [voucherCount, setVoucherCount] = useState(0);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.replace("/");
    router.refresh();
  };

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/signin");
    }
  }, [isLoading, router, user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    setProfile(user as UserProfileResponse);

    const loadProfile = async () => {
      try {
        const [userResponse, addressResponse] = await Promise.all([
          userApi.getMyInfo(),
          addressApi.getMine(),
        ]);

        setProfile(userResponse.result);
        updateUser({ ...user, ...userResponse.result } as any);
        setAddresses(addressResponse.result || []);
      } catch {
        // keep existing local state
      }
    };

    const loadVouchers = async () => {
      try {
        const response = await couponApi.getPublic();
        setVoucherCount(response.result?.length || 0);
      } catch {
        setVoucherCount(0);
      }
    };

    void loadProfile();
    void loadVouchers();
  }, [updateUser, user]);

  if (isLoading || !profile) {
    return null;
  }

  const customerName = profile.name || "Khách hàng";
  const customerTier = "THÂN THIẾT";
  const currentPoints = Number(profile.totalPoints || 0);
  const currentSpent = Math.max(Number(profile.totalSpent || 0), currentPoints * 1000);
  const nextTierThreshold = 10000000;
  const remainingToVip = Math.max(nextTierThreshold - currentSpent, 0);
  const progressValue = Math.min(100, Math.max(0, (currentSpent / nextTierThreshold) * 100));

  return (
    <>
      <section className="bg-gray-2 pb-10 pt-24 sm:pb-14 sm:pt-28">
        <div className="mx-auto flex w-full max-w-[1170px] justify-center px-4 sm:px-8 xl:px-0">
          <div className="w-full max-w-[620px]">
            <div className="overflow-hidden rounded-[28px] bg-[#FFF1C9] p-5 shadow-1 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-[28px] font-semibold leading-tight text-dark sm:text-[34px]">
                    {customerName}
                  </h1>
                  <div className="mt-3 flex items-center gap-2 text-lg text-dark sm:text-xl">
                    <span>{currentPoints.toLocaleString("vi-VN")}</span>
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#FCAF17] text-sm font-semibold text-white">
                      y
                    </span>
                  </div>
                </div>

                <span className="text-lg font-semibold tracking-[0.12em] text-[#D6A64B] sm:text-xl">
                  {customerTier}
                </span>
              </div>

              <div className="relative mt-8 overflow-hidden rounded-[24px] border border-[#F8DB8E] bg-[linear-gradient(135deg,rgba(255,248,228,0.95),rgba(255,238,190,0.95))] px-5 py-5 sm:py-6">
                <div className="relative h-[2px] w-full bg-[#E2C98A]">
                  <div className="h-full rounded-full bg-white transition-all duration-300" style={{ width: `${Math.max(progressValue, 2)}%` }} />
                </div>
              </div>

              <p className="mt-4 text-base text-dark sm:text-lg">
                Mua thêm {remainingToVip.toLocaleString("vi-VN")}đ để lên hạng VIP S
              </p>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => router.push("/my-account/points")}
                className="flex items-center justify-center gap-2.5 rounded-2xl border border-gray-3 bg-white px-4 py-3.5 text-center transition-all duration-200"
              >
                <svg className={iconClassName} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 8V12L14.5 14.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
                </svg>
                <span className="text-sm font-medium text-dark sm:text-base">Lịch sử điểm</span>
              </button>

              <button
                type="button"
                onClick={() => router.push("/my-account/vouchers")}
                className="flex items-center justify-center gap-2.5 rounded-2xl border border-gray-3 bg-white px-4 py-3.5 text-center transition-all duration-200"
              >
                <svg className={iconClassName} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 8.5H21V15.5C21 17.433 19.433 19 17.5 19H6.5C4.567 19 3 17.433 3 15.5V8.5Z" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M8 8.5V7.5C8 6.11929 9.11929 5 10.5 5H13.5C14.8807 5 16 6.11929 16 7.5V8.5" stroke="currentColor" strokeWidth="1.8" />
                </svg>
                <span className="text-sm font-medium text-dark sm:text-base">Voucher ({voucherCount})</span>
              </button>
            </div>

            <div className="mt-8 rounded-[28px] border border-gray-3 bg-white px-5 py-6 shadow-1 sm:px-8">
              <h2 className="text-base font-semibold text-dark sm:text-lg">Thông tin đặt hàng</h2>

              <div className="mt-6 divide-y divide-gray-3">
                <button type="button" onClick={() => setIsProfileModalOpen(true)} className="flex w-full items-center justify-between gap-4 py-4 text-left">
                  <div className="flex items-center gap-4">
                    <svg className={iconClassName} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M5 19C5.8 16.5 8.1 15 12 15C15.9 15 18.2 16.5 19 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                    <span className="text-[15px] font-medium text-dark sm:text-base">Sửa thông tin cá nhân</span>
                  </div>
                  <span className="text-lg text-dark-4 sm:text-xl">›</span>
                </button>

                <button type="button" onClick={() => router.push("/my-account/orders")} className="flex w-full items-center justify-between gap-4 py-4 text-left">
                  <div className="flex items-center gap-4">
                    <svg className={iconClassName} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7 4.5H17C18.1046 4.5 19 5.39543 19 6.5V17.5C19 18.6046 18.1046 19.5 17 19.5H7C5.89543 19.5 5 18.6046 5 17.5V6.5C5 5.39543 5.89543 4.5 7 4.5Z" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M8 9H16M8 13H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                    <span className="text-[15px] font-medium text-dark sm:text-base">Lịch sử mua hàng</span>
                  </div>
                  <span className="text-lg text-dark-4 sm:text-xl">›</span>
                </button>

                <button type="button" onClick={() => setIsAddressModalOpen(true)} className="flex w-full items-center justify-between gap-4 py-4 text-left">
                  <div className="flex items-center gap-4">
                    <svg className={iconClassName} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 20C15.5 16.4 18 13.9 18 10.5C18 7.46243 15.5376 5 12.5 5H11.5C8.46243 5 6 7.46243 6 10.5C6 13.9 8.5 16.4 12 20Z" stroke="currentColor" strokeWidth="1.8" />
                      <circle cx="12" cy="10.5" r="1.8" stroke="currentColor" strokeWidth="1.8" />
                    </svg>
                    <span className="block text-[15px] font-medium text-dark sm:text-base">Sổ địa chỉ nhận hàng</span>
                  </div>
                  <span className="text-lg text-dark-4 sm:text-xl">›</span>
                </button>
              </div>
            </div>

            <button type="button" onClick={handleLogout} className="mt-6 flex w-full items-center justify-center rounded-2xl border border-[#FCAF17] bg-white px-5 py-3.5 text-sm font-medium text-[#D28500] transition-all duration-200 hover:bg-[#FFF8E8] sm:text-base">
              Đăng xuất
            </button>
          </div>
        </div>
      </section>

      <ProfileEditModal
        isOpen={isProfileModalOpen}
        user={profile as any}
        onClose={() => setIsProfileModalOpen(false)}
        onUpdated={(nextUser) => {
          setProfile(nextUser as UserProfileResponse);
          updateUser(nextUser as any);
        }}
      />

      <AddressBookModal
        isOpen={isAddressModalOpen}
        currentUser={profile}
        addresses={addresses}
        onClose={() => setIsAddressModalOpen(false)}
        onAddressesChanged={setAddresses}
      />
    </>
  );
};

export default MyAccount;
