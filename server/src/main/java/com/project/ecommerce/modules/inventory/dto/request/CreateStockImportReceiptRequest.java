package com.project.ecommerce.modules.inventory.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.time.LocalDateTime;
import java.util.List;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateStockImportReceiptRequest {
    String receiptCode;
    String supplierName;
    String note;
    LocalDateTime importedAt;

    @Valid
    @NotEmpty(message = "FIELD_REQUIRED")
    List<CreateStockImportItemRequest> items;
}
