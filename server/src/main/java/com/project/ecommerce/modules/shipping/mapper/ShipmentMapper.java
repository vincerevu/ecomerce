package com.project.ecommerce.modules.shipping.mapper;

import com.project.ecommerce.common.mapper.CentralMapperConfig;
import com.project.ecommerce.modules.shipping.dto.response.ShipmentResponse;
import com.project.ecommerce.modules.shipping.entity.Shipment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(config = CentralMapperConfig.class)
public interface ShipmentMapper {
    @Mapping(target = "orderId", source = "order.id")
    @Mapping(target = "orderCode", source = "order.orderCode")
    @Mapping(target = "customerName", source = "order.customerName")
    @Mapping(target = "events", ignore = true)
    ShipmentResponse toResponse(Shipment shipment);
}
