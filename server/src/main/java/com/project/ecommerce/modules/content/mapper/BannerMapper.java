package com.project.ecommerce.modules.content.mapper;

import com.project.ecommerce.common.mapper.CentralMapperConfig;
import com.project.ecommerce.modules.content.dto.request.CreateBannerRequest;
import com.project.ecommerce.modules.content.dto.request.UpdateBannerRequest;
import com.project.ecommerce.modules.content.dto.response.BannerResponse;
import com.project.ecommerce.modules.content.entity.Banner;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(config = CentralMapperConfig.class)
public interface BannerMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updateBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "isDeleted", ignore = true)
    @Mapping(target = "position", ignore = true)
    Banner toBanner(CreateBannerRequest request);

    BannerResponse toBannerResponse(Banner banner);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updateBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "isDeleted", ignore = true)
    @Mapping(target = "position", ignore = true)
    void updateBanner(@MappingTarget Banner banner, UpdateBannerRequest request);
}
