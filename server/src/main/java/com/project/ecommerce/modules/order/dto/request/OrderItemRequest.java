package com.project.ecommerce.modules.order.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderItemRequest {
    String productId;
    String productVariantId;
    @NotBlank(message = "FIELD_REQUIRED")
    String productName;
    String productSlug;
    String imageUrl;
    String colorName;
    String sizeName;
    @NotNull(message = "FIELD_REQUIRED")
    @Min(value = 1, message = "FIELD_REQUIRED")
    Integer quantity;
    @NotNull(message = "FIELD_REQUIRED")
    BigDecimal unitPrice;
}
