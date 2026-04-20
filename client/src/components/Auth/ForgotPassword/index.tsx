"use client";

import Breadcrumb from "@/components/Common/Breadcrumb";
import Link from "next/link";
import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { normalizePhone, resetPassword, sendForgotPasswordOtp } from "@/libs/auth-api";
import { toast } from "react-hot-toast";
import OtpVerificationField from "@/components/Common/OtpVerificationField";

const ForgotPassword = () => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const router = useRouter();

  const isSubmitDisabled = useMemo(
    () =>
      loading ||
      phone.length !== 10 ||
      otp.length !== 6 ||
      newPassword.length < 6 ||
      confirmPassword.length < 6,
    [confirmPassword.length, loading, newPassword.length, otp.length, phone.length],
  );

  const handleSendOtp = async () => {
    if (phone.length !== 10) {
      toast.error("Vui lòng nhập số điện thoại hợp lệ (10 chữ số)");
      return false;
    }

    try {
      setSendingOtp(true);
      await sendForgotPasswordOtp(phone);
      setOtpSent(true);
      toast.success("Mã OTP đã được gửi đến số điện thoại của bạn!");
      return true;
    } catch (error: any) {
      toast.error(error.message || "Không thể gửi OTP, vui lòng thử lại!");
      return false;
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu nhập lại không khớp!");
      return;
    }

    if (!otpSent) {
      toast.error("Vui lòng gửi mã OTP trước khi đặt lại mật khẩu!");
      return;
    }

    try {
      setLoading(true);
      await resetPassword({
        phone,
        otp,
        newPassword,
      });
      toast.success("Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.");
      router.push("/signin");
    } catch (error: any) {
      toast.error(error.message || "Không thể đặt lại mật khẩu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Breadcrumb title={"Quên mật khẩu"} pages={["Quên mật khẩu"]} />
      <section className="overflow-hidden py-20 bg-gray-2">
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
          <div className="max-w-[570px] w-full mx-auto rounded-xl bg-white shadow-1 p-4 sm:p-7.5 xl:p-11">
            <div className="text-center mb-11">
              <h2 className="font-semibold text-xl sm:text-2xl xl:text-heading-5 text-dark mb-1.5">
                Khôi phục mật khẩu
              </h2>
              <p>Dùng số điện thoại đã đăng ký để nhận OTP đặt lại mật khẩu.</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-5">
                <label htmlFor="phone" className="block mb-2.5">
                  Số điện thoại
                </label>

                <div className="flex gap-2">
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    inputMode="numeric"
                    placeholder="Nhập số điện thoại 10 chữ số"
                    value={phone}
                    onChange={(e) => setPhone(normalizePhone(e.target.value))}
                    required
                    className="rounded-lg border border-gray-3 bg-gray-1 placeholder:text-dark-5 flex-grow py-2.5 px-4 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-blue/20"
                  />
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={sendingOtp || phone.length !== 10}
                    className="px-4 py-2.5 bg-blue text-dark rounded-lg text-sm hover:bg-blue-dark duration-200 whitespace-nowrap disabled:bg-opacity-50"
                  >
                    {sendingOtp ? "Đang gửi..." : otpSent ? "Gửi lại mã" : "Gửi mã"}
                  </button>
                </div>
              </div>

              <OtpVerificationField
                id="forgot-password-otp"
                value={otp}
                onChange={setOtp}
                onSendOtp={handleSendOtp}
                sending={sendingOtp}
                sendDisabled={phone.length !== 10}
                helperText="OTP có hiệu lực trong 5 phút. Sau khi gửi thành công, bạn cần chờ 60 giây mới có thể gửi lại."
                className="mb-5"
              />

              <div className="mb-5">
                <label htmlFor="new-password" className="block mb-2.5">
                  Mật khẩu mới
                </label>

                <input
                  type="password"
                  name="new-password"
                  id="new-password"
                  placeholder="Nhập mật khẩu mới"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="rounded-lg border border-gray-3 bg-gray-1 placeholder:text-dark-5 w-full py-2.5 px-4 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-blue/20"
                />
              </div>

              <div className="mb-5.5">
                <label htmlFor="confirm-password" className="block mb-2.5">
                  Nhập lại mật khẩu mới
                </label>

                <input
                  type="password"
                  name="confirm-password"
                  id="confirm-password"
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="rounded-lg border border-gray-3 bg-gray-1 placeholder:text-dark-5 w-full py-2.5 px-4 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-blue/20"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="w-full flex justify-center font-medium text-dark bg-blue py-2.5 px-5 rounded-lg ease-out duration-200 hover:bg-blue-dark mt-6 disabled:bg-opacity-50"
              >
                {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
              </button>

              <p className="text-center mt-6">
                Nhớ mật khẩu rồi?
                <Link
                  href="/signin"
                  className="text-dark ease-out duration-200 hover:text-blue pl-2"
                >
                  Quay lại đăng nhập
                </Link>
              </p>
            </form>
          </div>
        </div>
      </section>
    </>
  );
};

export default ForgotPassword;
