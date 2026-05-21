import { useEffect, useState } from "react";
import apiClient from "../../api/apiClient";
import { EyeIcon, PlusIcon, TrashBinIcon } from "../../icons";
import { showError, showSuccess } from "../../utils/toast";
import { useAuth } from "../../context/AuthContext";
import { hasAnyPermission } from "../auth/PermissionGuard";
import { useStoredPageSize } from "../../hooks/useStoredPageSize";
import Loader from "../common/Loader";
import Pagination from "../common/Pagination";
import SortDropdown, { type SortDropdownOption } from "../common/SortDropdown";
import Select, { Option } from "../form/Select";
import Button from "../ui/button/Button";
import ConfirmationModal from "../ui/modal/ConfirmationModal";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";

export interface Staff {
    id: string;
    name: string;
    phone: string;
    email: string;
    position: string;
    gender?: string;
    dateOfBirth?: string;
    roles: { name: string; description: string; permissions: { name: string }[] }[];
    status?: string;
    createdAt?: string;
}

interface TeamTableProps {
    onView?: (staff: Staff) => void;
    onCreate?: () => void;
}

type PositionStyle = {
    label: string;
    pill: string;
    icon: React.ReactNode;
};

const POSITION_STYLES: Record<string, PositionStyle> = {
    "Quản lý": {
        label: "Quản lý",
        pill: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/20",
        icon: <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
    },
    "Bán hàng": {
        label: "Bán hàng",
        pill: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20",
        icon: <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
    },
    Kho: {
        label: "Kho",
        pill: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
        icon: <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>,
    },
    "Hỗ trợ": {
        label: "Hỗ trợ",
        pill: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/10 dark:text-teal-300 dark:border-teal-500/20",
        icon: <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
    },
    "Vận hành": {
        label: "Vận hành",
        pill: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:border-orange-500/20",
        icon: <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    },
    "Kế toán": {
        label: "Kế toán",
        pill: "bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-300 dark:border-green-500/20",
        icon: <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
    },
};

const DEFAULT_POSITION_STYLE: PositionStyle = {
    label: "Nhân viên",
    pill: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
    icon: <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
};

const POSITION_KEYWORD_MAP: Array<[string, PositionStyle]> = [
    ["quản lý", POSITION_STYLES["Quản lý"]],
    ["bán hàng", POSITION_STYLES["Bán hàng"]],
    ["kho", POSITION_STYLES.Kho],
    ["hỗ trợ", POSITION_STYLES["Hỗ trợ"]],
    ["vận hành", POSITION_STYLES["Vận hành"]],
    ["kế toán", POSITION_STYLES["Kế toán"]],
];

function resolvePositionStyle(position: string): PositionStyle & { label: string } {
    if (!position) return { ...DEFAULT_POSITION_STYLE, label: "Nhân viên" };
    const lower = position.toLowerCase();
    for (const [keyword, style] of POSITION_KEYWORD_MAP) {
        if (lower.includes(keyword)) return { ...style, label: position };
    }
    return { ...DEFAULT_POSITION_STYLE, label: position };
}

function PositionBadge({ position }: { position: string }) {
    const style = resolvePositionStyle(position);
    return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${style.pill}`}>{style.icon}{style.label}</span>;
}

const AVATAR_COLORS = ["from-violet-500 to-purple-600", "from-blue-500 to-cyan-500", "from-teal-500 to-emerald-500", "from-orange-500 to-amber-500", "from-rose-500 to-pink-500", "from-indigo-500 to-blue-500"];

function Avatar({ name, index }: { name: string; index: number }) {
    const gradient = AVATAR_COLORS[index % AVATAR_COLORS.length];
    return <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-sm font-bold text-white shadow-sm`}>{name?.[0]?.toUpperCase() || "?"}</div>;
}

const DEFAULT_PAGE_SIZE = 10;
type TeamSortPreset = "" | "createdAtDesc" | "createdAtAsc" | "nameAsc" | "nameDesc" | "positionAsc" | "positionDesc";

const TEAM_SORT_OPTIONS: SortDropdownOption[] = [
    { value: "createdAtDesc", label: "Mới gia nhập" },
    { value: "createdAtAsc", label: "Cũ nhất" },
    { value: "nameAsc", label: "Tên A đến Z" },
    { value: "nameDesc", label: "Tên Z đến A" },
    { value: "positionAsc", label: "Chức vụ A đến Z" },
    { value: "positionDesc", label: "Chức vụ Z đến A" },
];

