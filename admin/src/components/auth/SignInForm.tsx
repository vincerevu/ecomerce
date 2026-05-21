import { useState } from "react";
import { Link, useNavigate } from "react-router";
import apiClient from "../../api/apiClient";
import { useAuth } from "../../context/AuthContext";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Button from "../ui/button/Button";
import Checkbox from "../form/input/Checkbox";
import Input from "../form/input/InputField";
import Label from "../form/Label";

interface LoginPermission {
  name: string;
}

interface LoginRole {
  name: string;
  permissions: LoginPermission[];
}

interface LoginUser {
  id?: string;
  username?: string;
  email?: string;
  name?: string;
  fullName?: string;
  phone?: string;
  position?: string;
  roles: LoginRole[];
  addresses?: unknown[];
}

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await apiClient.post("/auth/admin/login", {
        phone: identifier,
        password,
      });

      if (response.data.code !== 1000) {
        setError(response.data.message || "Đăng nhập thất bại");
        return;
      }

      const { accessToken, refreshToken, user } = response.data.result as {
        accessToken: string;
        refreshToken: string;
        user: LoginUser;
      };

      const ALLOWED_ROLES = ["ADMIN", "MANAGER", "STAFF", "WAREHOUSE_STAFF", "SHIPPER"];
      const hasBackofficeRole = user.roles.some((role) =>
        ALLOWED_ROLES.includes(role.name)
      );

      if (!hasBackofficeRole) {
        setError("Truy cập bị từ chối. Chỉ dành cho nhân viên hệ thống.");
        return;
      }

      login(accessToken, refreshToken, {
        id: user.id || user.username || identifier,
        email: user.email || user.username || "",
        name: user.fullName || user.name || user.username || identifier,
        phone: user.phone || identifier,
        roles: user.roles.map((role) => role.name),
        permissions: Array.from(new Set(user.roles.flatMap((role) => role.permissions.map((permission) => permission.name)))),
        position: user.position,
        address: typeof user.addresses?.[0] === "string" ? user.addresses[0] : undefined,
      });

      void isChecked;
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.message || "Thông tin đăng nhập không hợp lệ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-md pt-10">
        <Link to="/" className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
          <ChevronLeftIcon className="size-5" />
          Quay lại trang chủ
        </Link>
      </div>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 text-title-sm font-semibold text-gray-800 dark:text-white/90 sm:text-title-md">Đăng nhập Hệ thống</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Sử dụng Số điện thoại hoặc Email để đăng nhập.</p>
          </div>

          {error && <div className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-500 dark:bg-red-500/10">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <Label>Số điện thoại / Email <span className="text-error-500">*</span></Label>
                <Input placeholder="Nhập số điện thoại hoặc email" value={identifier} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setIdentifier(event.target.value)} required />
              </div>

              <div>
                <Label>Mật khẩu <span className="text-error-500">*</span></Label>
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} placeholder="Nhập mật khẩu" value={password} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)} required />
                  <span onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 z-30 -translate-y-1/2 cursor-pointer">
                    {showPassword ? <EyeIcon className="size-5 fill-gray-500 dark:fill-gray-400" /> : <EyeCloseIcon className="size-5 fill-gray-500 dark:fill-gray-400" />}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox checked={isChecked} onChange={setIsChecked} />
                  <span className="block text-theme-sm font-normal text-gray-700 dark:text-gray-400">Ghi nhớ đăng nhập</span>
                </div>
                <Link to="/forgot-password" className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400">Quên mật khẩu?</Link>
              </div>

              <div>
                <Button className="w-full" size="sm" isLoading={loading} type="submit">Đăng nhập</Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
