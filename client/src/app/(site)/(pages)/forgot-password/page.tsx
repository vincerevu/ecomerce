import ForgotPassword from "@/components/Auth/ForgotPassword";
import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quên mật khẩu | Bagy",
  description: "Khôi phục mật khẩu tài khoản khách hàng Bagy",
};

const ForgotPasswordPage = () => {
  return (
    <main>
      <ForgotPassword />
    </main>
  );
};

export default ForgotPasswordPage;
