import { useEffect, useMemo, useState } from "react";
import type {
  CreatePaymentPayload,
  PaymentRecord,
  PaymentStatus,
  UpdatePaymentPayload,
} from "../../api/paymentApi";
import type { OrderRecord } from "../../api/orderApi";
import Label from "../form/Label";
import Select, { type Option } from "../form/Select";
import Input from "../form/input/InputField";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import {
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_PROVIDER_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  PAYMENT_TRANSACTION_TYPE_OPTIONS,
  formatCurrency,
} from "../tables/paymentTable.utils";

interface PaymentModalProps {
  isOpen: boolean;
  payment: PaymentRecord | null;
  orders: OrderRecord[];
  isSaving: boolean;
  onClose: () => void;
  onCreate: (payload: CreatePaymentPayload) => void;
  onUpdate: (id: string, payload: UpdatePaymentPayload) => void;
  embedded?: boolean;
}

const ORDER_OPTIONS_FALLBACK: Option[] = [{ value: "", label: "Chọn đơn hàng" }];

export default function PaymentModal({
  isOpen,
  payment,
  orders,
  isSaving,
  onClose,
  onCreate,
  onUpdate,
  embedded = false,
}: PaymentModalProps) {
  const [orderId, setOrderId] = useState("");
  const [provider, setProvider] = useState("MOMO");
  const [paymentMethod, setPaymentMethod] = useState("E_WALLET");
  const [transactionType, setTransactionType] = useState("CHARGE");
  const [status, setStatus] = useState<PaymentStatus>("PENDING");
  const [amount, setAmount] = useState("");
  const [providerReference, setProviderReference] = useState("");
  const [notes, setNotes] = useState("");
  const [failureReason, setFailureReason] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    if (payment) {
      setOrderId(payment.orderId);
      setProvider(payment.provider);
      setPaymentMethod(payment.paymentMethod);
      setTransactionType(payment.transactionType);
      setStatus(payment.status);
      setAmount(String(payment.amount || ""));
      setProviderReference(payment.providerReference || "");
      setNotes(payment.notes || "");
      setFailureReason(payment.failureReason || "");
      return;
    }

    setOrderId(orders[0]?.id || "");
    setProvider("MOMO");
    setPaymentMethod("E_WALLET");
    setTransactionType("CHARGE");
    setStatus("PENDING");
    setAmount("");
    setProviderReference("");
    setNotes("");
    setFailureReason("");
  }, [isOpen, orders, payment]);

  const orderOptions = useMemo<Option[]>(
    () =>
      orders.length
        ? orders.map((order) => ({
            value: order.id,
            label: `${order.orderCode} • ${order.customerName} • ${formatCurrency(order.totalAmount || 0)}`,
          }))
        : ORDER_OPTIONS_FALLBACK,
    [orders],
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!amount) return;

    if (payment) {
      onUpdate(payment.id, {
        status,
        providerReference: providerReference || undefined,
        notes: notes || undefined,
        failureReason: failureReason || undefined,
      });
      return;
    }

    onCreate({
      orderId,
      provider: provider as CreatePaymentPayload["provider"],
      paymentMethod: paymentMethod as CreatePaymentPayload["paymentMethod"],
      transactionType: transactionType as CreatePaymentPayload["transactionType"],
      status,
      amount: Number(amount),
      currency: "VND",
      providerReference: providerReference || undefined,
      notes: notes || undefined,
      failureReason: failureReason || undefined,
    });
  };

  const content = (
    <div className={`${embedded ? "rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-[#111b2d] lg:p-8" : ""}`}>
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-500">
          Thanh toán
        </p>
        <h3 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
          {payment ? "Cập nhật giao dịch" : "Tạo giao dịch mới"}
        </h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Theo dõi cổng thanh toán, mã đối soát và trạng thái xử lý cho từng đơn hàng.
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label htmlFor="payment-order">Đơn hàng</Label>
            <Select
              options={orderOptions}
              value={orderId}
              onChange={setOrderId}
              className="w-full"
              placeholder="Chọn đơn hàng"
            />
          </div>

          <div>
            <Label htmlFor="payment-provider">Cổng thanh toán</Label>
            <Select
              options={PAYMENT_PROVIDER_OPTIONS}
              value={provider}
              onChange={setProvider}
              className="w-full"
            />
          </div>
          <div>
            <Label htmlFor="payment-method">Phương thức</Label>
            <Select
              options={PAYMENT_METHOD_OPTIONS}
              value={paymentMethod}
              onChange={setPaymentMethod}
              className="w-full"
            />
          </div>

          <div>
            <Label htmlFor="payment-type">Loại giao dịch</Label>
            <Select
              options={PAYMENT_TRANSACTION_TYPE_OPTIONS}
              value={transactionType}
              onChange={setTransactionType}
              className="w-full"
            />
          </div>
          <div>
            <Label htmlFor="payment-status">Trạng thái</Label>
            <Select
              options={PAYMENT_STATUS_OPTIONS}
              value={status}
              onChange={(value) => setStatus(value as PaymentStatus)}
              className="w-full"
            />
          </div>

          <div>
            <Label htmlFor="payment-amount">Số tiền</Label>
            <Input
              id="payment-amount"
              type="number"
              min="0"
              step={1000}
              value={amount}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setAmount(event.target.value)}
              placeholder="Ví dụ: 350000"
              required
            />
          </div>
          <div>
            <Label htmlFor="payment-reference">Mã đối soát</Label>
            <Input
              id="payment-reference"
              value={providerReference}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setProviderReference(event.target.value)
              }
              placeholder="Ví dụ: REF-20260318-001"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="payment-notes">Ghi chú</Label>
          <textarea
            id="payment-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 shadow-theme-xs outline-none transition-all focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800"
            placeholder="Ghi chú nội bộ cho giao dịch này"
          />
        </div>

        {status === "FAILED" ? (
          <div>
            <Label htmlFor="payment-failure-reason">Lý do thất bại</Label>
            <Input
              id="payment-failure-reason"
              value={failureReason}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setFailureReason(event.target.value)
              }
              placeholder="Ví dụ: Cổng thanh toán từ chối giao dịch"
            />
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Hủy bỏ
          </Button>
          <Button size="sm" type="submit" disabled={isSaving || !orderId}>
            {isSaving ? "Đang lưu..." : payment ? "Lưu thay đổi" : "Tạo giao dịch"}
          </Button>
        </div>
      </form>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="w-full max-w-[760px] p-5 lg:p-8"
    >
      {content}
    </Modal>
  );
}
