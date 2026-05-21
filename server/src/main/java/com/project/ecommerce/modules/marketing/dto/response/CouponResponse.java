package com.project.ecommerce.modules.marketing.dto.response;

import com.project.ecommerce.modules.marketing.enums.CouponPaymentMethod;
import com.project.ecommerce.modules.marketing.enums.CouponScope;
import com.project.ecommerce.modules.marketing.enums.DiscountType;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CouponResponse {
    String id;
    String code;
    String name;
    DiscountType discountType;
    BigDecimal discountValue;
    BigDecimal minOrderAmount;
    BigDecimal maxDiscountAmount;
    Integer usageLimit;
    Integer usedCount;
    LocalDateTime startsAt;
    LocalDateTime endsAt;
    Boolean active;
    CouponScope scope;
    CouponPaymentMethod paymentMethod;
    String targetMembershipTierId;
    String targetMembershipTierName;
    String targetUserId;
    String targetUserName;
    String targetUserPhone;
    LocalDateTime createdAt;
}
