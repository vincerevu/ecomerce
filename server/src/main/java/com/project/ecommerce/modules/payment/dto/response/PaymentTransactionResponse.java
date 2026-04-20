package com.project.ecommerce.modules.payment.dto.response;

import com.project.ecommerce.modules.order.enums.PaymentStatus;
import com.project.ecommerce.modules.payment.enums.PaymentMethod;
import com.project.ecommerce.modules.payment.enums.PaymentProvider;
import com.project.ecommerce.modules.payment.enums.PaymentTransactionType;
import java.math.BigDecimal;
import java.time.LocalDateTime;
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
public class PaymentTransactionResponse {
    String id;
    String orderId;
    String orderCode;
    String customerName;
    String transactionCode;
    PaymentProvider provider;
    PaymentMethod paymentMethod;
    PaymentTransactionType transactionType;
    PaymentStatus status;
    BigDecimal amount;
    String currency;
    String providerReference;
    LocalDateTime processedAt;
    String failureReason;
    String notes;
    String rawResponse;
    LocalDateTime createdAt;
}
