package com.project.ecommerce.modules.identity.mapper;

import com.project.ecommerce.common.mapper.CentralMapperConfig;
import com.project.ecommerce.modules.identity.dto.request.CreateRoleRequest;
import com.project.ecommerce.modules.identity.dto.response.RoleResponse;
import com.project.ecommerce.modules.identity.entity.Role;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(config = CentralMapperConfig.class, uses = {
        PermissionMapper.class })
public interface RoleMapper {
    RoleResponse toResponse(Role role);

    @Mapping(target = "permissions", ignore = true)
    @Mapping(target = "isDeleted", ignore = true)
    Role toRole(CreateRoleRequest request);
}
