"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Breadcrumb from "../Common/Breadcrumb";
import CustomDropdown from "../Common/CustomDropdown";
import SectionLoader from "../Common/SectionLoader";
import { useAppSelector } from "@/redux/store";
import {
  selectSelectedCartItems,
  selectSelectedTotalPrice,
} from "@/redux/features/cart-slice";
import { addressApi, AddressRecord } from "@/libs/address-api";
import {
  checkoutApi,
  OrderResponse,
  SepayCheckoutResponse,
} from "@/libs/checkout-api";
import { couponApi, CouponValidationResult } from "@/libs/coupon-api";
import { buildSepayQrImageUrl } from "@/libs/sepay";
import {
  shippingApi,
  ShippingAddressOption,
  ShippingFeeResult,
  ShippingServiceOption,
} from "@/libs/shipping-api";
import { getStoredUser } from "@/libs/auth-storage";
import { syncRemoveCartItem } from "@/libs/cart-sync";

type StoredUser = {
  id?: string;
  email?: string;
  name?: string;
  phone?: string;
};

const GHN_FROM_DISTRICT_ID = 1542;

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const findMatchingLocation = (
  options: ShippingAddressOption[],
  rawValue: string
) => {
  const normalizedRaw = normalizeText(rawValue);
  return (
    options.find((option) => normalizeText(option.name) === normalizedRaw) ||
    options.find((option) => normalizeText(option.name).includes(normalizedRaw)) ||
    options.find((option) => normalizedRaw.includes(normalizeText(option.name))) ||
    null
  );
};

const formatCurrency = (value: number) =>
  `${Math.max(value || 0, 0).toLocaleString("vi-VN")}₫`;

const isValidVietnamesePhone = (value: string) =>
  /^(0|84)(3|5|7|8|9)\d{8}$/.test(value.replace(/\s+/g, ""));

const derivePackageDimension = (
  totalQuantity: number,
  subtotal: number
) => ({
  weight: Math.max(200, totalQuantity * 350),
  length: subtotal > 3000000 ? 32 : 28,
  width: totalQuantity > 3 ? 24 : 20,
  height: Math.max(8, Math.min(24, totalQuantity * 3)),
});

