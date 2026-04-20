package com.project.ecommerce.modules.shipping.dto.response;

import java.math.BigDecimal;
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
public class ShippingFeeResponse {
    BigDecimal total;
    BigDecimal serviceFee;
    BigDecimal insuranceFee;
    BigDecimal codFee;
}
