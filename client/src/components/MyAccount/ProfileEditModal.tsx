"use client";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import ModalShell from "./ModalShell";
import type { AuthUser } from "@/types/auth";
import { userApi } from "@/libs/user-api";
import { setStoredUser } from "@/libs/auth-storage";

type GenderValue = "MALE" | "FEMALE" | "OTHER" | "";

type ProfileEditModalProps = {
  isOpen: boolean;
  user: AuthUser | null;
  onClose: () => void;
  onUpdated: (nextUser: AuthUser) => void;
};

const ProfileEditModal = ({
  isOpen,
  user,
  onClose,
  onUpdated,
}: ProfileEditModalProps) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<GenderValue>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !user) {
      return;
    }

    setName(user.name || "");
    setPhone(user.phone || "");
    setGender((user.gender as GenderValue) || "");
  }, [isOpen, user]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!name.trim()) {
      toast.error("Vui lòng nhập họ và tên.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await userApi.updateProfile({
        name: name.trim(),
        phone: phone || null,
        gender: gender || null,
      });

      const nextUser = {
        ...user,
        ...response.result,
      } as AuthUser;

      setStoredUser(nextUser);
      onUpdated(nextUser);
      toast.success("Đã cập nhật thông tin cá nhân.");
      onClose();
    } catch (error: any) {
      toast.error(error?.message || "Không thể cập nhật thông tin cá nhân.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalShell title="Sửa thông tin cá nhân" isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="px-5 py-6 sm:px-6">
        <div className="mb-5 flex items-center gap-5 text-[18px] text-dark">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="gender"
              className="h-5 w-5 appearance-none rounded-full border border-gray-4 bg-white outline-none ring-0 transition checked:border-[#FCAF17] checked:bg-[#FCAF17] checked:shadow-[inset_0_0_0_4px_#fff] focus:outline-none focus:ring-0"
              checked={gender === "MALE"}
              onChange={() => setGender("MALE")}
            />
            <span>Nam</span>
          </label>

          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="gender"
              className="h-5 w-5 appearance-none rounded-full border border-gray-4 bg-white outline-none ring-0 transition checked:border-[#FCAF17] checked:bg-[#FCAF17] checked:shadow-[inset_0_0_0_4px_#fff] focus:outline-none focus:ring-0"
              checked={gender === "FEMALE"}
              onChange={() => setGender("FEMALE")}
            />
            <span>Nữ</span>
          </label>
        </div>

        <div className="space-y-5">
          <div>
            <label className="mb-2.5 block text-[15px] font-medium text-dark">
              Họ và tên<span className="text-red">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-full border border-gray-3 bg-white px-5 py-4 text-xl text-dark outline-none transition focus:border-[#FCAF17]"
            />
          </div>

          <div>
            <label className="mb-2.5 block text-[15px] font-medium text-dark">
              Số điện thoại
            </label>
            <input
              type="text"
              value={phone}
              disabled
              className="w-full rounded-full border border-gray-3 bg-gray-1 px-5 py-4 text-xl text-dark outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-8 flex w-full items-center justify-center rounded-full bg-[#FFC84B] px-6 py-4 text-[18px] font-medium text-dark transition hover:bg-[#FCAF17] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Đang lưu..." : "Xác nhận"}
        </button>
      </form>
    </ModalShell>
  );
};

export default ProfileEditModal;
