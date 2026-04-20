package com.project.ecommerce.modules.product.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.List;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VariantRequest {
    @NotNull(message = "FIELD_REQUIRED")
    String sizeName;

    @NotNull(message = "FIELD_REQUIRED")
    BigDecimal originalPrice;

    @NotNull(message = "FIELD_REQUIRED")
    BigDecimal salePrice;

    @NotNull(message = "FIELD_REQUIRED")
    Integer stockQuantity;
}
