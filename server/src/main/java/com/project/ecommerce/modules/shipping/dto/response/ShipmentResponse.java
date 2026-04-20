package com.project.ecommerce.modules.shipping.dto.response;

import com.project.ecommerce.modules.shipping.enums.RequiredNoteType;
import com.project.ecommerce.modules.shipping.enums.ShipmentStatus;
import com.project.ecommerce.modules.shipping.enums.ShippingProvider;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ShipmentResponse {
    String id;
    String orderId;
    String orderCode;
    String customerName;
    ShippingProvider provider;
    String clientOrderCode;
    String trackingCode;
    Long shopId;
    Integer serviceId;
    Integer serviceTypeId;
    Integer paymentTypeId;
    RequiredNoteType requiredNote;
    ShipmentStatus status;
    BigDecimal shippingFee;
    BigDecimal codAmount;
    BigDecimal insuranceValue;
    Integer weight;
    Integer length;
    Integer width;
    Integer height;
    String toName;
    String toPhone;
    String toAddress;
    String toProvinceName;
    String toDistrictName;
    String toWardName;
    Integer toDistrictId;
    String toWardCode;
    String senderName;
    String senderPhone;
    String senderAddress;
    String senderProvinceName;
    String senderDistrictName;
    String senderWardName;
    Integer fromDistrictId;
    LocalDateTime expectedDeliveryTime;
    String note;
    String providerPayload;
    LocalDateTime createdAt;
    List<ShipmentEventResponse> events;
}
