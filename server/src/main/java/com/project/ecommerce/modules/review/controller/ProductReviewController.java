package com.project.ecommerce.modules.review.controller;

import com.project.ecommerce.common.dto.response.ApiResponse;
import com.project.ecommerce.common.dto.response.PageResponse;
import com.project.ecommerce.common.exceptions.AppException;
import com.project.ecommerce.common.exceptions.ErrorCode;
import com.project.ecommerce.modules.review.dto.request.CreateProductReviewRequest;
import com.project.ecommerce.modules.review.dto.request.UpdateProductReviewRequest;
import com.project.ecommerce.modules.review.dto.response.ProductReviewResponse;
import com.project.ecommerce.modules.review.dto.response.ProductReviewSummaryResponse;
import com.project.ecommerce.modules.review.entity.ProductReview;
import com.project.ecommerce.modules.review.service.ProductReviewService;
import com.turkraft.springfilter.boot.Filter;
import jakarta.validation.Valid;
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
@RequestMapping("/api/v1/reviews")
@RequiredArgsConstructor
public class ProductReviewController {

    private final ProductReviewService reviewService;

    @GetMapping
    public ApiResponse<PageResponse<ProductReviewResponse>> getReviews(Pageable pageable, @Filter Specification<ProductReview> spec) {
        return ApiResponse.<PageResponse<ProductReviewResponse>>builder()
                .code(1000).message("Success")
                .result(reviewService.getReviews(pageable, spec))
                .build();
    }

    @GetMapping("/products/{productId}")
    public ApiResponse<PageResponse<ProductReviewResponse>> getByProduct(@PathVariable String productId, Pageable pageable) {
        return ApiResponse.<PageResponse<ProductReviewResponse>>builder()
                .code(1000).message("Success")
                .result(reviewService.getApprovedByProduct(productId, pageable))
                .build();
    }

    @GetMapping("/products/{productId}/summary")
    public ApiResponse<ProductReviewSummaryResponse> getSummary(@PathVariable String productId) {
        return ApiResponse.<ProductReviewSummaryResponse>builder()
                .code(1000).message("Success")
                .result(reviewService.getSummary(productId))
                .build();
    }

    @GetMapping("/mine/orders/{orderId}")
    public ApiResponse<List<ProductReviewResponse>> getMineByOrder(
            @PathVariable String orderId,
            Authentication authentication) {
        if (authentication == null || "anonymousUser".equals(authentication.getName())) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        return ApiResponse.<List<ProductReviewResponse>>builder()
                .code(1000).message("Success")
                .result(reviewService.getMineByOrder(authentication.getName(), orderId))
                .build();
    }

    @PostMapping
    public ApiResponse<ProductReviewResponse> create(
            @Valid @RequestBody CreateProductReviewRequest request,
            Authentication authentication) {
        if (authentication == null || "anonymousUser".equals(authentication.getName())) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        return ApiResponse.<ProductReviewResponse>builder()
                .code(1000).message("Review created")
                .result(reviewService.create(authentication.getName(), request))
                .build();
    }

    @PutMapping("/{id}")
    public ApiResponse<ProductReviewResponse> update(@PathVariable String id, @Valid @RequestBody UpdateProductReviewRequest request) {
        return ApiResponse.<ProductReviewResponse>builder()
                .code(1000).message("Review updated")
                .result(reviewService.update(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable String id) {
        reviewService.delete(id);
        return ApiResponse.<Void>builder().code(1000).message("Review deleted").build();
    }
}
