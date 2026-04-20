import { useEffect, useState } from "react";
import type { CustomerRecord } from "../../api/customerApi";
import { customerApi } from "../../api/customerApi";
import { showError, showSuccess } from "../../utils/toast";
import Label from "../form/Label";
import Select from "../form/Select";
import Switch from "../form/switch/Switch";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { Modal } from "../ui/modal";

interface CustomerModalProps {
  isOpen: boolean;
  customer: CustomerRecord | null;
  onClose: () => void;
  onSuccess: (customer: CustomerRecord) => void;
  embedded?: boolean;
}

const formatDateForInput = (value?: string) => {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
};

export default function CustomerModal({
  isOpen,
  customer,
  onClose,
  onSuccess,
  embedded = false,
}: CustomerModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setName(customer?.name || "");
    setPhone(customer?.phone || "");
    setPassword("");
    setEmail(customer?.email || "");
    setGender(customer?.gender || "");
    setDateOfBirth(formatDateForInput(customer?.dateOfBirth));
    setActive(customer?.active ?? true);
  }, [isOpen, customer]);

  const handleClose = () => {
    setLoading(false);
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setLoading(true);
      const payload = {
        phone,
        name,
        email: email || undefined,
        gender: gender || undefined,
        dateOfBirth: dateOfBirth || undefined,
        active,
      };

      const response = customer
        ? await customerApi.update(customer.id, payload)
        : await customerApi.create({
            ...payload,
            password,
          });

      showSuccess(customer ? "Đã cập nhật thông tin khách hàng." : "Đã tạo khách hàng mới.");
      onSuccess(response.result);
      handleClose();
    } catch (error: any) {
      showError(
        error.response?.data?.message ||
          (customer ? "Không thể cập nhật khách hàng." : "Không thể tạo khách hàng."),
      );
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <div className={`${embedded ? "rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-[#111b2d] lg:p-8" : ""}`}>
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          {customer ? "Cập nhật khách hàng" : "Thêm khách hàng"}
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {customer
            ? "Chỉnh thông tin liên hệ và trạng thái hoạt động của tài khoản khách hàng."
            : "Tạo mới hồ sơ khách hàng để quản lý thông tin liên hệ và trạng thái tài khoản."}
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="customer-name">Họ và tên</Label>
            <Input
              id="customer-name"
              value={name}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setName(event.target.value)}
              placeholder="Ví dụ: Nguyễn Văn A"
              required
            />
          </div>
          <div>
            <Label htmlFor="customer-phone">Số điện thoại</Label>
            <Input
              id="customer-phone"
              value={phone}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setPhone(event.target.value)}
              placeholder="0901234567"
              required
            />
          </div>
        </div>

        {!customer ? (
          <div>
            <Label htmlFor="customer-password">Mật khẩu đăng nhập</Label>
            <Input
              id="customer-password"
              type="password"
              value={password}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)}
              placeholder="Tối thiểu 8 ký tự"
              required
            />
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="customer-email">Email</Label>
            <Input
              id="customer-email"
              type="email"
              value={email}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)}
              placeholder="customer@example.com"
            />
          </div>
          <div>
            <Label htmlFor="customer-gender">Giới tính</Label>
            <Select
              options={[
                { value: "", label: "Chưa chọn" },
                { value: "MALE", label: "Nam" },
                { value: "FEMALE", label: "Nữ" },
                { value: "OTHER", label: "Khác" },
              ]}
              value={gender}
              onChange={setGender}
              placeholder="Chọn giới tính"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="customer-dob">Ngày sinh</Label>
            <Input
              id="customer-dob"
              type="date"
              value={dateOfBirth}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setDateOfBirth(event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="customer-tier">Hạng hiện tại</Label>
            <Input
              id="customer-tier"
              value={customer?.membershipTier?.tierName || "Thành viên mới"}
              disabled
            />
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Trạng thái tài khoản
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Bật để khách hàng có thể đăng nhập và mua hàng, tắt để tạm khóa tài khoản.
              </p>
            </div>
            <Switch
              label={active ? "Đang hoạt động" : "Đã khóa"}
              checked={active}
              onChange={setActive}
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="outline" size="sm" type="button" onClick={handleClose}>
            Hủy bỏ
          </Button>
          <Button size="sm" type="submit" disabled={loading}>
            {loading ? (customer ? "Đang cập nhật..." : "Đang tạo...") : customer ? "Lưu thay đổi" : "Tạo khách hàng"}
          </Button>
        </div>
      </form>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      className="w-full max-w-[640px] p-5 lg:p-8"
    >
      {content}
    </Modal>
  );
}
