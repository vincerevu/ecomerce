package com.project.ecommerce.modules.product.mapper;

import com.project.ecommerce.common.mapper.CentralMapperConfig;
import com.project.ecommerce.modules.product.dto.request.CreateProductRequest;
import com.project.ecommerce.modules.product.dto.response.ProductResponse;
import com.project.ecommerce.modules.product.entity.Product;
import org.mapstruct.*;

@Mapper(config = CentralMapperConfig.class, uses = { CategoryMapper.class, TagMapper.class, ProductColorMapper.class })
public interface ProductMapper {

    ProductResponse toResponse(Product product);

    /** Used in create() - category, tags, and colors are handled separately in the service */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "category", ignore = true)
    @Mapping(target = "tags", ignore = true)
    @Mapping(target = "colors", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updateBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "isDeleted", ignore = true)
    @Mapping(target = "status", expression = "java(request.getStatus() != null ? request.getStatus() : \"ACTIVE\")")
    Product toEntity(CreateProductRequest request);

    /** Used in update() - only simple fields are mapped; relations are managed by the service */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "category", ignore = true)
    @Mapping(target = "tags", ignore = true)
    @Mapping(target = "colors", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updateBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "isDeleted", ignore = true)
    @Mapping(target = "status", expression = "java(request.getStatus() != null ? request.getStatus() : \"ACTIVE\")")
    void updateProduct(@MappingTarget Product product, CreateProductRequest request);
}
