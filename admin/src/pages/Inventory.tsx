import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import InventoryTable from "../components/tables/InventoryTable";

export default function Inventory() {
  return (
    <>
      <PageMeta
        title="Kho | Hệ thống Admin"
        description="Trang quản lý tồn kho, biến thể và phiếu nhập hàng"
      />

      <PageBreadcrumb pageTitle="Quản lý kho" />

      <div className="space-y-6">
        <InventoryTable />
      </div>
    </>
  );
}
