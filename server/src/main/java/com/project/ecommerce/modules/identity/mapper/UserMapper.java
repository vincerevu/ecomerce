package com.project.ecommerce.modules.identity.mapper;

import com.project.ecommerce.common.mapper.CentralMapperConfig;
import com.project.ecommerce.modules.identity.dto.request.CreateUserRequest;
import com.project.ecommerce.modules.identity.dto.request.UpdateUserProfileRequest;
import com.project.ecommerce.modules.identity.dto.response.UserResponse;
import com.project.ecommerce.modules.identity.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(config = CentralMapperConfig.class, uses = {
        RoleMapper.class, MembershipTierMapper.class })
public interface UserMapper {
    UserResponse toResponse(User user);

    @Mapping(target = "roles", ignore = true)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updateBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "isDeleted", ignore = true)
    @Mapping(target = "addresses", ignore = true)
    @Mapping(target = "membershipTier", ignore = true)
    @Mapping(target = "totalSpent", ignore = true)
    @Mapping(target = "totalPoints", ignore = true)
    @Mapping(target = "type", ignore = true)
    @Mapping(target = "active", ignore = true)
    User toUser(CreateUserRequest request);

    @Mapping(target = "roles", ignore = true)
    @Mapping(target = "password", ignore = true)
    @Mapping(target = "phone", ignore = true)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updateBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "isDeleted", ignore = true)
    @Mapping(target = "addresses", ignore = true)
    @Mapping(target = "membershipTier", ignore = true)
    @Mapping(target = "totalSpent", ignore = true)
    @Mapping(target = "totalPoints", ignore = true)
    @Mapping(target = "type", ignore = true)
    @Mapping(target = "active", ignore = true)
    void updateUser(@MappingTarget User user, CreateUserRequest request);

    @Mapping(target = "phone", ignore = true)
    @Mapping(target = "roles", ignore = true)
    @Mapping(target = "password", ignore = true)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updateBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "isDeleted", ignore = true)
    @Mapping(target = "addresses", ignore = true)
    @Mapping(target = "membershipTier", ignore = true)
    @Mapping(target = "totalSpent", ignore = true)
    @Mapping(target = "totalPoints", ignore = true)
    @Mapping(target = "type", ignore = true)
    @Mapping(target = "active", ignore = true)
    void updateProfile(@MappingTarget User user, UpdateUserProfileRequest request);
}
