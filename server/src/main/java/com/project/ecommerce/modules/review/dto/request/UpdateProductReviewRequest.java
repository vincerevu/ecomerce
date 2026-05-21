package com.project.ecommerce.modules.review.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateProductReviewRequest {
    @NotNull(message = "FIELD_REQUIRED")
    @Min(value = 1, message = "INVALID_KEY")
    @Max(value = 5, message = "INVALID_KEY")
    Integer rating;

    @Size(max = 1000, message = "INVALID_KEY")
    String comment;

    Boolean approved;
}
