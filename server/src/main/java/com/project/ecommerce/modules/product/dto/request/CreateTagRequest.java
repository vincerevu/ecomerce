package com.project.ecommerce.modules.product.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateTagRequest {
    @NotBlank(message = "FIELD_REQUIRED")
    String name;

    @NotBlank(message = "FIELD_REQUIRED")
    String slug;

    String colorCode;
    String iconUrl;
}
