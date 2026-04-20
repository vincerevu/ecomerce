import { useEffect, useMemo, useState } from "react";
import { addressApi, type AddressRecord } from "../../api/addressApi";
import { customerApi, type CustomerRecord } from "../../api/customerApi";
import {
  orderApi,
  type OrderRecord,
  type PaymentStatus,
} from "../../api/orderApi";
import { productApi } from "../../api/productApi";
import {
  shipmentApi,
  type ShippingAddressOption,
  type ShippingFeeResult,
  type ShippingServiceOption,
} from "../../api/shipmentApi";
import { showError, showSuccess } from "../../utils/toast";
import Button from "../ui/button/Button";
import { Modal } from "../ui/modal";
import Select, { type Option } from "../form/Select";
import Input from "../form/input/InputField";
import NumberInput from "../form/input/NumberInput";
import Switch from "../form/switch/Switch";
import Badge from "../ui/badge/Badge";
import Loader from "../common/Loader";
import {
  buildCreateOrderPayload,
  buildCreateShipmentPayload,
  buildShippingAddressText,
  derivePackageDimension,
  findMatchingLocation,
  flattenProductVariants,
  formatAddressLabel,
  type DraftOrderItem,
  type ProductRecordForOrder,
} from "./orderCreate.utils";

interface OrderCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (order: OrderRecord) => void;
}

const PAYMENT_METHOD_OPTIONS: Option[] = [
  { value: "COD", label: "COD / thu tiền khi giao" },
  { value: "PREPAID", label: "Thanh toán trước" },
];

const emptyDraftItem = (): DraftOrderItem => ({
  id: crypto.randomUUID(),
  variantId: "",
  quantity: 1,
});

const GHN_FROM_DISTRICT_ID = 1542;

const isValidVietnamesePhone = (value: string) =>
  /^(0|84)(3|5|7|8|9)\d{8}$/.test(value.replace(/\s+/g, ""));

const REQUIRED_NOTE_OPTIONS = [
  {
    value: "KHONGCHOXEMHANG",
    label: "Không cho xem hàng",
    hint: "Người nhận không được mở kiện trước khi nhận.",
  },
  {
    value: "CHOXEMHANGKHONGTHU",
    label: "Cho xem hàng không cho thử",
    hint: "Người nhận được xem hàng nhưng không thử sản phẩm.",
  },
  {
    value: "CHOTHUHANG",
    label: "Cho thử hàng",
    hint: "Người nhận được xem và thử hàng theo chính sách GHN.",
  },
] as const;

