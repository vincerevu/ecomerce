import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import apiClient from "../api/apiClient";
import PermissionGuard, { hasAnyPermission } from "../components/auth/PermissionGuard";
import Loader from "../components/common/Loader";
import SortDropdown, { type SortDropdownOption } from "../components/common/SortDropdown";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Badge from "../components/ui/badge/Badge";
import Button from "../components/ui/button/Button";
import { Modal } from "../components/ui/modal";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../components/ui/table";
import { useAuth } from "../context/AuthContext";
import { PencilIcon, PlusIcon, TrashBinIcon } from "../icons";

interface Permission {
    name: string;
    description: string;
}

interface Role {
    name: string;
    description: string;
    permissions: Permission[];
}

type SortPreset = "" | "nameAsc" | "nameDesc" | "permissionAsc" | "permissionDesc";

const ROLE_SORT_OPTIONS: SortDropdownOption[] = [
    { value: "nameAsc", label: "Tên A đến Z" },
    { value: "nameDesc", label: "Tên Z đến A" },
    { value: "permissionAsc", label: "Ít quyền nhất" },
    { value: "permissionDesc", label: "Nhiều quyền nhất" },
];

export default function Roles() {
    const { user } = useAuth();
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortPreset, setSortPreset] = useState<SortPreset>("");
    const [roleName, setRoleName] = useState("");
    const [roleDesc, setRoleDesc] = useState("");
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
    const [editingRoleName, setEditingRoleName] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const canCreate = hasAnyPermission(user, "ROLE:CREATE");
    const canUpdate = hasAnyPermission(user, "ROLE:UPDATE");
    const canDelete = hasAnyPermission(user, "ROLE:DELETE");

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [rolesRes, permissionsRes] = await Promise.all([apiClient.get("/roles"), apiClient.get("/permissions")]);
            if (rolesRes.data.code === 1000) setRoles(rolesRes.data.result);
            if (permissionsRes.data.code === 1000) setPermissions(permissionsRes.data.result);
        } catch (error) {
            console.error("Failed to fetch roles/permissions", error);
            toast.error("Không thể tải dữ liệu phân quyền");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { void fetchData(); }, []);

    const filteredRoles = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();
        return [...roles]
            .filter((role) => !normalizedSearch || role.name.toLowerCase().includes(normalizedSearch) || role.description?.toLowerCase().includes(normalizedSearch))
            .sort((left, right) => {
                switch (sortPreset) {
                    case "": return 0;
                    case "nameDesc": return right.name.localeCompare(left.name, "vi");
                    case "permissionAsc": return left.permissions.length - right.permissions.length;
                    case "permissionDesc": return right.permissions.length - left.permissions.length;
                    case "nameAsc":
                    default: return left.name.localeCompare(right.name, "vi");
                }
            });
    }, [roles, searchTerm, sortPreset]);

    const resetForm = () => {
        setRoleName("");
        setRoleDesc("");
        setSelectedPermissions([]);
        setEditingRoleName(null);
    };

    const handleOpenAdd = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const handleOpenEdit = (role: Role) => {
        setEditingRoleName(role.name);
        setRoleName(role.name);
        setRoleDesc(role.description);
        setSelectedPermissions(role.permissions.map((permission) => permission.name));
        setIsModalOpen(true);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = { name: roleName, description: roleDesc, permissionNames: selectedPermissions };
            if (editingRoleName) {
                await apiClient.put(`/roles/${editingRoleName}`, payload);
                toast.success("Cập nhật vai trò thành công");
            } else {
                await apiClient.post("/roles", payload);
                toast.success("Thêm vai trò thành công");
            }
            await fetchData();
            setIsModalOpen(false);
            resetForm();
        } catch (error) {
            console.error("Failed to save role", error);
            toast.error("Không thể lưu vai trò");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (name: string) => {
        if (!window.confirm(`Bạn có chắc muốn xóa vai trò ${name}?`)) return;
        try {
            await apiClient.delete(`/roles/${name}`);
            setRoles((prev) => prev.filter((role) => role.name !== name));
            toast.success("Đã xóa vai trò");
        } catch (error) {
            console.error("Failed to delete role", error);
            toast.error("Không thể xóa vai trò");
        }
    };

    const togglePermission = (permissionName: string) => {
        setSelectedPermissions((prev) => prev.includes(permissionName) ? prev.filter((item) => item !== permissionName) : [...prev, permissionName]);
    };

    const clearFilters = Boolean(searchTerm);

    return (
        <>
            <PageMeta title="Quản lý vai trò | Hệ thống Admin" description="Quản lý vai trò và phân quyền người dùng" />

            <div className="mb-6">
                <PageBreadcrumb pageTitle="Quản lý Vai trò" />
            </div>

            <div className="mb-4 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.02]">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <input
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Tìm theo tên vai trò hoặc mô tả..."
                        className="h-10 w-full max-w-sm rounded-lg border border-gray-200 bg-transparent px-4 text-sm outline-none transition-all focus:border-brand-300 dark:border-gray-700 dark:text-white"
                    />
                    {canCreate ? (
                        <Button size="sm" onClick={handleOpenAdd} startIcon={<PlusIcon />} className="shrink-0 self-start lg:self-auto">
                            Thêm vai trò
                        </Button>
                    ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <SortDropdown
                        value={sortPreset}
                        onChange={(value) => setSortPreset(value as SortPreset)}
                        options={ROLE_SORT_OPTIONS}
                        defaultLabel="Sắp xếp"
                        className="min-w-[180px] sm:w-auto"
                    />
                    {clearFilters && <button onClick={() => setSearchTerm("")} className="h-10 rounded-lg px-4 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10">Xóa lọc</button>}
                </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-theme-xl dark:border-gray-800 dark:bg-white/[0.02]">
                <div className="max-w-full overflow-x-auto custom-scrollbar">
                    <Table>
                        <TableHeader className="border-b border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-white/[0.02]">
                            <TableRow>
                                <TableCell isHeader className="px-6 py-5 text-left text-xs font-bold uppercase tracking-widest text-gray-400">Vai trò</TableCell>
                                <TableCell isHeader className="px-6 py-5 text-left text-xs font-bold uppercase tracking-widest text-gray-400">Mô tả</TableCell>
                                <TableCell isHeader className="px-6 py-5 text-left text-xs font-bold uppercase tracking-widest text-gray-400">Quyền hạn</TableCell>
                                <TableCell isHeader className="px-6 py-5 text-right text-xs font-bold uppercase tracking-widest text-gray-400">Thao tác</TableCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-transparent">
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="px-6 py-24">
                                        <div className="flex flex-col items-center justify-center gap-3 text-gray-500">
                                            <Loader size="md" />
                                            <span>Đang tải danh sách vai trò...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredRoles.length === 0 ? (
                                <TableRow><TableCell colSpan={4} className="px-6 py-20 text-center text-gray-500">Chưa có vai trò nào phù hợp.</TableCell></TableRow>
                            ) : (
                                filteredRoles.map((role) => (
                                    <TableRow key={role.name} className="group transition-all duration-300 hover:bg-gray-50 dark:hover:bg-brand-500/[0.01]">
                                        <TableCell className="px-6 py-6 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-sm font-bold text-brand-600 shadow-sm dark:from-brand-500/10 dark:to-brand-500/20">{role.name.substring(0, 2)}</div>
                                                <span className="text-sm font-bold text-gray-900 dark:text-white">{role.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-6 text-sm font-medium text-gray-600 dark:text-gray-400">{role.description}</TableCell>
                                        <TableCell className="px-6 py-6 whitespace-nowrap">
                                            <Badge color={role.permissions.length > 10 ? "success" : "info"} variant="light" size="md" className="border font-bold dark:border-gray-700/50">
                                                {role.permissions.length} QUYỀN
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-6 py-6 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-3 opacity-60 transition-opacity group-hover:opacity-100">
                                                <PermissionGuard permission="ROLE:UPDATE">
                                                    <button onClick={() => handleOpenEdit(role)} className="rounded-xl p-2.5 text-gray-500 transition-all hover:rotate-12 hover:bg-brand-50 hover:text-brand-500 dark:hover:bg-brand-500/10" title="Chỉnh sửa"><PencilIcon className="size-5" /></button>
                                                </PermissionGuard>
                                                <PermissionGuard permission="ROLE:DELETE">
                                                    <button onClick={() => handleDelete(role.name)} className="rounded-xl p-2.5 text-gray-500 transition-all hover:-translate-y-1 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10" title="Xóa"><TrashBinIcon className="size-5" /></button>
                                                </PermissionGuard>
                                                {!canUpdate && !canDelete && <span className="text-xs text-gray-400">Không có thao tác</span>}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => !isSubmitting && setIsModalOpen(false)} className="max-w-2xl overflow-hidden">
                <div className="flex flex-col">
                    <div className="border-b border-gray-100 bg-gray-50/50 px-8 py-6 dark:border-gray-800 dark:bg-white/[0.01]">
                        <h3 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">{editingRoleName ? "Hiệu chỉnh Vai trò" : "Tạo Vai trò"}</h3>
                        <p className="mt-1.5 text-sm font-medium text-gray-500 dark:text-gray-400">{editingRoleName ? `Bạn đang cập nhật cấu hình cho ${roleName}` : "Phân quyền chi tiết cho nhân sự hệ thống."}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8 p-8">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div className="space-y-2.5">
                                <label className="pl-1 text-xs font-bold uppercase tracking-widest text-gray-400">Mã vai trò</label>
                                <input type="text" required disabled={Boolean(editingRoleName)} value={roleName} onChange={(event) => setRoleName(event.target.value)} className="h-12 w-full rounded-2xl border-2 border-gray-100 px-5 font-bold outline-none transition-all focus:border-brand-300 disabled:opacity-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white" placeholder="VD: MANAGER" />
                            </div>
                            <div className="space-y-2.5">
                                <label className="pl-1 text-xs font-bold uppercase tracking-widest text-gray-400">Mô tả hiển thị</label>
                                <input type="text" required value={roleDesc} onChange={(event) => setRoleDesc(event.target.value)} className="h-12 w-full rounded-2xl border-2 border-gray-100 px-5 outline-none transition-all focus:border-brand-300 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white" placeholder="VD: Quản lý chi nhánh" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between pl-1">
                                <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Danh mục quyền truy cập</label>
                                <span className="rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-black text-white shadow-sm">Đã chọn {selectedPermissions.length}</span>
                            </div>
                            <div className="grid max-h-[350px] grid-cols-1 gap-3 overflow-y-auto rounded-3xl border-2 border-gray-50 bg-gray-50/30 p-4 sm:grid-cols-2 dark:border-gray-800 dark:bg-white/[0.01]">
                                {permissions.map((permission) => {
                                    const active = selectedPermissions.includes(permission.name);
                                    return (
                                        <div key={permission.name} onClick={() => togglePermission(permission.name)} className={`group/card flex cursor-pointer select-none items-start gap-3 rounded-2xl border-2 p-4 transition-all ${active ? "border-brand-500/50 bg-white shadow-theme-md dark:border-brand-500/30 dark:bg-brand-500/10" : "border-transparent bg-transparent hover:border-gray-200 dark:hover:border-gray-700"}`}>
                                            <div className="mt-1 flex items-center">
                                                <div className={`flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all ${active ? "border-brand-500 bg-brand-500" : "border-gray-300 bg-white group-hover/card:border-brand-400 dark:border-gray-600 dark:bg-gray-800"}`}>
                                                    {active && <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                                </div>
                                            </div>
                                            <div className="flex min-w-0 flex-col gap-0.5">
                                                <span className={`truncate text-sm font-bold tracking-tight transition-colors ${active ? "text-brand-600 dark:text-brand-400" : "text-gray-800 dark:text-gray-200"}`}>{permission.name}</span>
                                                <span className="text-[10px] font-medium leading-tight text-gray-400 dark:text-gray-500">{permission.description}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-6 dark:border-gray-800">
                            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="h-12 rounded-2xl border-2 font-bold hover:bg-gray-100">Hủy bỏ</Button>
                            <Button type="submit" disabled={isSubmitting} className="h-12 min-w-[150px] rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 px-8 font-bold transition-all active:scale-95">{isSubmitting ? "Đang xử lý..." : editingRoleName ? "Cập nhật ngay" : "Khởi tạo Vai trò"}</Button>
                        </div>
                    </form>
                </div>
            </Modal>
        </>
    );
}
