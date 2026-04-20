import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import apiClient from "../api/apiClient";
import Loader from "../components/common/Loader";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import SortPill from "../components/common/SortPill";
import Badge from "../components/ui/badge/Badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../components/ui/table";

interface Permission {
    name: string;
    description: string;
}

type SortPreset = "nameAsc" | "nameDesc" | "resourceAsc" | "resourceDesc";

const getResourceName = (permissionName: string) => permissionName.split(":")[0] || permissionName;

export default function Permissions() {
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortPreset, setSortPreset] = useState<SortPreset>("nameAsc");

    useEffect(() => {
        const fetchPermissions = async () => {
            try {
                const response = await apiClient.get("/permissions");
                if (response.data.code === 1000) setPermissions(response.data.result);
            } catch (error) {
                console.error("Failed to fetch permissions", error);
                toast.error("Không thể tải danh sách quyền");
            } finally {
                setIsLoading(false);
            }
        };
        void fetchPermissions();
    }, []);

    const filteredPermissions = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();
        return [...permissions]
            .filter(
                (permission) =>
                    !normalizedSearch ||
                    permission.name.toLowerCase().includes(normalizedSearch) ||
                    permission.description?.toLowerCase().includes(normalizedSearch),
            )
            .sort((left, right) => {
                switch (sortPreset) {
                    case "nameDesc":
                        return right.name.localeCompare(left.name, "vi");
                    case "resourceAsc":
                        return getResourceName(left.name).localeCompare(getResourceName(right.name), "vi");
                    case "resourceDesc":
                        return getResourceName(right.name).localeCompare(getResourceName(left.name), "vi");
                    case "nameAsc":
                    default:
                        return left.name.localeCompare(right.name, "vi");
                }
            });
    }, [permissions, searchTerm, sortPreset]);

    const clearFilters = Boolean(searchTerm);
    const isNameSort = sortPreset === "nameAsc" || sortPreset === "nameDesc";
    const isResourceSort = sortPreset === "resourceAsc" || sortPreset === "resourceDesc";

    return (
        <>
            <PageMeta title="Quản lý quyền | Hệ thống Admin" description="Danh sách quyền hệ thống" />

            <div className="mb-6">
                <PageBreadcrumb pageTitle="Quản lý quyền" />
            </div>

            <div className="mb-4 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.02]">
                <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Tìm theo tên quyền hoặc mô tả..."
                    className="h-10 w-full max-w-sm rounded-lg border border-gray-200 bg-transparent px-4 text-sm outline-none transition-all focus:border-brand-300 dark:border-gray-700 dark:text-white"
                />
                <div className="flex flex-wrap items-center gap-2">
                    <SortPill
                        active={isNameSort}
                        label={sortPreset === "nameDesc" ? "Tên Z đến A" : "Tên A đến Z"}
                        onClick={() => setSortPreset((current) => (current === "nameAsc" ? "nameDesc" : "nameAsc"))}
                        icon={
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {sortPreset === "nameDesc" ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7h12M4 12h9M4 17h6m10-10v10m0 0-3-3m3 3 3-3" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7h6M4 12h9M4 17h12m10-10v10m0-10-3 3m3-3 3 3" />
                                )}
                            </svg>
                        }
                    />
                    <SortPill
                        active={isResourceSort}
                        label={sortPreset === "resourceDesc" ? "Nhóm quyền Z đến A" : "Nhóm quyền A đến Z"}
                        onClick={() => setSortPreset((current) => (current === "resourceAsc" ? "resourceDesc" : "resourceAsc"))}
                        icon={
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {sortPreset === "resourceDesc" ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 7h10M7 12h7M7 17h4m10-10v10m0 0-3-3m3 3 3-3" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 7h4M7 12h7M7 17h10m10-10v10m0-10-3 3m3-3 3 3" />
                                )}
                            </svg>
                        }
                    />
                    {clearFilters && (
                        <button
                            onClick={() => setSearchTerm("")}
                            className="h-10 rounded-lg px-4 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
                        >
                            Xóa lọc
                        </button>
                    )}
                </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-theme-xl dark:border-gray-800 dark:bg-white/[0.02]">
                <div className="relative overflow-hidden bg-gradient-to-r from-brand-600/10 to-transparent px-6 py-6 dark:from-brand-500/10 dark:to-transparent">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white/90">Danh sách quyền hệ thống</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Các quyền này được hệ thống định nghĩa và dùng để kiểm soát truy cập chi tiết.
                    </p>
                    <div className="absolute right-0 top-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-brand-500/20 blur-3xl"></div>
                </div>

                <div className="max-w-full overflow-x-auto custom-scrollbar">
                    <Table>
                        <TableHeader className="border-b border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-white/[0.02]">
                            <TableRow>
                                <TableCell isHeader className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                                    Tên quyền
                                </TableCell>
                                <TableCell isHeader className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                                    Mô tả chức năng
                                </TableCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-transparent">
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={2} className="px-6 py-20">
                                        <div className="flex flex-col items-center justify-center gap-3 text-gray-500">
                                            <Loader size="md" />
                                            <span>Đang đồng bộ dữ liệu...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredPermissions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={2} className="px-6 py-20 text-center italic text-gray-500">
                                        Chưa có quyền nào phù hợp.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredPermissions.map((permission) => (
                                    <TableRow key={permission.name} className="group transition-all duration-300 hover:bg-brand-25/50 dark:hover:bg-brand-500/[0.02]">
                                        <TableCell className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="h-1.5 w-1.5 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(70,95,255,0.6)] transition-transform group-hover:scale-150"></div>
                                                <Badge color="primary" variant="light" size="md" className="rounded-lg px-3 py-1 font-mono text-xs tracking-tight">
                                                    {permission.name}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-5">
                                            <span className="text-sm font-medium leading-relaxed text-gray-700 dark:text-gray-300">
                                                {permission.description}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-6 py-4 text-xs text-gray-400 dark:border-gray-800 dark:bg-white/[0.01]">
                    <span>Tổng cộng: {filteredPermissions.length} quyền</span>
                    <span>Hệ thống phân quyền thời gian thực</span>
                </div>
            </div>
        </>
    );
}
