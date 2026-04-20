package com.project.ecommerce.modules.inventory.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class InventoryStockResponse {
    String productId;
    String productVariantId;
    String productName;
    String productSlug;
    String colorName;
    String hexCode;
    String sizeName;
    String imageUrl;
    BigDecimal originalPrice;
    BigDecimal salePrice;
    Integer stockQuantity;
    BigDecimal latestUnitCost;
    LocalDateTime latestImportedAt;
}
