package com.project.ecommerce.modules.inventory.dto.response;

import com.project.ecommerce.modules.inventory.enums.InventoryMovementType;
import com.project.ecommerce.modules.inventory.enums.InventoryReferenceType;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class InventoryMovementResponse {
    String id;
    String productVariantId;
    String productName;
    String colorName;
    String sizeName;
    InventoryMovementType movementType;
    Integer quantity;
    Integer beforeQuantity;
    Integer afterQuantity;
    BigDecimal unitCost;
    InventoryReferenceType referenceType;
    String referenceId;
    String note;
    LocalDateTime createdAt;
}
