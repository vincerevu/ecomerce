package com.project.ecommerce.modules.collection.dto.response;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CollectionShowcaseProductVariantResponse {
    private String id;
    private String sizeName;
    private BigDecimal originalPrice;
    private BigDecimal salePrice;
    private Integer stockQuantity;
}
