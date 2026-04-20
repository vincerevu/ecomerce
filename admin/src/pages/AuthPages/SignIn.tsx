import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Đăng nhập | Hệ thống Admin"
        description="Trang đăng nhập dành cho quản trị viên hệ thống"
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
