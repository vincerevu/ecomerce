package com.project.ecommerce.modules.review.service;

import com.project.ecommerce.common.dto.response.PageResponse;
import com.project.ecommerce.common.exceptions.AppException;
import com.project.ecommerce.common.exceptions.ErrorCode;
import com.project.ecommerce.modules.identity.entity.User;
import com.project.ecommerce.modules.identity.repository.UserRepository;
import com.project.ecommerce.modules.order.entity.Order;
import com.project.ecommerce.modules.order.repository.OrderRepository;
import com.project.ecommerce.modules.product.entity.Product;
import com.project.ecommerce.modules.product.repository.ProductRepository;
import com.project.ecommerce.modules.review.dto.request.CreateProductReviewRequest;
import com.project.ecommerce.modules.review.dto.request.UpdateProductReviewRequest;
import com.project.ecommerce.modules.review.dto.response.ProductReviewResponse;
import com.project.ecommerce.modules.review.dto.response.ProductReviewSummaryResponse;
import com.project.ecommerce.modules.review.entity.ProductReview;
import com.project.ecommerce.modules.review.mapper.ProductReviewMapper;
import com.project.ecommerce.modules.review.repository.ProductReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProductReviewService {

    private final ProductReviewRepository reviewRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final ProductReviewMapper reviewMapper;

    @Transactional(readOnly = true)
    @PreAuthorize("hasAuthority('REVIEW:VIEW')")
    public PageResponse<ProductReviewResponse> getReviews(Pageable pageable, Specification<ProductReview> spec) {
        Page<ProductReview> reviewPage = reviewRepository.findAll(spec, pageable);
        return PageResponse.<ProductReviewResponse>builder()
                .currentPage(pageable.getPageNumber())
                .pageSize(pageable.getPageSize())
                .totalPages(reviewPage.getTotalPages())
                .totalElements(reviewPage.getTotalElements())
                .last(reviewPage.isLast())
                .data(reviewPage.getContent().stream().map(reviewMapper::toResponse).toList())
                .build();
    }

    @Transactional(readOnly = true)
    public PageResponse<ProductReviewResponse> getApprovedByProduct(String productId, Pageable pageable) {
        Specification<ProductReview> spec = (root, query, cb) -> cb.and(
                cb.equal(root.get("product").get("id"), productId),
                cb.isTrue(root.get("approved")));
        Page<ProductReview> reviewPage = reviewRepository.findAll(spec, pageable);
        return PageResponse.<ProductReviewResponse>builder()
                .currentPage(pageable.getPageNumber())
                .pageSize(pageable.getPageSize())
                .totalPages(reviewPage.getTotalPages())
                .totalElements(reviewPage.getTotalElements())
                .last(reviewPage.isLast())
                .data(reviewPage.getContent().stream().map(reviewMapper::toResponse).toList())
                .build();
    }

    @Transactional(readOnly = true)
    public ProductReviewSummaryResponse getSummary(String productId) {
        return ProductReviewSummaryResponse.builder()
                .productId(productId)
                .averageRating(reviewRepository.averageRatingByProductId(productId))
                .reviewCount(reviewRepository.countByProductIdAndApprovedTrue(productId))
                .build();
    }

    @Transactional(readOnly = true)
    public java.util.List<ProductReviewResponse> getMineByOrder(String userId, String orderId) {
        return reviewRepository.findByUserIdAndOrderId(userId, orderId)
                .stream()
                .map(reviewMapper::toResponse)
                .toList();
    }

    @Transactional
    public ProductReviewResponse create(String userId, CreateProductReviewRequest request) {
        if (!orderRepository.existsDeliveredProductForUser(userId, request.getOrderId(), request.getProductId())) {
            throw new AppException(ErrorCode.REVIEW_NOT_ALLOWED);
        }
        if (reviewRepository.existsByUserIdAndOrderIdAndProductId(userId, request.getOrderId(), request.getProductId())) {
            throw new AppException(ErrorCode.REVIEW_ALREADY_EXISTS);
        }

        User user = userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        Order order = orderRepository.findById(request.getOrderId()).orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        Product product = productRepository.findById(request.getProductId()).orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        ProductReview review = ProductReview.builder()
                .user(user)
                .order(order)
                .product(product)
                .rating(request.getRating())
                .comment(request.getComment() == null ? null : request.getComment().trim())
                .approved(true)
                .build();
        return reviewMapper.toResponse(reviewRepository.save(review));
    }

    @Transactional
    @PreAuthorize("hasAuthority('REVIEW:UPDATE')")
    public ProductReviewResponse update(String id, UpdateProductReviewRequest request) {
        ProductReview review = findOrThrow(id);
        review.setRating(request.getRating());
        review.setComment(request.getComment() == null ? null : request.getComment().trim());
        if (request.getApproved() != null) {
            review.setApproved(request.getApproved());
        }
        return reviewMapper.toResponse(reviewRepository.save(review));
    }

    @Transactional
    @PreAuthorize("hasAuthority('REVIEW:DELETE')")
    public void delete(String id) {
        ProductReview review = findOrThrow(id);
        review.setIsDeleted(true);
        reviewRepository.save(review);
    }

    private ProductReview findOrThrow(String id) {
        return reviewRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.REVIEW_NOT_FOUND));
    }
}
