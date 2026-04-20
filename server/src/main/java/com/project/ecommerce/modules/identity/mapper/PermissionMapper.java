package com.project.ecommerce.modules.identity.mapper;

import com.project.ecommerce.common.mapper.CentralMapperConfig;
import com.project.ecommerce.modules.identity.dto.request.CreatePermissionRequest;
import com.project.ecommerce.modules.identity.dto.response.PermissionResponse;
import com.project.ecommerce.modules.identity.entity.Permission;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(config = CentralMapperConfig.class)
public interface PermissionMapper {
    PermissionResponse toResponse(Permission permission);

    @Mapping(target = "isDeleted", ignore = true)
    Permission toPermission(CreatePermissionRequest request);
}
