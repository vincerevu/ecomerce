package com.project.ecommerce.modules.marketing.dto.request;

import com.project.ecommerce.modules.marketing.enums.CouponPaymentMethod;
import com.project.ecommerce.modules.marketing.enums.CouponScope;
import com.project.ecommerce.modules.marketing.enums.DiscountType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CouponRequest {
    @NotBlank(message = "FIELD_REQUIRED")
    String code;

    @NotBlank(message = "FIELD_REQUIRED")
    String name;

    @NotNull(message = "FIELD_REQUIRED")
    DiscountType discountType;

    @NotNull(message = "FIELD_REQUIRED")
    @DecimalMin(value = "0.01", message = "INVALID_KEY")
    BigDecimal discountValue;

    BigDecimal minOrderAmount;
    BigDecimal maxDiscountAmount;
    Integer usageLimit;
    LocalDateTime startsAt;
    LocalDateTime endsAt;
    Boolean active;
    CouponScope scope;
    CouponPaymentMethod paymentMethod;
    String targetMembershipTierId;
    String targetUserId;
}
