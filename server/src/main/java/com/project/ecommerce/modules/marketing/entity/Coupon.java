package com.project.ecommerce.modules.marketing.entity;

import com.project.ecommerce.common.entity.BaseEntity;
import com.project.ecommerce.modules.identity.entity.MembershipTier;
import com.project.ecommerce.modules.identity.entity.User;
import com.project.ecommerce.modules.marketing.enums.CouponPaymentMethod;
import com.project.ecommerce.modules.marketing.enums.CouponScope;
import com.project.ecommerce.modules.marketing.enums.DiscountType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "coupons")
public class Coupon extends BaseEntity<String> {

    @Column(nullable = false, unique = true)
    String code;

    @Column(nullable = false)
    String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    DiscountType discountType;

    @Column(nullable = false)
    BigDecimal discountValue;

    @Column(nullable = false)
    BigDecimal minOrderAmount;

    BigDecimal maxDiscountAmount;

    Integer usageLimit;

    @Column(nullable = false)
    Integer usedCount;

    LocalDateTime startsAt;

    LocalDateTime endsAt;

    @Column(nullable = false)
    Boolean active;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    CouponScope scope;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    CouponPaymentMethod paymentMethod;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_membership_tier_id")
    MembershipTier targetMembershipTier;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_user_id")
    User targetUser;
}
