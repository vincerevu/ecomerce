import { useEffect, useState } from "react";
import { bannerApi, Banner } from "../../api/bannerApi";
import { TrashBinIcon, PencilIcon, PlusIcon } from "../../icons";
import { showError, showSuccess } from "../../utils/toast";
import ImageUpload from "../common/ImageUpload";
import Loader from "../common/Loader";
import Pagination from "../common/Pagination";
import Button from "../ui/button/Button";
import ConfirmationModal from "../ui/modal/ConfirmationModal";
import { Modal } from "../ui/modal";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import Switch from "../form/switch/Switch";
import Badge from "../ui/badge/Badge";
import { useStoredPageSize } from "../../hooks/useStoredPageSize";

const DEFAULT_PAGE_SIZE = 10;

export default function BannersTable() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useStoredPageSize("admin.banners.pageSize", DEFAULT_PAGE_SIZE);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    
    // Form state
    const [formData, setFormData] = useState({
        title: "",
        imageUrl: "",
        linkUrl: "",
        priority: 0,
        active: true
    });

    const canDelete = true; // hasAnyPermission(user, "BANNER:DELETE");
    const canCreate = true; // hasAnyPermission(user, "BANNER:CREATE");
    const canUpdate = true; // hasAnyPermission(user, "BANNER:UPDATE");

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);
        return () => window.clearTimeout(timeout);
    }, [searchTerm]);

    useEffect(() => {
        fetchBanners();
    }, [currentPage, debouncedSearchTerm, pageSize]);

    const fetchBanners = async () => {
        setLoading(true);
        try {
            const params: Record<string, string | number> = {
                page: currentPage - 1,
                size: pageSize,
            };

            if (debouncedSearchTerm.trim()) {
                params.filter = `title~'*${debouncedSearchTerm.trim()}*'`;
            }

            const response = await bannerApi.getPage(params);
            if (response.code === 1000 && response.result) {
                setBanners(response.result.data);
                setTotalPages(Math.max(1, response.result.totalPages || 1));
                setTotalElements(response.result.totalElements || 0);
            }
        } catch (error) {
            console.error("Failed to fetch banners:", error);
            showError("Không thể tải danh sách banner");
            setBanners([]);
            setTotalPages(1);
            setTotalElements(0);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setIsDeleting(true);
        try {
            const response = await bannerApi.delete(deleteId);
            if (response.code === 1000) {
                showSuccess("Xóa banner thành công");
                if (banners.length === 1 && currentPage > 1) {
                    setCurrentPage(currentPage - 1);
                } else {
                    fetchBanners();
                }
            }
        } catch (error) {
            console.error("Failed to delete banner:", error);
            showError("Không thể xóa banner");
        } finally {
            setIsDeleting(false);
            setDeleteId(null);
        }
    };

    const handleOpenModal = (banner: Banner | null = null) => {
        if (banner) {
            setEditingBanner(banner);
            setFormData({
                title: banner.title,
                imageUrl: banner.imageUrl,
                linkUrl: banner.linkUrl || "",
                priority: banner.priority,
                active: banner.active
            });
        } else {
            setEditingBanner(null);
            setFormData({
                title: "",
                imageUrl: "",
                linkUrl: "",
                priority: 0,
                active: true
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingBanner(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === "priority" ? parseInt(value) || 0 : value
        }));
    };

    const handleSwitchChange = (checked: boolean) => {
        setFormData(prev => ({
            ...prev,
            active: checked
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.imageUrl) {
            showError("Vui lòng tải ảnh banner");
            return;
        }
        setIsSaving(true);
        try {
            let response;
            if (editingBanner) {
                response = await bannerApi.update(editingBanner.id, formData);
                if (response.code === 1000) {
                    showSuccess("Cập nhật banner thành công");
                    handleCloseModal();
                    fetchBanners();
                }
            } else {
                response = await bannerApi.create(formData);
                if (response.code === 1000) {
                    showSuccess("Tạo banner thành công");
                    handleCloseModal();
                    setCurrentPage(1);
                    fetchBanners();
                }
            }
        } catch (error) {
            console.error("Failed to save banner:", error);
            showError("Không thể lưu banner");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative max-w-sm flex-1">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </span>
                    <input
                        type="text"
                        placeholder="Tìm theo tiêu đề..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="h-10 w-full rounded-lg border border-gray-200 bg-transparent pl-9 pr-4 text-sm outline-none transition-all focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:border-white/[0.08] dark:bg-[#162033] dark:text-white/90"
                    />
                </div>
                {canCreate && (
                    <Button size="sm" startIcon={<PlusIcon />} onClick={() => handleOpenModal()}>
                        Thêm Banner
                    </Button>
                )}
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#111b2d]">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                            <TableRow>
                                <TableCell isHeader className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Banner</TableCell>
                                <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Thứ tự</TableCell>
                                <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Trạng thái</TableCell>
                                <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Thao tác</TableCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="py-12">
                                        <div className="flex flex-col items-center justify-center gap-3 text-gray-400">
                                            <Loader size="md" />
                                            <span className="text-sm">Đang tải dữ liệu...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : banners.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="py-12 text-center text-sm text-gray-400">
                                        Không có banner nào
                                    </TableCell>
                                </TableRow>
                            ) : (
                                banners.map((banner) => (
                                    <TableRow key={banner.id}>
                                        <TableCell className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-12 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-gray-100 dark:border-white/[0.08]">
                                                    <img src={banner.imageUrl} alt={banner.title} className="h-full w-full object-cover" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-white">{banner.title}</div>
                                                    <div className="text-xs text-gray-500 truncate max-w-[200px]">{banner.linkUrl}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                                            {banner.priority}
                                        </TableCell>
                                        <TableCell className="px-4 py-4">
                                            <Badge color={banner.active ? "success" : "warning"}>
                                                {banner.active ? "Hoạt động" : "Tạm khóa"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                {canUpdate && (
                                                    <button
                                                        onClick={() => handleOpenModal(banner)}
                                                        className="text-gray-500 hover:text-violet-600 dark:text-gray-400 dark:hover:text-violet-400"
                                                    >
                                                        <PencilIcon className="h-5 w-5" />
                                                    </button>
                                                )}
                                                {canDelete && (
                                                    <button
                                                        onClick={() => setDeleteId(banner.id)}
                                                        className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                                                    >
                                                        <TrashBinIcon className="h-5 w-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                <Pagination
                    currentPage={Math.min(currentPage, totalPages)}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    pageSize={pageSize}
                    onPageSizeChange={(nextPageSize) => {
                        setPageSize(nextPageSize);
                        setCurrentPage(1);
                    }}
                    summary={
                        totalElements > 0
                            ? `Hiển thị ${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, totalElements)} trong ${totalElements} banner`
                            : "Không có kết quả"
                    }
                />
            </div>

            {/* Create/Edit Modal */}
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} className="max-w-lg">
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        {editingBanner ? "Chỉnh sửa Banner" : "Thêm Banner mới"}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tiêu đề</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                required
                                className="w-full h-10 rounded-lg border border-gray-200 bg-transparent px-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:border-white/[0.08] dark:bg-[#162033] dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hình ảnh</label>
                            <ImageUpload
                                value={formData.imageUrl}
                                onChange={(imageUrl) => setFormData(prev => ({ ...prev, imageUrl }))}
                                folder="ecommerce/banners"
                                className="h-40"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL Liên kết</label>
                            <input
                                type="text"
                                name="linkUrl"
                                value={formData.linkUrl}
                                onChange={handleInputChange}
                                className="w-full h-10 rounded-lg border border-gray-200 bg-transparent px-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:border-white/[0.08] dark:bg-[#162033] dark:text-white"
                            />
                        </div>
                        <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ưu tiên</label>
                                <input
                                    type="number"
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleInputChange}
                                    className="w-full h-10 rounded-lg border border-gray-200 bg-transparent px-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:border-white/[0.08] dark:bg-[#162033] dark:text-white"
                                />
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Trạng thái hoạt động</span>
                            <Switch checked={formData.active} onChange={handleSwitchChange} />
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <Button variant="outline" onClick={handleCloseModal} type="button">
                                Hủy
                            </Button>
                            <Button type="submit" loading={isSaving}>
                                {editingBanner ? "Cập nhật" : "Tạo mới"}
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmationModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Xóa Banner"
                message="Bạn có chắc chắn muốn xóa banner này? Hành động này không thể hoàn tác."
                loading={isDeleting}
            />
        </div>
    );
}
