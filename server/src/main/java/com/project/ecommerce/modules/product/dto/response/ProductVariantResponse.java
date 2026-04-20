package com.project.ecommerce.modules.product.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProductVariantResponse {
    String id;
    String sizeName;
    BigDecimal originalPrice;
    BigDecimal salePrice;
    Integer stockQuantity;
}
