package com.project.ecommerce.modules.product.mapper;

import com.project.ecommerce.common.mapper.CentralMapperConfig;
import com.project.ecommerce.modules.product.dto.request.CreateTagRequest;
import com.project.ecommerce.modules.product.dto.response.TagResponse;
import com.project.ecommerce.modules.product.entity.Tag;
import org.mapstruct.*;

@Mapper(config = CentralMapperConfig.class)
public interface TagMapper {
    @Mapping(target = "colorCode", ignore = true)
    TagResponse toResponse(Tag tag);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updateBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "isDeleted", ignore = true)
    Tag toEntity(CreateTagRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updateBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "isDeleted", ignore = true)
    void updateTag(@MappingTarget Tag tag, CreateTagRequest request);
}
