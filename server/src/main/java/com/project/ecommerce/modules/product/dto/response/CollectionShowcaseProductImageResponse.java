package com.project.ecommerce.modules.product.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CollectionShowcaseProductImageResponse {
    private String id;
    private String url;
    private boolean isMain;
}
