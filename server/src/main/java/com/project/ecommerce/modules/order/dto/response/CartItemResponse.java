package com.project.ecommerce.modules.order.dto.response;

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
public class CartItemResponse {
    String id;
    String productId;
    String productVariantId;
    String productName;
    String productSlug;
    String imageUrl;
    String colorId;
    String colorName;
    String sizeName;
    BigDecimal unitPrice;
    Integer quantity;
    BigDecimal lineTotal;
}
