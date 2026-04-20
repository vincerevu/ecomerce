import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { orderApi, OrderRecord } from "../api/orderApi";
import { paymentApi, type CreatePaymentPayload, type PaymentRecord, type UpdatePaymentPayload } from "../api/paymentApi";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Loader from "../components/common/Loader";
import PaymentModal from "../components/payments/PaymentModal";
import Button from "../components/ui/button/Button";
import { AngleLeftIcon } from "../icons";
import { showError, showSuccess } from "../utils/toast";

export default function PaymentEditor() {
    const { paymentId } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(paymentId);

    const [payment, setPayment] = useState<PaymentRecord | null>(null);
    const [orders, setOrders] = useState<OrderRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                setIsLoading(true);
                const [ordersResponse, paymentResponse] = await Promise.all([
                    orderApi.getOrders({ page: 0, size: 100, sort: "createdAt,desc" }),
                    paymentId ? paymentApi.getById(paymentId) : Promise.resolve(null),
                ]);

                setOrders(ordersResponse.result.data || []);
                setPayment(paymentResponse?.result || null);
            } catch (error) {
                console.error("Failed to load payment data", error);
                showError("Không thể tải dữ liệu giao dịch.");
            } finally {
                setIsLoading(false);
            }
        };

        void loadData();
    }, [paymentId]);

    const handleCreate = async (payload: CreatePaymentPayload) => {
        try {
            setIsSaving(true);
            await paymentApi.create(payload);
            showSuccess("Đã tạo giao dịch thanh toán.");
            navigate("/payments");
        } catch (error) {
            console.error("Failed to create payment", error);
            showError("Không thể tạo giao dịch thanh toán.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdate = async (id: string, payload: UpdatePaymentPayload) => {
        try {
            setIsSaving(true);
            await paymentApi.update(id, payload);
            showSuccess("Đã cập nhật giao dịch.");
            navigate("/payments");
        } catch (error) {
            console.error("Failed to update payment", error);
            showError("Không thể cập nhật giao dịch.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <PageMeta
                title={`${isEdit ? "Cập nhật" : "Thêm"} giao dịch | Hệ thống Admin`}
                description="Tạo và cập nhật giao dịch thanh toán cho đơn hàng"
            />

            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <PageBreadcrumb pageTitle={isEdit ? "Cập nhật giao dịch" : "Thêm giao dịch"} />
                <Button variant="outline" size="sm" startIcon={<AngleLeftIcon />} onClick={() => navigate("/payments")}>
                    Danh sách giao dịch
                </Button>
            </div>

            {isLoading ? (
                <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-gray-200 bg-white dark:border-white/[0.06] dark:bg-[#111b2d]">
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                        <Loader size="md" />
                        <span className="text-sm">Đang tải dữ liệu giao dịch...</span>
                    </div>
                </div>
            ) : (
                <PaymentModal
                    embedded
                    isOpen
                    payment={payment}
                    orders={orders}
                    isSaving={isSaving}
                    onClose={() => navigate("/payments")}
                    onCreate={handleCreate}
                    onUpdate={handleUpdate}
                />
            )}
        </>
    );
}
