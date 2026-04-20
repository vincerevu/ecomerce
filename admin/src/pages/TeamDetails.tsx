import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import apiClient from "../api/apiClient";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Loader from "../components/common/Loader";
import Select, { type Option } from "../components/form/Select";
import Badge from "../components/ui/badge/Badge";
import Button from "../components/ui/button/Button";
import { AngleLeftIcon, PencilIcon } from "../icons";
import { showError, showSuccess } from "../utils/toast";

type TeamRole = {
  name: string;
  description?: string;
};

type TeamMember = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  gender?: string;
  dateOfBirth?: string;
  position?: string;
  active?: boolean;
  roles?: TeamRole[];
  createdAt?: string;
};

type RoleOptionResponse = {
  name: string;
  description?: string;
};

const GENDER_OPTIONS: Option[] = [
  { value: "", label: "Chưa chọn" },
  { value: "MALE", label: "Nam" },
  { value: "FEMALE", label: "Nữ" },
  { value: "OTHER", label: "Khác" },
];

const ACTIVE_OPTIONS: Option[] = [
  { value: "true", label: "Đang làm việc" },
  { value: "false", label: "Ngưng hoạt động" },
];

const formatDateTime = (value?: string) => {
  if (!value) return "Chưa có dữ liệu";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN");
};

