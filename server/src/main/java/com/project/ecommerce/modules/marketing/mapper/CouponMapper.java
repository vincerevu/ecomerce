package com.project.ecommerce.modules.marketing.mapper;

import com.project.ecommerce.common.mapper.CentralMapperConfig;
import com.project.ecommerce.modules.marketing.dto.request.CouponRequest;
import com.project.ecommerce.modules.marketing.dto.response.CouponResponse;
import com.project.ecommerce.modules.marketing.entity.Coupon;
import org.mapstruct.Builder;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(config = CentralMapperConfig.class, builder = @Builder(disableBuilder = true))
public interface CouponMapper {
    @Mapping(target = "targetMembershipTierId", source = "targetMembershipTier.id")
    @Mapping(target = "targetMembershipTierName", source = "targetMembershipTier.tierName")
    @Mapping(target = "targetUserId", source = "targetUser.id")
    @Mapping(target = "targetUserName", source = "targetUser.name")
    @Mapping(target = "targetUserPhone", source = "targetUser.phone")
    CouponResponse toResponse(Coupon coupon);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updateBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "isDeleted", ignore = true)
    @Mapping(target = "usedCount", expression = "java(0)")
    @Mapping(target = "active", expression = "java(request.getActive() != null ? request.getActive() : true)")
    @Mapping(target = "scope", expression = "java(request.getScope() != null ? request.getScope() : com.project.ecommerce.modules.marketing.enums.CouponScope.ALL)")
    @Mapping(target = "paymentMethod", expression = "java(request.getPaymentMethod() != null ? request.getPaymentMethod() : com.project.ecommerce.modules.marketing.enums.CouponPaymentMethod.ALL)")
    @Mapping(target = "minOrderAmount", expression = "java(request.getMinOrderAmount() != null ? request.getMinOrderAmount() : java.math.BigDecimal.ZERO)")
    @Mapping(target = "targetMembershipTier", ignore = true)
    @Mapping(target = "targetUser", ignore = true)
    Coupon toEntity(CouponRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updateBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "isDeleted", ignore = true)
    @Mapping(target = "usedCount", ignore = true)
    @Mapping(target = "active", expression = "java(request.getActive() != null ? request.getActive() : coupon.getActive())")
    @Mapping(target = "scope", expression = "java(request.getScope() != null ? request.getScope() : com.project.ecommerce.modules.marketing.enums.CouponScope.ALL)")
    @Mapping(target = "paymentMethod", expression = "java(request.getPaymentMethod() != null ? request.getPaymentMethod() : com.project.ecommerce.modules.marketing.enums.CouponPaymentMethod.ALL)")
    @Mapping(target = "minOrderAmount", expression = "java(request.getMinOrderAmount() != null ? request.getMinOrderAmount() : java.math.BigDecimal.ZERO)")
    @Mapping(target = "targetMembershipTier", ignore = true)
    @Mapping(target = "targetUser", ignore = true)
    void update(@MappingTarget Coupon coupon, CouponRequest request);
}
