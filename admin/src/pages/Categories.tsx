import { useNavigate } from "react-router";
import { hasAnyPermission } from "../components/auth/PermissionGuard";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import CategoriesTable from "../components/tables/CategoriesTable";
import { useAuth } from "../context/AuthContext";

export default function Categories() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const canCreate = hasAnyPermission(user, "CATEGORY:CREATE");

    return (
        <>
            <PageMeta
                title="Quản lý danh mục | Hệ thống Admin"
                description="Thiết lập cấu trúc danh mục sản phẩm của cửa hàng"
            />

            <div className="mb-6">
                <PageBreadcrumb pageTitle="Quản lý danh mục" />
            </div>

            <CategoriesTable
                onView={(category) => navigate(`/categories/${category.id}`)}
                onCreate={canCreate ? () => navigate("/categories/new") : undefined}
            />
        </>
    );
}
