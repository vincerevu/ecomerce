import type { SepayCheckoutResponse } from "./checkout-api";
import type { CustomerOrder } from "./order-api";

const ORDER_PAYMENT_WINDOW_MS = 60 * 60 * 1000;

export const buildSepayQrImageUrl = (checkout: SepayCheckoutResponse | null) => {
  if (!checkout) {
    return null;
  }

  if (checkout.qrImageUrl) {
    return checkout.qrImageUrl;
  }

  if (checkout.qrCode) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(
      checkout.qrCode
    )}`;
  }

  if (checkout.bankAccountNumber && checkout.bankCode && checkout.orderCode) {
    const amount = Number(checkout.amount || 0);
    return `https://qr.sepay.vn/img?acc=${encodeURIComponent(
      checkout.bankAccountNumber
    )}&bank=${encodeURIComponent(checkout.bankCode)}&amount=${encodeURIComponent(
      String(amount)
    )}&des=${encodeURIComponent(checkout.orderCode)}`;
  }

  return null;
};

export const getOrderPaymentDeadline = (createdAt?: string) => {
  if (!createdAt) {
    return null;
  }

  const createdTime = new Date(createdAt).getTime();
  if (Number.isNaN(createdTime)) {
    return null;
  }

  return new Date(createdTime + ORDER_PAYMENT_WINDOW_MS);
};

export const isOrderPaymentExpired = (createdAt?: string) => {
  const deadline = getOrderPaymentDeadline(createdAt);
  return deadline ? deadline.getTime() <= Date.now() : false;
};

export const formatRemainingPaymentTime = (createdAt?: string) => {
  const deadline = getOrderPaymentDeadline(createdAt);
  if (!deadline) {
    return null;
  }

  const diffMs = deadline.getTime() - Date.now();
  if (diffMs <= 0) {
    return "00:00";
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

export const canRetrySepayOrder = (order: Pick<CustomerOrder, "status" | "paymentStatus" | "createdAt">) => {
  if (order.status !== "PENDING") {
    return false;
  }

  if (order.paymentStatus !== "PENDING") {
    return false;
  }

  return !isOrderPaymentExpired(order.createdAt);
};

export const getOrderStatusLabel = (order: Pick<CustomerOrder, "status" | "paymentStatus">) => {
  if (order.status === "PENDING" && order.paymentStatus === "PENDING") {
    return "Chờ thanh toán";
  }

  if (order.status === "PENDING") {
    return "Chờ xác nhận";
  }

  if (order.status === "CONFIRMED") {
    return "Đã xác nhận";
  }

  if (order.status === "PACKING") {
    return "Chuẩn bị hàng";
  }

  if (order.status === "SHIPPING") {
    return "Đang giao hàng";
  }

  if (order.status === "DELIVERED") {
    return "Đã giao";
  }

  return "Đã hủy";
};
