package com.project.ecommerce.modules.shipping.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class EstimateShippingFeeRequest {
    Integer fromDistrictId;
    @NotNull
    Integer toDistrictId;
    @NotBlank
    String toWardCode;
    Integer serviceId;
    Integer serviceTypeId;
    BigDecimal insuranceValue;
    BigDecimal codAmount;
    @NotNull
    Integer weight;
    @NotNull
    Integer length;
    @NotNull
    Integer width;
    @NotNull
    Integer height;
}
