package com.project.ecommerce.modules.review.mapper;

import com.project.ecommerce.common.mapper.CentralMapperConfig;
import com.project.ecommerce.modules.review.dto.response.ProductReviewResponse;
import com.project.ecommerce.modules.review.entity.ProductReview;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(config = CentralMapperConfig.class)
public interface ProductReviewMapper {
    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "userName", source = "user.name")
    @Mapping(target = "orderId", source = "order.id")
    @Mapping(target = "orderCode", source = "order.orderCode")
    @Mapping(target = "productId", source = "product.id")
    @Mapping(target = "productName", source = "product.name")
    ProductReviewResponse toResponse(ProductReview review);
}
