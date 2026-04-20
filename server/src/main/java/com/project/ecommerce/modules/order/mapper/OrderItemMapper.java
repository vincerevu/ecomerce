package com.project.ecommerce.modules.order.mapper;

import com.project.ecommerce.common.mapper.CentralMapperConfig;
import com.project.ecommerce.modules.order.dto.request.OrderItemRequest;
import com.project.ecommerce.modules.order.dto.response.OrderItemResponse;
import com.project.ecommerce.modules.order.entity.OrderItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(config = CentralMapperConfig.class)
public interface OrderItemMapper {

    @Mapping(target = "order", ignore = true)
    @Mapping(target = "product", ignore = true)
    @Mapping(target = "productVariant", ignore = true)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updateBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "isDeleted", ignore = true)
    @Mapping(target = "lineTotal", ignore = true)
    OrderItem toEntity(OrderItemRequest request);

    @Mapping(target = "productId", source = "product.id")
    @Mapping(target = "productVariantId", source = "productVariant.id")
    OrderItemResponse toResponse(OrderItem orderItem);
}
