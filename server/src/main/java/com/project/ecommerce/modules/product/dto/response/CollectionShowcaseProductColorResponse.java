package com.project.ecommerce.modules.product.dto.response;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CollectionShowcaseProductColorResponse {
    private String id;
    private String colorName;
    private String hexCode;
    private List<CollectionShowcaseProductImageResponse> images;
    private List<CollectionShowcaseProductVariantResponse> variants;
}
