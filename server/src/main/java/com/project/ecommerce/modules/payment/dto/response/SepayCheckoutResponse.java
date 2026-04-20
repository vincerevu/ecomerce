package com.project.ecommerce.modules.payment.dto.response;

import com.project.ecommerce.modules.order.enums.PaymentStatus;
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
public class SepayCheckoutResponse {
    String paymentId;
    String transactionCode;
    String providerReference;
    PaymentStatus paymentStatus;
    String orderId;
    String orderCode;
    BigDecimal amount;
    String bankName;
    String bankCode;
    String bankAccountNumber;
    String accountHolderName;
    String qrCode;
    String qrImageUrl;
    String checkoutUrl;
    LocalDateTime expiredAt;
}
