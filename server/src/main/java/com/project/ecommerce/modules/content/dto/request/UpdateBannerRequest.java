package com.project.ecommerce.modules.content.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateBannerRequest {
    String title;
    String imageUrl;
    String linkUrl;
    Integer priority;
    Boolean active;
    LocalDateTime startDate;
    LocalDateTime endDate;
}
