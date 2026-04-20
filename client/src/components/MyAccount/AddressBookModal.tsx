"use client";

import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import ModalShell from "./ModalShell";
import CustomDropdown from "@/components/Common/CustomDropdown";
import {
  addressApi,
  type AddressPayload,
  type AddressRecord,
} from "@/libs/address-api";
import {
  shippingApi,
  type ShippingAddressOption,
} from "@/libs/shipping-api";
import type { UserProfileResponse } from "@/libs/user-api";

type AddressBookModalProps = {
  isOpen: boolean;
  currentUser: UserProfileResponse | null;
  addresses: AddressRecord[];
  onClose: () => void;
  onAddressesChanged: (addresses: AddressRecord[]) => void;
};

type AddressFormState = {
  provinceCode: string;
  districtCode: string;
  wardCode: string;
  detail: string;
  defaultAddress: boolean;
};

const createEmptyForm = (): AddressFormState => ({
  provinceCode: "",
  districtCode: "",
  wardCode: "",
  detail: "",
  defaultAddress: false,
});

const findOptionCode = (
  options: ShippingAddressOption[],
  label?: string | null,
) => options.find((item) => item.name === label)?.code || "";

const AddressBookModal = ({
  isOpen,
  currentUser,
  addresses,
  onClose,
  onAddressesChanged,
}: AddressBookModalProps) => {
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressFormState>(createEmptyForm);
  const [provinces, setProvinces] = useState<ShippingAddressOption[]>([]);
  const [districts, setDistricts] = useState<ShippingAddressOption[]>([]);
  const [wards, setWards] = useState<ShippingAddressOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadProvinces = async () => {
    try {
      const response = await shippingApi.getProvinces();
      const nextProvinces = response.result || [];
      setProvinces(nextProvinces);
      return nextProvinces;
    } catch {
      setProvinces([]);
      return [] as ShippingAddressOption[];
    }
  };

  const selectedAddress = useMemo(
    () =>
      addresses.find((item) => item.id === selectedAddressId) ||
      addresses.find((item) => item.defaultAddress) ||
      addresses[0] ||
      null,
    [addresses, selectedAddressId],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setSelectedAddressId(
      addresses.find((item) => item.defaultAddress)?.id || addresses[0]?.id || null,
    );
  }, [addresses, isOpen]);

  useEffect(() => {
    if (!isFormOpen) {
      return;
    }

    void loadProvinces();
  }, [isFormOpen]);

  useEffect(() => {
    if (!isFormOpen || !form.provinceCode) {
      setDistricts([]);
      setWards([]);
      return;
    }

    const loadDistricts = async () => {
      try {
        const response = await shippingApi.getDistricts(Number(form.provinceCode));
        setDistricts(response.result || []);
      } catch {
        setDistricts([]);
      }
    };

    void loadDistricts();
  }, [form.provinceCode, isFormOpen]);

  useEffect(() => {
    if (!isFormOpen || !form.districtCode) {
      setWards([]);
      return;
    }

    const loadWards = async () => {
      try {
        const response = await shippingApi.getWards(Number(form.districtCode));
        setWards(response.result || []);
      } catch {
        setWards([]);
      }
    };

    void loadWards();
  }, [form.districtCode, isFormOpen]);

  const openCreateModal = () => {
    setEditingAddressId(null);
    setDistricts([]);
    setWards([]);
    setForm({
      ...createEmptyForm(),
      defaultAddress: addresses.length === 0,
    });
    setIsFormOpen(true);
  };

  const openEditModal = async (address: AddressRecord) => {
    try {
      setEditingAddressId(address.id);
      const nextProvinces = provinces.length > 0 ? provinces : await loadProvinces();
      const provinceCode = findOptionCode(nextProvinces, address.province);

      let nextDistricts: ShippingAddressOption[] = [];
      let districtCode = "";

      if (provinceCode) {
        const districtResponse = await shippingApi.getDistricts(Number(provinceCode));
        nextDistricts = districtResponse.result || [];
        districtCode = findOptionCode(nextDistricts, address.district);
      }

      let nextWards: ShippingAddressOption[] = [];
      let wardCode = "";

      if (districtCode) {
        const wardResponse = await shippingApi.getWards(Number(districtCode));
        nextWards = wardResponse.result || [];
        wardCode = findOptionCode(nextWards, address.ward);
      }

      setDistricts(nextDistricts);
      setWards(nextWards);
      setForm({
        provinceCode,
        districtCode,
        wardCode,
        detail: address.detail,
        defaultAddress: address.defaultAddress,
      });
      setIsFormOpen(true);
    } catch {
      toast.error("Không thể tải thông tin địa chỉ.");
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const province = provinces.find((item) => item.code === form.provinceCode);
    const district = districts.find((item) => item.code === form.districtCode);
    const ward = wards.find((item) => item.code === form.wardCode);

    if (
      !province ||
      !district ||
      !ward ||
      !form.detail.trim()
    ) {
      toast.error("Vui lòng nhập đầy đủ thông tin địa chỉ.");
      return;
    }

    const payload: AddressPayload = {
      receiverName: currentUser?.name?.trim() || selectedAddress?.receiverName || "",
      receiverPhone:
        currentUser?.phone?.trim() || selectedAddress?.receiverPhone || "",
      province: province.name,
      district: district.name,
      ward: ward.name,
      detail: form.detail.trim(),
      defaultAddress: form.defaultAddress,
    };

    try {
      setIsSubmitting(true);

      if (editingAddressId) {
        await addressApi.update(editingAddressId, payload);
      } else {
        await addressApi.create(payload);
      }

      const nextAddresses = (await addressApi.getMine()).result || [];
      onAddressesChanged(nextAddresses);
      setSelectedAddressId(
        nextAddresses.find((item) => item.defaultAddress)?.id ||
          nextAddresses[0]?.id ||
          null,
      );
      setIsFormOpen(false);
      toast.success(editingAddressId ? "Đã cập nhật địa chỉ." : "Đã thêm địa chỉ.");
    } catch (error: any) {
      toast.error(error?.message || "Không thể lưu địa chỉ nhận hàng.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <ModalShell title="Sổ địa chỉ nhận hàng" isOpen={isOpen} onClose={onClose}>
        <div className="px-5 py-5 sm:px-6">
          {addresses.length > 0 ? (
            <div className="space-y-3">
              {addresses.map((address) => {
                const isSelected = address.id === selectedAddress?.id;

                return (
                  <button
                    key={address.id}
                    type="button"
                    onClick={() => setSelectedAddressId(address.id)}
                    className={`w-full rounded-[24px] border px-5 py-4 text-left transition ${
                      isSelected
                        ? "border-[#FCAF17] bg-[#FFF8E7]"
                        : "border-gray-3 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-1 flex h-5 w-5 items-center justify-center rounded-[6px] border transition ${
                            isSelected
                              ? "border-[#FCAF17] bg-[#FCAF17] text-white"
                              : "border-gray-3 bg-white text-transparent"
                          }`}
                        >
                          <svg
                            width="11"
                            height="11"
                            viewBox="0 0 12 12"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M2 6.2L4.6 8.8L10 3.5"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>

                        <div className="text-dark">
                          <p className="text-base font-medium">
                            {address.receiverName}, {address.receiverPhone}
                          </p>
                          <p className="mt-1 text-base leading-7">
                            {address.detail}, {address.ward}, {address.district},{" "}
                            {address.province}
                          </p>
                        </div>
                      </div>

                      <span
                        onClick={(event) => {
                          event.stopPropagation();
                          void openEditModal(address);
                        }}
                        className="cursor-pointer text-base text-[#6B59D3]"
                      >
                        Sửa
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-base text-dark-4">
              Bạn chưa có địa chỉ nhận hàng nào.
            </div>
          )}

          <button
            type="button"
            onClick={openCreateModal}
            className="mt-4 flex w-full items-center justify-center gap-2 py-3 text-lg text-[#6B59D3]"
          >
            <span className="text-2xl leading-none">+</span>
            <span>Thêm địa chỉ nhận hàng</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="mt-8 w-full rounded-full bg-[#FFC84B] px-5 py-4 text-[18px] font-medium text-dark"
          >
            Xác nhận
          </button>
        </div>
      </ModalShell>

      <ModalShell
        title={editingAddressId ? "Sửa địa chỉ nhận hàng" : "Thêm địa chỉ nhận hàng"}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      >
        <form onSubmit={handleSubmit} className="px-5 py-5 sm:px-6">
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-dark">
                Tỉnh / Thành phố
              </label>
              <CustomDropdown
                value={form.provinceCode}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    provinceCode: value,
                    districtCode: "",
                    wardCode: "",
                  }))
                }
                options={provinces.map((item) => ({
                  label: item.name,
                  value: item.code,
                }))}
                searchable
                placeholder="Chọn tỉnh / thành"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-dark">
                Quận / Huyện
              </label>
              <CustomDropdown
                value={form.districtCode}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    districtCode: value,
                    wardCode: "",
                  }))
                }
                options={districts.map((item) => ({
                  label: item.name,
                  value: item.code,
                }))}
                searchable
                disabled={!form.provinceCode}
                placeholder="Chọn quận / huyện"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-dark">
                Phường / Xã
              </label>
              <CustomDropdown
                value={form.wardCode}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    wardCode: value,
                  }))
                }
                options={wards.map((item) => ({
                  label: item.name,
                  value: item.code,
                }))}
                searchable
                disabled={!form.districtCode}
                placeholder="Chọn phường / xã"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-dark">
                Địa chỉ chi tiết
              </label>
              <textarea
                value={form.detail}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    detail: event.target.value,
                  }))
                }
                rows={3}
                className="w-full rounded-[24px] border border-gray-3 px-5 py-3 text-base text-dark outline-none transition focus:border-[#FCAF17]"
              />
            </div>

            <label className="flex items-center gap-3 text-sm text-dark">
              <input
                type="checkbox"
                checked={form.defaultAddress}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    defaultAddress: event.target.checked,
                  }))
                }
                className="sr-only"
              />
              <span
                role="presentation"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    defaultAddress: !current.defaultAddress,
                  }))
                }
                className={`flex h-5 w-5 cursor-pointer items-center justify-center rounded-[6px] border transition ${
                  form.defaultAddress
                    ? "border-[#FCAF17] bg-[#FCAF17] text-white"
                    : "border-gray-3 bg-white text-transparent"
                }`}
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2 6.2L4.6 8.8L10 3.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span>Đặt làm địa chỉ mặc định</span>
            </label>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="flex-1 rounded-full border border-gray-3 px-5 py-3 text-base text-dark"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-full bg-[#FFC84B] px-5 py-3 text-base font-medium text-dark disabled:opacity-70"
            >
              {isSubmitting ? "Đang lưu..." : "Xác nhận"}
            </button>
          </div>
        </form>
      </ModalShell>
    </>
  );
};

export default AddressBookModal;