export default function TeamTable({ onView, onCreate }: TeamTableProps) {
    const { user } = useAuth();
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useStoredPageSize("admin.team.pageSize", DEFAULT_PAGE_SIZE);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [positionFilter, setPositionFilter] = useState("");
    const [positionOptions, setPositionOptions] = useState<Option[]>([{ value: "", label: "Tất cả chức vụ" }]);
    const [sortField, setSortField] = useState<string>("");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    const canDelete = hasAnyPermission(user, "USER:DELETE");
    const canCreate = hasAnyPermission(user, "USER:CREATE");

    useEffect(() => { void fetchPositions(); }, []);
    useEffect(() => {
        const timer = setTimeout(() => { void fetchStaff(currentPage); }, 400);
        return () => clearTimeout(timer);
    }, [currentPage, searchTerm, positionFilter, sortField, sortOrder, pageSize]);

    const fetchPositions = async () => {
        try {
            const response = await apiClient.get("/users/staff/positions");
            const positions: string[] = response.data.result || [];
            setPositionOptions([{ value: "", label: "Tất cả chức vụ" }, ...positions.map((pos) => ({ value: pos, label: pos }))]);
        } catch (err) {
            console.error("Failed to fetch positions", err);
        }
    };

    const fetchStaff = async (page: number) => {
        try {
            setLoading(true);
            const filterParts: string[] = [];
            if (searchTerm) filterParts.push(`(name ~~ '*${searchTerm}*' or phone ~~ '*${searchTerm}*')`);
            if (positionFilter) filterParts.push(`position : '${positionFilter}'`);
            const filter = filterParts.length ? `&filter=${encodeURIComponent(filterParts.join(" and "))}` : "";
            const sort = sortField ? `&sort=${sortField},${sortOrder}` : "";
            const res = await apiClient.get(`/users/staff?page=${page - 1}&size=${pageSize}${filter}${sort}`);
            const result = res.data.result;
            setStaffList(result.data || []);
            setTotalPages(result.totalPages || 1);
            setTotalElements(result.totalElements || 0);
        } catch {
            setError("Không thể lấy danh sách thành viên");
        } finally {
            setLoading(false);
        }
    };

    const handleSortPresetChange = (value: TeamSortPreset) => {
        setCurrentPage(1);

        if (!value) {
            setSortField("");
            setSortOrder("desc");
            return;
        }

        if (value === "createdAtDesc") {
            setSortField("createdAt");
            setSortOrder("desc");
            return;
        }
        if (value === "createdAtAsc") {
            setSortField("createdAt");
            setSortOrder("asc");
            return;
        }
        if (value === "nameAsc") {
            setSortField("name");
            setSortOrder("asc");
            return;
        }
        if (value === "nameDesc") {
            setSortField("name");
            setSortOrder("desc");
            return;
        }
        if (value === "positionAsc") {
            setSortField("position");
            setSortOrder("asc");
            return;
        }

        setSortField("position");
        setSortOrder("desc");
    };

    const handleDeleteClick = (id: string) => { setUserToDelete(id); setIsDeleteModalOpen(true); };
    const handleConfirmDelete = async () => {
        if (!userToDelete) return;
        try {
            setIsDeleting(true);
            await apiClient.delete(`/users/${userToDelete}`);
            setStaffList((prev) => prev.filter((staff) => staff.id !== userToDelete));
            showSuccess("Đã xóa thành viên thành công");
            setIsDeleteModalOpen(false);
        } catch (err: any) {
            showError(err.response?.data?.message || "Không thể xóa thành viên");
        } finally {
            setIsDeleting(false);
            setUserToDelete(null);
        }
    };

    const hasFilters = Boolean(searchTerm || positionFilter);
    const sortPreset: TeamSortPreset = !sortField ? "" : `${sortField}${sortOrder === "asc" ? "Asc" : "Desc"}` as TeamSortPreset;

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/[0.06] dark:bg-[#111b2d] dark:shadow-[0_22px_48px_rgba(2,6,23,0.34)]">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="relative min-w-0 flex-1 lg:max-w-sm">
                        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </span>
                        <input type="text" placeholder="Tìm theo tên hoặc SĐT..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-10 w-full rounded-lg border border-gray-200 bg-transparent pl-9 pr-4 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-white/[0.08] dark:bg-[#162033] dark:text-white/90 dark:placeholder:text-gray-500 dark:focus:border-brand-400/50 dark:focus:ring-brand-500/15" />
                    </div>
                    {canCreate && onCreate ? (
                        <Button size="sm" startIcon={<PlusIcon />} onClick={onCreate} className="shrink-0 self-start lg:self-auto">
                            Thêm thành viên
                        </Button>
                    ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <SortDropdown
                        value={sortPreset}
                        onChange={(value) => handleSortPresetChange(value as TeamSortPreset)}
                        options={TEAM_SORT_OPTIONS}
                        defaultLabel="Sắp xếp"
                        className="min-w-[180px] sm:w-auto"
                    />
                    <Select value={positionFilter} onChange={setPositionFilter} options={positionOptions} placeholder="Tất cả chức vụ" className="min-w-[180px]" />
                    {hasFilters && <button onClick={() => { setSearchTerm(""); setPositionFilter(""); setCurrentPage(1); }} className="h-10 rounded-lg px-4 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10">Xóa lọc</button>}
                    {!loading && <p className="whitespace-nowrap text-sm text-gray-400 dark:text-gray-500"><span className="font-semibold text-gray-700 dark:text-gray-300">{totalElements}</span> nhân viên</p>}
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#111b2d] dark:shadow-[0_20px_46px_rgba(2,6,23,0.32)]">
                {loading ? (
                    <div className="flex items-center justify-center py-20"><Loader size="lg" /></div>
                ) : error ? (
                    <div className="py-20 text-center"><div className="inline-flex flex-col items-center gap-2 text-red-500"><svg className="h-10 w-10 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg><p className="text-sm font-medium">{error}</p></div></div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="border-b border-gray-100 bg-gray-50/60 dark:border-white/[0.05] dark:bg-white/[0.02]">
                                    <TableRow>
                                        <TableCell isHeader className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Nhân viên</TableCell>
                                        <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Liên hệ</TableCell>
                                        <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Chức vụ</TableCell>
                                        <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Gia nhập</TableCell>
                                        <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Trạng thái</TableCell>
                                        <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Thao tác</TableCell>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.04]">
                                    {staffList.length === 0 ? (
                                        <TableRow><TableCell colSpan={6} className="py-16 text-center text-sm text-gray-400">Không tìm thấy thành viên nào</TableCell></TableRow>
                                    ) : staffList.map((staff, index) => (
                                        <TableRow key={staff.id} className="transition-colors hover:bg-blue-50/30 dark:hover:bg-white/[0.015]">
                                            <TableCell className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <Avatar name={staff.name} index={index} />
                                                    <div>
                                                        <p className="text-sm font-semibold leading-tight text-gray-800 dark:text-white/90">{staff.name}</p>
                                                        {staff.gender && <span className="mt-0.5 inline-block rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">{staff.gender === "MALE" ? "Nam" : staff.gender === "FEMALE" ? "Nữ" : staff.gender}</span>}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-4 py-3.5"><div className="space-y-0.5"><p className="text-sm font-medium text-gray-700 dark:text-gray-300">{staff.phone || "-"}</p><p className="max-w-[200px] truncate text-xs text-gray-400">{staff.email || "-"}</p></div></TableCell>
                                            <TableCell className="px-4 py-3.5"><PositionBadge position={staff.position} /></TableCell>
                                            <TableCell className="px-4 py-3.5">{staff.createdAt ? <div><p className="text-sm font-medium text-gray-700 dark:text-gray-300">{new Date(staff.createdAt).toLocaleDateString("vi-VN")}</p><p className="text-xs text-gray-400">{new Date(staff.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</p></div> : <span className="text-sm text-gray-400">-</span>}</TableCell>
                                            <TableCell className="px-4 py-3.5"><span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />Đang làm việc</span></TableCell>
                                            <TableCell className="px-4 py-3.5">
                                                <div className="flex items-center gap-1.5">
                                                    {onView && <button onClick={() => onView?.(staff)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition-all hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 dark:border-gray-700 dark:hover:bg-blue-500/10" title="Xem thông tin"><EyeIcon className="h-3.5 w-3.5" /></button>}
                                                    {canDelete && <button onClick={() => handleDeleteClick(staff.id)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition-all hover:border-red-400 hover:bg-red-50 hover:text-red-600 dark:border-gray-700 dark:hover:bg-red-500/10" title="Xóa thành viên"><TrashBinIcon className="h-3.5 w-3.5" /></button>}
                                                    {!onView && !canDelete && <span className="text-xs text-gray-400">Không có thao tác</span>}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            pageSize={pageSize}
                            onPageSizeChange={(nextPageSize) => {
                                setPageSize(nextPageSize);
                                setCurrentPage(1);
                            }}
                            summary={totalElements > 0 ? `Hiển thị ${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, totalElements)} trong tổng số ${totalElements} thành viên` : "Không có thành viên nào"}
                        />
                    </>
                )}

                <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleConfirmDelete} loading={isDeleting} title="Xác nhận xóa" message="Bạn có chắc chắn muốn xóa thành viên này không? Hành động này không thể hoàn tác." confirmText="Xóa ngay" />
            </div>
        </div>
    );
}
