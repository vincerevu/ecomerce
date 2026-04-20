package com.project.ecommerce.modules.identity.mapper;

import com.project.ecommerce.common.mapper.CentralMapperConfig;
import com.project.ecommerce.modules.identity.dto.request.CreateMembershipTierRequest;
import com.project.ecommerce.modules.identity.dto.request.UpdateMembershipTierRequest;
import com.project.ecommerce.modules.identity.dto.response.MembershipTierResponse;
import com.project.ecommerce.modules.identity.entity.MembershipTier;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(config = CentralMapperConfig.class)
public interface MembershipTierMapper {
    MembershipTierResponse toResponse(MembershipTier membershipTier);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updateBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "isDeleted", ignore = true)
    MembershipTier toTier(CreateMembershipTierRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updateBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "isDeleted", ignore = true)
    void updateTier(@MappingTarget MembershipTier tier, UpdateMembershipTierRequest request);
}
