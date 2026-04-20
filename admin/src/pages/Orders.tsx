import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import OrdersTable from "../components/tables/OrdersTable";

export default function Orders() {
    return (
        <>
            <PageMeta
                title="Đơn hàng | Hệ thống Admin"
                description="Trang quản lý đơn hàng, tiến độ xử lý và trạng thái thanh toán"
            />

            <PageBreadcrumb pageTitle="Quản lý đơn hàng" />

            <div className="space-y-6">
                <OrdersTable />
            </div>
        </>
    );
}
