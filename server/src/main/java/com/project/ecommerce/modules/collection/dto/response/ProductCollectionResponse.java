package com.project.ecommerce.modules.collection.dto.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProductCollectionResponse {
    String id;
    String name;
    String slug;
    String seoTitle;
    String seoDescription;
    String canonicalUrl;
    String sourceUrl;
    String coverMediaUrl;
    String coverMediaType;
    Integer productCount;
    Integer linkedProductCount;
    Integer sortOrder;
    Boolean status;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
    List<ProductCollectionProductResponse> products;
}
