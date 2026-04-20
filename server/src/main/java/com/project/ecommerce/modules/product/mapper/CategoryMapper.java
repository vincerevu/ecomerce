package com.project.ecommerce.modules.product.mapper;

import com.project.ecommerce.common.mapper.CentralMapperConfig;
import com.project.ecommerce.modules.product.dto.request.CreateCategoryRequest;
import com.project.ecommerce.modules.product.dto.request.UpdateCategoryRequest;
import com.project.ecommerce.modules.product.dto.response.CategoryResponse;
import com.project.ecommerce.modules.product.entity.Category;
import org.mapstruct.*;

@Mapper(config = CentralMapperConfig.class)
public interface CategoryMapper {
    
    @Mapping(target = "parent", qualifiedByName = "toResponseChild")
    CategoryResponse toResponse(Category category);

    @Named("toResponseChild")
    @Mapping(target = "parent", ignore = true)
    CategoryResponse toResponseChild(Category category);

    @Mapping(target = "parent", ignore = true)
    @Mapping(target = "children", ignore = true)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updateBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "isDeleted", ignore = true)
    Category toEntity(CreateCategoryRequest request);

    @Mapping(target = "parent", ignore = true)
    @Mapping(target = "children", ignore = true)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updateBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "isDeleted", ignore = true)
    void updateCategory(@MappingTarget Category category, UpdateCategoryRequest request);
}