export default function OrderCreateModal({
  isOpen,
  onClose,
  onCreated,
}: OrderCreateModalProps) {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [products, setProducts] = useState<ProductRecordForOrder[]>([]);
  const [addresses, setAddresses] = useState<AddressRecord[]>([]);
  const [provinces, setProvinces] = useState<ShippingAddressOption[]>([]);
  const [districts, setDistricts] = useState<ShippingAddressOption[]>([]);
  const [wards, setWards] = useState<ShippingAddressOption[]>([]);
  const [services, setServices] = useState<ShippingServiceOption[]>([]);
  const [feeResult, setFeeResult] = useState<ShippingFeeResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingAddresses, setIsFetchingAddresses] = useState(false);
  const [isEstimatingFee, setIsEstimatingFee] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [customerId, setCustomerId] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [shippingDetail, setShippingDetail] = useState("");
  const [provinceCode, setProvinceCode] = useState("");
  const [districtCode, setDistrictCode] = useState("");
  const [wardCode, setWardCode] = useState("");
  const [requiredNote, setRequiredNote] =
    useState<(typeof REQUIRED_NOTE_OPTIONS)[number]["value"]>("CHOTHUHANG");
  const [shippingNote, setShippingNote] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "PREPAID">("COD");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("UNPAID");
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [shouldCreateShipment, setShouldCreateShipment] = useState(true);
  const [serviceId, setServiceId] = useState<number | undefined>();
  const [packageWeight, setPackageWeight] = useState<number>(350);
  const [packageLength, setPackageLength] = useState<number>(28);
  const [packageWidth, setPackageWidth] = useState<number>(20);
  const [packageHeight, setPackageHeight] = useState<number>(8);
  const [packageTouched, setPackageTouched] = useState(false);
  const [items, setItems] = useState<DraftOrderItem[]>([emptyDraftItem()]);

  const variantOptions = useMemo(
    () => flattenProductVariants(products),
    [products],
  );

  const customerOptions = useMemo<Option[]>(
    () =>
      customers.map((customer) => ({
        value: customer.id,
        label: `${customer.name} • ${customer.phone}`,
      })),
    [customers],
  );

  const addressOptions = useMemo<Option[]>(
    () =>
      addresses.map((address) => ({
        value: address.id,
        label: formatAddressLabel(address),
      })),
    [addresses],
  );

  const provinceOptions = useMemo<Option[]>(
    () => provinces.map((item) => ({ value: item.code, label: item.name })),
    [provinces],
  );

  const districtOptions = useMemo<Option[]>(
    () => districts.map((item) => ({ value: item.code, label: item.name })),
    [districts],
  );

  const wardOptions = useMemo<Option[]>(
    () => wards.map((item) => ({ value: item.code, label: item.name })),
    [wards],
  );

  const serviceOptions = useMemo<Option[]>(
    () =>
      services.map((service) => ({
        value: String(service.serviceId ?? ""),
        label: service.shortName || `Dịch vụ ${service.serviceId}`,
      })),
    [services],
  );

  const itemOptions = useMemo<Option[]>(
    () =>
      variantOptions.map((variant) => ({
        value: variant.variantId,
        label: `${variant.productName} • ${variant.colorName} / ${variant.sizeName} • ${variant.salePrice.toLocaleString("vi-VN")} đ • tồn ${variant.stockQuantity}`,
      })),
    [variantOptions],
  );

  const selectedProvince = provinces.find((item) => item.code === provinceCode) ?? null;
  const selectedDistrict = districts.find((item) => item.code === districtCode) ?? null;
  const selectedWard = wards.find((item) => item.code === wardCode) ?? null;
  const selectedCustomer = customers.find((customer) => customer.id === customerId) ?? null;

  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => {
        const variant = variantOptions.find((candidate) => candidate.variantId === item.variantId);
        return sum + (variant?.salePrice ?? 0) * item.quantity;
      }, 0),
    [items, variantOptions],
  );

  const shippingFee = feeResult?.total ?? 0;
  const totalAmount = subtotal + shippingFee - (discountAmount || 0);
  const codAmount = paymentMethod === "PREPAID" ? 0 : Math.max(totalAmount, 0);

  useEffect(() => {
    if (!isOpen) return;

    const loadBootstrapData = async () => {
      setIsLoading(true);
      const [customersResult, productsResult, provincesResult] =
        await Promise.allSettled([
          customerApi.getCustomers({ page: 0, size: 200, sort: "createdAt,desc" }),
          productApi.getAll<ProductRecordForOrder>({ page: 0, size: 200, sort: "createdAt,desc" }),
          shipmentApi.getProvinces(),
        ]);
      try {
      } finally {
        setIsLoading(false);
      }

      if (customersResult.status === "fulfilled") {
        setCustomers(customersResult.value.result.data || []);
      } else {
        console.error("Failed to load customers", customersResult.reason);
        showError("Không thể tải danh sách khách hàng.");
      }

      if (productsResult.status === "fulfilled") {
        setProducts(productsResult.value.result.data || []);
      } else {
        console.error("Failed to load products", productsResult.reason);
        showError("Không thể tải danh sách sản phẩm.");
      }

      if (provincesResult.status === "fulfilled") {
        setProvinces(provincesResult.value.result || []);
      } else {
        console.error("Failed to load provinces", provincesResult.reason);
        showError("Không thể tải danh mục tỉnh/thành GHN.");
      }
    };

    void loadBootstrapData();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || packageTouched) return;
    const derived = derivePackageDimension(items, variantOptions);
    setPackageWeight(derived.weight);
    setPackageLength(derived.length);
    setPackageWidth(derived.width);
    setPackageHeight(derived.height);
  }, [isOpen, items, packageTouched, variantOptions]);

  useEffect(() => {
    if (!customerId) {
      setAddresses([]);
      setSelectedAddressId("");
      return;
    }

    const loadAddresses = async () => {
      setIsFetchingAddresses(true);
      try {
        const response = await addressApi.getByUserId(customerId);
        setAddresses(response.result || []);
      } catch (error) {
        console.error("Failed to load customer addresses", error);
        setAddresses([]);
        showError("Không thể tải sổ địa chỉ của khách hàng.");
      } finally {
        setIsFetchingAddresses(false);
      }
    };

    void loadAddresses();
  }, [customerId]);

  const resetForm = () => {
    setCustomerId("");
    setSelectedAddressId("");
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setShippingDetail("");
    setProvinceCode("");
    setDistrictCode("");
    setWardCode("");
    setRequiredNote("CHOTHUHANG");
    setDistricts([]);
    setWards([]);
    setServices([]);
    setServiceId(undefined);
    setShippingNote("");
    setOrderNotes("");
    setPaymentMethod("COD");
    setPaymentStatus("UNPAID");
    setDiscountAmount(0);
    setShouldCreateShipment(true);
    setFeeResult(null);
    setPackageTouched(false);
    setPackageWeight(350);
    setPackageLength(28);
    setPackageWidth(20);
    setPackageHeight(8);
    setItems([emptyDraftItem()]);
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const handleCustomerChange = (value: string) => {
    setCustomerId(value);
    setSelectedAddressId("");
    const customer = customers.find((item) => item.id === value) ?? null;
    setCustomerName(customer?.name || "");
    setCustomerPhone(customer?.phone || "");
    setCustomerEmail(customer?.email || "");
    setFeeResult(null);
  };

  const handlePaymentMethodChange = (value: string) => {
    const nextMethod = value === "PREPAID" ? "PREPAID" : "COD";
    setPaymentMethod(nextMethod);
    setPaymentStatus(nextMethod === "PREPAID" ? "PAID" : "UNPAID");
    setFeeResult(null);
  };

  const loadDistricts = async (provinceId: number) => {
    const response = await shipmentApi.getDistricts(provinceId);
    return response.result || [];
  };

  const loadWards = async (districtId: number) => {
    const response = await shipmentApi.getWards(districtId);
    return response.result || [];
  };

  const loadServices = async (districtId: number) => {
    const response = await shipmentApi.getAvailableServices(
      districtId,
      GHN_FROM_DISTRICT_ID,
    );
    const nextServices = response.result || [];
    setServices(nextServices);
    setServiceId(nextServices[0]?.serviceId);
  };

  const handleAddressChange = async (value: string) => {
    setSelectedAddressId(value);
    setFeeResult(null);
    const address = addresses.find((item) => item.id === value);
    if (!address) return;

    setCustomerName(address.receiverName || selectedCustomer?.name || "");
    setCustomerPhone(address.receiverPhone || selectedCustomer?.phone || "");
    setCustomerEmail(selectedCustomer?.email || "");
    setShippingDetail(address.detail || "");

    const provinceMatch = findMatchingLocation(provinces, address.province);
    if (!provinceMatch) return;

    setProvinceCode(provinceMatch.code);
    const nextDistricts = await loadDistricts(Number(provinceMatch.code));
    setDistricts(nextDistricts);

    const districtMatch = findMatchingLocation(nextDistricts, address.district);
    if (!districtMatch) {
      setDistrictCode("");
      setWards([]);
      setWardCode("");
      return;
    }

    setDistrictCode(districtMatch.code);
    const districtId = Number(districtMatch.code);
    const [nextWards] = await Promise.all([
      loadWards(districtId).then((results) => {
        setWards(results);
        return results;
      }),
      loadServices(districtId),
    ]);

    const wardMatch = findMatchingLocation(nextWards, address.ward);
    setWardCode(wardMatch?.code || "");
  };

  const handleProvinceChange = async (value: string) => {
    setProvinceCode(value);
    setDistrictCode("");
    setWardCode("");
    setWards([]);
    setServices([]);
    setServiceId(undefined);
    setFeeResult(null);
    if (!value) {
      setDistricts([]);
      return;
    }

    try {
      const nextDistricts = await loadDistricts(Number(value));
      setDistricts(nextDistricts);
    } catch (error) {
      console.error("Failed to load districts", error);
      showError("Không thể tải quận/huyện GHN.");
    }
  };

  const handleDistrictChange = async (value: string) => {
    setDistrictCode(value);
    setWardCode("");
    setFeeResult(null);
    if (!value) {
      setWards([]);
      setServices([]);
      setServiceId(undefined);
      return;
    }

    try {
      const districtId = Number(value);
      await Promise.all([
        loadWards(districtId).then((results) => {
          setWards(results);
          return results;
        }),
        loadServices(districtId),
      ]);
    } catch (error) {
      console.error("Failed to load district shipping data", error);
      showError("Không thể tải phường/xã hoặc dịch vụ giao hàng.");
    }
  };

  const handleItemChange = (
    id: string,
    field: "variantId" | "quantity",
    value: string | number,
  ) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: field === "quantity" ? Number(value) || 1 : value,
            }
          : item,
      ),
    );
    setFeeResult(null);
  };

  const canEstimateFee = Boolean(
    shouldCreateShipment &&
      districtCode &&
      wardCode &&
      serviceId &&
      customerName &&
      customerPhone &&
      shippingDetail &&
      items.every((item) => item.variantId && item.quantity > 0),
  );

  const handleEstimateFee = async () => {
    if (!districtCode || !wardCode || !serviceId) {
      showError("Hãy chọn đầy đủ quận/huyện, phường/xã và dịch vụ giao hàng.");
      return;
    }

    try {
      setIsEstimatingFee(true);
      const response = await shipmentApi.estimateFee({
        fromDistrictId: GHN_FROM_DISTRICT_ID,
        toDistrictId: Number(districtCode),
        toWardCode: wardCode,
        serviceId,
        codAmount,
        insuranceValue: Math.max(subtotal, 0),
        weight: packageWeight,
        length: packageLength,
        width: packageWidth,
        height: packageHeight,
      });
      setFeeResult(response.result);
      showSuccess("Đã tính phí vận chuyển thành công.");
    } catch (error) {
      console.error("Failed to estimate shipping fee", error);
      showError("Không thể tính phí vận chuyển GHN.");
    } finally {
      setIsEstimatingFee(false);
    }
  };

  const handleSubmit = async () => {
    if (!customerName || !customerPhone) {
      showError("Hãy nhập đầy đủ người nhận và số điện thoại.");
      return;
    }

    if (!isValidVietnamesePhone(customerPhone)) {
      showError("Số điện thoại khách hàng không hợp lệ.");
      return;
    }

    const validItems = items.filter((item) => item.variantId && item.quantity > 0);
    if (!validItems.length) {
      showError("Hãy chọn ít nhất một biến thể sản phẩm.");
      return;
    }

    if (shouldCreateShipment) {
      if (!selectedProvince || !selectedDistrict || !selectedWard || !shippingDetail) {
        showError("Hãy hoàn thiện địa chỉ GHN trước khi tạo vận đơn.");
        return;
      }
      if (!serviceId) {
        showError("Hãy chọn dịch vụ GHN.");
        return;
      }
      if (!feeResult) {
        showError("Hãy tính phí vận chuyển trước khi tạo đơn.");
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const shippingAddress = buildShippingAddressText({
        detail: shippingDetail,
        wardName: selectedWard?.name || "",
        districtName: selectedDistrict?.name || "",
        provinceName: selectedProvince?.name || "",
      });

      const orderResponse = await orderApi.create(
        buildCreateOrderPayload({
          userId: customerId || undefined,
          customerName,
          customerPhone,
          customerEmail,
          shippingAddress,
          shippingDetail,
          shippingProvinceName: selectedProvince?.name,
          shippingProvinceCode: selectedProvince?.code,
          shippingDistrictName: selectedDistrict?.name,
          shippingDistrictCode: selectedDistrict?.code,
          shippingWardName: selectedWard?.name,
          shippingWardCode: selectedWard?.code,
          notes: orderNotes,
          shippingFee: shouldCreateShipment ? shippingFee : 0,
          discountAmount,
          paymentStatus,
          status: "PENDING",
          items: validItems,
          variants: variantOptions,
        }),
      );

      const createdOrder = orderResponse.result;
      let finalOrder = createdOrder;

      if (shouldCreateShipment && selectedProvince && selectedDistrict && selectedWard) {
        await shipmentApi.create(
          buildCreateShipmentPayload({
            orderId: createdOrder.id,
            fromDistrictId: GHN_FROM_DISTRICT_ID,
            serviceId,
            serviceTypeId: Number(
              services.find((service) => service.serviceId === serviceId)?.serviceTypeId || 0,
            ) || undefined,
            requiredNote,
            codAmount,
            insuranceValue: Math.max(subtotal, 0),
            packageDimension: {
              weight: packageWeight,
              length: packageLength,
              width: packageWidth,
              height: packageHeight,
            },
            toName: customerName,
            toPhone: customerPhone,
            toAddress: shippingDetail,
            toProvinceName: selectedProvince.name,
            toDistrictName: selectedDistrict.name,
            toWardName: selectedWard.name,
            toDistrictId: Number(districtCode),
            toWardCode: wardCode,
            note: shippingNote || orderNotes,
          }),
        );
        const refreshedOrder = await orderApi.getById(createdOrder.id);
        finalOrder = refreshedOrder.result;
      }

      showSuccess(
        shouldCreateShipment
          ? "Đã tạo đơn hàng và vận đơn GHN."
          : "Đã tạo đơn hàng thành công.",
      );
      onCreated(finalOrder);
      onClose();
    } catch (error) {
      console.error("Failed to create order flow", error);
      showError("Không thể hoàn tất luồng tạo đơn hàng.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="w-[min(1180px,calc(100vw-24px))] overflow-hidden"
    >
      <div className="flex max-h-[calc(100vh-24px)] flex-col">
      <div className="shrink-0 border-b border-gray-100 px-4 py-4 sm:px-6 sm:py-5 dark:border-white/[0.05]">
        <div className="pr-12">
          <h3 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
            Tạo đơn hàng mới
          </h3>
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-[420px] flex-1 items-center justify-center px-4">
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <Loader size="md" />
            <span className="text-sm">Đang tải dữ liệu tạo đơn hàng...</span>
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
          <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
            <div className="space-y-6">
              <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-[#111b2d]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">
                      Khách hàng
                    </p>
                    <h4 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                      Hồ sơ nhận hàng
                    </h4>
                  </div>
                  {selectedCustomer?.membershipTier?.tierName ? (
                    <Badge size="sm" color="primary" variant="light">
                      {selectedCustomer.membershipTier.tierName}
                    </Badge>
                  ) : null}
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-400">
                      Chọn khách hàng
                    </label>
                    <Select
                      value={customerId}
                      onChange={handleCustomerChange}
                      options={customerOptions}
                        placeholder="Chọn khách hàng từ hệ thống"
                      searchable
                        searchPlaceholder="Gõ tên hoặc số điện thoại khách hàng"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400">
                        Sổ địa chỉ đã lưu
                      </label>
                      {isFetchingAddresses ? (
                        <span className="text-xs text-gray-400">Đang tải địa chỉ...</span>
                      ) : null}
                    </div>
                    <Select
                      value={selectedAddressId}
                      onChange={(value) => {
                        void handleAddressChange(value);
                      }}
                      options={addressOptions}
                       placeholder="Chọn địa chỉ của khách để điền nhanh"
                      searchable
                       searchPlaceholder="Gõ tên người nhận hoặc địa chỉ"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-400">
                      Người nhận
                    </label>
                    <Input value={customerName} onChange={(event) => setCustomerName(event.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-400">
                      Số điện thoại
                    </label>
                    <Input value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-400">
                      Email
                    </label>
                    <Input
                      type="email"
                      value={customerEmail}
                      onChange={(event) => setCustomerEmail(event.target.value)}
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-[#111b2d]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">
                      Sản phẩm
                    </p>
                    <h4 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                      Giỏ hàng quản trị
                    </h4>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setItems((prev) => [...prev, emptyDraftItem()])}
                  >
                    Thêm dòng
                  </Button>
                </div>

                <div className="mt-4 space-y-3">
                  {items.map((item, index) => {
                    const variant = variantOptions.find((candidate) => candidate.variantId === item.variantId);
                    return (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-gray-200 p-4 dark:border-white/[0.06]"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-gray-800 dark:text-white">
                            Dòng sản phẩm {index + 1}
                          </p>
                          {items.length > 1 ? (
                            <button
                              type="button"
                              onClick={() =>
                                setItems((prev) => prev.filter((candidate) => candidate.id !== item.id))
                              }
                              className="text-xs font-semibold text-red-500 transition-colors hover:text-red-600"
                            >
                              Xóa dòng
                            </button>
                          ) : null}
                        </div>

                        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_120px]">
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-400">
                              Biến thể sản phẩm
                            </label>
                            <Select
                              value={item.variantId}
                              onChange={(value) => handleItemChange(item.id, "variantId", value)}
                              options={itemOptions}
                               placeholder="Chọn màu/size cần bán"
                              searchable
                               searchPlaceholder="Gõ tên sản phẩm, màu, size"
                            />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-400">
                              Số lượng
                            </label>
                            <NumberInput
                              value={item.quantity}
                              min={1}
                              onChange={(value) => handleItemChange(item.id, "quantity", Number(value))}
                            />
                          </div>
                        </div>

                        {variant ? (
                          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <Badge size="sm" color="info" variant="light">
                              {variant.colorName} / {variant.sizeName}
                            </Badge>
                            <span>Giá bán: {variant.salePrice.toLocaleString("vi-VN")} đ</span>
                            <span>•</span>
                            <span>Tồn kho: {variant.stockQuantity}</span>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
            <div className="space-y-6">
              <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-[#111b2d]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">
                      Vận chuyển GHN
                    </p>
                    <h4 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                      Địa chỉ và phí giao hàng
                    </h4>
                  </div>
                  <Switch
                    label="Tạo vận đơn"
                    checked={shouldCreateShipment}
                    onChange={setShouldCreateShipment}
                  />
                </div>

                <div className="mt-4 space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-400">
                      Địa chỉ chi tiết
                    </label>
                    <Input
                      value={shippingDetail}
                      onChange={(event) => {
                        setShippingDetail(event.target.value);
                        setFeeResult(null);
                      }}
                       placeholder="Ví dụ: 7 Khương Hạ"
                    />
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-400">
                        Tỉnh / thành
                      </label>
                      <Select
                        value={provinceCode}
                        onChange={(value) => void handleProvinceChange(value)}
                        options={provinceOptions}
                        placeholder="Chọn tỉnh"
                        searchable
                        searchPlaceholder="Gõ tên tỉnh hoặc thành phố"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-400">
                        Quận / huyện
                      </label>
                      <Select
                        value={districtCode}
                        onChange={(value) => void handleDistrictChange(value)}
                        options={districtOptions}
                        placeholder="Chọn quận"
                        searchable
                        searchPlaceholder="Gõ tên quận hoặc huyện"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-400">
                        Phường / xã
                      </label>
                      <Select
                        value={wardCode}
                        onChange={(value) => {
                          setWardCode(value);
                          setFeeResult(null);
                        }}
                        options={wardOptions}
                        placeholder="Chọn phường"
                        searchable
                        searchPlaceholder="Gõ tên phường hoặc xã"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-400">
                        Dịch vụ GHN
                      </label>
                      <Select
                        value={serviceId ? String(serviceId) : ""}
                        onChange={(value) => {
                          setServiceId(Number(value));
                          setFeeResult(null);
                        }}
                        options={serviceOptions}
                        placeholder="Chọn dịch vụ"
                        searchable
                        searchPlaceholder="Gõ tên dịch vụ GHN"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-400">
                        Ghi chú giao hàng
                      </label>
                      <Input
                        value={shippingNote}
                        onChange={(event) => setShippingNote(event.target.value)}
                         placeholder="Ví dụ: Gọi trước khi giao"
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 dark:border-white/[0.08] dark:bg-white/[0.02]">
                    <div className="mb-3">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        Lưu ý giao hàng
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Chọn quy tắc xem hoặc thử hàng đúng với yêu cầu giao nhận.
                      </p>
                    </div>
                    <div className="space-y-3">
                      {REQUIRED_NOTE_OPTIONS.map((option) => (
                        <label
                          key={option.value}
                          className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-white px-3 py-3 transition-colors hover:border-brand-200 dark:border-white/[0.08] dark:bg-[#162033] dark:hover:border-brand-400/40"
                        >
                          <input
                            type="radio"
                            name="required-note"
                            value={option.value}
                            checked={requiredNote === option.value}
                            onChange={() => setRequiredNote(option.value)}
                            className="mt-0.5 h-4 w-4 border-gray-300 text-brand-500 focus:ring-brand-500"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {option.label}
                            </p>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              {option.hint}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-400">
                        Nặng (g)
                      </label>
                      <NumberInput
                        value={packageWeight}
                        min={1}
                        onChange={(value) => {
                          setPackageTouched(true);
                          setPackageWeight(Number(value));
                          setFeeResult(null);
                        }}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-400">
                        Dài
                      </label>
                      <NumberInput
                        value={packageLength}
                        min={1}
                        onChange={(value) => {
                          setPackageTouched(true);
                          setPackageLength(Number(value));
                          setFeeResult(null);
                        }}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-400">
                        Rộng
                      </label>
                      <NumberInput
                        value={packageWidth}
                        min={1}
                        onChange={(value) => {
                          setPackageTouched(true);
                          setPackageWidth(Number(value));
                          setFeeResult(null);
                        }}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-400">
                        Cao
                      </label>
                      <NumberInput
                        value={packageHeight}
                        min={1}
                        onChange={(value) => {
                          setPackageTouched(true);
                          setPackageHeight(Number(value));
                          setFeeResult(null);
                        }}
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 p-4 dark:border-white/[0.08] dark:bg-white/[0.02]">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          Phí GHN dự kiến
                        </p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Hệ thống sẽ dùng phí này để tạo đơn và đẩy vận đơn ngay sau đó.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEstimateFee}
                        isLoading={isEstimatingFee}
                        disabled={!canEstimateFee}
                      >
                        Tính phí
                      </Button>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-xl bg-white px-4 py-3 dark:bg-[#162033]">
                        <p className="text-xs uppercase tracking-[0.16em] text-gray-400">Phí vận chuyển</p>
                        <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
                          {shippingFee.toLocaleString("vi-VN")} đ
                        </p>
                      </div>
                      <div className="rounded-xl bg-white px-4 py-3 dark:bg-[#162033]">
                        <p className="text-xs uppercase tracking-[0.16em] text-gray-400">Thu hộ COD</p>
                        <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
                          {codAmount.toLocaleString("vi-VN")} đ
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-[#111b2d]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">
                  Tổng kết
                </p>
                <div className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex items-center justify-between">
                    <span>Phương thức thanh toán</span>
                    <div className="w-[190px]">
                      <Select
                        value={paymentMethod}
                        onChange={handlePaymentMethodChange}
                        options={PAYMENT_METHOD_OPTIONS}
                        searchable
                        searchPlaceholder="Gõ COD hoặc thanh toán trước"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Trạng thái thanh toán</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {paymentStatus === "PAID" ? "Đã thanh toán" : "Chưa thanh toán"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Giảm giá</span>
                    <div className="w-[190px]">
                      <NumberInput
                        value={discountAmount}
                        min={0}
                        onChange={(value) => setDiscountAmount(Number(value) || 0)}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Tạm tính</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {subtotal.toLocaleString("vi-VN")} đ
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Phí vận chuyển</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {shippingFee.toLocaleString("vi-VN")} đ
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Khuyến mãi</span>
                    <span className="font-medium text-emerald-500">
                      -{discountAmount.toLocaleString("vi-VN")} đ
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-dashed border-gray-200 pt-3 text-base font-semibold text-gray-900 dark:border-white/[0.08] dark:text-white">
                    <span>Khách cần thanh toán</span>
                    <span>{Math.max(totalAmount, 0).toLocaleString("vi-VN")} đ</span>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-400">
                    Ghi chú nội bộ
                  </label>
                  <textarea
                    value={orderNotes}
                    onChange={(event) => setOrderNotes(event.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm outline-none transition-colors focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                    placeholder="Ví dụ: Khách ưu tiên giao giờ hành chính"
                  />
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      <div className="shrink-0 border-t border-gray-100 bg-gray-50 px-4 py-4 sm:px-6 dark:border-white/[0.05] dark:bg-white/[0.02]">
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} isLoading={isSubmitting}>
            Tạo đơn hàng
          </Button>
        </div>
      </div>
      </div>
    </Modal>
  );
}
