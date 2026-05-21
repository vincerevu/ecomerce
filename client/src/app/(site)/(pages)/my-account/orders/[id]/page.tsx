"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { orderApi, type CustomerOrder } from "@/libs/order-api";
import { shippingApi, type ShipmentDetail, type ShipmentEvent } from "@/libs/shipping-api";
import { useAuth } from "@/app/context/AuthContext";
import { checkoutApi, type SepayCheckoutResponse } from "@/libs/checkout-api";
import {
  buildSepayQrImageUrl,
  canRetrySepayOrder,
  formatRemainingPaymentTime,
  getOrderPaymentDeadline,
  getOrderStatusLabel,
  isOrderPaymentExpired,
} from "@/libs/sepay";
import OtpVerificationField from "@/components/Common/OtpVerificationField";
import { reviewApi } from "@/libs/review-api";

type ProgressStep = {
  key: string;
  label: string;
  subLabel?: string;
  active: boolean;
  completed: boolean;
};

type TimelineEntry = {
  key: string;
  title: string;
  description?: string;
  time?: string;
  active: boolean;
};

const paymentLabelMap: Record<CustomerOrder["paymentStatus"], string> = {
  UNPAID: "Chưa thanh toán",
  PENDING: "Chờ thanh toán",
  PARTIALLY_PAID: "Đã thanh toán một phần",
  PAID: "Đã thanh toán",
  FAILED: "Thanh toán thất bại",
  REFUNDED: "Đã hoàn tiền",
};

const formatDateTime = (value?: string) => {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleString("vi-VN");
};

const formatCurrency = (value?: number) => `${(value ?? 0).toLocaleString("vi-VN")}đ`;

const shipmentStatusLabelMap: Record<string, string> = {
  CREATED: "Đã tạo vận đơn",
  READY_TO_PICK: "Chờ lấy hàng",
  PICKING: "Đang lấy hàng",
  DELIVERING: "Đang giao hàng",
  DELIVERED: "Giao hàng thành công",
  RETURNING: "Đang hoàn hàng",
  RETURNED: "Đã hoàn hàng",
  CANCELLED: "Đã hủy vận đơn",
  FAILED: "Giao hàng thất bại",
  ready_to_pick: "Chờ lấy hàng",
  picking: "Đang lấy hàng",
  delivering: "Đang giao hàng",
  transporting: "Đang vận chuyển",
  sorting: "Đang phân loại",
  delivered: "Giao hàng thành công",
  return: "Đang hoàn hàng",
  returning: "Đang hoàn hàng",
  returned: "Đã hoàn hàng",
  cancel: "Đã hủy vận đơn",
  cancelled: "Đã hủy vận đơn",
  delivery_fail: "Giao hàng thất bại",
  lost: "Thất lạc hàng",
  damage: "Hàng bị hư hỏng",
};

const getShipmentStatusLabel = (status?: string) => {
  if (!status) {
    return "";
  }
  return shipmentStatusLabelMap[status] || shipmentStatusLabelMap[status.trim()] || status;
};

const buildProgressSteps = (order: CustomerOrder, shipment: ShipmentDetail | null): ProgressStep[] => {
  const isPaid = order.paymentStatus === "PAID" || order.paymentStatus === "PARTIALLY_PAID";
  const showPaymentStep = order.paymentStatus === "PENDING" || isPaid;
  const hasShipment = Boolean(shipment?.trackingCode || shipment?.status || shipment?.events?.length);
  const isDelivered = order.status === "DELIVERED";

  const baseSteps: ProgressStep[] = [
    {
      key: "ordered",
      label: "Đơn hàng đã đặt",
      subLabel: formatDateTime(order.createdAt),
      active: true,
      completed: true,
    },
    {
      key: "handover",
      label: "Đã giao cho đơn vị vận chuyển",
      subLabel: hasShipment ? formatDateTime(shipment?.createdAt) : undefined,
      active: hasShipment || order.status === "SHIPPING" || isDelivered,
      completed: hasShipment || order.status === "SHIPPING" || isDelivered,
    },
    {
      key: "received",
      label: "Đã nhận được hàng",
      subLabel: isDelivered ? formatDateTime(shipment?.expectedDeliveryTime || order.createdAt) : undefined,
      active: isDelivered,
      completed: isDelivered,
    },
    {
      key: "done",
      label: "Đơn hàng hoàn thành",
      subLabel: isDelivered ? formatDateTime(shipment?.expectedDeliveryTime || order.createdAt) : undefined,
      active: isDelivered,
      completed: isDelivered,
    },
  ];

  if (!showPaymentStep) {
    return baseSteps;
  }

  return [
    baseSteps[0],
    {
      key: "paid",
      label: isPaid ? `Đơn hàng đã thanh toán (${formatCurrency(order.totalAmount)})` : paymentLabelMap[order.paymentStatus],
      subLabel: isPaid ? formatDateTime(order.createdAt) : undefined,
      active: isPaid,
      completed: isPaid,
    },
    ...baseSteps.slice(1),
  ];
};

