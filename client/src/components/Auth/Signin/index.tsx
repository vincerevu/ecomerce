"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { login, normalizePhone } from "@/libs/auth-api";
import { useAuth } from "@/app/context/AuthContext";

const Signin = () => {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login: applySession } = useAuth();
  const isSubmitDisabled = useMemo(
    () => loading || phone.length !== 10 || password.length < 6,
    [loading, phone, password],
  );

  useEffect(() => {
    const phoneParam = searchParams.get("phone");

    if (phoneParam) {
      setPhone(normalizePhone(phoneParam));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const session = await login(phone, password);
      applySession(session);
      toast.success("Đăng nhập thành công!");
      router.push("/");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Đăng nhập thất bại, vui lòng kiểm tra lại!");
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
              Đăng nhập tài khoản
            </h2>
            <p>Nhập thông tin của bạn</p>
          </div>

          <div>
            <form onSubmit={handleSubmit}>
              <div className="mb-5">
                <label htmlFor="phone" className="block mb-2.5">
                  Số điện thoại
                </label>

                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  inputMode="numeric"
                  placeholder="Nhập số điện thoại 10 chữ số"
                  value={phone}
                  onChange={(e) => setPhone(normalizePhone(e.target.value))}
                  required
                  className="rounded-lg border border-gray-3 bg-gray-1 placeholder:text-dark-5 w-full py-2.5 px-4 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-blue/20"
                />
                <p className="mt-2 text-sm text-dark-4">
                  Dùng số điện thoại đã đăng ký để đăng nhập.
                </p>
              </div>

              <div className="mb-5">
                <label htmlFor="password" className="block mb-2.5">
                  Mật khẩu
                </label>

                <input
                  type="password"
                  name="password"
                  id="password"
                  placeholder="Nhập mật khẩu của bạn"
                  autoComplete="on"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="rounded-lg border border-gray-3 bg-gray-1 placeholder:text-dark-5 w-full py-2.5 px-4 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-blue/20"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="w-full flex justify-center font-medium text-dark bg-blue py-2.5 px-5 rounded-lg ease-out duration-200 hover:bg-blue-dark mt-6 disabled:bg-opacity-50"
              >
                {loading ? "Đang xử lý..." : "Đăng nhập"}
              </button>

              <Link
                href="/forgot-password"
                className="block text-center text-dark-4 mt-4.5 ease-out duration-200 hover:text-dark"
              >
                Quên mật khẩu?
              </Link>

              <p className="text-center mt-6">
                Chưa có tài khoản?
                <Link
                  href={phone ? `/signup?phone=${encodeURIComponent(phone)}` : "/signup"}
                  className="text-dark ease-out duration-200 hover:text-blue pl-2"
                >
                  Đăng ký ngay!
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Signin;
