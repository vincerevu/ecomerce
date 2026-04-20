import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { customerApi, CustomerRecord } from "../api/customerApi";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Loader from "../components/common/Loader";
import CustomerModal from "../components/customers/CustomerModal";
import Button from "../components/ui/button/Button";
import { AngleLeftIcon } from "../icons";
import { showError } from "../utils/toast";

export default function CustomerEditor() {
    const { customerId } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(customerId);

    const [customer, setCustomer] = useState<CustomerRecord | null>(null);
    const [isLoading, setIsLoading] = useState(isEdit);

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
                showError("Không thể tải thông tin khách hàng.");
            } finally {
                setIsLoading(false);
            }
        };

        void loadCustomer();
    }, [customerId]);

    return (
        <>
            <PageMeta
                title={`${isEdit ? "Cập nhật" : "Thêm"} khách hàng | Hệ thống Admin`}
                description="Tạo và cập nhật thông tin khách hàng"
            />

            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <PageBreadcrumb pageTitle={isEdit ? "Cập nhật khách hàng" : "Thêm khách hàng"} />
                <Button variant="outline" size="sm" startIcon={<AngleLeftIcon />} onClick={() => navigate("/customers")}>
                    Danh sách khách hàng
                </Button>
            </div>

            {isLoading ? (
                <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-gray-200 bg-white dark:border-white/[0.06] dark:bg-[#111b2d]">
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                        <Loader size="md" />
                        <span className="text-sm">Đang tải dữ liệu khách hàng...</span>
                    </div>
                </div>
            ) : (
                <CustomerModal
                    embedded
                    isOpen
                    customer={customer}
                    onClose={() => navigate("/customers")}
                    onSuccess={() => navigate("/customers")}
                />
            )}
        </>
    );
}
