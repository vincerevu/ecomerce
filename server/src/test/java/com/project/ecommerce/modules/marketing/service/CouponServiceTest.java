package com.project.ecommerce.modules.marketing.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;

import com.project.ecommerce.common.exceptions.AppException;
import com.project.ecommerce.common.exceptions.ErrorCode;
import com.project.ecommerce.modules.identity.entity.MembershipTier;
import com.project.ecommerce.modules.identity.entity.User;
import com.project.ecommerce.modules.identity.repository.MembershipTierRepository;
import com.project.ecommerce.modules.identity.repository.UserRepository;
import com.project.ecommerce.modules.marketing.entity.Coupon;
import com.project.ecommerce.modules.marketing.enums.CouponPaymentMethod;
import com.project.ecommerce.modules.marketing.enums.CouponScope;
import com.project.ecommerce.modules.marketing.enums.DiscountType;
import com.project.ecommerce.modules.marketing.mapper.CouponMapper;
import com.project.ecommerce.modules.marketing.repository.CouponRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CouponServiceTest {

    @Mock
    CouponRepository couponRepository;

    @Mock
    CouponMapper couponMapper;

    @Mock
    MembershipTierRepository membershipTierRepository;

    @Mock
    UserRepository userRepository;

    @InjectMocks
    CouponService couponService;

    @Test
    void calculateDiscount_capsPercentDiscountAtMaxAmount() {
        Coupon coupon = Coupon.builder()
                .discountType(DiscountType.PERCENT)
                .discountValue(BigDecimal.valueOf(20))
                .maxDiscountAmount(BigDecimal.valueOf(30000))
                .build();

        BigDecimal discount = couponService.calculateDiscount(coupon, BigDecimal.valueOf(500000));

        assertThat(discount).isEqualByComparingTo("30000");
    }

    @Test
    void calculateDiscount_doesNotExceedSubtotal() {
        Coupon coupon = Coupon.builder()
                .discountType(DiscountType.FIXED)
                .discountValue(BigDecimal.valueOf(200000))
                .build();

        BigDecimal discount = couponService.calculateDiscount(coupon, BigDecimal.valueOf(120000));

        assertThat(discount).isEqualByComparingTo("120000");
    }

    @Test
    void validateForOrder_rejectsExpiredCoupon() {
        Coupon coupon = Coupon.builder()
                .code("SALE")
                .name("Sale")
                .active(true)
                .discountType(DiscountType.PERCENT)
                .discountValue(BigDecimal.TEN)
                .minOrderAmount(BigDecimal.ZERO)
                .usedCount(0)
                .endsAt(LocalDateTime.now().minusDays(1))
                .build();
        when(couponRepository.findByCodeIgnoreCase("SALE")).thenReturn(Optional.of(coupon));

        assertThatThrownBy(() -> couponService.validateForOrder("sale", BigDecimal.valueOf(100000), "user-1", "COD"))
                .isInstanceOf(AppException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.COUPON_EXPIRED);
    }

    @Test
    void validateForOrder_rejectsCouponForDifferentMembershipTier() {
        MembershipTier gold = MembershipTier.builder().id("tier-gold").tierName("Gold").build();
        MembershipTier silver = MembershipTier.builder().id("tier-silver").tierName("Silver").build();
        User user = User.builder().id("user-1").membershipTier(silver).build();
        Coupon coupon = Coupon.builder()
                .code("GOLD10")
                .name("Gold")
                .active(true)
                .scope(CouponScope.MEMBERSHIP_TIER)
                .targetMembershipTier(gold)
                .discountType(DiscountType.PERCENT)
                .discountValue(BigDecimal.TEN)
                .minOrderAmount(BigDecimal.ZERO)
                .usedCount(0)
                .build();
        when(couponRepository.findByCodeIgnoreCase("GOLD10")).thenReturn(Optional.of(coupon));
        when(userRepository.findById("user-1")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> couponService.validateForOrder("gold10", BigDecimal.valueOf(100000), "user-1", "COD"))
                .isInstanceOf(AppException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.COUPON_NOT_APPLICABLE);
    }

    @Test
    void validateForOrder_allowsCouponForTargetCustomer() {
        User targetUser = User.builder().id("user-1").build();
        Coupon coupon = Coupon.builder()
                .id("coupon-1")
                .code("VIP")
                .name("Vip")
                .active(true)
                .scope(CouponScope.CUSTOMER)
                .targetUser(targetUser)
                .discountType(DiscountType.FIXED)
                .discountValue(BigDecimal.valueOf(25000))
                .minOrderAmount(BigDecimal.ZERO)
                .usedCount(0)
                .build();
        when(couponRepository.findByCodeIgnoreCase("VIP")).thenReturn(Optional.of(coupon));
        when(userRepository.findById("user-1")).thenReturn(Optional.of(targetUser));

        var response = couponService.validateForOrder("vip", BigDecimal.valueOf(100000), "user-1", "COD");

        assertThat(response.getDiscountAmount()).isEqualByComparingTo("25000");
    }

    @Test
    void getAvailableCoupons_returnsOnlyCouponsApplicableToCurrentSubtotalAndUser() {
        MembershipTier gold = MembershipTier.builder().id("tier-gold").tierName("Gold").build();
        User user = User.builder().id("user-1").membershipTier(gold).build();
        Coupon allCoupon = Coupon.builder()
                .id("coupon-all")
                .code("ALL10")
                .name("All")
                .active(true)
                .scope(CouponScope.ALL)
                .discountType(DiscountType.FIXED)
                .discountValue(BigDecimal.valueOf(10000))
                .minOrderAmount(BigDecimal.ZERO)
                .usedCount(0)
                .build();
        Coupon highMinCoupon = Coupon.builder()
                .id("coupon-high")
                .code("HIGH")
                .name("High")
                .active(true)
                .scope(CouponScope.ALL)
                .discountType(DiscountType.FIXED)
                .discountValue(BigDecimal.valueOf(10000))
                .minOrderAmount(BigDecimal.valueOf(1000000))
                .usedCount(0)
                .build();
        Coupon tierCoupon = Coupon.builder()
                .id("coupon-tier")
                .code("GOLD")
                .name("Gold")
                .active(true)
                .scope(CouponScope.MEMBERSHIP_TIER)
                .targetMembershipTier(gold)
                .discountType(DiscountType.PERCENT)
                .discountValue(BigDecimal.TEN)
                .minOrderAmount(BigDecimal.ZERO)
                .usedCount(0)
                .build();
        when(couponRepository.findTop20ByActiveTrueOrderByCreatedAtDesc())
                .thenReturn(List.of(allCoupon, highMinCoupon, tierCoupon));
        when(userRepository.findById("user-1")).thenReturn(Optional.of(user));

        var response = couponService.getAvailableCoupons(BigDecimal.valueOf(200000), "user-1", "COD");

        assertThat(response).extracting("code").containsExactly("ALL10", "GOLD");
    }

    @Test
    void getPublicCoupons_includesVisibleCouponEvenWhenMinimumOrderIsHigher() {
        Coupon coupon = Coupon.builder()
                .id("coupon-high")
                .code("HIGH")
                .name("High")
                .active(true)
                .scope(CouponScope.ALL)
                .discountType(DiscountType.FIXED)
                .discountValue(BigDecimal.valueOf(10000))
                .minOrderAmount(BigDecimal.valueOf(1000000))
                .usedCount(0)
                .build();
        when(couponRepository.findTop20ByActiveTrueOrderByCreatedAtDesc()).thenReturn(List.of(coupon));
        lenient().when(couponMapper.toResponse(coupon))
                .thenReturn(com.project.ecommerce.modules.marketing.dto.response.CouponResponse.builder()
                        .id("coupon-high")
                        .code("HIGH")
                        .name("High")
                        .build());

        var response = couponService.getPublicCoupons(null);

        assertThat(response).extracting("code").containsExactly("HIGH");
    }

    @Test
    void claimForOrder_locksCouponAndIncrementsUsedCount() {
        Coupon coupon = Coupon.builder()
                .id("coupon-claim")
                .code("CLAIM")
                .name("Claim")
                .active(true)
                .scope(CouponScope.ALL)
                .paymentMethod(CouponPaymentMethod.ALL)
                .discountType(DiscountType.FIXED)
                .discountValue(BigDecimal.valueOf(15000))
                .minOrderAmount(BigDecimal.ZERO)
                .usedCount(0)
                .usageLimit(1)
                .build();
        when(couponRepository.findByCodeIgnoreCaseForUpdate("CLAIM")).thenReturn(Optional.of(coupon));

        var response = couponService.claimForOrder("claim", BigDecimal.valueOf(100000), "user-1", "COD");

        assertThat(response.getDiscountAmount()).isEqualByComparingTo("15000");
        assertThat(coupon.getUsedCount()).isEqualTo(1);
        verify(couponRepository).save(coupon);
    }

    @Test
    void getAvailableCoupons_filtersByPaymentMethod() {
        Coupon codCoupon = Coupon.builder()
                .id("coupon-cod")
                .code("CODONLY")
                .name("Cod only")
                .active(true)
                .scope(CouponScope.ALL)
                .paymentMethod(CouponPaymentMethod.COD)
                .discountType(DiscountType.FIXED)
                .discountValue(BigDecimal.valueOf(10000))
                .minOrderAmount(BigDecimal.ZERO)
                .usedCount(0)
                .build();
        Coupon sepayCoupon = Coupon.builder()
                .id("coupon-sepay")
                .code("SEPAYONLY")
                .name("Sepay only")
                .active(true)
                .scope(CouponScope.ALL)
                .paymentMethod(CouponPaymentMethod.SEPAY)
                .discountType(DiscountType.FIXED)
                .discountValue(BigDecimal.valueOf(10000))
                .minOrderAmount(BigDecimal.ZERO)
                .usedCount(0)
                .build();
        when(couponRepository.findTop20ByActiveTrueOrderByCreatedAtDesc())
                .thenReturn(List.of(codCoupon, sepayCoupon));

        var response = couponService.getAvailableCoupons(BigDecimal.valueOf(200000), "user-1", "SEPAY");

        assertThat(response).extracting("code").containsExactly("SEPAYONLY");
    }
}
