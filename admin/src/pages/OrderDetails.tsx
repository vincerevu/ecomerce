import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import type { OrderRecord, OrderStatus, PaymentStatus } from "../api/orderApi";
import { orderApi } from "../api/orderApi";
import { paymentApi, type PaymentRecord } from "../api/paymentApi";
import { shipmentApi, type ShipmentEventRecord, type ShipmentRecord } from "../api/shipmentApi";
import { useAuth } from "../context/AuthContext";
import { showError, showSuccess } from "../utils/toast";
import { hasAnyPermission } from "../components/auth/PermissionGuard";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Loader from "../components/common/Loader";
import Button from "../components/ui/button/Button";
import Badge from "../components/ui/badge/Badge";
import Select from "../components/form/Select";
import Input from "../components/form/input/InputField";
import { AngleLeftIcon, PencilIcon } from "../icons";
import {
  ORDER_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  formatCurrency,
  formatDateTime,
  getOrderStatusMeta,
  getPaymentStatusMeta,
} from "../components/tables/orderTable.utils";
import {
  formatDateTime as formatPaymentDateTime,
  getMethodLabel,
  getProviderLabel,
  getTransactionTypeLabel,
} from "../components/tables/paymentTable.utils";

export default function OrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canUpdate = hasAnyPermission(user, "ORDER:UPDATE");

  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<OrderStatus>("PENDING");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("UNPAID");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [shipment, setShipment] = useState<ShipmentRecord | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isShipmentLoading, setIsShipmentLoading] = useState(false);
  const [isPaymentsLoading, setIsPaymentsLoading] = useState(false);
  const [isSyncingShipment, setIsSyncingShipment] = useState(false);
  const [isCancellingShipment, setIsCancellingShipment] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingReceiver, setIsSavingReceiver] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setIsLoading(false);
      return;
    }

    const loadOrder = async () => {
      try {
        setIsLoading(true);
        const response = await orderApi.getById(orderId);
        const nextOrder = response.result;
        setOrder(nextOrder);
        setStatus(nextOrder.status);
        setPaymentStatus(nextOrder.paymentStatus);
        setCustomerName(nextOrder.customerName || "");
        setCustomerPhone(nextOrder.customerPhone || "");
        setIsEditing(false);
      } catch (error) {
        console.error("Failed to load order", error);
        showError("Không thể tải chi tiết đơn hàng.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadOrder();
  }, [orderId]);

  useEffect(() => {
    if (!orderId || !order) {
      setShipment(null);
      return;
    }

    const loadShipment = async () => {
      try {
        setIsShipmentLoading(true);
        const response = await shipmentApi.getByOrderId(orderId);
        setShipment(response.result);
      } catch (error) {
        console.error("Failed to load shipment", error);
        setShipment(null);
      } finally {
        setIsShipmentLoading(false);
      }
    };

    void loadShipment();
  }, [order, orderId]);

  useEffect(() => {
    if (!orderId) {
      setPayments([]);
      return;
    }

    const loadPayments = async () => {
      try {
        setIsPaymentsLoading(true);
        const filter = `order.id:'${escapeFilterValue(orderId)}' and isDeleted:false`;
        const response = await paymentApi.getPayments({
          page: 0,
          size: 20,
          sort: "createdAt,desc",
          filter,
        });
        setPayments(response.result.data || []);
      } catch (error) {
        console.error("Failed to load payments for order", error);
        setPayments([]);
      } finally {
        setIsPaymentsLoading(false);
      }
    };

    void loadPayments();
  }, [orderId]);

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

  const resetFormState = () => {
    if (!order) return;
    setStatus(order.status);
    setPaymentStatus(order.paymentStatus);
    setCustomerName(order.customerName || "");
    setCustomerPhone(order.customerPhone || "");
  };

  const handleCancelEdit = () => {
    resetFormState();
    setIsEditing(false);
  };

  const handleSaveChanges = async () => {
    if (!order) return;

    try {
      if (receiverDirty) {
        setIsSavingReceiver(true);
        const receiverResponse = await orderApi.updateReceiver(order.id, {
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
        });
        setOrder(receiverResponse.result);
        setCustomerName(receiverResponse.result.customerName || "");
        setCustomerPhone(receiverResponse.result.customerPhone || "");
      }

      if (dirty) {
        setIsSaving(true);
        const statusResponse = await orderApi.updateStatus(order.id, { status, paymentStatus });
        setOrder(statusResponse.result);
        setStatus(statusResponse.result.status);
        setPaymentStatus(statusResponse.result.paymentStatus);
      }

      if (receiverDirty || dirty) {
        showSuccess("Đã lưu thay đổi đơn hàng.");
      }
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save order changes", error);
      showError("Không thể lưu thay đổi đơn hàng.");
    } finally {
      setIsSaving(false);
      setIsSavingReceiver(false);
    }
  };

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

  const pageTitle = order ? `Chi tiết ${order.orderCode}` : "Chi tiết đơn hàng";

  if (isLoading) {
    return (
      <>
        <PageMeta title="Chi tiết đơn hàng | Hệ thống Admin" description="Xem và cập nhật chi tiết đơn hàng" />
        <PageBreadcrumb pageTitle="Chi tiết đơn hàng" />
        <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-gray-200 bg-white dark:border-white/[0.06] dark:bg-[#111b2d]">
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <Loader size="md" />
            <span className="text-sm">Đang tải chi tiết đơn hàng...</span>
          </div>
        </div>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <PageMeta title="Không tìm thấy đơn hàng | Hệ thống Admin" description="Không tìm thấy đơn hàng yêu cầu" />
        <PageBreadcrumb pageTitle="Chi tiết đơn hàng" />
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-white/[0.06] dark:bg-[#111b2d]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Không tìm thấy đơn hàng cần xem.</p>
          <Button className="mt-4" variant="outline" onClick={() => navigate("/orders")}>
            Quay lại danh sách đơn
          </Button>
        </div>
      </>
    );
  }

  const orderStatusMeta = getOrderStatusMeta(order.status);
  const paymentMeta = getPaymentStatusMeta(order.paymentStatus);
  const shipmentStatusMeta = getShipmentStatusMeta(shipment?.status);
  const requiredNoteLabel = getRequiredNoteLabel(shipment?.requiredNote);
  const canCancelShipment = Boolean(
    canUpdate &&
      shipment &&
      !["CANCELLED", "DELIVERED", "RETURNED"].includes(shipment.status),
  );

  return (
    <>
      <PageMeta title={`${order.orderCode} | Hệ thống Admin`} description="Xem và cập nhật chi tiết đơn hàng" />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <PageBreadcrumb pageTitle={pageTitle} />
        <div className="flex flex-wrap items-center gap-2">
          {canUpdate ? (
            isEditing ? (
              <>
                <Button
                  size="sm"
                  isLoading={isSaving || isSavingReceiver}
                  disabled={!dirty && !receiverDirty}
                  onClick={handleSaveChanges}
                >
                  Lưu thay đổi
                </Button>
                <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                  Quay lại
                </Button>
              </>
            ) : (
              <Button size="sm" startIcon={<PencilIcon />} onClick={() => setIsEditing(true)}>
                Chỉnh sửa
              </Button>
            )
          ) : null}
          <Button variant="outline" size="sm" startIcon={<AngleLeftIcon />} onClick={() => navigate("/orders")}>
            Danh sách đơn
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-[#111b2d] dark:shadow-[0_20px_46px_rgba(2,6,23,0.32)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-500">Đơn hàng</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">{order.orderCode}</h3>
            <Badge size="sm" color={orderStatusMeta.color} variant="light">
              {orderStatusMeta.label}
            </Badge>
            <Badge size="sm" color={paymentMeta.color} variant="light">
              {paymentMeta.label}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Tạo lúc {formatDateTime(order.createdAt)}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-[#111b2d]">
            <div>
              <h4 className="text-base font-semibold text-gray-900 dark:text-white">Thông tin đơn hàng</h4>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Gộp người nhận, sản phẩm và vận chuyển vào cùng một khối để dễ theo dõi hơn.
              </p>
            </div>
            <div className="mt-5 space-y-6">
              <div className="rounded-2xl bg-gray-50/80 p-4 dark:bg-white/[0.02]">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Khách nhận hàng</h4>
              <div className="mt-3 space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  disabled={!isEditing}
                />
                <Input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  disabled={!isEditing}
                />
                {order.customerEmail ? <p>{order.customerEmail}</p> : null}
                <p>{order.shippingAddress}</p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6 dark:border-white/[0.06]">
              <div className="border-b border-gray-100 px-4 py-3 dark:border-white/[0.05]">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Sản phẩm trong đơn</h4>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="h-14 w-14 overflow-hidden rounded-2xl bg-gray-100 dark:bg-white/[0.05]">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-gray-400">Không ảnh</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{item.productName}</p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {[item.colorName, item.sizeName].filter(Boolean).join(" • ") || "Biến thể mặc định"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(item.lineTotal)}</p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {item.quantity} x {formatCurrency(item.unitPrice)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6 dark:border-white/[0.06]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Vận đơn GHN</h4>
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
                      <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">{requiredNoteLabel}</p>
                    </div>
                    <div className="rounded-2xl bg-gray-50 px-4 py-3 dark:bg-white/[0.02]">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                        Dự kiến giao
                      </p>
                      <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">
                        {shipment.expectedDeliveryTime ? formatDateTime(shipment.expectedDeliveryTime) : "Chưa có dữ liệu"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-100 dark:border-white/[0.05]">
                    <div className="border-b border-gray-100 px-4 py-3 dark:border-white/[0.05]">
                      <h5 className="text-sm font-semibold text-gray-900 dark:text-white">Lịch sử vận chuyển</h5>
                    </div>
                    <div className="max-h-72 space-y-3 overflow-y-auto px-4 py-4">
                      {(shipment.events || []).length === 0 ? (
                        <p className="text-sm text-gray-400">Chưa có mốc trạng thái nào.</p>
                      ) : (
                        (shipment.events || []).map((event, index) => {
                          const eventMeta = getShipmentStatusMeta(event.internalStatus || event.providerStatus);
                          const eventLabel = getShipmentEventLabel(event);
                          return (
                            <div key={event.id || `${event.eventTime || "event"}-${index}`} className="flex gap-3">
                              <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-500" />
                              <div className="min-w-0 flex-1 rounded-2xl bg-gray-50 px-4 py-3 dark:bg-white/[0.02]">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{eventLabel}</p>
                                  {event.internalStatus || event.providerStatus ? (
                                    <Badge size="sm" color={eventMeta.color} variant="light">
                                      {eventMeta.label}
                                    </Badge>
                                  ) : null}
                                </div>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                  {event.eventTime ? formatDateTime(event.eventTime) : "Không rõ thời điểm"}
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
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-[#111b2d]">
            <div>
              <h4 className="text-base font-semibold text-gray-900 dark:text-white">Vận hành và thanh toán</h4>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Gom trạng thái xử lý, số tiền và lịch sử giao dịch vào cùng một khu vực.
              </p>
            </div>
            <div className="mt-5 space-y-6">
              <div className="rounded-2xl bg-gray-50/80 p-4 dark:bg-white/[0.02]">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Điều phối đơn hàng</h4>
              <div className="mt-4 space-y-3">
                {isEditing ? (
                  <>
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
                  </>
                ) : (
                  <>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-white/[0.08] dark:bg-white/[0.02]">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Trạng thái đơn</p>
                      <div className="mt-2">
                        <Badge size="sm" color={getOrderStatusMeta(status).color} variant="light">
                          {getOrderStatusMeta(status).label}
                        </Badge>
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-white/[0.08] dark:bg-white/[0.02]">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Trạng thái thanh toán</p>
                      <div className="mt-2">
                        <Badge size="sm" color={getPaymentStatusMeta(paymentStatus).color} variant="light">
                          {getPaymentStatusMeta(paymentStatus).label}
                        </Badge>
                      </div>
                    </div>
                  </>
                )}
                {canUpdate ? (
                  !isEditing ? (
                    <p className="text-xs text-gray-400">Bấm "Chỉnh sửa" để cập nhật trạng thái đơn.</p>
                  ) : (
                    <p className="text-xs text-gray-400">Bạn có thể chỉnh người nhận và trạng thái rồi lưu một lần.</p>
                  )
                ) : (
                  <p className="text-xs text-gray-400">Bạn chỉ có quyền xem đơn hàng.</p>
                )}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6 dark:border-white/[0.06]">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Tóm tắt thanh toán</h4>
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
                  <span className="font-medium text-emerald-600">-{formatCurrency(order.discountAmount || 0)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-dashed border-gray-200 pt-3 text-base font-semibold text-gray-900 dark:border-white/[0.08] dark:text-white">
                  <span>Tổng thanh toán</span>
                  <span>{formatCurrency(order.totalAmount || 0)}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6 dark:border-white/[0.06]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Lịch sử giao dịch</h4>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Theo dõi các lần thu tiền, thanh toán lại hoặc giao dịch thất bại của đơn hàng này.
                  </p>
                </div>
                <Badge size="sm" color="light" variant="light">
                  {payments.length} giao dịch
                </Badge>
              </div>

              {isPaymentsLoading ? (
                <div className="mt-4 rounded-2xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-400 dark:border-white/[0.08]">
                  Đang tải lịch sử giao dịch...
                </div>
              ) : payments.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-400 dark:border-white/[0.08]">
                  Đơn này chưa có giao dịch thanh toán nào.
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {payments.map((payment) => {
                    const paymentMeta = getPaymentStatusMeta(payment.status);

                    return (
                      <div
                        key={payment.id}
                        className="rounded-2xl border border-gray-100 bg-gray-50/70 px-4 py-3 dark:border-white/[0.05] dark:bg-white/[0.02]"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {payment.transactionCode}
                              </p>
                              <Badge size="sm" color={paymentMeta.color} variant="light">
                                {paymentMeta.label}
                              </Badge>
                            </div>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              {formatPaymentDateTime(payment.processedAt || payment.createdAt)}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(payment.amount || 0)}
                          </p>
                        </div>

                        <div className="mt-3 grid gap-3 text-sm text-gray-600 dark:text-gray-300 sm:grid-cols-2">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                              Kênh thanh toán
                            </p>
                            <p className="mt-1">
                              {getProviderLabel(payment.provider)} • {getMethodLabel(payment.paymentMethod)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                              Loại giao dịch
                            </p>
                            <p className="mt-1">{getTransactionTypeLabel(payment.transactionType)}</p>
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                              Mã đối soát
                            </p>
                            <p className="mt-1 break-all">{payment.providerReference || "Chưa có"}</p>
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                              Ghi chú
                            </p>
                            <p className="mt-1">{payment.notes || payment.failureReason || "Không có"}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {order.notes ? (
              <div className="border-t border-gray-100 pt-6 dark:border-white/[0.06]">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Ghi chú</h4>
                <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">{order.notes}</p>
              </div>
            ) : null}
            </div>
          </div>
        </div>
      </div>
    </>
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

  if (!normalizedDescription || normalizeShipmentStatus(normalizedDescription) === normalizedProviderStatus) {
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

function escapeFilterValue(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}
