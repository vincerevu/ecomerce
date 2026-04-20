import { useEffect, useMemo, useState } from "react";
import type {
  OrderRecord,
  OrderStatus,
  PaymentStatus,
  UpdateOrderReceiverPayload,
} from "../../api/orderApi";
import { shipmentApi, type ShipmentEventRecord, type ShipmentRecord } from "../../api/shipmentApi";
import {
  ORDER_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  formatCurrency,
  formatDateTime,
  getOrderStatusMeta,
  getPaymentStatusMeta,
} from "../tables/orderTable.utils";
import { showError, showSuccess } from "../../utils/toast";
import Badge from "../ui/badge/Badge";
import Button from "../ui/button/Button";
import Select from "../form/Select";
import Input from "../form/input/InputField";
import { Modal } from "../ui/modal";

interface OrderDetailModalProps {
  order: OrderRecord | null;
  isOpen: boolean;
  canUpdate: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSave: (payload: { status: OrderStatus; paymentStatus: PaymentStatus }) => void;
  onSaveReceiver: (payload: UpdateOrderReceiverPayload) => Promise<void>;
}

export default function OrderDetailModal({
  order,
  isOpen,
  canUpdate,
  isSaving,
  onClose,
  onSave,
  onSaveReceiver,
}: OrderDetailModalProps) {
  const [status, setStatus] = useState<OrderStatus>("PENDING");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("UNPAID");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [shipment, setShipment] = useState<ShipmentRecord | null>(null);
  const [isShipmentLoading, setIsShipmentLoading] = useState(false);
  const [isSyncingShipment, setIsSyncingShipment] = useState(false);
  const [isCancellingShipment, setIsCancellingShipment] = useState(false);
  const [isSavingReceiver, setIsSavingReceiver] = useState(false);

  useEffect(() => {
    if (!order) return;
    setStatus(order.status);
    setPaymentStatus(order.paymentStatus);
    setCustomerName(order.customerName || "");
    setCustomerPhone(order.customerPhone || "");
  }, [order]);

  useEffect(() => {
    if (!isOpen || !order) {
      setShipment(null);
      return;
    }

    const loadShipment = async () => {
      try {
        setIsShipmentLoading(true);
        const response = await shipmentApi.getByOrderId(order.id);
        setShipment(response.result);
      } catch (error) {
        console.error("Failed to load shipment", error);
        setShipment(null);
      } finally {
        setIsShipmentLoading(false);
      }
    };

    void loadShipment();
  }, [isOpen, order]);

  const dirty = useMemo(
    () =>
      order
        ? order.status !== status || order.paymentStatus !== paymentStatus
        : false,
    [order, paymentStatus, status],
  );

  const receiverDirty = useMemo(
    () =>
      order
        ? order.customerName !== customerName || order.customerPhone !== customerPhone
        : false,
    [customerName, customerPhone, order],
  );

  if (!order) return null;

  const orderStatusMeta = getOrderStatusMeta(order.status);
  const paymentMeta = getPaymentStatusMeta(order.paymentStatus);
  const shipmentStatusMeta = getShipmentStatusMeta(shipment?.status);
  const requiredNoteLabel = getRequiredNoteLabel(shipment?.requiredNote);
  const canCancelShipment = Boolean(
    canUpdate &&
      shipment &&
      !["CANCELLED", "DELIVERED", "RETURNED"].includes(shipment.status),
  );

  const handleSyncShipment = async () => {
    if (!shipment) return;

    try {
      setIsSyncingShipment(true);
      const response = await shipmentApi.sync(shipment.id);
      setShipment(response.result);
      showSuccess("Đã đồng bộ trạng thái vận đơn GHN.");
    } catch (error) {
      console.error("Failed to sync shipment", error);
      showError("Không thể đồng bộ trạng thái vận đơn GHN.");
    } finally {
      setIsSyncingShipment(false);
    }
  };

  const handleCancelShipment = async () => {
    if (!shipment) return;

    try {
      setIsCancellingShipment(true);
      const response = await shipmentApi.cancel(shipment.id);
      setShipment(response.result);
      showSuccess("Đã gửi yêu cầu hủy vận đơn GHN.");
    } catch (error) {
      console.error("Failed to cancel shipment", error);
      showError("Không thể hủy vận đơn GHN.");
    } finally {
      setIsCancellingShipment(false);
    }
  };

  const handleSaveReceiver = async () => {
    if (!order || !customerName.trim() || !customerPhone.trim()) return;
    try {
      setIsSavingReceiver(true);
      await onSaveReceiver({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
      });
    } finally {
      setIsSavingReceiver(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="flex max-h-[calc(100vh-24px)] w-[min(1120px,calc(100vw-24px))] flex-col overflow-hidden"
    >
      <div className="shrink-0 border-b border-gray-100 px-4 py-4 sm:px-6 sm:py-5 dark:border-white/[0.05]">
        <div className="pr-12">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-500">
            Đơn hàng
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {order.orderCode}
            </h3>
            <Badge size="sm" color={orderStatusMeta.color} variant="light">
              {orderStatusMeta.label}
            </Badge>
            <Badge size="sm" color={paymentMeta.color} variant="light">
              {paymentMeta.label}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Tạo lúc {formatDateTime(order.createdAt)}
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4 dark:border-white/[0.05] dark:bg-white/[0.02]">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              Khách nhận hàng
            </h4>
            <div className="mt-3 space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
              {order.customerEmail ? <p>{order.customerEmail}</p> : null}
              <p>{order.shippingAddress}</p>
              {canUpdate ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!receiverDirty}
                  isLoading={isSavingReceiver}
                  onClick={handleSaveReceiver}
                >
                  Lưu người nhận
                </Button>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 dark:border-white/[0.05]">
            <div className="border-b border-gray-100 px-4 py-3 dark:border-white/[0.05]">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                Sản phẩm trong đơn
              </h4>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="h-14 w-14 overflow-hidden rounded-2xl bg-gray-100 dark:bg-white/[0.05]">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-gray-400">
                        Không ảnh
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                      {item.productName}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {[item.colorName, item.sizeName].filter(Boolean).join(" • ") ||
                        "Biến thể mặc định"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(item.lineTotal)}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {item.quantity} x {formatCurrency(item.unitPrice)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 p-4 dark:border-white/[0.05]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Vận đơn GHN
                </h4>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Xem mã vận đơn, trạng thái giao hàng và các mốc cập nhật mới nhất.
                </p>
              </div>
              {shipment ? (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSyncShipment}
                    disabled={!canUpdate}
                    isLoading={isSyncingShipment}
                  >
                    Đồng bộ GHN
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelShipment}
                    disabled={!canCancelShipment}
                    isLoading={isCancellingShipment}
                    className="border-red-200 text-red-500 hover:bg-red-50"
                  >
                    Hủy vận đơn
                  </Button>
                </div>
              ) : null}
            </div>

            {isShipmentLoading ? (
              <div className="mt-4 rounded-2xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-400 dark:border-white/[0.08]">
                Đang tải thông tin vận đơn...
              </div>
            ) : !shipment ? (
              <div className="mt-4 rounded-2xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-400 dark:border-white/[0.08]">
                Đơn này chưa có vận đơn GHN.
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-gray-50 px-4 py-3 dark:bg-white/[0.02]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                      Mã vận đơn
                    </p>
                    <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                      {shipment.trackingCode || shipment.clientOrderCode || "Chưa có mã"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 px-4 py-3 dark:bg-white/[0.02]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                      Trạng thái giao hàng
                    </p>
                    <div className="mt-2">
                      <Badge size="sm" color={shipmentStatusMeta.color} variant="light">
                        {shipmentStatusMeta.label}
                      </Badge>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-gray-50 px-4 py-3 dark:bg-white/[0.02]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                      Lưu ý giao hàng
                    </p>
                    <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">
                      {requiredNoteLabel}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 px-4 py-3 dark:bg-white/[0.02]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                      Dự kiến giao
                    </p>
                    <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">
                      {shipment.expectedDeliveryTime
                        ? formatDateTime(shipment.expectedDeliveryTime)
                        : "Chưa có dữ liệu"}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-100 dark:border-white/[0.05]">
                  <div className="border-b border-gray-100 px-4 py-3 dark:border-white/[0.05]">
                    <h5 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Lịch sử vận chuyển
                    </h5>
                  </div>
                  <div className="max-h-72 space-y-3 overflow-y-auto px-4 py-4">
                    {(shipment.events || []).length === 0 ? (
                      <p className="text-sm text-gray-400">Chưa có mốc trạng thái nào.</p>
                    ) : (
                      (shipment.events || []).map((event, index) => {
                        const eventMeta = getShipmentStatusMeta(
                          event.internalStatus || event.providerStatus,
                        );
                        const eventLabel = getShipmentEventLabel(event);
                        return (
                          <div
                            key={event.id || `${event.eventTime || "event"}-${index}`}
                            className="flex gap-3"
                          >
                            <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-500" />
                            <div className="min-w-0 flex-1 rounded-2xl bg-gray-50 px-4 py-3 dark:bg-white/[0.02]">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {eventLabel}
                                </p>
                                {event.internalStatus || event.providerStatus ? (
                                  <Badge size="sm" color={eventMeta.color} variant="light">
                                    {eventMeta.label}
                                  </Badge>
                                ) : null}
                              </div>
                              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                {event.eventTime
                                  ? formatDateTime(event.eventTime)
                                  : "Không rõ thời điểm"}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-100 p-4 dark:border-white/[0.05]">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              Điều phối đơn hàng
            </h4>
            <div className="mt-4 space-y-3">
              <Select
                value={status}
                onChange={(value) => setStatus(value as OrderStatus)}
                options={ORDER_STATUS_OPTIONS}
                className="w-full"
              />
              <Select
                value={paymentStatus}
                onChange={(value) => setPaymentStatus(value as PaymentStatus)}
                options={PAYMENT_STATUS_OPTIONS}
                className="w-full"
              />
              {canUpdate ? (
                <Button
                  className="w-full"
                  isLoading={isSaving}
                  disabled={!dirty}
                  onClick={() => onSave({ status, paymentStatus })}
                >
                  Lưu trạng thái
                </Button>
              ) : (
                <p className="text-xs text-gray-400">Bạn chỉ có quyền xem đơn hàng.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4 dark:border-white/[0.05] dark:bg-white/[0.02]">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              Tóm tắt thanh toán
            </h4>
            <div className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center justify-between">
                <span>Tạm tính</span>
                <span className="font-medium">{formatCurrency(order.subtotal || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Phí vận chuyển</span>
                <span className="font-medium">{formatCurrency(order.shippingFee || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Giảm giá</span>
                <span className="font-medium text-emerald-600">
                  -{formatCurrency(order.discountAmount || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-dashed border-gray-200 pt-3 text-base font-semibold text-gray-900 dark:border-white/[0.08] dark:text-white">
                <span>Tổng thanh toán</span>
                <span>{formatCurrency(order.totalAmount || 0)}</span>
              </div>
            </div>
          </div>

          {order.notes ? (
            <div className="rounded-2xl border border-gray-100 p-4 dark:border-white/[0.05]">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                Ghi chú
              </h4>
              <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
                {order.notes}
              </p>
            </div>
          ) : null}
        </div>
        </div>
      </div>
    </Modal>
  );
}

function normalizeShipmentStatus(status?: string) {
  return (status || "").trim().toUpperCase();
}

function getShipmentStatusMeta(status?: string) {
  switch (normalizeShipmentStatus(status)) {
    case "READY_TO_PICK":
      return { label: "Sẵn sàng lấy hàng", color: "info" as const };
    case "PICKING":
      return { label: "Đang lấy hàng", color: "primary" as const };
    case "DELIVERING":
      return { label: "Đang giao hàng", color: "warning" as const };
    case "DELIVERED":
      return { label: "Giao thành công", color: "success" as const };
    case "RETURNING":
      return { label: "Đang hoàn hàng", color: "warning" as const };
    case "RETURNED":
      return { label: "Đã hoàn hàng", color: "error" as const };
    case "CANCELLED":
      return { label: "Đã hủy vận đơn", color: "error" as const };
    case "FAILED":
      return { label: "Giao thất bại", color: "error" as const };
    default:
      return { label: "Đã tạo vận đơn", color: "light" as const };
  }
}

function getShipmentEventLabel(event: ShipmentEventRecord) {
  const normalizedDescription = (event?.description || "").trim();
  const normalizedProviderStatus = normalizeShipmentStatus(event?.providerStatus);

  if (
    !normalizedDescription ||
    normalizeShipmentStatus(normalizedDescription) === normalizedProviderStatus
  ) {
    return getShipmentStatusMeta(event?.internalStatus || event?.providerStatus).label;
  }

  return normalizedDescription;
}

function getRequiredNoteLabel(requiredNote?: string) {
  switch (requiredNote) {
    case "KHONGCHOXEMHANG":
      return "Không cho xem hàng";
    case "CHOXEMHANGKHONGTHU":
      return "Cho xem hàng không cho thử";
    case "CHOTHUHANG":
      return "Cho thử hàng";
    default:
      return "Theo cấu hình mặc định";
  }
}

