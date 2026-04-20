import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { paymentApi, type PaymentRecord } from "../api/paymentApi";
import Loader from "../components/common/Loader";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Badge from "../components/ui/badge/Badge";
import Button from "../components/ui/button/Button";
import { AngleLeftIcon, PencilIcon } from "../icons";
import { showError } from "../utils/toast";
import {
  formatCurrency,
  formatDateTime,
  getMethodLabel,
  getPaymentStatusMeta,
  getProviderLabel,
  getTransactionTypeLabel,
} from "../components/tables/paymentTable.utils";

export default function PaymentDetails() {
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState<PaymentRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!paymentId) {
      setIsLoading(false);
      return;
    }
    const loadPayment = async () => {
      try {
        setIsLoading(true);
        const response = await paymentApi.getById(paymentId);
        setPayment(response.result);
      } catch (error) {
        console.error("Failed to load payment", error);
        showError("Không thể tải thông tin giao dịch.");
      } finally {
        setIsLoading(false);
      }
    };
    void loadPayment();
  }, [paymentId]);

  if (isLoading) {
    return (
      <>
        <PageMeta title="Chi tiết giao dịch | Hệ thống Admin" description="Xem chi tiết giao dịch thanh toán" />
        <PageBreadcrumb pageTitle="Chi tiết giao dịch" />
        <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-gray-200 bg-white dark:border-white/[0.06] dark:bg-[#111b2d]">
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <Loader size="md" />
            <span className="text-sm">Đang tải chi tiết giao dịch...</span>
          </div>
        </div>
      </>
    );
  }

  if (!payment) {
    return (
      <>
        <PageMeta title="Không tìm thấy giao dịch | Hệ thống Admin" description="Không tìm thấy giao dịch yêu cầu" />
        <PageBreadcrumb pageTitle="Chi tiết giao dịch" />
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-white/[0.06] dark:bg-[#111b2d]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Không tìm thấy giao dịch cần xem.</p>
          <Button className="mt-4" variant="outline" onClick={() => navigate("/payments")}>
            Quay lại danh sách giao dịch
          </Button>
        </div>
      </>
    );
  }

  const statusMeta = getPaymentStatusMeta(payment.status);

  return (
    <>
      <PageMeta title={`${payment.transactionCode} | Hệ thống Admin`} description="Xem chi tiết giao dịch thanh toán" />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <PageBreadcrumb pageTitle={`Chi tiết ${payment.transactionCode}`} />
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" startIcon={<PencilIcon />} onClick={() => navigate(`/payments/${payment.id}/edit`)}>
            Chỉnh sửa
          </Button>
          <Button variant="outline" size="sm" startIcon={<AngleLeftIcon />} onClick={() => navigate("/payments")}>
            Danh sách giao dịch
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-[#111b2d]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-500">Giao dịch</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">{payment.transactionCode}</h3>
            <Badge size="sm" color={statusMeta.color} variant="light">
              {statusMeta.label}
            </Badge>
          </div>
          <div className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
            <p><span className="font-medium text-gray-900 dark:text-white">Mã đơn:</span> {payment.orderCode}</p>
            <p><span className="font-medium text-gray-900 dark:text-white">Khách hàng:</span> {payment.customerName}</p>
            <p><span className="font-medium text-gray-900 dark:text-white">Cổng thanh toán:</span> {getProviderLabel(payment.provider)}</p>
            <p><span className="font-medium text-gray-900 dark:text-white">Phương thức:</span> {getMethodLabel(payment.paymentMethod)}</p>
            <p><span className="font-medium text-gray-900 dark:text-white">Loại giao dịch:</span> {getTransactionTypeLabel(payment.transactionType)}</p>
            <p><span className="font-medium text-gray-900 dark:text-white">Số tiền:</span> {formatCurrency(payment.amount)}</p>
            <p><span className="font-medium text-gray-900 dark:text-white">Mã đối soát:</span> {payment.providerReference || "Chưa có"}</p>
            <p><span className="font-medium text-gray-900 dark:text-white">Xử lý lúc:</span> {formatDateTime(payment.processedAt || payment.createdAt)}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-[#111b2d]">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Ghi chú</h4>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{payment.notes || "Chưa có ghi chú"}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-[#111b2d]">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Lý do thất bại</h4>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{payment.failureReason || "Không có"}</p>
          </div>
        </div>
      </div>
    </>
  );
}
