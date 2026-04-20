package com.project.ecommerce.modules.inventory.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class StockImportReceiptResponse {
    String id;
    String receiptCode;
    String supplierName;
    String note;
    LocalDateTime importedAt;
    BigDecimal totalAmount;
    Integer totalQuantity;
    Integer totalLines;
    LocalDateTime createdAt;
    List<StockImportItemResponse> items;
}
