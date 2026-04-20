package com.project.ecommerce.modules.payment.dto.request;

import com.project.ecommerce.modules.order.enums.PaymentStatus;
import com.project.ecommerce.modules.payment.enums.PaymentMethod;
import com.project.ecommerce.modules.payment.enums.PaymentProvider;
import com.project.ecommerce.modules.payment.enums.PaymentTransactionType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
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
public class CreatePaymentTransactionRequest {
    @NotBlank(message = "FIELD_REQUIRED")
    String orderId;

    String transactionCode;

    @NotNull(message = "FIELD_REQUIRED")
    PaymentProvider provider;

    @NotNull(message = "FIELD_REQUIRED")
    PaymentMethod paymentMethod;

    @NotNull(message = "FIELD_REQUIRED")
    PaymentTransactionType transactionType;

    @NotNull(message = "FIELD_REQUIRED")
    PaymentStatus status;

    @NotNull(message = "FIELD_REQUIRED")
    @DecimalMin(value = "0.0", inclusive = false, message = "FIELD_REQUIRED")
    BigDecimal amount;

    String currency;
    String providerReference;
    LocalDateTime processedAt;
    String failureReason;
    String notes;
    String rawResponse;
}
