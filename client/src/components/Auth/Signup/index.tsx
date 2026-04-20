"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { normalizePhone, register, sendRegisterOtp } from "@/libs/auth-api";
import OtpVerificationField from "@/components/Common/OtpVerificationField";

const Signup = () => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCooldownSeed, setOtpCooldownSeed] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSubmitDisabled = useMemo(
    () => {
      if (
        loading ||
        sendingOtp ||
        !name.trim() ||
        phone.length !== 10 ||
        password.length < 8 ||
        confirmPassword.length < 8
      ) {
        return true;
      }

      if (password !== confirmPassword) {
        return true;
      }

      if (!otpSent) {
        return false;
      }

      return otp.length !== 6;
    },
    [
      confirmPassword,
      loading,
      name,
      otp.length,
      otpSent,
      password,
      phone.length,
      sendingOtp,
    ],
  );

  useEffect(() => {
    const phoneParam = searchParams.get("phone");

    if (phoneParam) {
      setPhone(normalizePhone(phoneParam));
    }
  }, [searchParams]);

  const validateBaseForm = () => {
    if (!name.trim()) {
      toast.error("Vui lòng nhập họ và tên");
      return false;
    }

    if (phone.length !== 10) {
      toast.error("Vui lòng nhập số điện thoại hợp lệ (10 chữ số)");
      return false;
    }

    if (password.length < 8) {
      toast.error("Mật khẩu phải có ít nhất 8 ký tự");
      return false;
    }

    if (confirmPassword.length < 8) {
      toast.error("Vui lòng nhập lại mật khẩu");
      return false;
    }

    if (password !== confirmPassword) {
      toast.error("Mật khẩu nhập lại không khớp!");
      return false;
    }

    return true;
  };

  const handleConfirmInfo = async () => {
    if (!validateBaseForm()) {
      return false;
    }

    try {
      setSendingOtp(true);
      await sendRegisterOtp(phone);
      setOtpSent(true);
      setOtpCooldownSeed(Date.now());
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

    if (!otpSent) {
      await handleConfirmInfo();
      return;
    }

    if (!validateBaseForm()) {
      return;
    }

    if (otp.length !== 6) {
      toast.error("Vui lòng nhập mã OTP 6 chữ số");
      return;
    }

    setLoading(true);

    try {
      await register({
        name,
        phone,
        password,
        otp,
      });
      toast.success("Đăng ký tài khoản thành công! Vui lòng đăng nhập.");
      router.push("/signin");
    } catch (error: any) {
      toast.error(error.message || "Đăng ký thất bại, vui lòng kiểm tra lại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="overflow-hidden bg-gray-2 py-20">
      <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
        <div className="max-w-[570px] w-full mx-auto rounded-xl bg-white shadow-1 p-4 sm:p-7.5 xl:p-11">
          <div className="text-center mb-11">
            <h2 className="font-semibold text-xl sm:text-2xl xl:text-heading-5 text-dark mb-1.5">
              Tạo tài khoản
            </h2>
            <p>Nhập thông tin của bạn để bắt đầu</p>
          </div>

          <div className="mt-5.5">
            <form onSubmit={handleSubmit}>
              <div className="mb-5">
                <label htmlFor="name" className="block mb-2.5">
                  Họ và tên <span className="text-red">*</span>
                </label>

                <input
                  type="text"
                  name="name"
                  id="name"
                  placeholder="Nhập họ và tên"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="rounded-lg border border-gray-3 bg-gray-1 placeholder:text-dark-5 w-full py-2.5 px-4 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-blue/20"
                />
              </div>

              <div className="mb-5">
                <label htmlFor="phone" className="block mb-2.5">
                  Số điện thoại <span className="text-red">*</span>
                </label>

                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  inputMode="numeric"
                  placeholder="Nhập số điện thoại"
                  value={phone}
                  onChange={(e) => setPhone(normalizePhone(e.target.value))}
                  required
                  className="rounded-lg border border-gray-3 bg-gray-1 placeholder:text-dark-5 w-full py-2.5 px-4 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-blue/20"
                />
                <p className="mt-2 text-sm text-dark-4">
                  Nhập đầy đủ thông tin, sau đó bấm xác nhận để nhận mã OTP.
                </p>
              </div>

              <div className="mb-5">
                <label htmlFor="password" className="block mb-2.5">
                  Mật khẩu <span className="text-red">*</span>
                </label>

                <input
                  type="password"
                  name="password"
                  id="password"
                  placeholder="Nhập mật khẩu"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="rounded-lg border border-gray-3 bg-gray-1 placeholder:text-dark-5 w-full py-2.5 px-4 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-blue/20"
                />
              </div>

              <div className="mb-5.5">
                <label htmlFor="re-type-password" className="block mb-2.5">
                  Nhập lại mật khẩu <span className="text-red">*</span>
                </label>

                <input
                  type="password"
                  name="re-type-password"
                  id="re-type-password"
                  placeholder="Nhập lại mật khẩu"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="rounded-lg border border-gray-3 bg-gray-1 placeholder:text-dark-5 w-full py-2.5 px-4 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-blue/20"
                />
              </div>

              {otpSent ? (
                <OtpVerificationField
                  key={otpCooldownSeed}
                  id="signup-otp"
                  label={
                    <>
                      Mã xác thực OTP <span className="text-red">*</span>
                    </>
                  }
                  value={otp}
                  onChange={setOtp}
                  onSendOtp={handleConfirmInfo}
                  sending={sendingOtp}
                  sendDisabled={loading}
                  helperText="Mã OTP đã được gửi khi bạn bấm Xác nhận. Nếu chưa nhận được, bạn có thể gửi lại sau 60 giây."
                  className="mb-5.5"
                  autoStartCooldown
                />
              ) : (
                <p className="mb-5.5 text-sm text-dark-4">
                  Nhập đầy đủ thông tin, sau đó bấm xác nhận để hệ thống gửi mã OTP.
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="w-full flex justify-center font-medium text-dark bg-blue py-2.5 px-5 rounded-lg ease-out duration-200 hover:bg-blue-dark mt-6 disabled:bg-opacity-50"
              >
                {loading || sendingOtp
                  ? "Đang xử lý..."
                  : otpSent
                    ? "Tạo tài khoản"
                    : "Xác nhận"}
              </button>

              <p className="text-center mt-6">
                Đã có tài khoản?
                <Link
                  href={phone ? `/signin?phone=${encodeURIComponent(phone)}` : "/signin"}
                  className="text-dark ease-out duration-200 hover:text-blue pl-2"
                >
                  Đăng nhập ngay
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Signup;
