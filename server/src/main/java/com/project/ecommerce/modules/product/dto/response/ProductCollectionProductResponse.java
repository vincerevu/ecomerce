package com.project.ecommerce.modules.product.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductCollectionProductResponse {
    private String id;
    private String name;
    private String slug;
    private String status;
    private String imageUrl;
}
