package com.project.ecommerce.modules.inventory.mapper;

import com.project.ecommerce.modules.inventory.dto.response.InventoryMovementResponse;
import com.project.ecommerce.modules.inventory.entity.InventoryMovement;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import com.project.ecommerce.common.mapper.CentralMapperConfig;

@Mapper(config = CentralMapperConfig.class)
public interface InventoryMovementMapper {
    @Mapping(target = "productVariantId", source = "productVariant.id")
    @Mapping(target = "productName", source = "productVariant.productColor.product.name")
    @Mapping(target = "colorName", source = "productVariant.productColor.colorName")
    @Mapping(target = "sizeName", source = "productVariant.sizeName")
    InventoryMovementResponse toResponse(InventoryMovement movement);
}
