package com.project.ecommerce.modules.product.mapper;

import com.project.ecommerce.common.mapper.CentralMapperConfig;
import com.project.ecommerce.modules.product.dto.request.ColorRequest;
import com.project.ecommerce.modules.product.dto.response.ProductColorResponse;
import com.project.ecommerce.modules.product.entity.ProductColor;
import com.project.ecommerce.modules.product.entity.ProductImage;
import org.mapstruct.*;

import java.util.ArrayList;
import java.util.List;

@Mapper(config = CentralMapperConfig.class, uses = { ProductImageMapper.class, ProductVariantMapper.class })
public interface ProductColorMapper {

    ProductColorResponse toResponse(ProductColor color);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "images", ignore = true)
    @Mapping(target = "product", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updateBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "isDeleted", ignore = true)
    ProductColor toEntity(ColorRequest req);


}