const Checkout = () => {
  const router = useRouter();
  const cartItems = useAppSelector(selectSelectedCartItems);
  const subtotal = useAppSelector(selectSelectedTotalPrice);
  const storedUser = getStoredUser<StoredUser>();

  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEstimatingFee, setIsEstimatingFee] = useState(false);
  const [isSyncingSepay, setIsSyncingSepay] = useState(false);

  const [addresses, setAddresses] = useState<AddressRecord[]>([]);
  const [provinces, setProvinces] = useState<ShippingAddressOption[]>([]);
  const [districts, setDistricts] = useState<ShippingAddressOption[]>([]);
  const [wards, setWards] = useState<ShippingAddressOption[]>([]);
  const [services, setServices] = useState<ShippingServiceOption[]>([]);
  const [serviceId, setServiceId] = useState<number | undefined>();
  const [shippingFee, setShippingFee] = useState<ShippingFeeResult | null>(null);

  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [customerName, setCustomerName] = useState(storedUser?.name || "");
  const [customerPhone, setCustomerPhone] = useState(storedUser?.phone || "");
  const [detail, setDetail] = useState("");
  const [provinceCode, setProvinceCode] = useState("");
  const [districtCode, setDistrictCode] = useState("");
  const [wardCode, setWardCode] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "SEPAY">("COD");
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidationResult | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<CouponValidationResult[]>([]);
  const [isLoadingCoupons, setIsLoadingCoupons] = useState(false);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const [createdOrder, setCreatedOrder] = useState<OrderResponse | null>(null);
  const [sepayCheckout, setSepayCheckout] = useState<SepayCheckoutResponse | null>(null);

  const totalQuantity = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );
  const packageDimension = useMemo(
    () => derivePackageDimension(totalQuantity, subtotal),
    [subtotal, totalQuantity]
  );
  const selectedProvince =
    provinces.find((item) => item.code === provinceCode) || null;
  const selectedDistrict =
    districts.find((item) => item.code === districtCode) || null;
  const selectedWard = wards.find((item) => item.code === wardCode) || null;
  const currentShippingFee = shippingFee?.total || 0;
  const discountAmount = appliedCoupon?.discountAmount || 0;
  const totalAmount = Math.max(subtotal + currentShippingFee - discountAmount, 0);
  const displayedSepayAmount =
    createdOrder?.totalAmount ??
    (subtotal + (createdOrder ? createdOrder.shippingFee : currentShippingFee));
  const sepayQrImageUrl = useMemo(() => buildSepayQrImageUrl(sepayCheckout), [sepayCheckout]);
  const isShippingInfoComplete =
    !!customerName &&
    !!customerPhone &&
    !!detail &&
    !!selectedProvince &&
    !!selectedDistrict &&
    !!selectedWard;

  useEffect(() => {
    const bootstrap = async () => {
      setIsBootstrapping(true);
      try {
        const [provinceResponse, addressResponse] = await Promise.all([
          shippingApi.getProvinces(),
          storedUser?.id ? addressApi.getMine().catch(() => null) : Promise.resolve(null),
        ]);

        setProvinces(provinceResponse.result || []);
        setAddresses(addressResponse?.result || []);
      } catch (error) {
        console.error(error);
        toast.error("Không thể tải dữ liệu thanh toán.");
      } finally {
        setIsBootstrapping(false);
      }
    };

    void bootstrap();
  }, [storedUser?.id]);

  useEffect(() => {
    if (!isBootstrapping && cartItems.length === 0) {
      toast.error("Vui lòng chọn ít nhất một sản phẩm để thanh toán.");
      router.replace("/cart");
    }
  }, [cartItems.length, isBootstrapping, router]);

  useEffect(() => {
    setAppliedCoupon(null);
  }, [paymentMethod, subtotal]);

  useEffect(() => {
    if (subtotal <= 0) {
      setAvailableCoupons([]);
      return;
    }

    const loadAvailableCoupons = async () => {
      try {
        setIsLoadingCoupons(true);
        const response = await couponApi.getAvailable(subtotal, paymentMethod);
        setAvailableCoupons(response.result || []);
      } catch (error) {
        console.error(error);
        setAvailableCoupons([]);
      } finally {
        setIsLoadingCoupons(false);
      }
    };

    void loadAvailableCoupons();
  }, [paymentMethod, subtotal]);

  useEffect(() => {
    if (!sepayCheckout?.paymentId) {
      return;
    }

    if (sepayCheckout.paymentStatus === "PAID" || sepayCheckout.paymentStatus === "FAILED") {
      return;
    }

    const interval = setInterval(async () => {
      try {
        setIsSyncingSepay(true);
        const response = await checkoutApi.syncSepayPayment(sepayCheckout.paymentId);
        setSepayCheckout(response.result);
        if (response.result.paymentStatus === "PAID") {
          toast.success("SePay đã xác nhận thanh toán.");
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsSyncingSepay(false);
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [sepayCheckout]);

  useEffect(() => {
    if (!districtCode || !wardCode || cartItems.length === 0) {
      setShippingFee(null);
      return;
    }

    const estimateFee = async () => {
      try {
        setIsEstimatingFee(true);
        const codAmount = paymentMethod === "COD" ? totalAmount : 0;
        const feeResponse = await shippingApi.estimateFee({
          fromDistrictId: GHN_FROM_DISTRICT_ID,
          toDistrictId: Number(districtCode),
          toWardCode: wardCode,
          serviceId,
          insuranceValue: subtotal,
          codAmount,
          ...packageDimension,
        });
        setShippingFee(feeResponse.result);
      } catch (error) {
        console.error(error);
        setShippingFee(null);
      } finally {
        setIsEstimatingFee(false);
      }
    };

    void estimateFee();
  }, [
    cartItems.length,
    districtCode,
    packageDimension,
    paymentMethod,
    serviceId,
    subtotal,
    totalAmount,
    wardCode,
  ]);

  const handleProvinceChange = async (value: string) => {
    setProvinceCode(value);
    setDistrictCode("");
    setWardCode("");
    setDistricts([]);
    setWards([]);
    setServices([]);
    setServiceId(undefined);
    setShippingFee(null);

    if (!value) {
      return;
    }

    try {
      const response = await shippingApi.getDistricts(Number(value));
      setDistricts(response.result || []);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải quận/huyện.");
    }
  };

  const handleDistrictChange = async (value: string) => {
    setDistrictCode(value);
    setWardCode("");
    setWards([]);
    setServices([]);
    setServiceId(undefined);
    setShippingFee(null);

    if (!value) {
      return;
    }

    try {
      const [wardResponse, serviceResponse] = await Promise.all([
        shippingApi.getWards(Number(value)),
        shippingApi.getServices(Number(value), GHN_FROM_DISTRICT_ID),
      ]);
      setWards(wardResponse.result || []);
      setServices(serviceResponse.result || []);
      setServiceId(serviceResponse.result?.[0]?.serviceId);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải phường/xã hoặc dịch vụ vận chuyển.");
    }
  };

  const handleAddressChange = async (value: string) => {
    setSelectedAddressId(value);
    const address = addresses.find((item) => item.id === value);
    if (!address) {
      return;
    }

    setCustomerName(address.receiverName || "");
    setCustomerPhone(address.receiverPhone || "");
    setDetail(address.detail || "");

    const provinceMatch = findMatchingLocation(provinces, address.province);
    if (!provinceMatch) {
      return;
    }

    setProvinceCode(provinceMatch.code);
    const districtResponse = await shippingApi.getDistricts(Number(provinceMatch.code));
    const nextDistricts = districtResponse.result || [];
    setDistricts(nextDistricts);

    const districtMatch = findMatchingLocation(nextDistricts, address.district);
    if (!districtMatch) {
      setDistrictCode("");
      setWards([]);
      return;
    }

    setDistrictCode(districtMatch.code);
    const [wardResponse, serviceResponse] = await Promise.all([
      shippingApi.getWards(Number(districtMatch.code)),
      shippingApi.getServices(Number(districtMatch.code), GHN_FROM_DISTRICT_ID),
    ]);
    const nextWards = wardResponse.result || [];
    setWards(nextWards);
    setServices(serviceResponse.result || []);
    setServiceId(serviceResponse.result?.[0]?.serviceId);

    const wardMatch = findMatchingLocation(nextWards, address.ward);
    setWardCode(wardMatch?.code || "");
  };

  const handleApplyCoupon = async (selectedCode?: string) => {
    const code = (selectedCode || couponInput).trim();
    if (!code) {
      toast.error("Vui lòng nhập mã giảm giá.");
      return;
    }
    if (subtotal <= 0) {
      toast.error("Giỏ hàng chưa có sản phẩm để áp mã.");
      return;
    }

    try {
      setIsApplyingCoupon(true);
      const response = await couponApi.validate(code, subtotal, paymentMethod);
      setAppliedCoupon(response.result);
      setCouponInput(response.result.code);
      toast.success(`Đã áp dụng ${response.result.code}.`);
    } catch (error: any) {
      console.error(error);
      setAppliedCoupon(null);
      toast.error(error?.message || "Mã giảm giá không hợp lệ.");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleSubmit = async () => {

    if (cartItems.length === 0) {
      toast.error("Giỏ hàng đang trống.");
      return;
    }

    if (!customerName || !customerPhone || !detail || !selectedProvince || !selectedDistrict || !selectedWard) {
      toast.error("Vui lòng nhập đầy đủ thông tin giao hàng.");
      return;
    }

    if (!isValidVietnamesePhone(customerPhone)) {
      toast.error("Số điện thoại người nhận không hợp lệ.");
      return;
    }

    try {
      setIsSubmitting(true);
      setCreatedOrder(null);
      setSepayCheckout(null);

      const shippingAddress = [detail, selectedWard.name, selectedDistrict.name, selectedProvince.name]
        .filter(Boolean)
        .join(", ");

      const orderResponse = await checkoutApi.createOrder({
        userId: storedUser?.id,
        customerName,
        customerPhone,
        shippingAddress,
        shippingDetail: detail,
        shippingProvinceName: selectedProvince.name,
        shippingProvinceCode: selectedProvince.code,
        shippingDistrictName: selectedDistrict.name,
        shippingDistrictCode: selectedDistrict.code,
        shippingWardName: selectedWard.name,
        shippingWardCode: selectedWard.code,
        notes,
        shippingFee: currentShippingFee,
        couponCode: appliedCoupon?.code,
        paymentMethod,
        paymentStatus: paymentMethod === "COD" ? "UNPAID" : "PENDING",
        status: "PENDING",
        items: cartItems.map((item) => ({
          productId: item.productId,
          productVariantId: item.variantId,
          productName: item.title,
          productSlug: item.productSlug,
          imageUrl: item.imageUrl || item.imgs?.previews[0],
          colorName: item.colorName,
          sizeName: item.sizeName,
          quantity: item.quantity,
          unitPrice: item.discountedPrice,
        })),
      });

      setCreatedOrder(orderResponse.result);

      if (paymentMethod === "COD") {
        await checkoutApi.createCodPayment(orderResponse.result.id);
        await Promise.all(cartItems.map((item) => syncRemoveCartItem(item.id)));
        router.push(`/my-account/orders?created=1&orderCode=${encodeURIComponent(orderResponse.result.orderCode)}`);
        return;
      }

      await checkoutApi.createSepayPayment(orderResponse.result.id);
      await Promise.all(cartItems.map((item) => syncRemoveCartItem(item.id)));
      router.push(`/my-account/orders?created=1&orderCode=${encodeURIComponent(orderResponse.result.orderCode)}`);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Không thể tạo đơn thanh toán.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isBootstrapping) {
    return (
      <>
        <Breadcrumb title="Thanh toán" pages={["Thanh toán"]} compact />
        <section className="overflow-hidden py-12 bg-gray-2">
          <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
            <SectionLoader title="Đang tải checkout" columns={2} rows={1} />
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <Breadcrumb title="Thanh toán" pages={["Thanh toán"]} compact />

      <section className="overflow-hidden py-12 bg-gray-2">
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handleSubmit();
            }}
            className="flex flex-col lg:flex-row gap-7.5 xl:gap-11"
          >
            <div className="lg:max-w-[670px] w-full space-y-7">
              <div className="bg-white shadow-1 rounded-[18px] p-5 sm:p-8">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-dark text-xl sm:text-2xl">
                      Thông tin giao hàng
                    </h2>
                    <p className="mt-1 text-sm text-dark-4">
                      {storedUser?.id
                        ? "Bạn có thể chọn địa chỉ đã lưu hoặc nhập địa chỉ mới."
                        : "Đăng nhập để chọn nhanh địa chỉ đã lưu của bạn."}
                    </p>
                  </div>
                </div>

                {addresses.length > 0 && (
                  <div className="mb-5">
                    <label className="mb-2.5 block text-sm font-medium text-dark">
                      Chọn từ sổ địa chỉ
                    </label>
                    <CustomDropdown
                      value={selectedAddressId}
                      onChange={handleAddressChange}
                      placeholder="Chọn địa chỉ đã lưu"
                      searchPlaceholder="Tìm theo tên, số điện thoại, địa chỉ..."
                      searchable
                      options={addresses.map((address) => ({
                        value: address.id,
                        label: `${address.receiverName} • ${address.detail}, ${address.ward}, ${address.district}`,
                      }))}
                    />
                  </div>
                )}

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2.5 block text-sm font-medium text-dark">
                      Họ tên người nhận
                    </label>
                    <input
                      value={customerName}
                      onChange={(event) => setCustomerName(event.target.value)}
                      className="w-full rounded-full border border-gray-3 bg-gray-1 px-5 py-3 outline-none transition focus:border-blue"
                      placeholder="Nguyễn Văn A"
                    />
                  </div>
                  <div>
                    <label className="mb-2.5 block text-sm font-medium text-dark">
                      Số điện thoại
                    </label>
                    <input
                      value={customerPhone}
                      onChange={(event) => setCustomerPhone(event.target.value)}
                      className="w-full rounded-full border border-gray-3 bg-gray-1 px-5 py-3 outline-none transition focus:border-blue"
                      placeholder="09xxxxxxxx"
                    />
                  </div>
                </div>

                <div className="mt-5 grid gap-5 sm:grid-cols-3">
                  <div>
                    <label className="mb-2.5 block text-sm font-medium text-dark">
                      Tỉnh / Thành
                    </label>
                    <CustomDropdown
                      value={provinceCode}
                      onChange={handleProvinceChange}
                      placeholder="Chọn tỉnh / thành"
                      searchPlaceholder="Gõ để tìm tỉnh / thành"
                      searchable
                      options={provinces.map((item) => ({
                        value: item.code,
                        label: item.name,
                      }))}
                    />
                  </div>
                  <div>
                    <label className="mb-2.5 block text-sm font-medium text-dark">
                      Quận / Huyện
                    </label>
                    <CustomDropdown
                      value={districtCode}
                      onChange={handleDistrictChange}
                      placeholder="Chọn quận / huyện"
                      searchPlaceholder="Gõ để tìm quận / huyện"
                      searchable
                      options={districts.map((item) => ({
                        value: item.code,
                        label: item.name,
                      }))}
                      disabled={!provinceCode}
                    />
                  </div>
                  <div>
                    <label className="mb-2.5 block text-sm font-medium text-dark">
                      Phường / Xã
                    </label>
                    <CustomDropdown
                      value={wardCode}
                      onChange={setWardCode}
                      placeholder="Chọn phường / xã"
                      searchPlaceholder="Gõ để tìm phường / xã"
                      searchable
                      options={wards.map((item) => ({
                        value: item.code,
                        label: item.name,
                      }))}
                      disabled={!districtCode}
                    />
                  </div>
                </div>

                <div className="mt-5">
                  <label className="mb-2.5 block text-sm font-medium text-dark">
                    Địa chỉ chi tiết
                  </label>
                  <input
                    value={detail}
                    onChange={(event) => setDetail(event.target.value)}
                    className="w-full rounded-full border border-gray-3 bg-gray-1 px-5 py-3 outline-none transition focus:border-blue"
                    placeholder="Số nhà, tên đường..."
                  />
                </div>

                <div className="mt-5">
                  <label className="mb-2.5 block text-sm font-medium text-dark">
                    Ghi chú
                  </label>
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    rows={4}
                    className="w-full rounded-[22px] border border-gray-3 bg-gray-1 px-5 py-3 outline-none transition focus:border-blue"
                    placeholder="Ghi chú giao hàng nếu có"
                  />
                </div>

                <div className="mt-5">
                  <label className="mb-2.5 block text-sm font-medium text-dark">
                    Phương thức thanh toán
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("COD")}
                      className={`rounded-[18px] border px-5 py-4 text-left transition ${
                        paymentMethod === "COD"
                          ? "border-yellow bg-yellow-light/40"
                          : "border-gray-3 bg-white hover:border-gray-4"
                      }`}
                    >
                      <p className="font-medium text-dark">Thanh toán khi nhận hàng</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("SEPAY")}
                      className={`rounded-[18px] border px-5 py-4 text-left transition ${
                        paymentMethod === "SEPAY"
                          ? "border-yellow bg-yellow-light/40"
                          : "border-gray-3 bg-white hover:border-gray-4"
                      }`}
                    >
                      <p className="font-medium text-dark">Thanh toán qua SePay</p>
                    </button>
                  </div>
                </div>
              </div>

              {sepayCheckout && paymentMethod === "SEPAY" && (
                <div className="bg-white shadow-1 rounded-[18px] p-5 sm:p-8">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-dark text-xl">Thanh toán</h3>
                      <p className="mt-1 text-sm text-dark-4">
                        Đơn {sepayCheckout.orderCode} • trạng thái {sepayCheckout.paymentStatus}
                      </p>
                    </div>

                    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            setIsSyncingSepay(true);
                            const response = await checkoutApi.syncSepayPayment(sepayCheckout.paymentId);
                            setSepayCheckout(response.result);
                            if (response.result.paymentStatus === "PAID") {
                              toast.success("SePay đã xác nhận thanh toán.");
                            }
                          } catch (error) {
                            console.error(error);
                            toast.error("Không thể đồng bộ trạng thái SePay.");
                          } finally {
                            setIsSyncingSepay(false);
                          }
                        }}
                        className="min-w-[170px] rounded-full border border-gray-3 px-4 py-2 text-sm font-medium text-dark hover:border-gray-4"
                      >
                        {isSyncingSepay ? "Đang kiểm tra..." : "Kiểm tra thanh toán"}
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 grid items-start gap-5 lg:grid-cols-[196px_minmax(0,1fr)]">
                    <div className="w-fit self-start rounded-[16px] border border-gray-3 bg-gray-1 p-3">
                      {sepayQrImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={sepayQrImageUrl}
                          alt="SePay QR"
                          className="h-[170px] w-[170px] rounded-xl object-cover"
                        />
                      ) : (
                        <div className="flex h-[170px] w-[170px] items-center justify-center rounded-xl bg-white text-center text-sm text-dark-4">
                          Chưa có ảnh QR từ SePay
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 rounded-[16px] border border-gray-3 bg-gray-1 p-5">
                      <p className="text-sm text-dark-4">Ngân hàng</p>
                      <p className="font-medium text-dark">{sepayCheckout.bankName || "SePay"}</p>

                      <p className="text-sm text-dark-4">Số tài khoản</p>
                      <p className="font-medium text-dark">{sepayCheckout.bankAccountNumber || "Đang cập nhật"}</p>

                      <p className="text-sm text-dark-4">Chủ tài khoản</p>
                      <p className="font-medium text-dark">{sepayCheckout.accountHolderName || "Bagy Fashion"}</p>

                      <p className="text-sm text-dark-4">Nội dung chuyển khoản</p>
                        <p className="font-medium text-dark">{sepayCheckout.orderCode}</p>

                        <p className="text-sm text-dark-4">Số tiền</p>
                        <p className="text-xl font-semibold text-dark">{formatCurrency(displayedSepayAmount)}</p>
                      </div>
                    </div>
                  </div>
              )}
            </div>

            <div className="max-w-[455px] w-full lg:self-start">
              <div className="bg-white shadow-1 rounded-[18px] sticky top-24">
                <div className="border-b border-gray-3 py-5 px-5 sm:px-8">
                  <h3 className="font-semibold text-xl text-dark">Đơn hàng của bạn</h3>
                </div>

                <div className="px-5 sm:px-8 py-5">
                  {cartItems.length === 0 ? (
                    <p className="rounded-[18px] border border-dashed border-gray-3 px-4 py-8 text-center text-dark-4">
                      Giỏ hàng đang trống.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex items-start gap-3 border-b border-gray-3 pb-4">
                          <div className="h-16 w-16 overflow-hidden rounded-2xl bg-gray-1">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.imageUrl || item.imgs?.previews?.[0] || "/images/arrivals/arrivals-01.png"}
                              alt={item.title}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 font-medium text-dark">{item.title}</p>
                            <p className="mt-1 text-sm text-dark-4">
                              {item.colorName || "Mặc định"}
                              {item.sizeName ? ` • ${item.sizeName}` : ""}
                              {` • x${item.quantity}`}
                            </p>
                          </div>
                          <p className="font-medium text-dark">
                            {formatCurrency(item.discountedPrice * item.quantity)}
                          </p>
                        </div>
                      ))}

                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between text-dark-4">
                          <span>Tạm tính</span>
                          <span>{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex items-center justify-between text-dark-4">
                          <span>Phí vận chuyển</span>
                          <span>{isEstimatingFee ? "..." : formatCurrency(currentShippingFee)}</span>
                        </div>
                        <div className="rounded-[18px] border border-gray-3 bg-gray-1 p-3">
                          <label className="mb-2 block text-sm font-medium text-dark">
                            Mã giảm giá
                          </label>
                          <div className="flex gap-2">
                            <input
                              value={couponInput}
                              onChange={(event) => setCouponInput(event.target.value.toUpperCase())}
                              placeholder="NHAPMA"
                              className="min-w-0 flex-1 rounded-full border border-gray-3 bg-white px-4 py-2 text-sm outline-none transition focus:border-blue"
                            />
                            <button
                              type="button"
                              onClick={() => void handleApplyCoupon()}
                              disabled={isApplyingCoupon}
                              className="rounded-full bg-[#FFC84B] px-4 py-2 text-sm font-semibold text-dark transition hover:bg-[#F5BC2E] disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              {isApplyingCoupon ? "..." : "Áp dụng"}
                            </button>
                          </div>
                          <div className="mt-3">
                            <div className="mb-2 flex items-center justify-between gap-3">
                              <span className="text-xs font-medium uppercase tracking-wide text-dark-4">
                                Mã có thể dùng
                              </span>
                              {isLoadingCoupons ? (
                                <span className="text-xs text-dark-4">Đang tải...</span>
                              ) : null}
                            </div>
                            {availableCoupons.length > 0 ? (
                              <div className="space-y-2">
                                {availableCoupons.map((coupon) => {
                                  const isSelected = appliedCoupon?.code === coupon.code;
                                  return (
                                    <button
                                      key={coupon.couponId}
                                      type="button"
                                      onClick={() => void handleApplyCoupon(coupon.code)}
                                      disabled={isApplyingCoupon}
                                      className={`flex w-full items-center justify-between gap-3 rounded-2xl border bg-white px-3 py-2 text-left transition ${
                                        isSelected
                                          ? "border-[#FFC84B] bg-[#FFF7DF]"
                                          : "border-gray-3 hover:border-[#FFC84B]"
                                      } disabled:cursor-not-allowed disabled:opacity-70`}
                                    >
                                      <span className="min-w-0">
                                        <span className="block text-sm font-semibold text-dark">{coupon.code}</span>
                                        <span className="block truncate text-xs text-dark-4">{coupon.name}</span>
                                      </span>
                                      <span className="shrink-0 text-sm font-semibold text-[#2EBA5A]">
                                        -{formatCurrency(coupon.discountAmount)}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            ) : !isLoadingCoupons ? (
                              <p className="rounded-2xl border border-dashed border-gray-3 bg-white px-3 py-2 text-xs text-dark-4">
                                Chưa có mã phù hợp với giỏ hàng hiện tại.
                              </p>
                            ) : null}
                          </div>
                          {appliedCoupon ? (
                            <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                              <span className="text-[#2EBA5A]">{appliedCoupon.name}</span>
                              <button
                                type="button"
                                onClick={() => setAppliedCoupon(null)}
                                className="font-medium text-dark-4 hover:text-dark"
                              >
                                Bỏ mã
                              </button>
                            </div>
                          ) : null}
                        </div>
                        {discountAmount > 0 ? (
                          <div className="flex items-center justify-between text-[#2EBA5A]">
                            <span>Giảm giá</span>
                            <span>-{formatCurrency(discountAmount)}</span>
                          </div>
                        ) : null}
                        <div className="flex items-center justify-between border-t border-gray-3 pt-3 text-lg font-semibold text-dark">
                          <span>Tổng cộng</span>
                          <span>{formatCurrency(totalAmount)}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          void handleSubmit();
                        }}
                        disabled={isSubmitting || cartItems.length === 0 || !isShippingInfoComplete}
                        className="mt-2 flex w-full justify-center rounded-full bg-blue px-6 py-3 font-medium text-dark transition hover:bg-blue-dark disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSubmitting
                          ? "Đang xử lý..."
                          : paymentMethod === "COD"
                          ? "Đặt hàng COD"
                          : "Tạo thanh toán SePay"}
                      </button>

                      {!isShippingInfoComplete && (
                        <p className="text-sm text-dark-4">
                          Vui lòng nhập đầy đủ thông tin giao hàng để tiếp tục.
                        </p>
                      )}

                      {createdOrder && (
                        <div className="rounded-[18px] border border-gray-3 bg-gray-1 px-4 py-3 text-sm text-dark-4">
                          Đơn hiện tại: <span className="font-medium text-dark">{createdOrder.orderCode}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>
      </section>
    </>
  );
};

export default Checkout;
