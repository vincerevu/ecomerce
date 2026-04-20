package com.project.ecommerce.modules.payment.mapper;

import com.project.ecommerce.common.mapper.CentralMapperConfig;
import com.project.ecommerce.modules.payment.dto.request.CreatePaymentTransactionRequest;
import com.project.ecommerce.modules.payment.dto.response.PaymentTransactionResponse;
import com.project.ecommerce.modules.payment.entity.PaymentTransaction;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(config = CentralMapperConfig.class)
public interface PaymentTransactionMapper {

    @Mapping(target = "orderId", source = "order.id")
    @Mapping(target = "orderCode", source = "order.orderCode")
    @Mapping(target = "customerName", source = "order.customerName")
    PaymentTransactionResponse toResponse(PaymentTransaction paymentTransaction);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "order", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updateBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "isDeleted", ignore = true)
    @Mapping(target = "currency", expression = "java(request.getCurrency() == null || request.getCurrency().isBlank() ? \"VND\" : request.getCurrency().trim().toUpperCase())")
    PaymentTransaction toEntity(CreatePaymentTransactionRequest request);
}
