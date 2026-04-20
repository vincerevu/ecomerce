package com.project.ecommerce.modules.order.dto.response;

import com.project.ecommerce.modules.order.enums.OrderStatus;
import com.project.ecommerce.modules.order.enums.PaymentStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
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
public class OrderResponse {
    String id;
    String orderCode;
    String userId;
    String customerName;
    String customerPhone;
    String customerEmail;
    String shippingAddress;
    String shippingDetail;
    String shippingProvinceName;
    String shippingProvinceCode;
    String shippingDistrictName;
    String shippingDistrictCode;
    String shippingWardName;
    String shippingWardCode;
    String notes;
    OrderStatus status;
    PaymentStatus paymentStatus;
    BigDecimal subtotal;
    BigDecimal shippingFee;
    BigDecimal discountAmount;
    BigDecimal totalAmount;
    Integer itemCount;
    LocalDateTime createdAt;
    List<OrderItemResponse> items;
}
