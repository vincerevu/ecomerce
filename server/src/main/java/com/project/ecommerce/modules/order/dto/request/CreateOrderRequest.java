package com.project.ecommerce.modules.order.dto.request;

import com.project.ecommerce.modules.order.enums.OrderStatus;
import com.project.ecommerce.modules.order.enums.PaymentStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import java.math.BigDecimal;
import java.util.List;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateOrderRequest {
    String orderCode;
    String userId;
    @NotBlank(message = "FIELD_REQUIRED")
    String customerName;
    @NotBlank(message = "FIELD_REQUIRED")
    @Pattern(regexp = "^(0|84)(3|5|7|8|9)\\d{8}$", message = "PHONE_INVALID")
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
    String paymentMethod;
    BigDecimal shippingFee;
    BigDecimal discountAmount;
    String couponCode;

    @Valid
    @NotEmpty(message = "FIELD_REQUIRED")
    List<OrderItemRequest> items;
}
