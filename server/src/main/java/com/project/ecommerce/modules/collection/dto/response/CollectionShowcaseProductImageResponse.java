package com.project.ecommerce.modules.collection.dto.response;

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
