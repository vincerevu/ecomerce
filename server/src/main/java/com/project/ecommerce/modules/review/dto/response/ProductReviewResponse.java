package com.project.ecommerce.modules.review.dto.response;

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
public class ProductReviewResponse {
    String id;
    String userId;
    String userName;
    String orderId;
    String orderCode;
    String productId;
    String productName;
    Integer rating;
    String comment;
    Boolean approved;
    LocalDateTime createdAt;
}
