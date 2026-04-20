import { useNavigate } from "react-router";
import { hasAnyPermission } from "../components/auth/PermissionGuard";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import ProductsTable from "../components/tables/ProductsTable";
import { useAuth } from "../context/AuthContext";

export default function Products() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const canCreate = hasAnyPermission(user, "PRODUCT:CREATE");

    return (
        <>
            <PageMeta
                title="Sản phẩm | Hệ thống Admin"
                description="Quản lý toàn bộ sản phẩm, biến thể màu sắc, kích cỡ và tồn kho"
            />

            <div className="mb-6">
                <PageBreadcrumb pageTitle="Quản lý sản phẩm" />
            </div>

            <div className="space-y-6">
            <ProductsTable
                onView={(product) => navigate(`/products/${product.id}`)}
                onCreate={canCreate ? () => navigate("/products/new") : undefined}
            />
            </div>
        </>
    );
}
