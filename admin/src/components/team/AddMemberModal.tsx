import { useEffect, useState } from "react";
import apiClient from "../../api/apiClient";
import { showError, showSuccess } from "../../utils/toast";
import DatePicker from "../form/date-picker";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Select, { Option } from "../form/Select";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import { Staff } from "../tables/TeamTable";

interface RoleOption extends Option {}

interface MemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    member?: Staff | null;
}

interface RoleResponse {
    name: string;
    description?: string;
}

export default function AddMemberModal({ isOpen, onClose, onSuccess, member = null }: MemberModalProps) {
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [position, setPosition] = useState("");
    const [gender, setGender] = useState("");
    const [dateOfBirth, setDateOfBirth] = useState("");
    const [password, setPassword] = useState("");
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [availableRoles, setAvailableRoles] = useState<RoleOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const isEdit = Boolean(member);

    useEffect(() => {
        if (!isOpen) return;

        void fetchRoles();

        if (member) {
            setName(member.name || "");
            setPhone(member.phone || "");
            setPosition(member.position || "");
            setGender(member.gender || "");
            setDateOfBirth(member.dateOfBirth || "");
            setSelectedRoles(member.roles.map((role) => role.name));
            setPassword("");
            setError("");
        } else {
            handleReset();
        }
    }, [isOpen, member]);

    const fetchRoles = async () => {
        try {
            const response = await apiClient.get("/roles");
            const roles = (response.data.result || []).map((role: RoleResponse) => ({
                value: role.name,
                label: role.description || role.name,
            }));
            setAvailableRoles(roles);
        } catch (err) {
            console.error("Failed to fetch roles", err);
        }
    };

    const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!phone || (!isEdit && !password) || selectedRoles.length === 0) {
            setError(`Vui lòng điền đầy đủ các thông tin bắt buộc (Số điện thoại, ${!isEdit ? "Mật khẩu, " : ""}Vai trò).`);
            return;
        }

        try {
            setLoading(true);
            setError("");

            const payload: {
                phone: string;
                name: string;
                position: string;
                gender: string;
                dateOfBirth: string;
                roles: string[];
                active: boolean;
                password?: string;
            } = {
                phone,
                name,
                position,
                gender,
                dateOfBirth,
                roles: selectedRoles,
                active: true,
            };

            if (password) payload.password = password;

            if (isEdit && member) {
                await apiClient.put(`/users/${member.id}`, payload);
                showSuccess("Cập nhật thông tin thành công!");
            } else {
                await apiClient.post("/users", payload);
                showSuccess("Khởi tạo tài khoản thành công!");
            }

            onSuccess();
            handleClose();
        } catch (err: any) {
            showError(err.response?.data?.message || `Không thể ${isEdit ? "cập nhật" : "khởi tạo"} tài khoản`);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setName("");
        setPhone("");
        setPosition("");
        setGender("");
        setDateOfBirth("");
        setPassword("");
        setSelectedRoles([]);
        setError("");
    };

    const handleClose = () => {
        handleReset();
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} className="w-full max-w-[600px] p-5 lg:p-8">
            <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">{isEdit ? "Chỉnh sửa thành viên" : "Thêm thành viên mới"}</h3>
                <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                    {isEdit ? "Cập nhật thông tin chi tiết cho nhân viên hệ thống." : "Tạo tài khoản mới cho nhân viên hoặc quản trị viên hệ thống."}
                </p>
            </div>

            {error && <div className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-500 dark:bg-red-500/10">{error}</div>}

            <form className="space-y-4" onSubmit={handleSave}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <Label htmlFor="name">Họ và tên</Label>
                        <Input id="name" placeholder="Ví dụ: Nguyễn Văn A" value={name} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setName(event.target.value)} />
                    </div>

                    <div>
                        <Label htmlFor="phone">Số điện thoại <span className="text-red-500">*</span></Label>
                        <Input id="phone" placeholder="0901234567" value={phone} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setPhone(event.target.value)} required />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <Label htmlFor="gender">Giới tính</Label>
                        <Select
                            options={[
                                { value: "MALE", label: "Nam" },
                                { value: "FEMALE", label: "Nữ" },
                                { value: "OTHER", label: "Khác" },
                            ]}
                            value={gender}
                            onChange={setGender}
                            placeholder="Chọn giới tính"
                        />
                    </div>
                    <div>
                        <DatePicker id="dob" label="Ngày sinh" placeholder="yyyy-mm-dd" defaultDate={dateOfBirth || undefined} onChange={(_selectedDates: Date[], dateStr: string) => setDateOfBirth(dateStr)} />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <Label htmlFor="position">Chức vụ / Vị trí</Label>
                        <Input id="position" placeholder="Ví dụ: Quản lý kho" value={position} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setPosition(event.target.value)} />
                    </div>

                    <div>
                        <Label htmlFor="password">
                            {isEdit ? "Mật khẩu mới (để trống nếu không đổi)" : "Mật khẩu khởi tạo"}
                            {!isEdit && <span className="text-red-500"> *</span>}
                        </Label>
                        <Input id="password" type="password" placeholder="Tối thiểu 8 ký tự" value={password} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)} required={!isEdit} />
                    </div>
                </div>

                <div>
                    <Label>Vai trò hệ thống <span className="text-red-500">*</span></Label>
                    <Select options={availableRoles} value={selectedRoles[0] || ""} onChange={(value) => setSelectedRoles([value])} placeholder="Chọn vai trò" />
                </div>

                <div className="mt-6 flex items-center justify-end gap-3">
                    <Button variant="outline" size="sm" onClick={handleClose} type="button">Hủy bỏ</Button>
                    <Button size="sm" type="submit" disabled={loading}>{loading ? "Đang xử lý..." : isEdit ? "Cập nhật thông tin" : "Khởi tạo tài khoản"}</Button>
                </div>
            </form>
        </Modal>
    );
}
