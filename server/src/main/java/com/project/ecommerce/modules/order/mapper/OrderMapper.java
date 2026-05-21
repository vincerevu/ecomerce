package com.project.ecommerce.modules.order.mapper;

import com.project.ecommerce.common.mapper.CentralMapperConfig;
import com.project.ecommerce.modules.order.dto.request.CreateOrderRequest;
import com.project.ecommerce.modules.order.dto.response.OrderResponse;
import com.project.ecommerce.modules.order.entity.Order;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(config = CentralMapperConfig.class, uses = OrderItemMapper.class)
public interface OrderMapper {

    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "itemCount", expression = "java(order.getItems() != null ? order.getItems().size() : 0)")
    OrderResponse toResponse(Order order);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "items", ignore = true)
    @Mapping(target = "paymentTransactions", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updateBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "isDeleted", ignore = true)
    @Mapping(target = "subtotal", ignore = true)
    @Mapping(target = "totalAmount", ignore = true)
    @Mapping(target = "couponName", ignore = true)
    @Mapping(target = "status", expression = "java(request.getStatus() != null ? request.getStatus() : com.project.ecommerce.modules.order.enums.OrderStatus.PENDING)")
    @Mapping(target = "paymentStatus", expression = "java(request.getPaymentStatus() != null ? request.getPaymentStatus() : com.project.ecommerce.modules.order.enums.PaymentStatus.UNPAID)")
    @Mapping(target = "shippingFee", expression = "java(request.getShippingFee() != null ? request.getShippingFee() : java.math.BigDecimal.ZERO)")
    @Mapping(target = "discountAmount", ignore = true)
    Order toEntity(CreateOrderRequest request);
}
