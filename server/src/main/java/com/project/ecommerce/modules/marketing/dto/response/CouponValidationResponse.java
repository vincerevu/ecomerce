package com.project.ecommerce.modules.marketing.dto.response;

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
public class CouponValidationResponse {
    String couponId;
    String code;
    String name;
    BigDecimal discountAmount;
    BigDecimal subtotal;
    BigDecimal totalAfterDiscount;
}
