import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { customerApi, CustomerRecord } from "../api/customerApi";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Loader from "../components/common/Loader";
import CustomerDetailModal from "../components/customers/CustomerDetailModal";
import Button from "../components/ui/button/Button";
import { AngleLeftIcon, PencilIcon } from "../icons";
import { showError } from "../utils/toast";

export default function CustomerDetails() {
    const { customerId } = useParams();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState<CustomerRecord | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!customerId) {
            setCustomer(null);
            setIsLoading(false);
            return;
        }

        const loadCustomer = async () => {
            try {
                setIsLoading(true);
                const response = await customerApi.getById(customerId);
                setCustomer(response.result);
            } catch (error) {
                console.error("Failed to load customer", error);
                showError("Không thể tải chi tiết khách hàng.");
            } finally {
                setIsLoading(false);
            }
        };

        void loadCustomer();
    }, [customerId]);

    return (
        <>
            <PageMeta
                title="Chi tiết khách hàng | Hệ thống Admin"
                description="Xem hồ sơ, lịch sử đơn hàng và thanh toán của khách hàng"
            />

            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <PageBreadcrumb pageTitle={customer ? `Khách hàng: ${customer.name}` : "Chi tiết khách hàng"} />
                <div className="flex flex-wrap items-center gap-2">
                    {customer ? (
                        <Button size="sm" startIcon={<PencilIcon />} onClick={() => navigate(`/customers/${customer.id}/edit`)}>
                            Chỉnh sửa
                        </Button>
                    ) : null}
                    <Button variant="outline" size="sm" startIcon={<AngleLeftIcon />} onClick={() => navigate("/customers")}>
                        Danh sách khách hàng
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-gray-200 bg-white dark:border-white/[0.06] dark:bg-[#111b2d]">
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                        <Loader size="md" />
                        <span className="text-sm">Đang tải chi tiết khách hàng...</span>
                    </div>
                </div>
            ) : customer ? (
                <CustomerDetailModal embedded isOpen customer={customer} onClose={() => navigate("/customers")} />
            ) : (
                <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-white/[0.06] dark:bg-[#111b2d]">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Không tìm thấy khách hàng cần xem.</p>
                    <Button className="mt-4" variant="outline" onClick={() => navigate("/customers")}>
                        Quay lại danh sách khách hàng
                    </Button>
                </div>
            )}
        </>
    );
}
