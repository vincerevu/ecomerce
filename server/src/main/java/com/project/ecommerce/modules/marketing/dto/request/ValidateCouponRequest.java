package com.project.ecommerce.modules.marketing.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ValidateCouponRequest {
    @NotBlank(message = "FIELD_REQUIRED")
    String code;

    @NotNull(message = "FIELD_REQUIRED")
    @DecimalMin(value = "0", message = "INVALID_KEY")
    BigDecimal subtotal;

    String paymentMethod;
}