export default function TeamDetails() {
  const { staffId } = useParams();
  const navigate = useNavigate();

  const [member, setMember] = useState<TeamMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [roleOptions, setRoleOptions] = useState<Option[]>([]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [active, setActive] = useState("true");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!staffId) {
      setIsLoading(false);
      return;
    }

    const loadMember = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.get(`/users/${staffId}`);
        const nextMember = response.data.result as TeamMember;
        setMember(nextMember);
        setName(nextMember.name || "");
        setPhone(nextMember.phone || "");
        setPosition(nextMember.position || "");
        setGender(nextMember.gender || "");
        setDateOfBirth(nextMember.dateOfBirth || "");
        setSelectedRole(nextMember.roles?.[0]?.name || "");
        setActive(String(nextMember.active ?? true));
        setPassword("");
        setIsEditing(false);
      } catch (error) {
        console.error("Failed to load staff member", error);
        showError("Không thể tải thông tin thành viên.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadMember();
  }, [staffId]);

  useEffect(() => {
    const loadRoles = async () => {
      try {
        const response = await apiClient.get("/roles");
        const options = ((response.data.result || []) as RoleOptionResponse[]).map((role) => ({
          value: role.name,
          label: role.description || role.name,
        }));
        setRoleOptions(options);
      } catch (error) {
        console.error("Failed to load roles", error);
      }
    };

    void loadRoles();
  }, []);

  const resetForm = () => {
    if (!member) return;
    setName(member.name || "");
    setPhone(member.phone || "");
    setPosition(member.position || "");
    setGender(member.gender || "");
    setDateOfBirth(member.dateOfBirth || "");
    setSelectedRole(member.roles?.[0]?.name || "");
    setActive(String(member.active ?? true));
    setPassword("");
  };

  const handleCancelEdit = () => {
    resetForm();
    setIsEditing(false);
  };

  const dirty = useMemo(() => {
    if (!member) return false;
    return (
      name !== (member.name || "") ||
      phone !== (member.phone || "") ||
      position !== (member.position || "") ||
      gender !== (member.gender || "") ||
      dateOfBirth !== (member.dateOfBirth || "") ||
      selectedRole !== (member.roles?.[0]?.name || "") ||
      active !== String(member.active ?? true) ||
      Boolean(password)
    );
  }, [active, dateOfBirth, gender, member, name, password, phone, position, selectedRole]);

  const handleSave = async () => {
    if (!staffId || !member) return;

    try {
      setIsSaving(true);
      const payload: Record<string, unknown> = {
        name: name.trim(),
        phone: phone.trim(),
        position: position.trim(),
        gender: gender || null,
        dateOfBirth: dateOfBirth || null,
        roles: selectedRole ? [selectedRole] : [],
        active: active === "true",
      };

      if (password.trim()) {
        payload.password = password.trim();
      }

      const response = await apiClient.put(`/users/${staffId}`, payload);
      const nextMember = response.data.result as TeamMember;
      setMember(nextMember);
      setName(nextMember.name || "");
      setPhone(nextMember.phone || "");
      setPosition(nextMember.position || "");
      setGender(nextMember.gender || "");
      setDateOfBirth(nextMember.dateOfBirth || "");
      setSelectedRole(nextMember.roles?.[0]?.name || "");
      setActive(String(nextMember.active ?? true));
      setPassword("");
      setIsEditing(false);
      showSuccess("Cập nhật thành viên thành công.");
    } catch (error) {
      console.error("Failed to update staff member", error);
      showError("Không thể cập nhật thành viên.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <PageMeta title="Chi tiết thành viên | Hệ thống Admin" description="Xem thông tin thành viên" />
        <PageBreadcrumb pageTitle="Chi tiết thành viên" />
        <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-gray-200 bg-white dark:border-white/[0.06] dark:bg-[#111b2d]">
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <Loader size="md" />
            <span className="text-sm">Đang tải thông tin thành viên...</span>
          </div>
        </div>
      </>
    );
  }

  if (!member) {
    return (
      <>
        <PageMeta title="Không tìm thấy thành viên | Hệ thống Admin" description="Không tìm thấy thành viên yêu cầu" />
        <PageBreadcrumb pageTitle="Chi tiết thành viên" />
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-white/[0.06] dark:bg-[#111b2d]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Không tìm thấy thành viên cần xem.</p>
          <Button className="mt-4" variant="outline" onClick={() => navigate("/team")}>
            Quay lại danh sách thành viên
          </Button>
        </div>
      </>
    );
  }

  const roleBadges = member.roles?.length ? member.roles : [];

  return (
    <>
      <PageMeta title={`${member.name} | Hệ thống Admin`} description="Xem thông tin thành viên" />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <PageBreadcrumb pageTitle={`Thành viên: ${member.name}`} />
        <div className="flex flex-wrap items-center gap-2">
          {!isEditing ? (
            <Button size="sm" startIcon={<PencilIcon />} onClick={() => setIsEditing(true)}>
              Chỉnh sửa
            </Button>
          ) : (
            <>
              <Button size="sm" onClick={handleSave} isLoading={isSaving} disabled={!dirty}>
                Lưu thay đổi
              </Button>
              <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                Quay lại
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" startIcon={<AngleLeftIcon />} onClick={() => navigate("/team")}>
            Danh sách thành viên
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-[#111b2d]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-500">Thành viên</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">{name || member.name}</h3>
            <Badge size="sm" color={active === "true" ? "success" : "light"} variant="light">
              {active === "true" ? "Đang làm việc" : "Ngưng hoạt động"}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Gia nhập lúc {formatDateTime(member.createdAt)}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 dark:border-white/[0.05] dark:bg-white/[0.02]">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Thông tin cá nhân</h4>
              <div className="mt-3 space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <div>
                  <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">Họ và tên</p>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    disabled={!isEditing}
                    className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none disabled:bg-gray-100 disabled:text-gray-500 dark:border-white/[0.08] dark:bg-[#162033] dark:text-white dark:disabled:bg-white/[0.03]"
                  />
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">Số điện thoại</p>
                  <input
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    disabled={!isEditing}
                    className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none disabled:bg-gray-100 disabled:text-gray-500 dark:border-white/[0.08] dark:bg-[#162033] dark:text-white dark:disabled:bg-white/[0.03]"
                  />
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">Email</p>
                  <div className="rounded-lg border border-gray-200 bg-gray-100 px-3 py-3 text-sm text-gray-600 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-gray-300">
                    {member.email || "Chưa có email"}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 p-4 dark:border-white/[0.05]">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Thông tin công việc</h4>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">Chức vụ</p>
                  <input
                    value={position}
                    onChange={(event) => setPosition(event.target.value)}
                    disabled={!isEditing}
                    className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none disabled:bg-gray-100 disabled:text-gray-500 dark:border-white/[0.08] dark:bg-[#162033] dark:text-white dark:disabled:bg-white/[0.03]"
                  />
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">Trạng thái</p>
                  {isEditing ? (
                    <Select value={active} onChange={setActive} options={ACTIVE_OPTIONS} className="w-full" />
                  ) : (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-white/[0.08] dark:bg-white/[0.02]">
                      <Badge size="sm" color={member.active ? "success" : "light"} variant="light">
                        {member.active ? "Đang làm việc" : "Ngưng hoạt động"}
                      </Badge>
                    </div>
                  )}
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">Giới tính</p>
                  {isEditing ? (
                    <Select value={gender} onChange={setGender} options={GENDER_OPTIONS} className="w-full" />
                  ) : (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-white/[0.08] dark:bg-white/[0.02]">
                      {gender === "MALE" ? "Nam" : gender === "FEMALE" ? "Nữ" : gender === "OTHER" ? "Khác" : "Chưa chọn"}
                    </div>
                  )}
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">Ngày sinh</p>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(event) => setDateOfBirth(event.target.value)}
                    disabled={!isEditing}
                    className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none disabled:bg-gray-100 disabled:text-gray-500 dark:border-white/[0.08] dark:bg-[#162033] dark:text-white dark:disabled:bg-white/[0.03]"
                  />
                </div>
                <div className="md:col-span-2">
                  <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">Vai trò</p>
                  {isEditing ? (
                    <Select value={selectedRole} onChange={setSelectedRole} options={roleOptions} className="w-full" searchable />
                  ) : (
                    <div className="flex flex-wrap gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-white/[0.08] dark:bg-white/[0.02]">
                      {roleBadges.length ? (
                        roleBadges.map((role) => (
                          <Badge key={role.name} size="sm" color="info" variant="light">
                            {role.description || role.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-gray-500">Chưa gán vai trò</span>
                      )}
                    </div>
                  )}
                </div>
                {isEditing ? (
                  <div className="md:col-span-2">
                    <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">Mật khẩu mới</p>
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Để trống nếu không đổi"
                      className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none dark:border-white/[0.08] dark:bg-[#162033] dark:text-white"
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 dark:border-white/[0.05] dark:bg-white/[0.02]">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Tóm tắt</h4>
              <div className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center justify-between">
                  <span>Mã nhân viên</span>
                  <span className="font-medium">{member.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Loại tài khoản</span>
                  <span className="font-medium">{member.email ? "Nhân sự hệ thống" : "Nhân sự nội bộ"}</span>
                </div>
                <div className="flex items-center justify-between border-t border-dashed border-gray-200 pt-3 dark:border-white/[0.08]">
                  <span>Gia nhập</span>
                  <span className="font-medium">{formatDateTime(member.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
