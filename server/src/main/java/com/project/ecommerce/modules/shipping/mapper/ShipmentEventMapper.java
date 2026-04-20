package com.project.ecommerce.modules.shipping.mapper;

import com.project.ecommerce.common.mapper.CentralMapperConfig;
import com.project.ecommerce.modules.shipping.dto.response.ShipmentEventResponse;
import com.project.ecommerce.modules.shipping.entity.ShipmentEvent;
import org.mapstruct.Mapper;

@Mapper(config = CentralMapperConfig.class)
public interface ShipmentEventMapper {
    ShipmentEventResponse toResponse(ShipmentEvent shipmentEvent);
}
