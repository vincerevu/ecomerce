package com.project.ecommerce.modules.content.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateBannerRequest {
    @NotBlank(message = "Title is required")
    String title;

    @NotBlank(message = "Image URL is required")
    String imageUrl;

    String linkUrl;
    Integer priority;
    Boolean active;
    LocalDateTime startDate;
    LocalDateTime endDate;
}
