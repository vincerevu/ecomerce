package com.project.ecommerce.modules.product.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TagResponse {
    String id;
    String name;
    String slug;
    String colorCode;
}
