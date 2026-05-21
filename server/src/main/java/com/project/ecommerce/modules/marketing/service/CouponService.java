package com.project.ecommerce.modules.marketing.service;

import com.project.ecommerce.common.dto.response.PageResponse;
import com.project.ecommerce.common.exceptions.AppException;
import com.project.ecommerce.common.exceptions.ErrorCode;
import com.project.ecommerce.modules.identity.entity.MembershipTier;
import com.project.ecommerce.modules.identity.entity.User;
import com.project.ecommerce.modules.identity.repository.MembershipTierRepository;
import com.project.ecommerce.modules.identity.repository.UserRepository;
import com.project.ecommerce.modules.marketing.dto.request.CouponRequest;
import com.project.ecommerce.modules.marketing.dto.request.ValidateCouponRequest;
import com.project.ecommerce.modules.marketing.dto.response.CouponResponse;
import com.project.ecommerce.modules.marketing.dto.response.CouponValidationResponse;
import com.project.ecommerce.modules.marketing.entity.Coupon;
import com.project.ecommerce.modules.marketing.enums.CouponPaymentMethod;
import com.project.ecommerce.modules.marketing.enums.CouponScope;
import com.project.ecommerce.modules.marketing.enums.DiscountType;
import com.project.ecommerce.modules.marketing.mapper.CouponMapper;
import com.project.ecommerce.modules.marketing.repository.CouponRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CouponService {

    private final CouponRepository couponRepository;
    private final CouponMapper couponMapper;
    private final MembershipTierRepository membershipTierRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    @PreAuthorize("hasAuthority('COUPON:VIEW')")
    public PageResponse<CouponResponse> getCoupons(Pageable pageable, Specification<Coupon> spec) {
        Page<Coupon> couponPage = couponRepository.findAll(spec, pageable);
        return PageResponse.<CouponResponse>builder()
                .currentPage(pageable.getPageNumber())
                .pageSize(pageable.getPageSize())
                .totalPages(couponPage.getTotalPages())
                .totalElements(couponPage.getTotalElements())
                .last(couponPage.isLast())
                .data(couponPage.getContent().stream().map(couponMapper::toResponse).toList())
                .build();
    }

    @Transactional(readOnly = true)
    @PreAuthorize("hasAuthority('COUPON:VIEW')")
    public CouponResponse getById(String id) {
        return couponMapper.toResponse(findOrThrow(id));
    }

    @Transactional
    @PreAuthorize("hasAuthority('COUPON:CREATE')")
    public CouponResponse create(CouponRequest request) {
        String normalizedCode = normalizeCode(request.getCode());
        if (couponRepository.existsByCodeIgnoreCase(normalizedCode)) {
            throw new AppException(ErrorCode.COUPON_CODE_ALREADY_EXISTS);
        }
        Coupon coupon = couponMapper.toEntity(request);
        coupon.setCode(normalizedCode);
        applyScope(coupon, request);
        return couponMapper.toResponse(couponRepository.save(coupon));
    }

    @Transactional
    @PreAuthorize("hasAuthority('COUPON:UPDATE')")
    public CouponResponse update(String id, CouponRequest request) {
        Coupon coupon = findOrThrow(id);
        String normalizedCode = normalizeCode(request.getCode());
        if (couponRepository.existsByCodeIgnoreCaseAndIdNot(normalizedCode, id)) {
            throw new AppException(ErrorCode.COUPON_CODE_ALREADY_EXISTS);
        }
        couponMapper.update(coupon, request);
        coupon.setCode(normalizedCode);
        applyScope(coupon, request);
        return couponMapper.toResponse(couponRepository.save(coupon));
    }

    @Transactional
    @PreAuthorize("hasAuthority('COUPON:DELETE')")
    public void delete(String id) {
        Coupon coupon = findOrThrow(id);
        coupon.setIsDeleted(true);
        couponRepository.save(coupon);
    }

    @Transactional(readOnly = true)
    public CouponValidationResponse validate(ValidateCouponRequest request, String userId) {
        Coupon coupon = findActiveCoupon(request.getCode(), request.getSubtotal(), userId, request.getPaymentMethod());
        return buildValidationResponse(coupon, request.getSubtotal());
    }

    @Transactional(readOnly = true)
    public List<CouponValidationResponse> getAvailableCoupons(BigDecimal subtotal, String userId, String paymentMethod) {
        BigDecimal safeSubtotal = subtotal == null ? BigDecimal.ZERO : subtotal.max(BigDecimal.ZERO);
        return couponRepository.findTop20ByActiveTrueOrderByCreatedAtDesc().stream()
                .filter(coupon -> isCouponAvailable(coupon, safeSubtotal, userId, paymentMethod))
                .map(coupon -> buildValidationResponse(coupon, safeSubtotal))
                .limit(6)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CouponResponse> getPublicCoupons(String userId) {
        return couponRepository.findTop20ByActiveTrueOrderByCreatedAtDesc().stream()
                .filter(coupon -> isCouponVisible(coupon, userId))
                .map(couponMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public CouponValidationResponse validateForOrder(String code, BigDecimal subtotal, String userId, String paymentMethod) {
        if (code == null || code.isBlank()) {
            return null;
        }
        return buildValidationResponse(findActiveCoupon(code, subtotal, userId, paymentMethod), subtotal);
    }

    @Transactional
    public CouponValidationResponse claimForOrder(String code, BigDecimal subtotal, String userId, String paymentMethod) {
        if (code == null || code.isBlank()) {
            return null;
        }

        Coupon coupon = couponRepository.findByCodeIgnoreCaseForUpdate(normalizeCode(code))
                .orElseThrow(() -> new AppException(ErrorCode.COUPON_NOT_FOUND));
        validateCouponAvailability(coupon, subtotal, userId, paymentMethod);
        CouponValidationResponse response = buildValidationResponse(coupon, subtotal);
        coupon.setUsedCount((coupon.getUsedCount() == null ? 0 : coupon.getUsedCount()) + 1);
        couponRepository.save(coupon);
        return response;
    }

    @Transactional
    public void markUsed(String couponCode) {
        if (couponCode == null || couponCode.isBlank()) {
            return;
        }
        Coupon coupon = couponRepository.findByCodeIgnoreCaseForUpdate(normalizeCode(couponCode))
                .orElseThrow(() -> new AppException(ErrorCode.COUPON_NOT_FOUND));
        validateCouponBaseRules(coupon);
        coupon.setUsedCount((coupon.getUsedCount() == null ? 0 : coupon.getUsedCount()) + 1);
        couponRepository.save(coupon);
    }

    public BigDecimal calculateDiscount(Coupon coupon, BigDecimal subtotal) {
        BigDecimal safeSubtotal = subtotal == null ? BigDecimal.ZERO : subtotal.max(BigDecimal.ZERO);
        BigDecimal discount = coupon.getDiscountType() == DiscountType.PERCENT
                ? safeSubtotal.multiply(coupon.getDiscountValue()).divide(BigDecimal.valueOf(100), 0, RoundingMode.DOWN)
                : coupon.getDiscountValue();

        if (coupon.getMaxDiscountAmount() != null && coupon.getMaxDiscountAmount().compareTo(BigDecimal.ZERO) > 0) {
            discount = discount.min(coupon.getMaxDiscountAmount());
        }
        return discount.max(BigDecimal.ZERO).min(safeSubtotal);
    }

    private Coupon findOrThrow(String id) {
        return couponRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.COUPON_NOT_FOUND));
    }

    private Coupon findActiveCoupon(String code, BigDecimal subtotal, String userId, String paymentMethod) {
        Coupon coupon = couponRepository.findByCodeIgnoreCase(normalizeCode(code))
                .orElseThrow(() -> new AppException(ErrorCode.COUPON_NOT_FOUND));
        validateCouponAvailability(coupon, subtotal, userId, paymentMethod);
        return coupon;
    }

    private void validateCouponAvailability(Coupon coupon, BigDecimal subtotal, String userId, String paymentMethod) {
        validateCouponBaseRules(coupon);
        BigDecimal minOrder = coupon.getMinOrderAmount() == null ? BigDecimal.ZERO : coupon.getMinOrderAmount();
        if ((subtotal == null ? BigDecimal.ZERO : subtotal).compareTo(minOrder) < 0) {
            throw new AppException(ErrorCode.COUPON_MIN_ORDER_NOT_MET);
        }
        validateScope(coupon, userId);
        validatePaymentMethod(coupon, paymentMethod);
    }

    private boolean isCouponAvailable(Coupon coupon, BigDecimal subtotal, String userId, String paymentMethod) {
        try {
            validateCouponAvailability(coupon, subtotal, userId, paymentMethod);
            return true;
        } catch (AppException exception) {
            return false;
        }
    }

    private boolean isCouponVisible(Coupon coupon, String userId) {
        try {
            validateCouponBaseRules(coupon);
            validateScope(coupon, userId);
            return true;
        } catch (AppException exception) {
            return false;
        }
    }

    private void validatePaymentMethod(Coupon coupon, String paymentMethod) {
        CouponPaymentMethod requiredMethod = coupon.getPaymentMethod() == null
                ? CouponPaymentMethod.ALL
                : coupon.getPaymentMethod();
        if (requiredMethod == CouponPaymentMethod.ALL) {
            return;
        }
        if (paymentMethod == null || paymentMethod.isBlank()) {
            throw new AppException(ErrorCode.COUPON_NOT_APPLICABLE);
        }
        if (!requiredMethod.name().equalsIgnoreCase(paymentMethod.trim())) {
            throw new AppException(ErrorCode.COUPON_NOT_APPLICABLE);
        }
    }

    private void validateCouponBaseRules(Coupon coupon) {
        LocalDateTime now = LocalDateTime.now();

        if (!Boolean.TRUE.equals(coupon.getActive())) {
            throw new AppException(ErrorCode.COUPON_INACTIVE);
        }
        if (coupon.getStartsAt() != null && coupon.getStartsAt().isAfter(now)) {
            throw new AppException(ErrorCode.COUPON_NOT_STARTED);
        }
        if (coupon.getEndsAt() != null && coupon.getEndsAt().isBefore(now)) {
            throw new AppException(ErrorCode.COUPON_EXPIRED);
        }
        if (coupon.getUsageLimit() != null && coupon.getUsageLimit() > 0
                && (coupon.getUsedCount() == null ? 0 : coupon.getUsedCount()) >= coupon.getUsageLimit()) {
            throw new AppException(ErrorCode.COUPON_USAGE_LIMIT_REACHED);
        }
    }

    private void applyScope(Coupon coupon, CouponRequest request) {
        CouponScope scope = request.getScope() == null ? CouponScope.ALL : request.getScope();
        coupon.setScope(scope);
        coupon.setTargetMembershipTier(null);
        coupon.setTargetUser(null);

        if (scope == CouponScope.MEMBERSHIP_TIER) {
            if (request.getTargetMembershipTierId() == null || request.getTargetMembershipTierId().isBlank()) {
                throw new AppException(ErrorCode.COUPON_TARGET_REQUIRED);
            }
            MembershipTier tier = membershipTierRepository.findById(request.getTargetMembershipTierId())
                    .orElseThrow(() -> new AppException(ErrorCode.COUPON_TARGET_REQUIRED));
            coupon.setTargetMembershipTier(tier);
            return;
        }

        if (scope == CouponScope.CUSTOMER) {
            if (request.getTargetUserId() == null || request.getTargetUserId().isBlank()) {
                throw new AppException(ErrorCode.COUPON_TARGET_REQUIRED);
            }
            User user = userRepository.findById(request.getTargetUserId())
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
            coupon.setTargetUser(user);
        }
    }

    private void validateScope(Coupon coupon, String userId) {
        CouponScope scope = coupon.getScope() == null ? CouponScope.ALL : coupon.getScope();
        if (scope == CouponScope.ALL) {
            return;
        }
        if (userId == null || userId.isBlank() || "anonymousUser".equals(userId)) {
            throw new AppException(ErrorCode.COUPON_NOT_APPLICABLE);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        if (scope == CouponScope.CUSTOMER) {
            String targetUserId = coupon.getTargetUser() != null ? coupon.getTargetUser().getId() : null;
            if (!user.getId().equals(targetUserId)) {
                throw new AppException(ErrorCode.COUPON_NOT_APPLICABLE);
            }
            return;
        }

        String userTierId = user.getMembershipTier() != null ? user.getMembershipTier().getId() : null;
        String targetTierId = coupon.getTargetMembershipTier() != null ? coupon.getTargetMembershipTier().getId() : null;
        if (userTierId == null || !userTierId.equals(targetTierId)) {
            throw new AppException(ErrorCode.COUPON_NOT_APPLICABLE);
        }
    }

    private CouponValidationResponse buildValidationResponse(Coupon coupon, BigDecimal subtotal) {
        BigDecimal safeSubtotal = subtotal == null ? BigDecimal.ZERO : subtotal.max(BigDecimal.ZERO);
        BigDecimal discountAmount = calculateDiscount(coupon, safeSubtotal);
        return CouponValidationResponse.builder()
                .couponId(coupon.getId())
                .code(coupon.getCode())
                .name(coupon.getName())
                .subtotal(safeSubtotal)
                .discountAmount(discountAmount)
                .totalAfterDiscount(safeSubtotal.subtract(discountAmount))
                .build();
    }

    private String normalizeCode(String code) {
        return code == null ? "" : code.trim().toUpperCase();
    }
}
