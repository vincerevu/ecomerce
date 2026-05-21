package com.project.ecommerce.modules.product.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
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
public class ProductListResponse {
    String id;
    String name;
    String slug;
    String shortDescription;
    String categoryId;
    String categoryName;
    String categorySlug;
    String thumbnailUrl;
    BigDecimal minOriginalPrice;
    BigDecimal minSalePrice;
    BigDecimal displayPrice;
    BigDecimal displayOriginalPrice;
    Integer totalStock;
    Integer variantCount;
    String status;
    LocalDateTime createdAt;
    List<ProductColorSummaryResponse> colors;
}
