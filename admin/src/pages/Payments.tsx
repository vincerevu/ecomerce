import { useNavigate } from "react-router";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import PaymentsTable from "../components/tables/PaymentsTable";

export default function Payments() {
    const navigate = useNavigate();

    return (
        <>
            <PageMeta
                title="Thanh toán | Hệ thống Admin"
                description="Trang quản lý giao dịch thanh toán, hoàn tiền và đối soát đơn hàng"
            />

            <PageBreadcrumb pageTitle="Quản lý thanh toán" />

            <div className="space-y-6">
                <PaymentsTable
                    onCreate={() => navigate("/payments/new")}
                    onView={(paymentId) => navigate(`/payments/${paymentId}`)}
                />
            </div>
        </>
    );
}
