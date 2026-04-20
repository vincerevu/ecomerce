package com.project.ecommerce.modules.shipping.dto.request;

import com.project.ecommerce.modules.shipping.enums.RequiredNoteType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateShipmentRequest {
    @NotBlank
    String orderId;
    String clientOrderCode;
    Integer serviceId;
    Integer serviceTypeId;
    Integer paymentTypeId;
    RequiredNoteType requiredNote;
    BigDecimal codAmount;
    BigDecimal insuranceValue;
    @NotNull
    Integer weight;
    @NotNull
    Integer length;
    @NotNull
    Integer width;
    @NotNull
    Integer height;
    @NotBlank
    String toName;
    @NotBlank
    String toPhone;
    @NotBlank
    String toAddress;
    @NotBlank
    String toProvinceName;
    @NotBlank
    String toDistrictName;
    @NotBlank
    String toWardName;
    @NotNull
    Integer toDistrictId;
    @NotBlank
    String toWardCode;
    Integer fromDistrictId;
    String senderName;
    String senderPhone;
    String senderAddress;
    String senderProvinceName;
    String senderDistrictName;
    String senderWardName;
    String note;
}
