package com.project.ecommerce.modules.inventory.dto.response;

import java.math.BigDecimal;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class StockImportItemResponse {
    String id;
    String productVariantId;
    String productId;
    String productName;
    String colorName;
    String sizeName;
    Integer quantity;
    BigDecimal unitCost;
    BigDecimal lineTotal;
}
