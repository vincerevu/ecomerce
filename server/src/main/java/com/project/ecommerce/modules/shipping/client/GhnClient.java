package com.project.ecommerce.modules.shipping.client;

import com.project.ecommerce.modules.shipping.dto.response.ShippingAddressOptionResponse;
import com.project.ecommerce.modules.shipping.dto.response.ShippingFeeResponse;
import com.project.ecommerce.modules.shipping.dto.response.ShippingServiceOptionResponse;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface GhnClient {

    ShippingFeeResponse estimateFee(
            Integer fromDistrictId,
            Integer toDistrictId,
            String toWardCode,
            Integer serviceId,
            Integer serviceTypeId,
            BigDecimal insuranceValue,
            BigDecimal codAmount,
            Integer weight,
            Integer length,
            Integer width,
            Integer height);

    List<ShippingServiceOptionResponse> getAvailableServices(Integer fromDistrictId, Integer toDistrictId);

    GhnShipmentCreatedResult createOrder(GhnCreateOrderCommand command);

    GhnShipmentTrackingResult getOrderDetailByClientOrderCode(String clientOrderCode);

    void cancelOrder(String trackingCode);

    List<ShippingAddressOptionResponse> getProvinces();

    List<ShippingAddressOptionResponse> getDistricts(Integer provinceId);

    List<ShippingAddressOptionResponse> getWards(Integer districtId);

    record GhnCreateOrderCommand(
            String clientOrderCode,
            Integer serviceId,
            Integer serviceTypeId,
            Integer paymentTypeId,
            String requiredNote,
            BigDecimal codAmount,
            BigDecimal insuranceValue,
            Integer weight,
            Integer length,
            Integer width,
            Integer height,
            String toName,
            String toPhone,
            String toAddress,
            Integer toDistrictId,
            String toWardCode,
            String toWardName,
            String toDistrictName,
            String toProvinceName,
            String senderName,
            String senderPhone,
            String senderAddress,
            String senderWardName,
            String senderDistrictName,
            String senderProvinceName,
            String note) {
    }

    record GhnShipmentCreatedResult(
            String trackingCode,
            String providerStatus,
            LocalDateTime expectedDeliveryTime,
            BigDecimal totalFee,
            String rawPayload) {
    }

    record GhnShipmentTrackingResult(
            String trackingCode,
            String providerStatus,
            LocalDateTime expectedDeliveryTime,
            String description,
            String rawPayload) {
    }
}
