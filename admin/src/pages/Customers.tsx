import { useNavigate } from "react-router";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import CustomersTable from "../components/tables/CustomersTable";

export default function Customers() {
    const navigate = useNavigate();

    return (
        <>
            <PageMeta
                title="Khách hàng | Hệ thống Admin"
                description="Trang quản lý khách hàng, hạng thành viên và trạng thái tài khoản"
            />
            <PageBreadcrumb pageTitle="Quản lý khách hàng" />
            <div className="space-y-6">
                <CustomersTable
                    onCreate={() => navigate("/customers/new")}
                    onView={(customerId) => navigate(`/customers/${customerId}`)}
                />
            </div>
        </>
    );
}
