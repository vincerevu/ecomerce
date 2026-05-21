package com.project.ecommerce.modules.product.dto.response;

import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CollectionShowcaseProductResponse {
    private String id;
    private String name;
    private String slug;
    private LocalDateTime createdAt;
    private String status;
    private List<CollectionShowcaseProductColorResponse> colors;
}
