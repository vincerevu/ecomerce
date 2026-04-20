package com.project.ecommerce.modules.payment.dto.request;

import com.project.ecommerce.modules.order.enums.PaymentStatus;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdatePaymentTransactionRequest {
    @NotNull(message = "FIELD_REQUIRED")
    PaymentStatus status;

    String providerReference;
    LocalDateTime processedAt;
    String failureReason;
    String notes;
    String rawResponse;
}
