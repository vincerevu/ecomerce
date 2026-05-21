package com.project.ecommerce.modules.review.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.project.ecommerce.common.exceptions.AppException;
import com.project.ecommerce.common.exceptions.ErrorCode;
import com.project.ecommerce.modules.identity.repository.UserRepository;
import com.project.ecommerce.modules.order.repository.OrderRepository;
import com.project.ecommerce.modules.product.repository.ProductRepository;
import com.project.ecommerce.modules.review.dto.request.CreateProductReviewRequest;
import com.project.ecommerce.modules.review.mapper.ProductReviewMapper;
import com.project.ecommerce.modules.review.repository.ProductReviewRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ProductReviewServiceTest {

    @Mock
    ProductReviewRepository reviewRepository;

    @Mock
    OrderRepository orderRepository;

    @Mock
    ProductRepository productRepository;

    @Mock
    UserRepository userRepository;

    @Mock
    ProductReviewMapper reviewMapper;

    @InjectMocks
    ProductReviewService reviewService;

    @Test
    void create_rejectsProductNotDeliveredToUser() {
        CreateProductReviewRequest request = new CreateProductReviewRequest();
        request.setOrderId("order-1");
        request.setProductId("product-1");
        request.setRating(5);
        when(orderRepository.existsDeliveredProductForUser("user-1", "order-1", "product-1"))
                .thenReturn(false);

        assertThatThrownBy(() -> reviewService.create("user-1", request))
                .isInstanceOf(AppException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.REVIEW_NOT_ALLOWED);
    }

    @Test
    void create_rejectsDuplicateReviewForSameOrderProduct() {
        CreateProductReviewRequest request = new CreateProductReviewRequest();
        request.setOrderId("order-1");
        request.setProductId("product-1");
        request.setRating(5);
        when(orderRepository.existsDeliveredProductForUser("user-1", "order-1", "product-1"))
                .thenReturn(true);
        when(reviewRepository.existsByUserIdAndOrderIdAndProductId("user-1", "order-1", "product-1"))
                .thenReturn(true);

        assertThatThrownBy(() -> reviewService.create("user-1", request))
                .isInstanceOf(AppException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.REVIEW_ALREADY_EXISTS);
    }
}
