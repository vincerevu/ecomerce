package com.project.ecommerce.modules.identity.mapper;

import com.project.ecommerce.common.mapper.CentralMapperConfig;
import com.project.ecommerce.modules.identity.dto.response.PointHistoryResponse;
import com.project.ecommerce.modules.identity.entity.PointHistory;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(config = CentralMapperConfig.class)
public interface PointHistoryMapper {
    @Mapping(target = "createdDate", source = "createdAt")
    PointHistoryResponse toResponse(PointHistory pointHistory);
}