const buildFallbackTimeline = (order: CustomerOrder, shipment: ShipmentDetail | null): TimelineEntry[] => {
  const entries: TimelineEntry[] = [
    {
      key: "created",
      title: "Đơn hàng đã được tạo",
      description: "Hệ thống đã ghi nhận đơn hàng của bạn.",
      time: order.createdAt,
      active: true,
    },
  ];

  if (order.paymentStatus === "PAID" || order.paymentStatus === "PARTIALLY_PAID") {
    entries.push({
      key: "paid",
      title: paymentLabelMap[order.paymentStatus],
      description: "Thanh toán đã được xác nhận.",
      time: order.createdAt,
      active: true,
    });
  }

  if (shipment?.trackingCode || order.status === "SHIPPING" || order.status === "DELIVERED") {
    entries.push({
      key: "shipping",
      title: order.status === "DELIVERED" ? "Đã giao hàng" : "Đang vận chuyển",
      description: shipment?.trackingCode ? `Mã vận đơn: ${shipment.trackingCode}` : "Đơn hàng đang được bàn giao cho đơn vị vận chuyển.",
      time: shipment?.createdAt || order.createdAt,
      active: true,
    });
  }

  if (order.status === "DELIVERED") {
    entries.push({
      key: "delivered",
      title: "Giao hàng thành công",
      description: "Bạn đã nhận được đơn hàng.",
      time: shipment?.expectedDeliveryTime || order.createdAt,
      active: true,
    });
  }

  if (order.status === "CANCELLED") {
    entries.push({
      key: "cancelled",
      title: "Đơn hàng đã hủy",
      description: "Đơn hàng không tiếp tục xử lý.",
      time: order.createdAt,
      active: true,
    });
  }

  return entries.reverse();
};

const buildTimeline = (order: CustomerOrder, shipment: ShipmentDetail | null): TimelineEntry[] => {
  const events = [...(shipment?.events || [])]
    .filter((event) => Boolean(event.description || event.providerStatus || event.internalStatus || event.eventTime))
    .sort((a, b) => new Date(b.eventTime || 0).getTime() - new Date(a.eventTime || 0).getTime());

  if (!events.length) {
    return buildFallbackTimeline(order, shipment);
  }

  return events.map((event, index) => {
    const providerLabel = getShipmentStatusLabel(event.providerStatus);
    const internalLabel = getShipmentStatusLabel(event.internalStatus);
    const statusDescription =
      providerLabel && internalLabel && providerLabel !== internalLabel
        ? `${providerLabel} • ${internalLabel}`
        : internalLabel || providerLabel;
    const title = event.description || internalLabel || providerLabel || "Cập nhật vận chuyển";

    return {
      key: event.id || `${index}`,
      title,
      description: statusDescription && statusDescription !== title ? statusDescription : undefined,
      time: event.eventTime,
      active: index === 0,
    };
  });
};

