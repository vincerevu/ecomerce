import { useNavigate } from "react-router";
import { hasAnyPermission } from "../components/auth/PermissionGuard";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import CollectionsTable from "../components/tables/CollectionsTable";
import { useAuth } from "../context/AuthContext";

export default function Collections() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canCreate = hasAnyPermission(user, "COLLECTION:CREATE");

  return (
    <>
      <PageMeta
        title="Quản lý bộ sưu tập | Hệ thống Admin"
        description="Quản lý các bộ sưu tập và sản phẩm liên kết hiển thị trên storefront"
      />

      <div className="mb-6">
        <PageBreadcrumb pageTitle="Quản lý bộ sưu tập" />
      </div>

      <CollectionsTable
        onView={(collection) => navigate(`/collections/${collection.id}`)}
        onCreate={canCreate ? () => navigate("/collections/new") : undefined}
      />
    </>
  );
}
