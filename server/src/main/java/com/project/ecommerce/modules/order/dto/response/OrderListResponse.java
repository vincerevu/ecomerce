package com.project.ecommerce.modules.order.dto.response;

import com.project.ecommerce.modules.order.enums.OrderStatus;
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
public class OrderListResponse {
    String id;
    String orderCode;
    String userId;
    String customerName;
    String customerPhone;
    OrderStatus status;
    PaymentStatus paymentStatus;
    BigDecimal totalAmount;
    Integer itemCount;
    LocalDateTime createdAt;
}
