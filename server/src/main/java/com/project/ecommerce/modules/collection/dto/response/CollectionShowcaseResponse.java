package com.project.ecommerce.modules.collection.dto.response;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CollectionShowcaseResponse {
    private String id;
    private String name;
    private String slug;
    private String seoTitle;
    private String seoDescription;
    private String sourceUrl;
    private String coverMediaUrl;
    private String coverMediaType;
    private Integer productCount;
    private Integer linkedProductCount;
    private Integer previewPageCount;
    private List<CollectionShowcaseProductResponse> products;
}
