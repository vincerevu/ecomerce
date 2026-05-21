package com.project.ecommerce.modules.marketing.controller;

import com.project.ecommerce.common.dto.response.ApiResponse;
import com.project.ecommerce.common.dto.response.PageResponse;
import com.project.ecommerce.modules.marketing.dto.request.CouponRequest;
import com.project.ecommerce.modules.marketing.dto.request.ValidateCouponRequest;
import com.project.ecommerce.modules.marketing.dto.response.CouponResponse;
import com.project.ecommerce.modules.marketing.dto.response.CouponValidationResponse;
import com.project.ecommerce.modules.marketing.entity.Coupon;
import com.project.ecommerce.modules.marketing.service.CouponService;
import com.turkraft.springfilter.boot.Filter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/coupons")
@RequiredArgsConstructor
@Tag(name = "Coupon Controller", description = "APIs for coupon validation and management")
public class CouponController {

    private final CouponService couponService;

    @GetMapping("/available")
    public ApiResponse<List<CouponValidationResponse>> getAvailableCoupons(
            BigDecimal subtotal,
            String paymentMethod,
            Authentication authentication) {
        String userId = authentication != null ? authentication.getName() : null;
        return ApiResponse.<List<CouponValidationResponse>>builder()
                .code(1000).message("Success")
                .result(couponService.getAvailableCoupons(subtotal, userId, paymentMethod))
                .build();
    }

    @GetMapping("/public")
    public ApiResponse<List<CouponResponse>> getPublicCoupons(Authentication authentication) {
        String userId = authentication != null ? authentication.getName() : null;
        return ApiResponse.<List<CouponResponse>>builder()
                .code(1000).message("Success")
                .result(couponService.getPublicCoupons(userId))
                .build();
    }

    @GetMapping
    public ApiResponse<PageResponse<CouponResponse>> getCoupons(Pageable pageable, @Filter Specification<Coupon> spec) {
        return ApiResponse.<PageResponse<CouponResponse>>builder()
                .code(1000).message("Success")
                .result(couponService.getCoupons(pageable, spec))
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<CouponResponse> getById(@PathVariable String id) {
        return ApiResponse.<CouponResponse>builder()
                .code(1000).message("Success")
                .result(couponService.getById(id))
                .build();
    }

    @PostMapping
    public ApiResponse<CouponResponse> create(@Valid @RequestBody CouponRequest request) {
        return ApiResponse.<CouponResponse>builder()
                .code(1000).message("Coupon created")
                .result(couponService.create(request))
                .build();
    }

    @PutMapping("/{id}")
    public ApiResponse<CouponResponse> update(@PathVariable String id, @Valid @RequestBody CouponRequest request) {
        return ApiResponse.<CouponResponse>builder()
                .code(1000).message("Coupon updated")
                .result(couponService.update(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable String id) {
        couponService.delete(id);
        return ApiResponse.<Void>builder().code(1000).message("Coupon deleted").build();
    }

    @PostMapping("/validate")
    public ApiResponse<CouponValidationResponse> validate(
            @Valid @RequestBody ValidateCouponRequest request,
            Authentication authentication) {
        String userId = authentication != null ? authentication.getName() : null;
        return ApiResponse.<CouponValidationResponse>builder()
                .code(1000).message("Coupon valid")
                .result(couponService.validate(request, userId))
                .build();
    }
}