const StepIcon = ({ stepKey, active }: { stepKey: string; active: boolean }) => {
  const common = active ? "#2EBA5A" : "#C9D3E0";
  const fill = active ? "#EAF9EF" : "#F5F7FA";

  const icons: Record<string, React.ReactNode> = {
    ordered: (
      <path d="M8 7.5H16M8 11.5H16M8 15.5H13M6.5 4.5H17.5C18.0523 4.5 18.5 4.94772 18.5 5.5V18.5L15.5 16L12.5 18.5L9.5 16L6.5 18.5V5.5C6.5 4.94772 6.94772 4.5 7.5 4.5H6.5Z" stroke={common} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    ),
    paid: (
      <>
        <rect x="4.5" y="7" width="15" height="10" rx="2.5" stroke={common} strokeWidth="1.8" />
        <path d="M4.5 10.5H19.5" stroke={common} strokeWidth="1.8" strokeLinecap="round" />
        <path d="M8 14H11.5" stroke={common} strokeWidth="1.8" strokeLinecap="round" />
      </>
    ),
    handover: (
      <>
        <path d="M4.5 8.5H13.5V14.5H4.5V8.5Z" stroke={common} strokeWidth="1.8" />
        <path d="M13.5 10H16.5L18.5 12V14.5H13.5V10Z" stroke={common} strokeWidth="1.8" />
        <circle cx="7.5" cy="16.5" r="1.5" stroke={common} strokeWidth="1.8" />
        <circle cx="15.5" cy="16.5" r="1.5" stroke={common} strokeWidth="1.8" />
      </>
    ),
    received: (
      <>
        <circle cx="12" cy="12" r="7.5" stroke={common} strokeWidth="1.8" />
        <path d="M8.5 12L10.8 14.3L15.8 9.3" stroke={common} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    done: (
      <path d="M12 5.5L13.979 9.51L18.408 10.154L15.204 13.277L15.96 17.688L12 15.606L8.04 17.688L8.796 13.277L5.592 10.154L10.021 9.51L12 5.5Z" stroke={common} strokeWidth="1.8" strokeLinejoin="round" />
    ),
  };

  return (
    <div className={`flex h-16 w-16 items-center justify-center rounded-full border-[3px] ${active ? "border-[#2EBA5A]" : "border-[#C9D3E0]"}`} style={{ backgroundColor: fill }}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">{icons[stepKey]}</svg>
    </div>
  );
};

const OrderDetailPage = () => {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [shipment, setShipment] = useState<ShipmentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPreparingPayment, setIsPreparingPayment] = useState(false);
  const [isSyncingPayment, setIsSyncingPayment] = useState(false);
  const [remainingPaymentTime, setRemainingPaymentTime] = useState<string | null>(null);
  const [sepayCheckout, setSepayCheckout] = useState<SepayCheckoutResponse | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelOtp, setCancelOtp] = useState("");
  const [isSendingCancelOtp, setIsSendingCancelOtp] = useState(false);
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
  const [cancelOtpSent, setCancelOtpSent] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<CustomerOrder["items"][number] | null>(null);
  const [reviewedProductIds, setReviewedProductIds] = useState<Set<string>>(new Set());
  const [reviewRating, setReviewRating] = useState(5);
  const [hoveredReviewRating, setHoveredReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.replace("/signin");
    }
  }, [isAuthLoading, router, user]);

  useEffect(() => {
    if (!user?.id || !params?.id) {
      return;
    }

    const loadData = async () => {
      try {
        setIsLoading(true);
        const [orderResult, shipmentResult, reviewsResult] = await Promise.allSettled([
          orderApi.getById(params.id),
          shippingApi.getByOrderId(params.id),
          reviewApi.getMineByOrder(params.id),
        ]);

        if (orderResult.status !== "fulfilled") {
          throw orderResult.reason;
        }

        const orderData = orderResult.value.result;
        if (orderData.userId && orderData.userId !== user.id) {
          router.replace("/my-account/orders");
          return;
        }

        setOrder(orderData);
        setShipment(shipmentResult.status === "fulfilled" ? shipmentResult.value.result : null);
        setReviewedProductIds(
          reviewsResult.status === "fulfilled"
            ? new Set(reviewsResult.value.result.map((review) => review.productId))
            : new Set(),
        );
      } catch {
        router.replace("/my-account/orders");
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, [params?.id, router, user?.id]);

  useEffect(() => {
    if (!order) {
      setRemainingPaymentTime(null);
      return;
    }

    const updateRemainingTime = () => {
      setRemainingPaymentTime(formatRemainingPaymentTime(order.createdAt));
    };

    updateRemainingTime();
    const interval = window.setInterval(updateRemainingTime, 1000);
    return () => window.clearInterval(interval);
  }, [order]);

  useEffect(() => {
    if (!isPaymentModalOpen && !isCancelModalOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          setIsPaymentModalOpen(false);
          setIsCancelModalOpen(false);
        }
    };

    window.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isCancelModalOpen, isPaymentModalOpen]);

  useEffect(() => {
    if (!sepayCheckout?.paymentId || sepayCheckout.paymentStatus === "PAID" || sepayCheckout.paymentStatus === "FAILED") {
      return;
    }

    const interval = window.setInterval(async () => {
      try {
        setIsSyncingPayment(true);
        const response = await checkoutApi.syncSepayPayment(sepayCheckout.paymentId);
        setSepayCheckout(response.result);

        if (response.result.paymentStatus === "PAID" && params?.id) {
          setIsPaymentModalOpen(false);
          const refreshedOrder = await orderApi.getById(params.id);
          setOrder(refreshedOrder.result);
          toast.success("SePay đã xác nhận thanh toán.");
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsSyncingPayment(false);
      }
    }, 8000);

    return () => window.clearInterval(interval);
  }, [params?.id, sepayCheckout?.paymentId, sepayCheckout?.paymentStatus]);

  const progressSteps = useMemo(() => (order ? buildProgressSteps(order, shipment) : []), [order, shipment]);
  const timeline = useMemo(() => (order ? buildTimeline(order, shipment) : []), [order, shipment]);
  const sepayQrImageUrl = useMemo(() => buildSepayQrImageUrl(sepayCheckout), [sepayCheckout]);
  const canResumePayment = order ? canRetrySepayOrder(order) : false;
  const paymentDeadline = order ? getOrderPaymentDeadline(order.createdAt) : null;
  const hasExpiredPaymentWindow = order ? isOrderPaymentExpired(order.createdAt) : false;
  const isSepayPendingOrder = order?.paymentStatus === "PENDING";
  const canCancelOrder =
    order?.status === "PENDING" &&
    order.paymentStatus !== "PAID" &&
    order.paymentStatus !== "PARTIALLY_PAID";

  const handleResumePayment = async () => {
    if (!order?.id) {
      return;
    }

    try {
      setIsPreparingPayment(true);
      const response = await checkoutApi.createSepayPayment(order.id);
      setSepayCheckout(response.result);
      setIsPaymentModalOpen(true);
      toast.success("Tạo mã thanh toán thành công.");
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Không thể tạo lại thanh toán SePay.");
      if (params?.id) {
        try {
          const refreshedOrder = await orderApi.getById(params.id);
          setOrder(refreshedOrder.result);
        } catch (refreshError) {
          console.error(refreshError);
        }
      }
    } finally {
      setIsPreparingPayment(false);
    }
  };

  const handleOpenCancelModal = () => {
    setCancelOtp("");
    setCancelOtpSent(false);
    setIsCancelModalOpen(true);
  };

  const handleSendCancelOtp = async () => {
    if (!order?.id) {
      return false;
    }

    try {
      setIsSendingCancelOtp(true);
      await orderApi.sendCancelOtp(order.id);
      setCancelOtpSent(true);
      toast.success("Mã OTP xác nhận hủy đơn đã được gửi về số điện thoại của bạn.");
      return true;
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Không thể gửi OTP hủy đơn.");
      return false;
    } finally {
      setIsSendingCancelOtp(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!order?.id) {
      return;
    }

    if (cancelOtp.length !== 6) {
      toast.error("Vui lòng nhập mã OTP 6 chữ số.");
      return;
    }

    try {
      setIsConfirmingCancel(true);
      const response = await orderApi.confirmCancel(order.id, cancelOtp);
      setOrder(response.result);
      setIsCancelModalOpen(false);
      setCancelOtp("");
      setCancelOtpSent(false);
      toast.success("Đơn hàng đã được hủy thành công.");
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Không thể hủy đơn hàng.");
    } finally {
      setIsConfirmingCancel(false);
    }
  };

  const handleOpenReview = (item: CustomerOrder["items"][number]) => {
    setReviewTarget(item);
    setReviewRating(5);
    setHoveredReviewRating(0);
    setReviewComment("");
  };

  const handleSubmitReview = async () => {
    if (!order?.id || !reviewTarget?.productId) {
      return;
    }

    try {
      setIsSubmittingReview(true);
      await reviewApi.create({
        orderId: order.id,
        productId: reviewTarget.productId,
        rating: reviewRating,
        comment: reviewComment,
      });
      toast.success("Cảm ơn bạn đã đánh giá sản phẩm.");
      setReviewedProductIds((prev) => {
        const next = new Set(prev);
        next.add(reviewTarget.productId);
        return next;
      });
      setReviewTarget(null);
      setReviewComment("");
      setReviewRating(5);
      setHoveredReviewRating(0);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Không thể gửi đánh giá.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isAuthLoading) {
    return <section className="min-h-screen bg-[#F6F7FB] px-4 pb-12 pt-24 text-center text-dark-4">Đang kiểm tra phiên đăng nhập...</section>;
  }

  if (isLoading || !order) {
    return <section className="min-h-screen bg-[#F6F7FB] px-4 pb-12 pt-24 text-center text-dark-4">Đang tải chi tiết đơn hàng...</section>;
  }

  return (
    <section className="min-h-screen bg-[#F6F7FB] pb-12 pt-20">
      <div className="sticky top-0 z-20 border-b border-gray-3 bg-white">
        <div className="relative mx-auto flex h-14 max-w-[1280px] items-center justify-center px-4">
          <button
            type="button"
            onClick={() => router.push("/my-account/orders")}
            aria-label="Quay lại"
            className="absolute left-4 flex h-10 w-10 items-center justify-center rounded-full text-dark transition hover:bg-gray-1"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold text-dark sm:text-2xl">Chi tiết đơn hàng</h1>
        </div>
      </div>

      <div className="mx-auto max-w-[1280px] px-4 py-6">
        <div className="rounded-[28px] border border-gray-3 bg-white p-6 shadow-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#2EBA5A]">Đơn hàng</p>
              <h2 className="mt-2 text-[28px] font-semibold text-dark">{order.orderCode}</h2>
              <p className="mt-2 text-base text-dark-4">{getOrderStatusLabel(order)} • {paymentLabelMap[order.paymentStatus]}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {canCancelOrder ? (
                <button
                  type="button"
                  onClick={handleOpenCancelModal}
                  className="rounded-full border border-[#E8B7B7] px-5 py-2 text-sm font-medium text-[#B44A4A] transition hover:bg-[#FFF5F5]"
                >
                  Hủy đơn hàng
                </button>
              ) : null}
              <div className="rounded-full bg-[#FFF3D7] px-5 py-2 text-sm font-medium text-[#C98700]">
                Tổng thanh toán: {formatCurrency(order.totalAmount)}
              </div>
            </div>
          </div>

          {order.status === "PENDING" && isSepayPendingOrder ? (
            <div className="mt-6 rounded-[24px] border border-[#FFE3A3] bg-[#FFF9EA] p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-lg font-semibold text-dark">
                    {canResumePayment ? "Đơn hàng đang chờ bạn thanh toán SePay" : "Phiên thanh toán của đơn hàng đã hết hạn"}
                  </p>
                  <p className="mt-2 text-sm text-dark-4">
                    {canResumePayment && remainingPaymentTime
                      ? `Bạn vẫn có thể tiếp tục thanh toán trong ${remainingPaymentTime}.`
                      : "Sau thời hạn 1 giờ, đơn hàng sẽ tự hủy và không thể thanh toán tiếp."}
                  </p>
                  {paymentDeadline ? (
                    <p className="mt-2 text-sm text-dark-4">
                      Hạn thanh toán: {paymentDeadline.toLocaleString("vi-VN")}
                    </p>
                  ) : null}
                </div>
                {canResumePayment ? (
                  <button
                    type="button"
                    onClick={() => void handleResumePayment()}
                    disabled={isPreparingPayment}
                    className="rounded-full bg-[#FFC84B] px-6 py-3 text-sm font-semibold text-dark transition hover:bg-[#F5BC2E] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isPreparingPayment ? "Đang mở thanh toán..." : "Thanh toán ngay"}
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className={`mt-10 grid grid-cols-1 gap-6 xl:gap-4 ${progressSteps.length === 4 ? "xl:grid-cols-4" : "xl:grid-cols-5"}`}>
            {progressSteps.map((step, index) => (
              <div key={step.key} className="relative flex flex-col items-center text-center xl:px-2">
                {index < progressSteps.length - 1 ? (
                  <div className={`absolute left-[50%] top-8 hidden h-[4px] w-full xl:block ${step.completed ? "bg-[#2EBA5A]" : "bg-[#DDE5EF]"}`} />
                ) : null}
                <div className="relative z-[1] bg-white px-2">
                  <StepIcon stepKey={step.key} active={step.active} />
                </div>
                <p className={`mt-5 text-xl font-medium ${step.active ? "text-dark" : "text-dark-4"}`}>{step.label}</p>
                {step.subLabel ? <p className="mt-2 text-sm text-dark-4">{step.subLabel}</p> : null}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_1fr]">
          <div className="rounded-[28px] border border-gray-3 bg-white p-6 shadow-1">
            <div className="flex items-start justify-between gap-4 border-b border-gray-3 pb-5">
              <div>
                <h3 className="text-2xl font-semibold text-dark">Địa chỉ nhận hàng</h3>
                <p className="mt-2 text-base text-dark-4">Thông tin giao hàng và liên hệ nhận đơn.</p>
              </div>
              {shipment?.trackingCode ? (
                <div className="text-right text-sm text-dark-4">
                  <p className="font-medium text-dark">{shipment.provider || "Đơn vị vận chuyển"}</p>
                  <p>{shipment.trackingCode}</p>
                </div>
              ) : null}
            </div>

            <div className="mt-5 space-y-2 text-base text-dark">
              <p className="text-xl font-medium text-dark">{order.customerName || shipment?.toName || "Khách hàng"}</p>
              {order.customerPhone ? <p>{order.customerPhone}</p> : null}
              <p>
                {[order.shippingDetail, order.shippingWardName, order.shippingDistrictName, order.shippingProvinceName]
                  .filter(Boolean)
                  .join(", ") || order.shippingAddress || shipment?.toAddress || "Chưa có địa chỉ giao hàng"}
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 rounded-[20px] bg-[#F8FAFD] p-5 md:grid-cols-2">
              <div>
                <p className="text-sm text-dark-4">Thanh toán</p>
                <p className="mt-1 text-lg font-medium text-dark">{paymentLabelMap[order.paymentStatus]}</p>
              </div>
              <div>
                <p className="text-sm text-dark-4">Dự kiến giao</p>
                <p className="mt-1 text-lg font-medium text-dark">{formatDateTime(shipment?.expectedDeliveryTime) || "Đang cập nhật"}</p>
              </div>
            </div>

          </div>

          <div className="rounded-[28px] border border-gray-3 bg-white p-6 shadow-1">
            <div className="border-b border-gray-3 pb-5">
              <h3 className="text-2xl font-semibold text-dark">Hành trình đơn hàng</h3>
              <p className="mt-2 text-base text-dark-4">Các mốc vận chuyển và cập nhật mới nhất của đơn hàng.</p>
            </div>

            <div className="mt-6 space-y-0">
              {timeline.map((entry, index) => (
                <div key={entry.key} className="relative flex gap-4 pb-8 last:pb-0">
                  <div className="relative flex w-10 shrink-0 justify-center">
                    <div className={`relative z-[1] mt-1 h-5 w-5 rounded-full border-2 ${entry.active ? "border-[#2EBA5A] bg-[#2EBA5A]" : "border-[#D3DCE7] bg-white"}`}>
                      {entry.active ? <div className="absolute inset-1 rounded-full bg-white" /> : null}
                    </div>
                    {index < timeline.length - 1 ? <div className="absolute top-7 h-full w-[2px] bg-[#DDE5EF]" /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className={`text-lg font-medium ${entry.active ? "text-[#2EBA5A]" : "text-dark"}`}>{entry.title}</p>
                      {entry.time ? <span className="text-sm text-dark-4">{formatDateTime(entry.time)}</span> : null}
                    </div>
                    {entry.description ? <p className="mt-1 text-base text-dark-4">{entry.description}</p> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-[28px] border border-gray-3 bg-white p-6 shadow-1">
          <div className="flex items-center justify-between gap-4 border-b border-gray-3 pb-5">
            <h3 className="text-2xl font-semibold text-dark">Sản phẩm trong đơn</h3>
            <div className="text-right">
              <p className="text-sm text-dark-4">Tạm tính</p>
              <p className="text-xl font-semibold text-dark">{formatCurrency(order.subtotal)}</p>
            </div>
          </div>

          <div className="divide-y divide-gray-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative h-20 w-20 overflow-hidden rounded-[20px] bg-[#F6F7FB]">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.productName} fill className="object-cover" sizes="80px" />
                    ) : null}
                  </div>
                  <div>
                    <Link href={item.productSlug ? `/shop-details/${item.productSlug}` : "#"} className="text-xl font-medium text-dark transition hover:text-[#C98700]">
                      {item.productName}
                    </Link>
                    <p className="mt-2 text-base text-dark-4">{[item.colorName, item.sizeName].filter(Boolean).join(" • ")} • x{item.quantity}</p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm text-dark-4">Đơn giá</p>
                  <p className="mt-1 text-xl font-semibold text-dark">{formatCurrency(item.unitPrice)}</p>
                  {order.status === "DELIVERED" && item.productId ? (
                    <button
                      type="button"
                      onClick={() => handleOpenReview(item)}
                      disabled={reviewedProductIds.has(item.productId)}
                      className="mt-3 rounded-full border border-[#FFC84B] px-4 py-2 text-sm font-semibold text-dark transition hover:bg-[#FFF3D7] disabled:cursor-not-allowed disabled:border-gray-3 disabled:bg-gray-1 disabled:text-dark-4"
                    >
                      {reviewedProductIds.has(item.productId) ? "Đã đánh giá" : "Đánh giá"}
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 border-t border-gray-3 pt-5 text-base text-dark sm:ml-auto sm:max-w-[360px]">
            <div className="flex items-center justify-between">
              <span className="text-dark-4">Tạm tính</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-dark-4">Phí vận chuyển</span>
              <span>{formatCurrency(order.shippingFee)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-dark-4">Giảm giá</span>
              <span>-{formatCurrency(order.discountAmount)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-gray-3 pt-3 text-xl font-semibold">
              <span>Tổng cộng</span>
              <span>{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      {isPaymentModalOpen && sepayCheckout ? (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-dark/60 px-4 py-8"
          onClick={() => setIsPaymentModalOpen(false)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-[920px] overflow-y-auto rounded-[28px] bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(false)}
              className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-gray-3 text-dark transition hover:bg-gray-1"
              aria-label="Đóng modal thanh toán"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            <div className="pr-12">
              <p className="text-2xl font-semibold text-dark">Thanh toán SePay</p>
              <p className="mt-2 text-base text-dark-4">
                Đơn {sepayCheckout.orderCode} • trạng thái {paymentLabelMap[sepayCheckout.paymentStatus as CustomerOrder["paymentStatus"]] || sepayCheckout.paymentStatus}
              </p>
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-[240px_1fr]">
              <div className="w-fit rounded-[18px] border border-gray-3 bg-[#F8FAFD] p-4">
                {sepayQrImageUrl ? (
                  <Image
                    src={sepayQrImageUrl}
                    alt="SePay QR"
                    width={208}
                    height={208}
                    className="h-[208px] w-[208px] rounded-[14px] object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-[208px] w-[208px] items-center justify-center rounded-[14px] bg-white text-center text-sm text-dark-4">
                    Chưa có ảnh QR từ SePay
                  </div>
                )}
              </div>

              <div className="space-y-4 rounded-[20px] border border-gray-3 bg-[#F8FAFD] p-5">
                <div>
                  <p className="text-sm text-dark-4">Ngân hàng</p>
                  <p className="font-medium text-dark">{sepayCheckout.bankName || "SePay"}</p>
                </div>
                <div>
                  <p className="text-sm text-dark-4">Số tài khoản</p>
                  <p className="font-medium text-dark">{sepayCheckout.bankAccountNumber || "Đang cập nhật"}</p>
                </div>
                <div>
                  <p className="text-sm text-dark-4">Chủ tài khoản</p>
                  <p className="font-medium text-dark">{sepayCheckout.accountHolderName || "Bagy Fashion"}</p>
                </div>
                <div>
                  <p className="text-sm text-dark-4">Nội dung chuyển khoản</p>
                  <p className="font-medium text-dark">{sepayCheckout.orderCode}</p>
                </div>
                <div>
                  <p className="text-sm text-dark-4">Số tiền</p>
                  <p className="text-xl font-semibold text-dark">{formatCurrency(order.totalAmount)}</p>
                </div>
                {hasExpiredPaymentWindow ? (
                  <p className="text-sm font-medium text-[#D14343]">Phiên thanh toán đã hết hạn.</p>
                ) : paymentDeadline ? (
                  <p className="text-sm text-dark-4">Hạn thanh toán: {paymentDeadline.toLocaleString("vi-VN")}</p>
                ) : null}

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!sepayCheckout.paymentId) {
                        return;
                      }
                      try {
                        setIsSyncingPayment(true);
                        const response = await checkoutApi.syncSepayPayment(sepayCheckout.paymentId);
                        setSepayCheckout(response.result);
                        if (params?.id) {
                          const refreshedOrder = await orderApi.getById(params.id);
                          setOrder(refreshedOrder.result);
                        }
                        if (response.result.paymentStatus === "PAID") {
                          setIsPaymentModalOpen(false);
                          toast.success("SePay đã xác nhận thanh toán.");
                        }
                      } catch (error: any) {
                        console.error(error);
                        toast.error(error?.message || "Không thể đồng bộ thanh toán.");
                      } finally {
                        setIsSyncingPayment(false);
                      }
                    }}
                    className="rounded-full border border-gray-3 px-4 py-2 text-sm font-medium text-dark transition hover:border-gray-4"
                  >
                    {isSyncingPayment ? "Đang kiểm tra..." : "Kiểm tra thanh toán"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPaymentModalOpen(false)}
                    className="rounded-full bg-[#FFC84B] px-5 py-2 text-sm font-semibold text-dark transition hover:bg-[#F5BC2E]"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isCancelModalOpen ? (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-dark/60 px-4 py-8"
          onClick={() => setIsCancelModalOpen(false)}
        >
          <div
            className="relative w-full max-w-[520px] rounded-[28px] bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsCancelModalOpen(false)}
              className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-gray-3 text-dark transition hover:bg-gray-1"
              aria-label="Đóng modal hủy đơn"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            <div className="pr-12">
              <p className="text-2xl font-semibold text-dark">Xác nhận hủy đơn</p>
              <p className="mt-2 text-base text-dark-4">
                Hệ thống sẽ gửi OTP đến số điện thoại {order.customerPhone || "đã lưu"} để xác nhận hủy đơn {order.orderCode}.
              </p>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-[18px] border border-gray-3 bg-[#F8FAFD] p-4">
                <p className="text-sm text-dark-4">Lưu ý</p>
                <p className="mt-1 text-sm text-dark">
                  Chỉ đơn hàng đang chờ xác nhận mới có thể hủy. Mã OTP có hiệu lực trong 5 phút.
                </p>
              </div>

              <OtpVerificationField
                id="cancel-otp"
                value={cancelOtp}
                onChange={setCancelOtp}
                onSendOtp={handleSendCancelOtp}
                sending={isSendingCancelOtp}
                sendDisabled={isConfirmingCancel}
                helperText="Mã OTP được gửi tới số điện thoại của đơn hàng và chỉ gửi lại sau 60 giây."
              />

              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(false)}
                  className="rounded-full border border-gray-3 px-5 py-2 text-sm font-medium text-dark transition hover:border-gray-4"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => void handleConfirmCancel()}
                  disabled={isConfirmingCancel}
                  className="rounded-full bg-[#E05858] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#cc4747] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isConfirmingCancel ? "Đang hủy..." : "Xác nhận hủy đơn"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {reviewTarget ? (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-dark/60 px-4 py-8"
          onClick={() => setReviewTarget(null)}
        >
          <div
            className="relative w-full max-w-[560px] rounded-[28px] bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setReviewTarget(null)}
              className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-gray-3 text-dark transition hover:bg-gray-1"
              aria-label="Đóng modal đánh giá"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            <div className="pr-12">
              <p className="text-2xl font-semibold text-dark">Đánh giá sản phẩm</p>
              <p className="mt-2 text-base text-dark-4">{reviewTarget.productName}</p>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-dark">Số sao</label>
                <div className="flex gap-2" onMouseLeave={() => setHoveredReviewRating(0)}>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setReviewRating(rating)}
                      onMouseEnter={() => setHoveredReviewRating(rating)}
                      aria-label={`Chọn ${rating} sao`}
                      className={`flex h-11 w-11 items-center justify-center text-3xl transition ${
                        rating <= (hoveredReviewRating || reviewRating)
                          ? "text-[#F5A400]"
                          : "text-dark-4 hover:text-[#FFC84B]"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-dark">Nhận xét</label>
                <textarea
                  value={reviewComment}
                  onChange={(event) => setReviewComment(event.target.value)}
                  rows={5}
                  maxLength={1000}
                  className="w-full rounded-[20px] border border-gray-3 bg-[#F8FAFD] px-4 py-3 outline-none transition focus:border-[#FFC84B]"
                  placeholder="Chia sẻ cảm nhận của bạn về chất liệu, form dáng, đóng gói..."
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setReviewTarget(null)}
                  className="rounded-full border border-gray-3 px-5 py-2 text-sm font-medium text-dark transition hover:border-gray-4"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => void handleSubmitReview()}
                  disabled={isSubmittingReview}
                  className="rounded-full bg-[#FFC84B] px-5 py-2 text-sm font-semibold text-dark transition hover:bg-[#F5BC2E] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmittingReview ? "Đang gửi..." : "Gửi đánh giá"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default OrderDetailPage;
