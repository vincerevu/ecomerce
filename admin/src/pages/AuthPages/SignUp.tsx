import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignUpForm from "../../components/auth/SignUpForm";

export default function SignUp() {
  return (
    <>
      <PageMeta
        title="Đăng ký | Hệ thống Admin"
        description="Trang đăng ký tài khoản cho hệ thống quản trị"
      />
      <AuthLayout>
        <SignUpForm />
      </AuthLayout>
    </>
  );
}
