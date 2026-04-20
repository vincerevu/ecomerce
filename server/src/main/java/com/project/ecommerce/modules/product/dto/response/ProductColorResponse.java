package com.project.ecommerce.modules.product.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProductColorResponse {
    String id;
    String colorName;
    String hexCode;
    List<ProductImageResponse> images;
    List<ProductVariantResponse> variants;
}
