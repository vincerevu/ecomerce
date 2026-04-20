package com.project.ecommerce.modules.product.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProductResponse {
    String id;
    String name;
    String slug;
    String description;
    String shortDescription;
    String material;
    String gender;
    String style;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
    CategoryResponse category;
    List<ProductColorResponse> colors;
    List<TagResponse> tags;
    String status;
}
