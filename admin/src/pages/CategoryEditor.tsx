import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { categoryApi } from "../api/categoryApi";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Loader from "../components/common/Loader";
import CategoryModal from "../components/categories/CategoryModal";
import Button from "../components/ui/button/Button";
import { AngleLeftIcon } from "../icons";
import { showError, showSuccess } from "../utils/toast";

export default function CategoryEditor() {
    const { categoryId } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(categoryId);

    const [category, setCategory] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(isEdit);

    useEffect(() => {
        if (!categoryId) {
            setCategory(null);
            setIsLoading(false);
            return;
        }

        const loadCategory = async () => {
            try {
                setIsLoading(true);
                const response = await categoryApi.getById(categoryId);
                setCategory(response.result);
            } catch (error) {
                console.error("Failed to load category", error);
                showError("Không thể tải thông tin danh mục.");
            } finally {
                setIsLoading(false);
            }
        };

        void loadCategory();
    }, [categoryId]);

    const handleSave = async (payload: any) => {
        try {
            if (categoryId) {
                await categoryApi.update(categoryId, payload);
                showSuccess("Cập nhật danh mục thành công.");
            } else {
                await categoryApi.create(payload);
                showSuccess("Tạo danh mục thành công.");
            }

            navigate("/categories");
        } catch (error) {
            console.error("Failed to save category", error);
            showError("Lưu danh mục thất bại.");
        }
    };

    return (
        <>
            <PageMeta
                title={`${isEdit ? "Cập nhật" : "Thêm"} danh mục | Hệ thống Admin`}
                description="Tạo và cập nhật cấu trúc danh mục của cửa hàng"
            />

            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <PageBreadcrumb pageTitle={isEdit ? "Cập nhật danh mục" : "Thêm danh mục"} />
                <Button variant="outline" size="sm" startIcon={<AngleLeftIcon />} onClick={() => navigate("/categories")}>
                    Danh sách danh mục
                </Button>
            </div>

            {isLoading ? (
                <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-gray-200 bg-white dark:border-white/[0.06] dark:bg-[#111b2d]">
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                        <Loader size="md" />
                        <span className="text-sm">Đang tải dữ liệu danh mục...</span>
                    </div>
                </div>
            ) : (
                <CategoryModal
                    embedded
                    isOpen
                    onClose={() => navigate("/categories")}
                    onSave={handleSave}
                    category={category}
                />
            )}
        </>
    );
}
